// hooks/use-job-autosave.tsx
// Auto-save hook for workspace state

import { useState, useCallback, useEffect, useRef } from 'react'
import { saveJob, generateJobId, type Job } from '@/lib/job-persistence'
import { useWorkspace, type WorkspaceObject } from '@/hooks/use-workspace'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

const AUTOSAVE_INTERVAL_MS = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

interface UseJobAutosaveReturn {
  isSaving: boolean
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  saveJob: (options?: { title?: string; description?: string }) => Promise<void>
  manualSave: () => Promise<void>
  clearUnsavedChanges: () => void
  jobId: string | null
}

export function useJobAutosave(
  initialJobId?: string
): UseJobAutosaveReturn {
  const { user } = useAuth()
  const { objects, selectedObjectId, activeTool } = useWorkspace()
  
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [jobId, setJobId] = useState<string | null>(initialJobId || null)
  
  // Refs for tracking state
  const savedStateRef = useRef<string>('')
  const retryCountRef = useRef(0)
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Create a snapshot of current state for comparison
  const createStateSnapshot = useCallback(() => {
    const state = {
      objects: Object.keys(objects).sort(),
      objectStates: Object.entries(objects).map(([id, obj]) => ({
        id,
        type: obj.type,
        dimensions: obj.dimensions,
        material: obj.material,
        features: obj.features,
      })),
      selectedObjectId,
      activeTool,
    }
    return JSON.stringify(state)
  }, [objects, selectedObjectId, activeTool])

  // Check if state has changed
  const hasStateChanged = useCallback(() => {
    const currentSnapshot = createStateSnapshot()
    return currentSnapshot !== savedStateRef.current
  }, [createStateSnapshot])

  // Save job to S3
  const performSave = useCallback(async (
    snapshot: string,
    isAutoSave: boolean = false
  ): Promise<boolean> => {
    if (!user) {
      console.warn('Cannot save: User not authenticated')
      return false
    }

    const currentJobId = jobId || generateJobId()
    if (!jobId) {
      setJobId(currentJobId)
    }

    setIsSaving(true)
    retryCountRef.current = 0

    try {
      const workspace: Job['workspace'] = {
        objects,
        selectedObjectId,
        activeTool,
      }

      const result = await saveJob(user.id, currentJobId, workspace, undefined, undefined, {
        title: isAutoSave ? undefined : `Job ${new Date().toLocaleDateString()}`,
      })

      if (result.success) {
        savedStateRef.current = snapshot
        setHasUnsavedChanges(false)
        setLastSavedAt(new Date())
        retryCountRef.current = 0
        
        if (!isAutoSave) {
          toast.success('Job saved successfully')
        }
        
        return true
      } else {
        throw new Error(result.error || 'Save failed')
      }
    } catch (error) {
      console.error('Failed to save job:', error)
      
      // Retry logic
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        return performSave(snapshot, isAutoSave)
      }
      
      if (!isAutoSave) {
        toast.error('Failed to save job. Please try again.')
      }
      
      return false
    } finally {
      setIsSaving(false)
    }
  }, [user, jobId, objects, selectedObjectId, activeTool])

  // Manual save
  const manualSave = useCallback(async () => {
    const snapshot = createStateSnapshot()
    await performSave(snapshot, false)
  }, [createStateSnapshot, performSave])

  // Save with options
  const saveJobWithOptions = useCallback(async (options?: { title?: string; description?: string }) => {
    const snapshot = createStateSnapshot()
    
    if (!user) {
      toast.error('Please sign in to save your work')
      return
    }

    setIsSaving(true)
    retryCountRef.current = 0

    try {
      const currentJobId = jobId || generateJobId()
      if (!jobId) {
        setJobId(currentJobId)
      }

      const workspace: Job['workspace'] = {
        objects,
        selectedObjectId,
        activeTool,
      }

      const result = await saveJob(user.id, currentJobId, workspace, undefined, undefined, {
        title: options?.title,
        description: options?.description,
      })

      if (result.success) {
        savedStateRef.current = snapshot
        setHasUnsavedChanges(false)
        setLastSavedAt(new Date())
        toast.success('Job saved successfully')
      } else {
        throw new Error(result.error || 'Save failed')
      }
    } catch (error) {
      console.error('Failed to save job:', error)
      toast.error('Failed to save job. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [user, jobId, objects, selectedObjectId, activeTool, createStateSnapshot])

  // Clear unsaved changes flag
  const clearUnsavedChanges = useCallback(() => {
    savedStateRef.current = createStateSnapshot()
    setHasUnsavedChanges(false)
  }, [createStateSnapshot])

  // Auto-save effect
  useEffect(() => {
    if (!user || hasUnsavedChanges === false) return

    // Clear any existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    // Set up auto-save timeout
    autosaveTimeoutRef.current = setTimeout(async () => {
      const snapshot = createStateSnapshot()
      await performSave(snapshot, true)
    }, AUTOSAVE_INTERVAL_MS)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [user, hasUnsavedChanges, createStateSnapshot, performSave])

  // Track unsaved changes
  useEffect(() => {
    if (hasStateChanged()) {
      setHasUnsavedChanges(true)
    }
  }, [objects, selectedObjectId, activeTool, hasStateChanged])

  // Initialize saved state
  useEffect(() => {
    savedStateRef.current = createStateSnapshot()
  }, [])

  return {
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    saveJob: saveJobWithOptions,
    manualSave,
    clearUnsavedChanges,
    jobId,
  }
}

// UI hook for showing save status
export function useSaveStatus() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [lastSavedTime, setLastSavedTime] = useState<string>('')

  const updateStatus = useCallback((status: 'saved' | 'saving' | 'unsaved', time?: Date) => {
    setSaveStatus(status)
    if (time) {
      setLastSavedTime(time.toLocaleTimeString())
    }
  }, [])

  return {
    saveStatus,
    lastSavedTime,
    updateStatus,
  }
}

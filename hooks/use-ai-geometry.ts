// Hook for AI-powered geometry generation with Cadmium execution

import { useState, useCallback, useRef, useEffect } from 'react'
import { ExecutionEngine, type ExecutionProgress } from '@/lib/geometry/execution-engine'
import { updateCanvasMesh } from '@/lib/canvas-utils'
import { useWorkspace } from '@/hooks/use-workspace'

export interface AIGeometryState {
  isGenerating: boolean
  progress: number
  status: string
  error: string | null
  currentOperation?: string
}

export function useAIGeometry() {
  const { addObject, selectObject } = useWorkspace()
  const [state, setState] = useState<AIGeometryState>({
    isGenerating: false,
    progress: 0,
    status: '',
    error: null,
  })

  const engineRef = useRef<ExecutionEngine | null>(null)

  // Initialize execution engine
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const engine = new ExecutionEngine()
      engineRef.current = engine

      // Kick off worker initialization (don’t block render)
      engine.ensureReady().catch((err) => {
        console.error('Failed to initialize execution engine:', err)
      })
    }

    return () => {
      engineRef.current?.dispose()
    }
  }, [])

  const generateGeometry = useCallback(async (intent: string) => {
    if (!engineRef.current) {
      throw new Error('Execution engine not initialized')
    }

    setState({
      isGenerating: true,
      progress: 0,
      status: 'Initializing geometry engine...',
      error: null,
    })

    try {
      // Wait for worker to be ready
      await engineRef.current.ensureReady()

      setState((prev) => ({
        ...prev,
        status: 'Parsing your request...',
      }))
      
      // Step 1: Parse intent via API
      console.log('📡 Calling /api/ai/generate with intent:', intent)
      const parseResponse = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      })

      if (!parseResponse.ok) {
        const error = await parseResponse.json().catch(() => ({ error: 'Failed to parse error response' }))
        throw new Error(error.error || `API error: ${parseResponse.status}`)
      }

      const responseData = await parseResponse.json()
      
      // Validate response structure
      if (!responseData.success) {
        throw new Error(responseData.error || 'API returned unsuccessful response')
      }
      
      if (!responseData.intent || !responseData.operations) {
        throw new Error('Invalid API response: missing intent or operations')
      }
      
      const { intent: geometryIntent, operations } = responseData

      setState((prev) => ({
        ...prev,
        progress: 25,
        status: `Planning ${operations.length} operations...`,
      }))

      // Step 2: Execute operations
      let latestMeshData: any = null
      let latestGeometryId = ''

      const finalGeometryId = await engineRef.current.executeSequence(
        operations,
        (progress: ExecutionProgress) => {
          const progressPercent = 25 + ((progress.current / progress.total) * 75)
          
          setState((prev) => ({
            ...prev,
            progress: progressPercent,
            status: progress.operation.description,
            currentOperation: progress.operation.operation,
          }))
        },
        (geometryId: string, mesh: any) => {
          // Validate mesh data before using it
          if (!mesh || !mesh.vertices || !mesh.indices) {
            console.error('Invalid mesh data received from worker:', { geometryId, mesh })
            return
          }
          
          latestMeshData = mesh
          latestGeometryId = geometryId
          
          try {
            // Update Three.js scene in real-time
            updateCanvasMesh(geometryId, mesh)
          } catch (error) {
            console.error('Failed to update canvas mesh:', error)
            // Don't throw here - let the main promise chain handle errors
          }
        }
      )

      // Step 3: Add to workspace
      if (latestMeshData && latestGeometryId) {
        const objectId = `geometry_${Date.now()}`
        
        // Extract dimensions safely
        const dimensions = geometryIntent.baseGeometry?.parameters || {}
        
        addObject(objectId, {
          type: geometryIntent.baseGeometry?.type || 'box',
          geometryId: latestGeometryId,
          dimensions: dimensions,
          features: geometryIntent.features || [],
          material: geometryIntent.material || 'aluminum',
          description: intent,
          meshData: latestMeshData,
          color: '#0077ff',
          visible: true,
          selected: false,
        })

        selectObject(objectId)
      }

      setState({
        isGenerating: false,
        progress: 100,
        status: 'Complete!',
        error: null,
      })

      // Reset after success
      setTimeout(() => {
        setState({
          isGenerating: false,
          progress: 0,
          status: '',
          error: null,
        })
      }, 2000)

      return finalGeometryId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setState({
        isGenerating: false,
        progress: 0,
        status: 'Error',
        error: errorMessage,
      })

      throw error
    }
  }, [addObject, selectObject])

  const exportGeometry = useCallback(async (geometryId: string, format: 'stl' | 'obj') => {
    if (!engineRef.current) {
      throw new Error('Execution engine not initialized')
    }

    try {
      const content = await engineRef.current.exportGeometry(geometryId, format)
      
      // Trigger download
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `model.${format}`
      link.click()
      URL.revokeObjectURL(url)
      
      return content
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  return {
    ...state,
    generateGeometry,
    exportGeometry,
  }
}

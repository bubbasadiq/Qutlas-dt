"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { toast } from "sonner"
import { SaveWorkspaceDialog } from "./save-workspace-dialog"
import { LoadWorkspaceDialog } from "./load-workspace-dialog"

export function Toolbar() {
  const { objects, clearWorkspace, addObject } = useWorkspace()
  const router = useRouter()
  const [saved, setSaved] = useState(true)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [objectsSnapshot, setObjectsSnapshot] = useState<string>("")
  
  // Track changes to objects to update saved state
  useEffect(() => {
    const currentSnapshot = JSON.stringify(objects)
    if (objectsSnapshot && currentSnapshot !== objectsSnapshot) {
      setSaved(false)
    }
    if (!objectsSnapshot) {
      setObjectsSnapshot(currentSnapshot)
    }
  }, [objects, objectsSnapshot])

  // Warn on page unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!saved) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saved])

  const handleNew = () => {
    if (!saved && !confirm('Discard unsaved changes?')) return
    clearWorkspace()
    setSaved(true)
    setObjectsSnapshot("{}")
  }
  
  const handleSaveWorkspace = async (name: string) => {
    try {
      const data = JSON.stringify(Object.keys(objects).map(id => ({
        id,
        ...objects[id]
      })))
      const response = await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data }),
      })
      if (response.ok) {
        setSaved(true)
        setObjectsSnapshot(JSON.stringify(objects))
        toast.success('Workspace saved successfully')
      } else {
        toast.error('Failed to save workspace')
      }
    } catch (error) {
      toast.error('Error saving workspace')
    }
  }
  
  const handleLoadWorkspace = (objectsData: any[]) => {
    clearWorkspace()
    objectsData.forEach(obj => {
      addObject(obj.id, obj)
    })
    setSaved(true)
    setObjectsSnapshot(JSON.stringify(objects))
  }
  
  const handleExport = async () => {
    if (Object.keys(objects).length === 0) {
      toast.error('No objects to export')
      return
    }

    const exportToast = toast.loading('Exporting workspace...')
    
    try {
      const response = await fetch('/api/workspace/export-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objects: Object.keys(objects).map(id => objects[id]) }),
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `design-${Date.now()}.stp`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Workspace exported successfully', { id: exportToast })
    } catch (error) {
      toast.error('Failed to export workspace', { id: exportToast })
    }
  }
  
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Icon name="logo" className="w-6 h-6" />
        <span className="font-semibold">Qutlas Studio</span>
      </div>
      
      <div className="flex-1" /> {/* Spacer */}
      
      {/* File operations */}
      <div className="flex items-center gap-2 border-r pr-4">
        <button
          onClick={handleNew}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition"
          title="New (Ctrl+N)"
        >
          New
        </button>
        
        <button
          onClick={() => setShowLoadDialog(true)}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition"
          title="Open (Ctrl+O)"
        >
          Open
        </button>
        
        <button
          onClick={() => setShowSaveDialog(true)}
          className={`px-3 py-2 text-sm rounded transition ${
            saved
              ? 'hover:bg-gray-100'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title="Save (Ctrl+S)"
        >
          {saved ? 'Save' : 'Save*'}
        </button>
        
        <button
          onClick={handleExport}
          disabled={Object.keys(objects).length === 0}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition disabled:opacity-50"
          title="Export"
        >
          Export
        </button>
      </div>
      
      {/* View controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toast.info('Fit View - Coming soon')}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition"
          title="Fit View"
        >
          Fit View
        </button>
      </div>
      
      <div className="flex-1" /> {/* Spacer */}
      
      {/* User menu */}
      <div className="flex items-center gap-2 border-l pl-4">
        <button
          onClick={() => router.push('/dashboard/profile')}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition"
        >
          Profile
        </button>
        <button
          onClick={() => router.push('/auth/logout')}
          className="px-3 py-2 text-sm hover:bg-red-50 text-red-600 rounded transition"
        >
          Logout
        </button>
      </div>

      {/* Dialogs */}
      <SaveWorkspaceDialog 
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveWorkspace}
      />
      <LoadWorkspaceDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={handleLoadWorkspace}
      />
    </div>
  )
}
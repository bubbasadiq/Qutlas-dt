"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"

export function Toolbar() {
  const { objects, clearWorkspace } = useWorkspace()
  const router = useRouter()
  const [saved, setSaved] = useState(true)
  
  const handleNew = () => {
    if (!saved && !confirm('Discard unsaved changes?')) return
    clearWorkspace()
    setSaved(true)
  }
  
  const handleSave = async () => {
    try {
      const data = JSON.stringify(Object.keys(objects).map(id => ({
        id,
        ...objects[id]
      })))
      const response = await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Workspace ${new Date().toISOString()}`, data }),
      })
      if (response.ok) {
        setSaved(true)
        alert('Workspace saved')
      } else {
        alert('Save failed')
      }
    } catch (error) {
      alert('Error saving workspace')
    }
  }
  
  const handleLoad = async () => {
    try {
      const response = await fetch('/api/workspace/list')
      const workspaces = await response.json()
      // Show dialog to select workspace...
      alert('Load functionality would show workspace selection dialog')
    } catch (error) {
      alert('Error loading workspaces')
    }
  }
  
  const handleExport = async () => {
    try {
      // Export to STEP file
      const response = await fetch('/api/workspace/export-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objects: Object.keys(objects).map(id => objects[id]) }),
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `design-${Date.now()}.stp`
      a.click()
    } catch (error) {
      alert('Export failed')
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
          onClick={handleLoad}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition"
          title="Open (Ctrl+O)"
        >
          Open
        </button>
        
        <button
          onClick={handleSave}
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
          onClick={() => alert('Fit View functionality')}
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
    </div>
  )
}
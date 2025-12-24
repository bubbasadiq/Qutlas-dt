"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

export function Toolbar() {
  const { objects, clearWorkspace } = useWorkspace()
  const router = useRouter()
  const [saved, setSaved] = useState(true)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  
  const handleNew = () => {
    if (!saved && !confirm('Discard unsaved changes?')) return
    clearWorkspace()
    setSaved(true)
  }
  
  const handleSave = async () => {
    setIsLoading('save')
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
        toast.success('Workspace saved')
      } else {
        toast.error('Save failed')
      }
    } catch (error) {
      toast.error('Error saving workspace')
    } finally {
      setIsLoading(null)
    }
  }
  
  const handleLoad = async () => {
    setIsLoading('load')
    try {
      const response = await fetch('/api/workspace/list')
      const workspaces = await response.json()
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        toast.info(`Found ${workspaces.length} workspaces`)
      } else {
        toast.info('No saved workspaces found')
      }
    } catch (error) {
      toast.error('Error loading workspaces')
    } finally {
      setIsLoading(null)
    }
  }
  
  const handleExport = async () => {
    if (Object.keys(objects).length === 0) {
      toast.warning('No objects to export')
      return
    }
    setIsLoading('export')
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
      toast.success('Export complete')
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setIsLoading(null)
    }
  }
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      toast.error('Logout failed')
    }
  }
  
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Icon name="logo" className="w-6 h-6" />
        <span className="font-semibold hidden sm:inline">Qutlas Studio</span>
      </div>
      
      <div className="flex-1" />
      
      {/* File operations */}
      <div className="flex items-center gap-2 border-r pr-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNew}
          disabled={isLoading !== null}
        >
          New
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLoad}
          disabled={isLoading !== null}
        >
          {isLoading === 'load' ? <LoadingSpinner className="h-4 w-4" /> : 'Open'}
        </Button>
        
        <Button
          variant={saved ? 'ghost' : 'default'}
          size="sm"
          onClick={handleSave}
          disabled={isLoading !== null}
          className={!saved ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
        >
          {isLoading === 'save' ? (
            <LoadingSpinner className="h-4 w-4" />
          ) : (
            'Save'
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={Object.keys(objects).length === 0 || isLoading !== null}
        >
          {isLoading === 'export' ? (
            <LoadingSpinner className="h-4 w-4" />
          ) : (
            'Export'
          )}
        </Button>
      </div>
      
      {/* View controls */}
      <div className="flex items-center gap-2 hidden lg:flex">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.info('Fit View functionality')}
        >
          Fit View
        </Button>
      </div>
      
      <div className="flex-1" />
      
      {/* User menu */}
      <div className="flex items-center gap-2 border-l pl-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Logout
        </Button>
      </div>
    </div>
  )
}
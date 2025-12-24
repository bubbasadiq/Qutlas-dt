"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Workspace {
  id: string
  name: string
  created_at: string
  updated_at?: string
  data: string
}

interface LoadWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onLoad: (workspaceData: any[]) => void
}

export function LoadWorkspaceDialog({ isOpen, onClose, onLoad }: LoadWorkspaceDialogProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces()
    }
  }, [isOpen])

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/workspace/list')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
      } else {
        toast.error('Failed to load workspaces')
      }
    } catch (error) {
      toast.error('Error loading workspaces')
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = async () => {
    if (!selectedId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/workspace/load/${selectedId}`)
      if (response.ok) {
        const workspace = await response.json()
        const objectsData = JSON.parse(workspace.data)
        onLoad(objectsData)
        toast.success('Workspace loaded successfully')
        onClose()
      } else {
        toast.error('Failed to load workspace')
      }
    } catch (error) {
      toast.error('Error loading workspace')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Delete this workspace? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/workspace/delete/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Workspace deleted')
        fetchWorkspaces()
      } else {
        toast.error('Failed to delete workspace')
      }
    } catch (error) {
      toast.error('Error deleting workspace')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Load Workspace</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && workspaces.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[var(--primary-700)] border-t-transparent rounded-full" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--neutral-500)] mb-4">No saved workspaces yet</p>
              <p className="text-sm text-[var(--neutral-400)]">Create and save your first workspace to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => setSelectedId(workspace.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedId === workspace.id
                      ? 'border-[var(--primary-700)] bg-[var(--primary-50)]'
                      : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)] hover:bg-[var(--bg-100)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--neutral-900)]">{workspace.name}</h4>
                      <p className="text-xs text-[var(--neutral-500)] mt-1">
                        Saved {formatDistanceToNow(new Date(workspace.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(workspace.id, e)}
                      className="text-[var(--neutral-400)] hover:text-red-600 transition-colors p-1"
                      title="Delete workspace"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleLoad} disabled={!selectedId || loading}>
            {loading ? 'Loading...' : 'Load Workspace'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

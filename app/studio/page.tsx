"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SidebarTools } from "./components/sidebar-tools"
import { CanvasViewer } from "./components/canvas-viewer"
import { PropertiesPanel } from "./components/properties-panel"
import { TreeView } from "./components/tree-view"
import { Toolbar } from "./components/toolbar"
import { ContextMenu } from "./components/context-menu"
import { IntentChat } from "@/components/intent-chat"
import { AIGeometryPanel } from "@/components/ai-geometry-panel"
import { AuthGuard } from "@/components/auth-guard"
import { useWorkspace } from "@/hooks/use-workspace"
import { ErrorBoundary } from "@/components/error-boundary"
import { toast } from "sonner"

function StudioContent() {
  const searchParams = useSearchParams()
  const [activeTool, setActiveTool] = useState<string>("select")
  const [viewType, setViewType] = useState("iso")
  const [initialIntent, setInitialIntent] = useState<string | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
    actions: any[]
  } | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  
  const { 
    objects, 
    selectedObjectId, 
    selectObject, 
    deleteObject, 
    updateObject,
    addObject,
    clearWorkspace,
    undo,
    redo,
    canUndo,
    canRedo
  } = useWorkspace()

  useEffect(() => {
    const intent = searchParams.get("intent")
    if (intent) {
      setInitialIntent(decodeURIComponent(intent))
    }
  }, [searchParams])

  // Advanced Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // Ctrl+S / Cmd+S - Save
      if (ctrlKey && e.key === 's') {
        e.preventDefault()
        setShowSaveDialog(true)
        return
      }

      // Ctrl+O / Cmd+O - Open
      if (ctrlKey && e.key === 'o') {
        e.preventDefault()
        setShowLoadDialog(true)
        return
      }

      // Ctrl+Z / Cmd+Z - Undo
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) {
          undo()
          toast.success('Undo')
        }
        return
      }

      // Ctrl+Shift+Z or Ctrl+Y / Cmd+Shift+Z - Redo
      if ((ctrlKey && e.shiftKey && e.key === 'z') || (ctrlKey && e.key === 'y')) {
        e.preventDefault()
        if (canRedo) {
          redo()
          toast.success('Redo')
        }
        return
      }

      // Ctrl+D / Cmd+D - Duplicate
      if (ctrlKey && e.key === 'd' && selectedObjectId) {
        e.preventDefault()
        const obj = objects[selectedObjectId]
        if (obj) {
          const newId = `${selectedObjectId}_copy_${Date.now()}`
          addObject(newId, { ...obj, selected: false })
          selectObject(newId)
          toast.success('Object duplicated')
        }
        return
      }

      // Ctrl+A / Cmd+A - Select All (first object for now)
      if (ctrlKey && e.key === 'a') {
        e.preventDefault()
        const firstId = Object.keys(objects)[0]
        if (firstId) {
          selectObject(firstId)
          toast.info('Selected first object')
        }
        return
      }

      // Delete key to delete selected object
      if (e.key === 'Delete' && selectedObjectId) {
        deleteObject(selectedObjectId)
        toast.success('Object deleted')
        return
      }
      
      // Escape to deselect or close context menu
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null)
        } else if (selectedObjectId) {
          selectObject('')
        }
        return
      }

      // F - Fit view to objects
      if (e.key === 'f' && !ctrlKey) {
        e.preventDefault()
        // Trigger fit view in canvas
        const fitButton = document.querySelector('[title="Fit view to all objects (F)"]') as HTMLButtonElement
        if (fitButton) {
          fitButton.click()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedObjectId, deleteObject, selectObject, contextMenu, objects, addObject, undo, redo, canUndo, canRedo])

  const handleGeometryGenerated = (geometry: any) => {
    // Extract geometry data from AI response
    if (geometry?.geometry) {
      const geoData = geometry.geometry
      const id = geoData.id || `geo_${Date.now()}`
      
      // Add object to workspace with complete metadata
      addObject(id, {
        type: geoData.type || 'box',
        dimensions: geoData.dimensions || {},
        features: geoData.features || [],
        material: geoData.material || 'aluminum',
        description: geoData.description || '',
        params: geoData.dimensions || {},
      })
      
      // Select the newly created object
      selectObject(id)
    }
  }

  const handleContextMenuAction = (action: any) => {
    if (action.label === 'Delete' && action.objectId) {
      deleteObject(action.objectId)
      toast.success('Object deleted')
    } else if (action.label === 'Duplicate' && action.objectId) {
      const obj = objects[action.objectId]
      if (obj) {
        const newId = `${action.objectId}_copy_${Date.now()}`
        addObject(newId, { ...obj, selected: false })
        toast.success('Object duplicated')
      }
    } else if (action.label === 'Hide' && action.objectId) {
      const obj = objects[action.objectId]
      if (obj) {
        updateObject(action.objectId, { ...obj, visible: !obj.visible })
        toast.success(obj.visible ? 'Object hidden' : 'Object shown')
      }
    } else if (action.label === 'Properties' && action.objectId) {
      selectObject(action.objectId)
      toast.info('Properties panel updated')
    } else if (action.label === 'Clear All') {
      if (confirm('Clear all objects from workspace?')) {
        clearWorkspace()
        toast.success('Workspace cleared')
      }
    } else if (action.label === 'Select All') {
      // Select first object (proper multi-select would need more work)
      const firstId = Object.keys(objects)[0]
      if (firstId) selectObject(firstId)
    } else if (action.onClick) {
      action.onClick()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-100)]">
      {/* Toolbar */}
      <Toolbar />
      
      {/* Main workspace - 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Sidebar with tools and AI Assistant */}
        <div className="flex flex-col w-80 bg-white border-r border-[var(--neutral-200)]">
          {/* Tool Icons at Top */}
          <div className="border-b border-[var(--neutral-200)] p-2">
            <SidebarTools activeTool={activeTool} onToolSelect={setActiveTool} />
          </div>
          
          {/* AI Geometry Generator */}
          <div className="border-b border-[var(--neutral-200)] p-3">
            <AIGeometryPanel />
          </div>
          
          {/* AI Assistant - Takes remaining space */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--primary-700)] to-[var(--primary-600)] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Assistant</p>
                <p className="text-xs text-white/70">Powered by Claude</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <IntentChat
                variant="workspace"
                placeholder="Describe what to create or modify..."
                onGeometryGenerated={handleGeometryGenerated}
                initialIntent={initialIntent}
              />
            </div>
          </div>
        </div>
        
        {/* Center column: Canvas */}
        <div className="flex-1 relative">
          <CanvasViewer 
            activeTool={activeTool}
            workspaceObjects={objects}
            selectedObjectId={selectedObjectId}
            onObjectSelect={(id) => id && selectObject(id)}
            onViewChange={setViewType}
            onContextMenu={(position, actions) => {
              setContextMenu({ position, actions })
            }}
          />
          <ContextMenu
            position={contextMenu?.position || null}
            actions={contextMenu?.actions || []}
            onActionClick={(action) => handleContextMenuAction(action)}
            onClose={() => setContextMenu(null)}
          />
        </div>
        
        {/* Right column: Tree view + Properties panel */}
        <div className="w-80 bg-white border-l border-[var(--neutral-200)] flex flex-col">
          {/* Tree view - top half */}
          <div className="flex-1 overflow-y-auto border-b border-[var(--neutral-200)] p-4">
            <h3 className="text-sm font-semibold text-[var(--neutral-900)] mb-3">Scene</h3>
            <TreeView />
          </div>
          
          {/* Properties panel - bottom half */}
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel selectedObject={selectedObjectId || undefined} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudioWorkspacePage() {
  return (
    <AuthGuard>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm text-[var(--neutral-600)]">Loading workspace...</p>
              </div>
            </div>
          }
        >
          <StudioContent />
        </Suspense>
      </ErrorBoundary>
    </AuthGuard>
  )
}

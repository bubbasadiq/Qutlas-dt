"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SidebarTools } from "./components/sidebar-tools"
import { CanvasViewer } from "./components/canvas-viewer"
import { PropertiesPanel } from "./components/properties-panel"
import { TreeView } from "./components/tree-view"
import { Toolbar } from "./components/toolbar"
import { ViewportControls } from "./components/viewport-controls"
import { ContextMenu } from "./components/context-menu"
import { IntentChat } from "@/components/intent-chat"
import { AuthGuard } from "@/components/auth-guard"
import { useWorkspace } from "@/hooks/use-workspace"

function StudioContent() {
  const searchParams = useSearchParams()
  const [activeTool, setActiveTool] = useState<string>("select")
  const [viewType, setViewType] = useState("iso")
  const [geometryData, setGeometryData] = useState<any>(null)
  const [initialIntent, setInitialIntent] = useState<string | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
    actions: any[]
  } | null>(null)
  
  const { 
    objects, 
    selectedObjectId, 
    selectObject, 
    deleteObject, 
    updateObject,
    clearWorkspace 
  } = useWorkspace()

  useEffect(() => {
    const intent = searchParams.get("intent")
    if (intent) {
      setInitialIntent(decodeURIComponent(intent))
    }
  }, [searchParams])

  const handleGeometryGenerated = (geometry: any) => {
    setGeometryData(geometry)
    if (geometry?.geometry?.id) {
      selectObject(geometry.geometry.id)
    }
  }

  const handleContextMenuAction = (action: any) => {
    if (action.label === 'Delete' && action.objectId) {
      deleteObject(action.objectId)
    } else if (action.label === 'Hide' && action.objectId) {
      const obj = objects[action.objectId]
      if (obj) {
        updateObject(action.objectId, { ...obj, visible: !obj.visible })
      }
    } else if (action.label === 'Clear All') {
      clearWorkspace()
    } else if (action.onClick) {
      // Execute the original click handler
      action.onClick()
    }
  }

  const viewportController = {
    viewFront: () => setViewType('front'),
    viewTop: () => setViewType('top'),
    viewRight: () => setViewType('right'),
    viewIsometric: () => setViewType('iso'),
    toggleGrid: () => {
      // This would toggle grid visibility
      console.log('Toggle grid')
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <Toolbar />
      
      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tools */}
        <SidebarTools activeTool={activeTool} onToolSelect={setActiveTool} />
        
        {/* Canvas */}
        <div className="flex-1 relative">
          <CanvasViewer 
            activeTool={activeTool} 
            onViewChange={setViewType} 
            onContextMenu={(position, actions) => {
              // Enhance actions with actual object IDs where needed
              const enhancedActions = actions.map(action => {
                if (action.onClick && typeof action.onClick === 'function') {
                  return action // Keep original click handlers
                }
                return action
              })
              setContextMenu({ position, actions: enhancedActions })
            }}
          />
          <ViewportControls viewportController={viewportController} />
          <ContextMenu
            position={contextMenu?.position || null}
            actions={contextMenu?.actions || []}
            onActionClick={handleContextMenuAction}
            onClose={() => setContextMenu(null)}
          />
        </div>
        
        {/* Right panel (split between tree view and properties) */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
          {/* Tree view */}
          <div className="flex-1 overflow-y-auto">
            <TreeView />
          </div>
          
          {/* Properties panel */}
          <div className="flex-1 border-t border-gray-200 overflow-y-auto">
            <PropertiesPanel selectedObject={selectedObjectId || undefined} />
          </div>
        </div>
      </div>
      
      {/* AI Assistant Panel (bottom left) */}
      <div className="absolute bottom-4 left-4 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">AI Assistant</p>
        </div>
        <IntentChat
          variant="workspace"
          placeholder="Describe changes..."
          onGeometryGenerated={handleGeometryGenerated}
          initialIntent={initialIntent}
        />
      </div>
    </div>
  )
}

export default function StudioWorkspacePage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-gray-100">Loading workspace...</div>
        }
      >
        <StudioContent />
      </Suspense>
    </AuthGuard>
  )
}
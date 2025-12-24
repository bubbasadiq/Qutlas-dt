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
import { MobileNav } from "./components/mobile-nav"
import { LoadingSpinner } from "@/components/loading-spinner"

export const dynamic = 'force-dynamic'

function StudioContent() {
  const searchParams = useSearchParams()
  const [activeTool, setActiveTool] = useState<string>("select")
  const [viewType, setViewType] = useState("iso")
  const [initialIntent, setInitialIntent] = useState<string | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
    actions: any[]
  } | null>(null)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  
  const { 
    objects, 
    selectedObjectId, 
    selectObject, 
    deleteObject, 
    updateObject,
    addObject,
    clearWorkspace 
  } = useWorkspace()

  useEffect(() => {
    const intent = searchParams.get("intent")
    if (intent) {
      setInitialIntent(decodeURIComponent(intent))
    }
  }, [searchParams])

  const handleGeometryGenerated = (geometry: any) => {
    if (geometry?.geometry) {
      const geoData = geometry.geometry
      const id = geoData.id || `geo_${Date.now()}`
      
      addObject(id, {
        type: geoData.type || 'box',
        dimensions: geoData.dimensions || {},
        features: geoData.features || [],
        material: geoData.material || 'aluminum',
        description: geoData.description || '',
        params: geoData.dimensions || {},
      })
      
      selectObject(id)
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
      action.onClick()
    }
  }

  const viewportController = {
    viewFront: () => setViewType('front'),
    viewTop: () => setViewType('top'),
    viewRight: () => setViewType('right'),
    viewIsometric: () => setViewType('iso'),
    toggleGrid: () => {
      console.log('Toggle grid')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-100)]">
      {/* Toolbar - hidden on mobile */}
      <div className="hidden md:block">
        <Toolbar />
      </div>
      
      {/* Mobile navigation */}
      <MobileNav />
      
      {/* Main workspace - responsive layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Sidebar tools - hidden on mobile */}
        <div className="hidden md:flex flex-col w-16 bg-white border-r border-[var(--neutral-200)]">
          <SidebarTools activeTool={activeTool} onToolSelect={setActiveTool} />
        </div>
        
        {/* Center column: Canvas */}
        <div className="flex-1 relative">
          <CanvasViewer 
            activeTool={activeTool}
            workspaceObjects={objects}
            selectedObjectId={selectedObjectId}
            onObjectSelect={selectObject}
            onViewChange={setViewType}
            onContextMenu={(position, actions) => {
              setContextMenu({ position, actions })
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
        
        {/* Right column: Tree view + Properties panel - hidden on mobile/tablet */}
        <div className={`${rightPanelOpen ? 'flex' : 'hidden'} lg:flex w-80 bg-white border-l border-[var(--neutral-200)] flex-col`}>
          {/* Toggle button for mobile */}
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 translate-x-full bg-white border border-[var(--neutral-200)] p-1 rounded-r"
          >
            <svg className={`w-4 h-4 transition-transform ${rightPanelOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
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
      
      {/* AI Assistant Panel - Fixed at bottom left, above sidebar */}
      <div className="fixed bottom-6 left-4 md:left-20 w-[calc(100%-2rem)] md:w-96 bg-white border border-[var(--neutral-200)] rounded-xl shadow-2xl overflow-hidden z-50 max-h-[60vh] flex flex-col">
        <div className="bg-gradient-to-r from-[var(--primary-700)] to-[var(--primary-600)] px-4 py-3 flex items-center gap-3 flex-shrink-0">
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
        <div className="p-4 overflow-auto flex-1">
          <IntentChat
            variant="workspace"
            placeholder="Describe what to create or modify..."
            onGeometryGenerated={handleGeometryGenerated}
            initialIntent={initialIntent}
          />
        </div>
      </div>
    </div>
  )
}

function StudioLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <LoadingSpinner className="w-10 h-10 mx-auto mb-4" />
        <p className="text-sm text-[var(--neutral-600)]">Loading workspace...</p>
      </div>
    </div>
  )
}

export default function StudioWorkspacePage() {
  return (
    <AuthGuard>
      <Suspense fallback={<StudioLoading />}>
        <StudioContent />
      </Suspense>
    </AuthGuard>
  )
}

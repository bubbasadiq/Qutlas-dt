"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SidebarTools } from "../../studio/components/sidebar-tools"
import { CanvasViewer } from "../../studio/components/canvas-viewer"
import { PropertiesPanel } from "../../studio/components/properties-panel"
import { TreeView } from "../../studio/components/tree-view"
import { Toolbar } from "../../studio/components/toolbar"
import { ContextMenu } from "../../studio/components/context-menu"
import { QuotePanel } from "../../studio/components/quote-panel"
import { ManufacturabilityPanel } from "../../studio/components/manufacturability-panel"
import { SemanticIRPanel } from "../../studio/components/semantic-ir-panel"
import { AdvancedFeaturesPanel } from "../../studio/components/advanced-features-panel"
import { MobileBottomNav, DEFAULT_BOTTOM_NAV_TABS } from "../../studio/components/mobile-bottom-nav"
import { SegmentedPanel, SegmentedPanelGroup } from "@/components/segmented-panel"
import { MobileMenu } from "../../studio/components/mobile-menu"
import { BottomSheet } from "@/components/ui/sheet"
import { SaveWorkspaceDialog } from "../../studio/components/save-workspace-dialog"
import { LoadWorkspaceDialog } from "../../studio/components/load-workspace-dialog"
import { IntentChatWorkspace } from "@/components/intent-chat-workspace"
import { AIGeometryPanel } from "@/components/ai-geometry-panel"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { ErrorBoundary } from "@/components/error-boundary"
import { toast } from "sonner"
import { mapErrorMessage } from "@/lib/error-utils"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"

function StudioContent() {
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [activeTool, setActiveTool] = useState<string>("select")
  const [viewType, setViewType] = useState("iso")
  const [initialIntent, setInitialIntent] = useState<string | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
    actions: any[]
  } | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // Mobile-specific state
  const [mobileBottomTab, setMobileBottomTab] = useState("canvas")
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showToolsSheet, setShowToolsSheet] = useState(false)
  const [showTreeSheet, setShowTreeSheet] = useState(false)
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false)
  const [showAISheet, setShowAISheet] = useState(false)

  const {
    objects,
    selectedObjectId,
    selectedObjectIds,
    selectObject,
    deleteObject,
    updateObject,
    addObject,
    clearWorkspace,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWorkspace()

  useEffect(() => {
    const intent = searchParams.get("intent")
    if (intent) {
      setInitialIntent(decodeURIComponent(intent))
    }

    // Handle catalog part import
    const importPartId = searchParams.get("import")
    if (importPartId) {
      // Find the most recent workspace import in localStorage
      const allKeys = Object.keys(localStorage)
      const importKeys = allKeys.filter((key) => key.startsWith("workspace-import-"))

      if (importKeys.length > 0) {
        // Sort by timestamp (most recent first)
        importKeys.sort((a, b) => {
          const timestampA = parseInt(a.replace("workspace-import-", ""))
          const timestampB = parseInt(b.replace("workspace-import-", ""))
          return timestampB - timestampA
        })

        const mostRecentKey = importKeys[0]
        const dataStr = localStorage.getItem(mostRecentKey)

        if (dataStr) {
          try {
            const catalogPartData = JSON.parse(dataStr)

            // Convert catalog part data to WorkspaceObject format
            const workspaceId = `catalog-${catalogPartData.partId}-${Date.now()}`
            const workspaceObject = {
              type: "catalog-part",
              dimensions: catalogPartData.specs || {},
              material: catalogPartData.material || "aluminum",
              finish: catalogPartData.finish || "Raw",
              visible: true,
              selected: false,
              description: catalogPartData.name || "",
              params: {
                ...catalogPartData.specs,
                partId: catalogPartData.partId,
                category: catalogPartData.category,
                quantity: catalogPartData.quantity || 1,
                basePrice: catalogPartData.basePrice || 0,
                totalPrice: catalogPartData.totalPrice || 0,
              },
            }

            // Add the part to workspace
            addObject(workspaceId, workspaceObject)
            selectObject(workspaceId)

            // Clean up localStorage
            localStorage.removeItem(mostRecentKey)

            toast.success(`Added ${catalogPartData.name} to workspace`)
          } catch (error) {
            console.error("Failed to import catalog part:", error)
            toast.error("Failed to import catalog part")
          }
        }
      }
    }
  }, [searchParams, addObject, selectObject])

  // Advanced Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // Don't process shortcuts in text inputs
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"
      ) {
        // Allow some shortcuts even in inputs (Ctrl+S to save)
        if (ctrlKey && e.key === "s") {
          e.preventDefault()
          setShowSaveDialog(true)
        }
        return
      }

      // ? - Show help dialog
      if (e.key === "?" || e.key === "/") {
        e.preventDefault()
        document.querySelector('[title="Keyboard Shortcuts"]')?.dispatchEvent(new MouseEvent("click"))
        return
      }

      // Ctrl+S / Cmd+S - Save
      if (ctrlKey && e.key === "s") {
        e.preventDefault()
        setShowSaveDialog(true)
        return
      }

      // Ctrl+O / Cmd+O - Open
      if (ctrlKey && e.key === "o") {
        e.preventDefault()
        setShowLoadDialog(true)
        return
      }

      // Ctrl+Z / Cmd+Z - Undo
      if (ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) {
          undo()
          toast.success("Undo")
        }
        return
      }

      // Ctrl+Shift+Z or Ctrl+Y / Cmd+Shift+Z - Redo
      if ((ctrlKey && e.shiftKey && e.key === "z") || (ctrlKey && e.key === "y")) {
        e.preventDefault()
        if (canRedo) {
          redo()
          toast.success("Redo")
        }
        return
      }

      // Ctrl+D / Cmd+D - Duplicate
      if (ctrlKey && e.key === "d" && selectedObjectId) {
        e.preventDefault()
        const obj = objects[selectedObjectId]
        if (obj) {
          const newId = `${selectedObjectId}_copy_${Date.now()}`
          addObject(newId, { ...obj, selected: false })
          selectObject(newId)
          toast.success("Object duplicated")
        }
        return
      }

      // Ctrl+A / Cmd+A - Select All (first object for now)
      if (ctrlKey && e.key === "a") {
        e.preventDefault()
        const firstId = Object.keys(objects)[0]
        if (firstId) {
          selectObject(firstId)
          toast.info("Selected first object")
        }
        return
      }

      // Delete key to delete selected object
      if (e.key === "Delete" && selectedObjectId) {
        e.preventDefault()
        deleteObject(selectedObjectId)
        toast.success("Object deleted")
        return
      }

      // Escape to deselect or close context menu
      if (e.key === "Escape") {
        if (contextMenu) {
          setContextMenu(null)
        } else if (selectedObjectId) {
          selectObject("")
        } else {
          // Close mobile sheets on escape
          setShowToolsSheet(false)
          setShowTreeSheet(false)
          setShowPropertiesSheet(false)
          setShowAISheet(false)
        }
        return
      }

      // F - Fit view to objects
      if (e.key === "f" && !ctrlKey) {
        e.preventDefault()
        // Trigger fit view in canvas
        const fitButton = document.querySelector('[title="Fit view to all objects (F)"]') as HTMLButtonElement
        if (fitButton) {
          fitButton.click()
        }
        return
      }

      // Tool shortcuts
      if (!ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select')
            toast.info('Select tool activated')
            return
          case 's':
            setActiveTool('sketch')
            toast.info('Sketch tool activated')
            return
          case 'm':
            setActiveTool('measure')
            toast.info('Measure tool activated')
            return
          case 'b':
            // Create box
            const boxId = `box_${Date.now()}`
            addObject(boxId, {
              type: 'box',
              dimensions: { width: 100, height: 100, depth: 100 },
              visible: true,
              selected: true,
            })
            selectObject(boxId)
            toast.success('Box created')
            return
          case 'c':
            // Create cylinder
            const cylId = `cylinder_${Date.now()}`
            addObject(cylId, {
              type: 'cylinder',
              dimensions: { radius: 50, height: 100 },
              visible: true,
              selected: true,
            })
            selectObject(cylId)
            toast.success('Cylinder created')
            return
          case 'r':
            // Create sphere (r for round)
            const sphereId = `sphere_${Date.now()}`
            addObject(sphereId, {
              type: 'sphere',
              dimensions: { radius: 50 },
              visible: true,
              selected: true,
            })
            selectObject(sphereId)
            toast.success('Sphere created')
            return
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    selectedObjectId,
    deleteObject,
    selectObject,
    contextMenu,
    objects,
    addObject,
    undo,
    redo,
    canUndo,
    canRedo,
    setActiveTool,
  ])

  const handleGeometryGenerated = (geometry: any) => {
    // Extract geometry data from AI response
    if (geometry?.geometry) {
      const geoData = geometry.geometry
      const id = geoData.id || `geo_${Date.now()}`

      // Add object to workspace with complete metadata
      addObject(id, {
        type: geoData.type || "box",
        dimensions: geoData.dimensions || {},
        features: geoData.features || [],
        material: geoData.material || "aluminum",
        description: geoData.description || "",
        params: geoData.dimensions || {},
      })

      // Select the newly created object
      selectObject(id)
    }
  }

  const handleContextMenuAction = (action: any) => {
    if (action.label === "Delete" && action.objectId) {
      deleteObject(action.objectId)
      toast.success("Object deleted")
    } else if (action.label === "Duplicate" && action.objectId) {
      const obj = objects[action.objectId]
      if (obj) {
        const newId = `${action.objectId}_copy_${Date.now()}`
        addObject(newId, { ...obj, selected: false })
        toast.success("Object duplicated")
      }
    } else if (action.label === "Hide" && action.objectId) {
      const obj = objects[action.objectId]
      if (obj) {
        updateObject(action.objectId, { ...obj, visible: !obj.visible })
        toast.success(obj.visible ? "Object hidden" : "Object shown")
      }
    } else if (action.label === "Properties" && action.objectId) {
      selectObject(action.objectId)
      toast.info("Properties panel updated")
    } else if (action.label === "Clear All") {
      if (confirm("Clear all objects from workspace?")) {
        clearWorkspace()
        toast.success("Workspace cleared")
      }
    } else if (action.label === "Select All") {
      // Select first object (proper multi-select would need more work)
      const firstId = Object.keys(objects)[0]
      if (firstId) selectObject(firstId)
    } else if (action.onClick) {
      action.onClick()
    }
  }

  const handleMobileTabChange = (tabId: string) => {
    setMobileBottomTab(tabId)

    // Open the appropriate sheet based on tab
    switch (tabId) {
      case "tools":
        setShowToolsSheet(true)
        break
      case "tree":
        setShowTreeSheet(true)
        break
      case "properties":
        setShowPropertiesSheet(true)
        break
      case "ai":
        setShowAISheet(true)
        break
      case "canvas":
      default:
        // Close all sheets when going back to canvas
        setShowToolsSheet(false)
        setShowTreeSheet(false)
        setShowPropertiesSheet(false)
        setShowAISheet(false)
        break
    }
  }

  // Desktop 3-column layout
  if (!isMobile) {
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

            {/* AI Assistant - Takes remaining space */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--primary-700)] to-[var(--primary-600)] px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icons.Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Assistant</p>
                  <p className="text-xs text-white/70">Powered by Deepseek</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <IntentChatWorkspace
                  placeholder="Describe what to create or modify..."
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
              onObjectSelect={(id) => selectObject(id || "")}
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

          {/* Right column: Tree view + Segmented panels */}
          <div className="w-80 bg-white border-l border-[var(--neutral-200)] flex flex-col">
            {/* Tree view - top section */}
            <div className="h-48 overflow-y-auto border-b border-[var(--neutral-200)] p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-600)] mb-2">Scene</h3>
              <TreeView />
            </div>

            {/* Segmented panels - bottom section */}
            <div className="flex-1 overflow-y-auto">
              <SegmentedPanelGroup allowMultipleOpen={false}>
                <SegmentedPanel
                  title="Properties"
                  icon="Settings"
                  isOpen={false} // Managed by SegmentedPanelGroup
                  onToggle={() => {}} // Managed by SegmentedPanelGroup
                >
                  <PropertiesPanel
                    selectedObject={selectedObjectId || undefined}
                    selectedObjects={selectedObjectIds}
                  />
                </SegmentedPanel>
                <SegmentedPanel
                  title="Quote"
                  icon="FileText"
                  isOpen={false} // Managed by SegmentedPanelGroup
                  onToggle={() => {}} // Managed by SegmentedPanelGroup
                >
                  <QuotePanel />
                </SegmentedPanel>
                <SegmentedPanel
                  title="Manufacturing"
                  icon="Factory"
                  isOpen={false} // Managed by SegmentedPanelGroup
                  onToggle={() => {}} // Managed by SegmentedPanelGroup
                >
                  <ManufacturabilityPanel />
                </SegmentedPanel>
                <SegmentedPanel
                  title="Semantic IR"
                  icon="GitBranch"
                  isOpen={false} // Managed by SegmentedPanelGroup
                  onToggle={() => {}} // Managed by SegmentedPanelGroup
                >
                  <SemanticIRPanel />
                </SegmentedPanel>
                <SegmentedPanel
                  title="Advanced Features"
                  icon="Zap"
                  isOpen={false} // Managed by SegmentedPanelGroup
                  onToggle={() => {}} // Managed by SegmentedPanelGroup
                >
                  <AdvancedFeaturesPanel />
                </SegmentedPanel>
              </SegmentedPanelGroup>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <SaveWorkspaceDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={async (name) => {
            try {
              const data = JSON.stringify(Object.keys(objects).map(id => objects[id]))
              const response = await fetch('/api/workspace/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, data }),
              })
              if (response.ok) {
                toast.success('Workspace saved successfully')
              } else {
                toast.error('Failed to save workspace')
              }
            } catch (error) {
              toast.error('Error saving workspace')
            }
            setShowSaveDialog(false)
          }}
        />
        <LoadWorkspaceDialog
          isOpen={showLoadDialog}
          onClose={() => setShowLoadDialog(false)}
          onLoad={(objectsData) => {
            clearWorkspace()
            objectsData.forEach((obj: any) => {
              addObject(obj.id, obj)
            })
            setShowLoadDialog(false)
          }}
        />
      </div>
    )
  }

  // Mobile single-column layout with bottom nav
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-100)]">
      {/* Toolbar - simplified for mobile */}
      <Toolbar onMobileMenuOpen={() => setShowMobileMenu(true)} />

      {/* Main content area - full screen canvas */}
      <div className="flex-1 relative overflow-hidden">
        <CanvasViewer
          activeTool={activeTool}
          workspaceObjects={objects}
          selectedObjectId={selectedObjectId}
          onObjectSelect={(id) => selectObject(id || "")}
          onViewChange={setViewType}
          onContextMenu={(position, actions) => {
            setContextMenu({ position, actions })
          }}
          isMobile={true}
        />
        <ContextMenu
          position={contextMenu?.position || null}
          actions={contextMenu?.actions || []}
          onActionClick={(action) => handleContextMenuAction(action)}
          onClose={() => setContextMenu(null)}
        />
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav
        tabs={DEFAULT_BOTTOM_NAV_TABS}
        activeTab={mobileBottomTab}
        onTabChange={handleMobileTabChange}
      />

      {/* Mobile Sheets */}
      {/* Tools Sheet */}
      <BottomSheet
        open={showToolsSheet}
        onClose={() => setShowToolsSheet(false)}
        title="Tools"
      >
        <div className="pb-4">
          <SidebarTools activeTool={activeTool} onToolSelect={(tool) => {
            setActiveTool(tool)
            setShowToolsSheet(false)
          }} />
        </div>
      </BottomSheet>

      {/* Tree View Sheet */}
      <BottomSheet
        open={showTreeSheet}
        onClose={() => setShowTreeSheet(false)}
        title="Scene Tree"
      >
        <div className="pb-4">
          <TreeView />
        </div>
      </BottomSheet>

      {/* Properties Sheet */}
      <BottomSheet
        open={showPropertiesSheet}
        onClose={() => setShowPropertiesSheet(false)}
        title="Properties"
      >
        <div className="pb-4">
          <PropertiesPanel
            selectedObject={selectedObjectId || undefined}
            selectedObjects={selectedObjectIds}
          />
        </div>
      </BottomSheet>

      {/* AI Assistant Sheet */}
      <BottomSheet
        open={showAISheet}
        onClose={() => setShowAISheet(false)}
        title="AI Assistant"
      >
        <div className="pb-4">
          <IntentChatWorkspace
            placeholder="Describe what to create or modify..."
            initialIntent={initialIntent}
          />
        </div>
      </BottomSheet>

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        menuItems={[]}
        onUndo={canUndo ? undo : undefined}
        onRedo={canRedo ? redo : undefined}
        onSave={() => setShowSaveDialog(true)}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Mobile Dialogs */}
      <SaveWorkspaceDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={async (name) => {
          try {
            const data = JSON.stringify(Object.keys(objects).map(id => objects[id]))
            const response = await fetch('/api/workspace/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, data }),
            })
            if (response.ok) {
              toast.success('Workspace saved successfully')
            } else {
              toast.error('Failed to save workspace')
            }
          } catch (error) {
            toast.error('Error saving workspace')
          }
          setShowSaveDialog(false)
        }}
      />
      <LoadWorkspaceDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={(objectsData) => {
          clearWorkspace()
          objectsData.forEach((obj: any) => {
            addObject(obj.id, obj)
          })
          setShowLoadDialog(false)
        }}
      />
    </div>
  )
}

export default function StudioWorkspacePage() {
  return (
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
  )
}

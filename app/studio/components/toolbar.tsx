"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Hexagon, Settings, Keyboard, Info, Menu, Save, Undo, Redo, BarChart3, FileText, Zap, CreditCard } from "lucide-react"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { toast } from "sonner"
import { SaveWorkspaceDialog } from "./save-workspace-dialog"
import { LoadWorkspaceDialog } from "./load-workspace-dialog"
import { ExportDialog, ExportOptions } from "./export-dialog"
import { ImportDialog } from "./import-dialog"
import { SettingsDialog } from "./settings-dialog"
import { HelpDialog } from "./help-dialog"
import { MenuButton, MenuItem } from "@/components/toolbar-menu"
import { shortcutsRegistry, Keys } from "@/lib/shortcuts-registry"

interface ToolbarProps {
  onMobileMenuOpen?: () => void
}

export function Toolbar({ onMobileMenuOpen }: ToolbarProps) {
  const { 
    objects, 
    clearWorkspace, 
    addObject, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    selectedObjectId, 
    selectedObjectIds,
    deleteObject, 
    selectObject,
    performBoolean
  } = useWorkspace()
  const isMobile = useIsMobile()
  const router = useRouter()
  const [saved, setSaved] = useState(true)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
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
  
  const handleExport = async (options: ExportOptions) => {
    if (Object.keys(objects).length === 0) {
      toast.error('No objects to export')
      return
    }

    const exportToast = toast.loading('Exporting workspace...')

    try {
      const response = await fetch('/api/workspace/export-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects: Object.keys(objects).map(id => objects[id]),
          format: options.format,
          quality: options.quality,
          includeMaterials: options.includeMaterials,
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${options.fileName}.${options.format}`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Workspace exported successfully', { id: exportToast })
    } catch (error) {
      toast.error('Failed to export workspace', { id: exportToast })
    }
  }

  const handleImport = async (files: File[]) => {
    const importToast = toast.loading('Importing files...')

    try {
      for (const file of files) {
        // Upload/parsing is handled elsewhere; for now we add a usable placeholder shape
        const id = `geo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        addObject(id, {
          type: "box",
          dimensions: { width: 100, height: 50, depth: 25 },
          params: { length: 100, width: 50, height: 25 },
          description: file.name,
        })
        selectObject(id)
      }

      toast.success(`Imported ${files.length} file${files.length > 1 ? "s" : ""} successfully`, { id: importToast })
    } catch (error) {
      toast.error("Failed to import files", { id: importToast })
    }
  }

  const createGeometry = useCallback(async (type: string) => {
    const toastId = toast.loading(`Creating ${type}...`)

    try {
      // Geometry preview in the studio is generated client-side (THREE/Cadmium fallback).
      // We create the object immediately so users can always build shapes.
      const id = `geo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const dimensions: Record<string, number> = {}

      switch (type) {
        case "box":
          dimensions.width = 100
          dimensions.height = 100
          dimensions.depth = 100
          break
        case "cylinder":
          dimensions.radius = 50
          dimensions.height = 100
          break
        case "sphere":
          dimensions.radius = 50
          break
        case "cone":
          dimensions.radius = 50
          dimensions.height = 100
          break
        case "torus":
          dimensions.majorRadius = 50
          dimensions.minorRadius = 15
          break
        default:
          throw new Error(`Unknown geometry type: ${type}`)
      }

      addObject(id, {
        type: type as any,
        dimensions,
        params: dimensions,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${id.slice(-4)}`,
      })
      selectObject(id)

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created`, { id: toastId })
    } catch (error) {
      toast.error(`Failed to create ${type}`, { id: toastId })
    }
  }, [addObject, selectObject])
  
  // Define menu items
  const fileMenuItems: MenuItem[] = [
    { id: 'new', label: 'New', icon: 'file', shortcut: [Keys.Ctrl, 'n'], onClick: handleNew },
    { id: 'open', label: 'Open', icon: 'folder-open', shortcut: [Keys.Ctrl, 'o'], onClick: () => setShowLoadDialog(true) },
    { id: 'save', label: 'Save', icon: 'save', shortcut: [Keys.Ctrl, 's'], onClick: () => setShowSaveDialog(true) },
    { id: 'save-as', label: 'Save As...', icon: 'save', shortcut: [Keys.Ctrl, Keys.Shift, 's'], onClick: () => setShowSaveDialog(true) },
    { divider: true },
    { id: 'import', label: 'Import...', icon: 'upload', shortcut: [Keys.Ctrl, 'i'], onClick: () => setShowImportDialog(true) },
    { id: 'export', label: 'Export...', icon: 'download', shortcut: [Keys.Ctrl, 'e'], onClick: () => setShowExportDialog(true) },
  ]

  const editMenuItems: MenuItem[] = [
    { id: 'undo', label: 'Undo', icon: 'undo', shortcut: [Keys.Ctrl, 'z'], onClick: () => { if (canUndo) undo() }, disabled: !canUndo },
    { id: 'redo', label: 'Redo', icon: 'redo', shortcut: [Keys.Ctrl, 'y'], onClick: () => { if (canRedo) redo() }, disabled: !canRedo },
    { divider: true },
    { id: 'delete', label: 'Delete', icon: 'trash', shortcut: ['Delete'], onClick: () => { if (selectedObjectId) deleteObject(selectedObjectId) }, disabled: !selectedObjectId },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy', shortcut: [Keys.Ctrl, 'd'], onClick: () => { if (selectedObjectId) createGeometry('box') }, disabled: !selectedObjectId },
    { divider: true },
    { id: 'select-all', label: 'Select All', icon: 'square', shortcut: [Keys.Ctrl, 'a'], onClick: () => toast.info('Select All - Coming soon') },
  ]

  const viewMenuItems: MenuItem[] = [
    { id: 'zoom-in', label: 'Zoom In', icon: 'zoom-in', onClick: () => toast.info('Zoom In - Coming soon') },
    { id: 'zoom-out', label: 'Zoom Out', icon: 'zoom-out', onClick: () => toast.info('Zoom Out - Coming soon') },
    { id: 'fit', label: 'Fit View', icon: 'maximize', shortcut: ['f'], onClick: () => document.querySelector('[title="Fit view to all objects (F)"]')?.dispatchEvent(new MouseEvent('click')) },
    { id: 'reset', label: 'Reset Camera', icon: 'camera', onClick: () => toast.info('Reset Camera - Coming soon') },
    { divider: true },
    { id: 'toggle-grid', label: 'Toggle Grid', icon: 'grid', onClick: () => toast.info('Toggle Grid - Coming soon') },
    { id: 'toggle-panels', label: 'Toggle Panels', icon: 'layout', onClick: () => toast.info('Toggle Panels - Coming soon') },
  ]

  const createMenuItems: MenuItem[] = [
    { id: 'box', label: 'Box', icon: 'square', shortcut: ['b'], onClick: () => createGeometry('box') },
    { id: 'cylinder', label: 'Cylinder', icon: 'circle', shortcut: ['c'], onClick: () => createGeometry('cylinder') },
    { id: 'sphere', label: 'Sphere', icon: 'circle', shortcut: ['s'], onClick: () => createGeometry('sphere') },
    { id: 'cone', label: 'Cone', icon: 'triangle', shortcut: ['o'], onClick: () => createGeometry('cone') },
    { id: 'torus', label: 'Torus', icon: 'circle', shortcut: ['t'], onClick: () => createGeometry('torus') },
  ]

  const modifyMenuItems: MenuItem[] = [
    { 
      id: 'union', 
      label: 'Boolean Union', 
      icon: 'layers', 
      shortcut: ['u'], 
      onClick: () => {
        if (selectedObjectIds.length > 1) {
          toast.promise(performBoolean('union', selectedObjectIds[0], selectedObjectIds[1]), {
            loading: 'Performing union...',
            success: 'Objects combined',
            error: 'Union failed'
          });
        } else {
          toast.info('Select at least 2 objects to union');
        }
      }
    },
    { 
      id: 'subtract', 
      label: 'Boolean Subtract', 
      icon: 'minus', 
      shortcut: ['l'], 
      onClick: () => {
        if (selectedObjectIds.length > 1) {
          toast.promise(performBoolean('subtract', selectedObjectIds[0], selectedObjectIds[1]), {
            loading: 'Performing subtraction...',
            success: 'Object subtracted',
            error: 'Subtraction failed'
          });
        } else {
          toast.info('Select base and tool objects to subtract');
        }
      }
    },
    { 
      id: 'intersect', 
      label: 'Boolean Intersect', 
      icon: 'intersect', 
      shortcut: ['i'], 
      onClick: () => {
        if (selectedObjectIds.length > 1) {
          toast.promise(performBoolean('intersect', selectedObjectIds[0], selectedObjectIds[1]), {
            loading: 'Performing intersection...',
            success: 'Intersection complete',
            error: 'Intersection failed'
          });
        } else {
          toast.info('Select at least 2 objects to intersect');
        }
      }
    },
  ]

  const featuresMenuItems: MenuItem[] = [
    { id: 'hole', label: 'Add Hole', icon: 'circle', shortcut: ['h'], onClick: () => toast.info('Add Hole - Coming soon') },
    { id: 'fillet', label: 'Fillet', icon: 'rounded-corner', shortcut: ['f'], onClick: () => toast.info('Fillet - Coming soon') },
    { id: 'chamfer', label: 'Chamfer', icon: 'corner-down-right', shortcut: ['e'], onClick: () => toast.info('Chamfer - Coming soon') },
    { id: 'pocket', label: 'Pocket', icon: 'box', onClick: () => toast.info('Pocket - Coming soon') },
  ]

  const manufactureMenuItems: MenuItem[] = [
    { id: 'analyze-dfm', label: 'Analyze DFM', icon: 'zap', onClick: () => router.push('/catalog/quote') },
    { id: 'generate-job', label: 'Generate Job', icon: 'hammer', onClick: () => toast.info('Generate Job - Coming soon') },
    { id: 'get-quote', label: 'Get Quote', icon: 'banknote', onClick: () => router.push('/catalog/quote') },
  ]

  const helpMenuItems: MenuItem[] = [
    { id: 'docs', label: 'Documentation', icon: 'book', onClick: () => window.open('https://docs.qutlas.com', '_blank') },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard', shortcut: ['?'], onClick: () => setShowHelpDialog(true) },
    { divider: true },
    { id: 'settings', label: 'Settings', icon: 'settings', onClick: () => setShowSettingsDialog(true) },
    { divider: true },
    { id: 'about', label: 'About', icon: 'info', onClick: () => toast.info('Qutlas Studio v1.0.0') },
  ]

  // Mobile toolbar - simplified
  if (isMobile) {
    return (
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 shadow-sm safe-area-inset-top">
        {/* Left: Logo + Menu button */}
        <div className="flex items-center gap-3">
          <Hexagon className="w-6 h-6 text-[var(--primary-700)]" />
          <span className="font-semibold text-[var(--primary-700)] hidden sm:inline">Qutlas</span>
        </div>

        {/* Center: Quick actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (canUndo) undo() }}
            disabled={!canUndo}
            className="p-2.5 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => { if (canRedo) redo() }}
            disabled={!canRedo}
            className="p-2.5 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-5 h-5 text-gray-700" />
          </button>
          {!saved && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-2.5 rounded-lg bg-[var(--primary-700)] text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Save"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right: Menu button */}
        <button
          onClick={onMobileMenuOpen}
          className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

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
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          onExport={handleExport}
        />
        <ImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />
        <SettingsDialog
          isOpen={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
        />
        <HelpDialog
          isOpen={showHelpDialog}
          onClose={() => setShowHelpDialog(false)}
        />
      </div>
    )
  }

  // Desktop toolbar - full version
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-4 border-r">
        <Hexagon className="w-6 h-6 text-[var(--primary-700)]" />
        <span className="font-semibold text-[var(--primary-700)]">Qutlas Studio</span>
      </div>

      {/* Menu Bar */}
      <div className="flex items-center gap-1">
        <MenuButton label="File" items={fileMenuItems} />
        <MenuButton label="Edit" items={editMenuItems} />
        <MenuButton label="View" items={viewMenuItems} />
        <MenuButton label="Create" items={createMenuItems} icon="plus" />
        <MenuButton label="Modify" items={modifyMenuItems} />
        <MenuButton label="Features" items={featuresMenuItems} />
        <MenuButton label="Manufacture" items={manufactureMenuItems} />
        <MenuButton label="Help" items={helpMenuItems} />
      </div>

      <div className="flex-1" />

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {!saved && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1.5 text-sm bg-[var(--primary-700)] text-white rounded hover:bg-[var(--primary-800)] transition"
            title="Save (Ctrl+S)"
          >
            Save*
          </button>
        )}
        <button
          onClick={() => document.querySelector('[title="Fit view to all objects (F)"]')?.dispatchEvent(new MouseEvent('click'))}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition"
          title="Fit View (F)"
        >
          Fit
        </button>
      </div>

      {/* Production & Checkout Flow */}
      <div className="flex items-center gap-2 border-l pl-4 ml-4">
        <button
          onClick={() => {
            if (Object.keys(objects).length === 0) {
              toast.error('Add objects to workspace first')
              return
            }
            toast.info('Opening manufacturability analysis...')
            // Could open analysis panel or navigate to analysis view
          }}
          disabled={Object.keys(objects).length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="Analyze manufacturability"
        >
          <BarChart3 size={16} />
          <span className="hidden lg:inline">Analyze</span>
        </button>
        <button
          onClick={() => {
            if (Object.keys(objects).length === 0) {
              toast.error('Add objects to workspace first')
              return
            }
            router.push('/catalog')
          }}
          disabled={Object.keys(objects).length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="Generate quote"
        >
          <FileText size={16} />
          <span className="hidden lg:inline">Quote</span>
        </button>
        <button
          onClick={() => {
            if (Object.keys(objects).length === 0) {
              toast.error('Add objects to workspace first')
              return
            }
            toast.info('Initiating production order...')
            // Could open production dialog
          }}
          disabled={Object.keys(objects).length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="Initiate production order"
        >
          <Zap size={16} />
          <span className="hidden lg:inline">Production</span>
        </button>
        <button
          onClick={() => router.push('/catalog/quote')}
          disabled={Object.keys(objects).length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="Proceed to checkout"
        >
          <CreditCard size={16} />
          <span className="hidden lg:inline">Checkout</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* User Menu */}
      <div className="flex items-center gap-2 border-l pl-4">
        <button
          onClick={() => setShowHelpDialog(true)}
          className="p-2 hover:bg-gray-100 rounded transition"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => setShowSettingsDialog(true)}
          className="p-2 hover:bg-gray-100 rounded transition"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
        <div className="w-px h-6 bg-gray-200" />
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
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImport}
      />
      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
      <HelpDialog
        isOpen={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
      />
    </div>
  )
}

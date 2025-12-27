"use client"

import { useState, useEffect, useCallback } from "react"
import { Hexagon, Menu, Save, Undo, Redo, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { Keys } from "@/lib/shortcuts-registry"

interface ToolbarProps {
  onMobileMenuOpen?: () => void
  onAnalyzeClick?: () => void
  onQuoteClick?: () => void
}

export function Toolbar({ onMobileMenuOpen, onAnalyzeClick, onQuoteClick }: ToolbarProps) {
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
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  
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
    { divider: true },
    { id: 'import', label: 'Import...', icon: 'upload', shortcut: [Keys.Ctrl, 'i'], onClick: () => setShowImportDialog(true) },
    { id: 'export', label: 'Export...', icon: 'download', shortcut: [Keys.Ctrl, 'e'], onClick: () => setShowExportDialog(true) },
  ]

  const editMenuItems: MenuItem[] = [
    { id: 'undo', label: 'Undo', icon: 'undo', shortcut: [Keys.Ctrl, 'z'], onClick: () => { if (canUndo) undo() }, disabled: !canUndo },
    { id: 'redo', label: 'Redo', icon: 'redo', shortcut: [Keys.Ctrl, 'y'], onClick: () => { if (canRedo) redo() }, disabled: !canRedo },
    { divider: true },
    { id: 'delete', label: 'Delete', icon: 'trash', shortcut: ['Delete'], onClick: () => { if (selectedObjectId) deleteObject(selectedObjectId) }, disabled: !selectedObjectId },
  ]

  const viewMenuItems: MenuItem[] = [
    { id: 'fit', label: 'Fit View', icon: 'maximize', shortcut: ['f'], onClick: () => document.querySelector('[title="Fit view to all objects (F)"]')?.dispatchEvent(new MouseEvent('click')) },
    { id: 'reset', label: 'Reset Camera', icon: 'camera', onClick: () => toast.info('Reset Camera - Coming soon') },
    { divider: true },
    { id: 'toggle-grid', label: 'Toggle Grid', icon: 'grid', onClick: () => toast.info('Toggle Grid - Coming soon') },
  ]

  const createMenuItems: MenuItem[] = [
    { id: 'box', label: 'Box', icon: 'square', shortcut: ['b'], onClick: () => createGeometry('box') },
    { id: 'cylinder', label: 'Cylinder', icon: 'circle', shortcut: ['c'], onClick: () => createGeometry('cylinder') },
    { id: 'sphere', label: 'Sphere', icon: 'circle', shortcut: ['s'], onClick: () => createGeometry('sphere') },
    { id: 'cone', label: 'Cone', icon: 'triangle', onClick: () => createGeometry('cone') },
    { id: 'torus', label: 'Torus', icon: 'circle', onClick: () => createGeometry('torus') },
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

  const manufactureMenuItems: MenuItem[] = [
    { id: 'analyze-dfm', label: 'Analyze Manufacturability', icon: 'zap', onClick: onAnalyzeClick },
    { id: 'get-quote', label: 'Get Quote', icon: 'banknote', onClick: onQuoteClick },
  ]

  const helpMenuItems: MenuItem[] = [
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard', shortcut: ['?'], onClick: () => setShowHelpDialog(true) },
    { id: 'settings', label: 'Settings', icon: 'settings', onClick: () => setShowSettingsDialog(true) },
    { divider: true },
    { id: 'about', label: 'About', icon: 'info', onClick: () => toast.info('Qutlas Studio v1.0.0') },
  ]

  // Mobile toolbar - simplified
  if (isMobile) {
    return (
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-3 shadow-sm safe-area-inset-top">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Hexagon className="w-5 h-5 text-[var(--primary-700)]" />
          <span className="font-semibold text-sm text-[var(--primary-700)] hidden sm:inline">Qutlas</span>
        </div>

        {/* Center: Quick actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (canUndo) undo() }}
            disabled={!canUndo}
            className="p-2 rounded-md transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => { if (canRedo) redo() }}
            disabled={!canRedo}
            className="p-2 rounded-md transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4 text-gray-700" />
          </button>
          {!saved && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-2 rounded-md bg-[var(--primary-700)] text-white transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Menu button */}
        <button
          onClick={onMobileMenuOpen}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
          title="Menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
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

  // Desktop toolbar - full version with collapsible menu
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Main toolbar row */}
      <div className="h-12 flex items-center px-3 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
          <Hexagon className="w-5 h-5 text-[var(--primary-700)]" />
          <span className="font-semibold text-sm text-[var(--primary-700)]">Qutlas Studio</span>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setMenuCollapsed(!menuCollapsed)}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title={menuCollapsed ? "Expand menu" : "Collapse menu"}
        >
          {menuCollapsed ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronUp className="w-4 h-4 text-gray-600" />}
        </button>

        {/* Quick Actions - Always visible */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (canUndo) undo() }}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => { if (canRedo) redo() }}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Right section - Save & Manufacturing actions */}
        <div className="flex items-center gap-2">
          {!saved && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-2.5 py-1 text-xs bg-[var(--primary-700)] text-white rounded hover:bg-[var(--primary-800)] transition font-medium"
              title="Save (Ctrl+S)"
            >
              Save*
            </button>
          )}
          <button
            onClick={onAnalyzeClick}
            disabled={Object.keys(objects).length === 0}
            className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            title="Analyze Manufacturability"
          >
            Analyze
          </button>
          <button
            onClick={onQuoteClick}
            disabled={Object.keys(objects).length === 0}
            className="px-2.5 py-1 text-xs bg-[var(--primary-700)] text-white rounded hover:bg-[var(--primary-800)] transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            title="Get Quote"
          >
            Quote
          </button>
        </div>
      </div>

      {/* Collapsible Menu Bar */}
      {!menuCollapsed && (
        <div className="h-9 flex items-center px-3 gap-1 bg-gray-50/50 border-t border-gray-100">
          <MenuButton label="File" items={fileMenuItems} />
          <MenuButton label="Edit" items={editMenuItems} />
          <MenuButton label="View" items={viewMenuItems} />
          <MenuButton label="Create" items={createMenuItems} icon="plus" />
          <MenuButton label="Modify" items={modifyMenuItems} />
          <MenuButton label="Manufacture" items={manufactureMenuItems} />
          <div className="flex-1" />
          <MenuButton label="Help" items={helpMenuItems} />
        </div>
      )}

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

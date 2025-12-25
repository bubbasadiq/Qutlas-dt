"use client"

import { useEffect, useCallback } from "react"
import { shortcutsRegistry, Keys, Shortcut } from "@/lib/shortcuts-registry"
import { useWorkspace } from "./use-workspace"

/**
 * Hook to register and manage keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo, clearWorkspace, selectedObjectId, deleteObject, selectObject } = useWorkspace()

  useEffect(() => {
    // File shortcuts
    shortcutsRegistry.register({
      id: 'file-new',
      keys: [Keys.Ctrl, 'n'],
      description: 'New project',
      category: 'general',
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'file-open',
      keys: [Keys.Ctrl, 'o'],
      description: 'Open project',
      category: 'general',
      action: () => {
        document.querySelector('button[title*="Open (Ctrl+O)"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'file-save',
      keys: [Keys.Ctrl, 's'],
      description: 'Save project',
      category: 'general',
      action: () => {
        document.querySelector('button[title*="Save (Ctrl+S)"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'file-save-as',
      keys: [Keys.Ctrl, Keys.Shift, 's'],
      description: 'Save As',
      category: 'general',
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'file-export',
      keys: [Keys.Ctrl, 'e'],
      description: 'Export design',
      category: 'general',
      action: () => {
        document.querySelector('button[title*="Export (Ctrl+E)"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'file-import',
      keys: [Keys.Ctrl, 'i'],
      description: 'Import files',
      category: 'general',
      action: () => {
        document.querySelector('button[title*="Import (Ctrl+I)"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    // Edit shortcuts
    shortcutsRegistry.register({
      id: 'edit-undo',
      keys: [Keys.Ctrl, 'z'],
      description: 'Undo',
      category: 'editing',
      action: () => {
        if (canUndo) undo()
      },
    })

    shortcutsRegistry.register({
      id: 'edit-redo',
      keys: [Keys.Ctrl, 'y'],
      description: 'Redo',
      category: 'editing',
      action: () => {
        if (canRedo) redo()
      },
    })

    shortcutsRegistry.register({
      id: 'edit-redo-alt',
      keys: [Keys.Ctrl, Keys.Shift, 'z'],
      description: 'Redo',
      category: 'editing',
      action: () => {
        if (canRedo) redo()
      },
    })

    shortcutsRegistry.register({
      id: 'edit-delete',
      keys: ['Delete'],
      description: 'Delete selected',
      category: 'editing',
      disabled: () => !selectedObjectId,
      action: () => {
        if (selectedObjectId) deleteObject(selectedObjectId)
      },
    })

    shortcutsRegistry.register({
      id: 'edit-duplicate',
      keys: [Keys.Ctrl, 'd'],
      description: 'Duplicate selected',
      category: 'editing',
      disabled: () => !selectedObjectId,
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'edit-select-all',
      keys: [Keys.Ctrl, 'a'],
      description: 'Select all',
      category: 'editing',
      action: () => {
        const firstId = document.querySelector('[data-object-id]')?.getAttribute('data-object-id')
        if (firstId) selectObject(firstId)
      },
    })

    shortcutsRegistry.register({
      id: 'edit-deselect-all',
      keys: [Keys.Ctrl, Keys.Shift, 'a'],
      description: 'Deselect all',
      category: 'editing',
      action: () => {
        selectObject('')
      },
    })

    // View shortcuts
    shortcutsRegistry.register({
      id: 'view-fit',
      keys: ['f'],
      description: 'Fit all in view',
      category: 'view',
      action: () => {
        const fitButton = document.querySelector('[title="Fit view to all objects (F)"]') as HTMLButtonElement
        if (fitButton) fitButton.click()
      },
    })

    shortcutsRegistry.register({
      id: 'view-zoom-fit',
      keys: ['z'],
      description: 'Zoom to selected',
      category: 'view',
      action: () => {
        // Handle in canvas
      },
    })

    shortcutsRegistry.register({
      id: 'view-isometric',
      keys: ['0'],
      description: 'Isometric view',
      category: 'view',
      action: () => {
        document.querySelector('button:has-text("Iso")')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'view-front',
      keys: ['1'],
      description: 'Front view',
      category: 'view',
      action: () => {
        document.querySelector('button:has-text("Front")')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'view-top',
      keys: ['2'],
      description: 'Top view',
      category: 'view',
      action: () => {
        document.querySelector('button:has-text("Top")')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'view-right',
      keys: ['3'],
      description: 'Right side view',
      category: 'view',
      action: () => {
        document.querySelector('button:has-text("Right")')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'view-toggle-grid',
      keys: ['g'],
      description: 'Toggle grid',
      category: 'view',
      action: () => {
        document.querySelector('button:has-text("Grid")')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    // Creation shortcuts
    shortcutsRegistry.register({
      id: 'create-box',
      keys: ['b'],
      description: 'Create box',
      category: 'creation',
      action: () => {
        document.querySelector('[data-action="create-box"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'create-cylinder',
      keys: ['c'],
      description: 'Create cylinder',
      category: 'creation',
      action: () => {
        document.querySelector('[data-action="create-cylinder"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'create-sphere',
      keys: ['s'],
      description: 'Create sphere',
      category: 'creation',
      action: () => {
        document.querySelector('[data-action="create-sphere"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'create-cone',
      keys: ['o'],
      description: 'Create cone',
      category: 'creation',
      action: () => {
        document.querySelector('[data-action="create-cone"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'create-torus',
      keys: ['t'],
      description: 'Create torus',
      category: 'creation',
      action: () => {
        document.querySelector('[data-action="create-torus"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    // Feature shortcuts
    shortcutsRegistry.register({
      id: 'feature-hole',
      keys: ['h'],
      description: 'Add hole',
      category: 'features',
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'feature-fillet',
      keys: ['f'],
      description: 'Add fillet',
      category: 'features',
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'feature-chamfer',
      keys: ['e'],
      description: 'Add chamfer',
      category: 'features',
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'feature-union',
      keys: ['u'],
      description: 'Boolean union',
      category: 'features',
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'feature-subtract',
      keys: ['l'],
      description: 'Boolean subtract',
      category: 'features',
      action: () => {
        // Handle in toolbar
      },
    })

    shortcutsRegistry.register({
      id: 'feature-intersect',
      keys: ['i'],
      description: 'Boolean intersect',
      category: 'features',
      action: () => {
        // Handle in toolbar
      },
    })

    // Transform shortcuts
    shortcutsRegistry.register({
      id: 'transform-grab',
      keys: ['g'],
      description: 'Grab (move mode)',
      category: 'transform',
      action: () => {
        // Handle in canvas
      },
    })

    shortcutsRegistry.register({
      id: 'transform-rotate',
      keys: ['r'],
      description: 'Rotate mode',
      category: 'transform',
      action: () => {
        // Handle in canvas
      },
    })

    shortcutsRegistry.register({
      id: 'transform-scale',
      keys: ['s'],
      description: 'Scale mode',
      category: 'transform',
      action: () => {
        // Handle in canvas
      },
    })

    // Chat shortcuts
    shortcutsRegistry.register({
      id: 'chat-shortcut',
      keys: [Keys.Ctrl, 'k'],
      description: 'Open chat',
      category: 'chat',
      action: () => {
        // Focus chat input
        const chatInput = document.querySelector('textarea[placeholder*="Describe"]') as HTMLTextAreaElement
        if (chatInput) {
          chatInput.focus()
        }
      },
    })

    // Help shortcuts
    shortcutsRegistry.register({
      id: 'help-shortcuts',
      keys: ['?'],
      description: 'Show keyboard shortcuts',
      category: 'general',
      action: () => {
        document.querySelector('[title="Keyboard Shortcuts"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    shortcutsRegistry.register({
      id: 'help-shortcuts-alt',
      keys: ['/'],
      description: 'Show keyboard shortcuts',
      category: 'general',
      action: () => {
        document.querySelector('[title="Keyboard Shortcuts"]')?.dispatchEvent(new MouseEvent('click'))
      },
    })

    // Attach to document
    shortcutsRegistry.attach()

    // Cleanup on unmount
    return () => {
      shortcutsRegistry.detach()
    }
  }, [undo, redo, canUndo, canRedo, selectedObjectId, deleteObject, selectObject])

  return {
    shortcuts: shortcutsRegistry.getAll(),
    formatShortcut: shortcutsRegistry.formatShortcut.bind(shortcutsRegistry),
  }
}

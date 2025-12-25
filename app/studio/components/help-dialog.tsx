"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { shortcutsRegistry } from "@/lib/shortcuts-registry"
import { useMemo } from "react"

interface HelpDialogProps {
  isOpen: boolean
  onClose: () => void
}

const categories = {
  general: { label: 'General', icon: 'settings' },
  editing: { label: 'Editing', icon: 'edit' },
  view: { label: 'View', icon: 'eye' },
  creation: { label: 'Creation', icon: 'plus' },
  features: { label: 'Features', icon: 'layers' },
  chat: { label: 'Chat', icon: 'message-square' },
  transform: { label: 'Transform', icon: 'move' },
}

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  const shortcuts = useMemo(() => shortcutsRegistry.getAll(), [])

  const groupedShortcuts = useMemo(() => {
    const grouped: Record<string, typeof shortcuts> = {}
    shortcuts.forEach(s => {
      if (!grouped[s.category]) {
        grouped[s.category] = []
      }
      grouped[s.category].push(s)
    })
    return grouped
  }, [shortcuts])

  const formatShortcut = (keys?: string[]) => {
    if (!keys) return ''
    return keys.map(key => {
      switch (key) {
        case 'Control': return 'Ctrl'
        case 'Command': return '⌘'
        case 'Alt': return 'Alt'
        case 'Shift': return 'Shift'
        case 'Delete': return 'Del'
        case 'Escape': return 'Esc'
        case 'Enter': return '↵'
        case 'ArrowUp': return '↑'
        case 'ArrowDown': return '↓'
        case 'ArrowLeft': return '←'
        case 'ArrowRight': return '→'
        default: return key
      }
    }).join('+')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="help-circle" className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {Object.entries(categories).map(([catId, catInfo]) => {
              const catShortcuts = groupedShortcuts[catId] || []
              if (catShortcuts.length === 0) return null

              return (
                <section key={catId}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Icon name={catInfo.icon as any} className="w-4 h-4 text-[var(--primary-700)]" />
                    {catInfo.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {catShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{shortcut.description}</span>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-gray-600">
                          {formatShortcut(shortcut.keys)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>

        <div className="pt-4 border-t mt-4">
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Icon name="info" className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Tip: Press <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">?</kbd> to open this help dialog anytime.</p>
                <p className="text-blue-700">Shortcuts are disabled when typing in input fields.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => window.open('https://docs.qutlas.com', '_blank')}
              className="text-sm text-[var(--primary-700)] hover:text-[var(--primary-800)] font-medium"
            >
              View Full Documentation →
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

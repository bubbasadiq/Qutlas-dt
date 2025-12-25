/**
 * Centralized keyboard shortcuts registry for the Qutlas Studio workspace
 * Handles all keyboard shortcuts, conflicts, and context awareness
 */

export interface Shortcut {
  id: string
  keys: string[] // Array of keys (e.g., ['Control', 's'])
  description: string
  category: 'general' | 'editing' | 'view' | 'creation' | 'features' | 'chat' | 'transform'
  action: () => void
  disabled?: () => boolean // Function to check if shortcut should be disabled
  context?: 'always' | 'when-input-focused' | 'when-canvas-focused'
}

class ShortcutsRegistry {
  private shortcuts: Map<string, Shortcut> = new Map()
  private listeners: Set<(e: KeyboardEvent) => void> = new Set()

  register(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.id, shortcut)
  }

  unregister(id: string): void {
    this.shortcuts.delete(id)
  }

  get(id: string): Shortcut | undefined {
    return this.shortcuts.get(id)
  }

  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }

  getByCategory(category: Shortcut['category']): Shortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === category)
  }

  /**
   * Check if a keyboard event matches a shortcut
   */
  matchesShortcut(e: KeyboardEvent, shortcut: Shortcut): boolean {
    const requiredKeys = new Set(shortcut.keys)
    const pressedKeys = new Set<string>()

    if (e.ctrlKey || e.metaKey) pressedKeys.add(isMac() ? 'Command' : 'Control')
    if (e.altKey) pressedKeys.add('Alt')
    if (e.shiftKey) pressedKeys.add('Shift')
    pressedKeys.add(e.key)

    // Check if all required keys are pressed
    for (const key of requiredKeys) {
      if (!pressedKeys.has(key)) return false
    }

    // Check if only required keys are pressed
    for (const key of pressedKeys) {
      if (!requiredKeys.has(key)) return false
    }

    return true
  }

  /**
   * Handle keyboard event and execute matching shortcut
   */
  handleEvent(e: KeyboardEvent): boolean {
    // Check if focus is in an input/textarea - skip shortcuts there unless they're allowed
    const activeElement = document.activeElement
    const isInputFocused = activeElement instanceof HTMLInputElement ||
                          activeElement instanceof HTMLTextAreaElement ||
                          activeElement?.getAttribute('contenteditable') === 'true'

    for (const shortcut of this.shortcuts.values()) {
      // Skip if shortcut is disabled
      if (shortcut.disabled?.()) continue

      // Skip if context doesn't match
      if (shortcut.context === 'when-input-focused' && !isInputFocused) continue
      if (shortcut.context === 'when-canvas-focused' && isInputFocused) continue

      if (this.matchesShortcut(e, shortcut)) {
        e.preventDefault()
        e.stopPropagation()
        shortcut.action()
        return true
      }
    }

    return false
  }

  /**
   * Format shortcut keys for display
   */
  formatShortcut(keys: string[]): string {
    const isMacDevice = isMac()
    return keys
      .map(key => {
        switch (key) {
          case 'Control':
            return isMacDevice ? '⌘' : 'Ctrl'
          case 'Command':
            return '⌘'
          case 'Alt':
            return isMacDevice ? '⌥' : 'Alt'
          case 'Shift':
            return isMacDevice ? '⇧' : 'Shift'
          case 'ArrowUp':
            return '↑'
          case 'ArrowDown':
            return '↓'
          case 'ArrowLeft':
            return '←'
          case 'ArrowRight':
            return '→'
          case 'Delete':
            return 'Del'
          case 'Escape':
            return 'Esc'
          case 'Enter':
            return '↵'
          default:
            return key.charAt(0).toUpperCase() + key.slice(1)
        }
      })
      .join(isMacDevice ? '' : '+')
  }

  /**
   * Attach listener to document
   */
  attach(): void {
    const handler = (e: KeyboardEvent) => this.handleEvent(e)
    document.addEventListener('keydown', handler)
    this.listeners.add(handler)
  }

  /**
   * Detach all listeners
   */
  detach(): void {
    this.listeners.forEach(handler => {
      document.removeEventListener('keydown', handler)
    })
    this.listeners.clear()
  }
}

/**
 * Check if current platform is Mac
 */
function isMac(): boolean {
  return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

// Global registry instance
export const shortcutsRegistry = new ShortcutsRegistry()

/**
 * Helper to create shortcut key combination
 */
export function keyCombo(...keys: string[]): string[] {
  return keys
}

/**
 * Predefined key combinations for common shortcuts
 */
export const Keys = {
  Ctrl: 'Control',
  Cmd: 'Command',
  Alt: 'Alt',
  Shift: 'Shift',
  Delete: 'Delete',
  Escape: 'Escape',
  Enter: 'Enter',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
}

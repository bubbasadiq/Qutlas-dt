"use client"

import { useRef, useEffect, useState } from "react"
import * as Icons from "lucide-react"
import { shortcutsRegistry, Keys } from "@/lib/shortcuts-registry"

// Icon mapping from string names to Lucide icons
const iconMap: Record<string, any> = {
  'file': Icons.File,
  'folder-open': Icons.FolderOpen,
  'save': Icons.Save,
  'upload': Icons.Upload,
  'download': Icons.Download,
  'undo': Icons.Undo,
  'redo': Icons.Redo,
  'trash': Icons.Trash,
  'copy': Icons.Copy,
  'square': Icons.Square,
  'zoom-in': Icons.ZoomIn,
  'zoom-out': Icons.ZoomOut,
  'maximize': Icons.Maximize,
  'camera': Icons.Camera,
  'grid': Icons.Grid3x3,
  'layout': Icons.Layout,
  'plus': Icons.Plus,
  'circle': Icons.Circle,
  'triangle': Icons.Triangle,
  'layers': Icons.Layers,
  'minus': Icons.Minus,
  'intersect': Icons.Scissors,
  'zap': Icons.Zap,
  'hammer': Icons.Hammer,
  'banknote': Icons.Banknote,
  'book': Icons.Book,
  'keyboard': Icons.Keyboard,
  'settings': Icons.Settings,
  'info': Icons.Info,
  'chevron-right': Icons.ChevronRight,
  'chevron-down': Icons.ChevronDown,
  'logo': Icons.Hexagon,
}

export interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string[]
  divider?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: MenuItem[]
}

interface MenuDropdownProps {
  items: MenuItem[]
  onClose: () => void
}

export function MenuDropdown({ items, onClose }: MenuDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

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
        default: return key
      }
    }).join('+')
  }

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[200px] z-50"
    >
      {items.map((item, idx) =>
        item.divider ? (
          <div key={idx} className="border-t border-gray-100 my-1" />
        ) : (
          <MenuItemComponent key={idx} item={item} onClose={onClose} formatShortcut={formatShortcut} />
        )
      )}
    </div>
  )
}

function MenuItemComponent({
  item,
  onClose,
  formatShortcut,
}: {
  item: MenuItem
  onClose: () => void
  formatShortcut: (keys?: string[]) => string
}) {
  const [showSubmenu, setShowSubmenu] = useState(false)
  const hasSubmenu = item.children && item.children.length > 0

  const IconComponent = item.icon ? iconMap[item.icon] : null

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!item.disabled && item.onClick) {
            item.onClick()
            onClose()
          }
        }}
        onMouseEnter={() => hasSubmenu && setShowSubmenu(true)}
        onMouseLeave={() => hasSubmenu && setShowSubmenu(false)}
        disabled={item.disabled}
        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors ${
          item.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="w-3.5 h-3.5 text-gray-500" />}
          <span>{item.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.shortcut && (
            <span className="text-xs text-gray-400 font-medium">{formatShortcut(item.shortcut)}</span>
          )}
          {hasSubmenu && <Icons.ChevronRight className="w-3 h-3 text-gray-400" />}
        </div>
      </button>

      {hasSubmenu && showSubmenu && (
        <div
          className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[200px] z-50"
          onMouseEnter={() => setShowSubmenu(true)}
          onMouseLeave={() => setShowSubmenu(false)}
        >
          {item.children?.map((subItem, subIdx) => {
            const SubIcon = subItem.icon ? iconMap[subItem.icon] : null
            return subItem.divider ? (
              <div key={subIdx} className="border-t border-gray-100 my-1" />
            ) : (
              <button
                key={subIdx}
                onClick={() => {
                  if (!subItem.disabled && subItem.onClick) {
                    subItem.onClick()
                    onClose()
                  }
                }}
                disabled={subItem.disabled}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  subItem.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {SubIcon && <SubIcon className="w-3.5 h-3.5 text-gray-500" />}
                <span>{subItem.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface MenuButtonProps {
  label: string
  icon?: string
  items: MenuItem[]
  isActive?: boolean
}

export function MenuButton({ label, icon, items, isActive }: MenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const IconComponent = icon ? iconMap[icon] : null

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2 py-1.5 text-xs rounded transition-colors flex items-center gap-1 ${
          isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
        <span>{label}</span>
        <Icons.ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && <MenuDropdown items={items} onClose={() => setIsOpen(false)} />}
    </div>
  )
}

"use client"

import { useRef, useEffect } from "react"
import { Icon } from "@/components/ui/icon"

export interface ContextMenuProps {
  position: { x: number; y: number } | null
  actions: ContextMenuAction[]
  onActionClick: (action: ContextMenuAction) => void
  onClose: () => void
}

export interface ContextMenuAction {
  label: string
  icon?: string
  onClick: () => void
  disabled?: boolean
  divider?: boolean
}

export function ContextMenu({
  position,
  actions,
  onActionClick,
  onClose,
}: ContextMenuProps) {
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
  
  if (!position) return null
  
  return (
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-300 rounded shadow-lg z-50 py-1 min-w-max"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {actions.map((action, idx) => (
        action.divider ? (
          <div key={idx} className="border-t border-gray-200 my-1" />
        ) : (
          <button
            key={idx}
            onClick={() => {
              onActionClick(action)
              onClose()
            }}
            disabled={action.disabled}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-blue-50 transition ${
              action.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {action.icon && <Icon name={action.icon} className="w-4 h-4" />}
            <span>{action.label}</span>
          </button>
        )
      ))}
    </div>
  )
}
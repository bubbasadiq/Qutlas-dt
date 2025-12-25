"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import * as Icons from "lucide-react"
import { MenuItem } from "@/components/toolbar-menu"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  menuItems: MenuItem[]
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  saved?: boolean
}

interface MenuGroup {
  id: string
  label: string
  icon: string
  items: MenuItem[]
}

export function MobileMenu({
  isOpen,
  onClose,
  menuItems,
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  saved = true,
}: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Organize menu items into groups
  const fileItems = menuItems.filter(
    (item) =>
      ["new", "open", "save", "save-as", "import", "export"].includes(item.id || "")
  )
  const editItems = menuItems.filter(
    (item) => ["undo", "redo", "delete", "duplicate", "select-all"].includes(item.id || "")
  )
  const viewItems = menuItems.filter(
    (item) =>
      ["zoom-in", "zoom-out", "fit", "reset", "toggle-grid", "toggle-panels"].includes(
        item.id || ""
      )
  )
  const createItems = menuItems.filter((item) =>
    ["box", "cylinder", "sphere", "cone", "torus"].includes(item.id || "")
  )

  const groups: MenuGroup[] = [
    { id: "file", label: "File", icon: "file", items: fileItems },
    { id: "edit", label: "Edit", icon: "edit", items: editItems },
    { id: "view", label: "View", icon: "view", items: viewItems },
    { id: "create", label: "Create", icon: "plus", items: createItems },
  ]

  const formatShortcut = (keys?: string[]) => {
    if (!keys) return ""
    return keys
      .map((key) => {
        switch (key) {
          case "Control":
            return "Ctrl"
          case "Command":
            return "⌘"
          case "Alt":
            return "Alt"
          case "Shift":
            return "Shift"
          case "Delete":
            return "Del"
          default:
            return key
        }
      })
      .join("+")
  }

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      file: Icons.File,
      folder: Icons.Folder,
      "folder-open": Icons.FolderOpen,
      save: Icons.Save,
      upload: Icons.Upload,
      download: Icons.Download,
      undo: Icons.Undo,
      redo: Icons.Redo,
      trash: Icons.Trash,
      copy: Icons.Copy,
      square: Icons.Square,
      "zoom-in": Icons.ZoomIn,
      "zoom-out": Icons.ZoomOut,
      maximize: Icons.Maximize,
      camera: Icons.Camera,
      grid: Icons.Grid3X3,
      layout: Icons.Layout,
      plus: Icons.Plus,
      circle: Icons.Circle,
      triangle: Icons.Triangle,
      edit: Icons.Edit,
      view: Icons.Eye,
    }
    return iconName ? iconMap[iconName] : null
  }

  const renderMenuItem = (item: MenuItem, isSubItem = false) => {
    if (item.divider) {
      return <div key="divider" className="border-t border-gray-100 my-2" />
    }

    const IconComponent = getIconComponent(item.icon)

    return (
      <button
        key={item.id}
        onClick={() => {
          if (!item.disabled && item.onClick) {
            item.onClick()
            onClose()
          }
        }}
        disabled={item.disabled}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg",
          "min-h-[48px] touch-manipulation",
          item.disabled
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-gray-100 active:bg-gray-200",
          isSubItem && "pl-8"
        )}
      >
        <div className="flex items-center gap-3">
          {IconComponent && (
            <IconComponent className="w-5 h-5 text-gray-500" />
          )}
          {!IconComponent && item.icon && (
            <Icon name={item.icon} size={20} className="text-gray-500" />
          )}
          <span
            className={cn(
              "font-medium",
              item.disabled ? "text-gray-400" : "text-gray-900"
            )}
          >
            {item.label}
          </span>
        </div>
        {item.shortcut && (
          <span className="text-xs text-gray-400 font-medium">
            {formatShortcut(item.shortcut)}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Menu panel */}
      <div
        ref={menuRef}
        className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-hidden"
      >
        {/* Handle bar */}
        <div
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4"
          onClick={onClose}
        />

        {/* Quick actions bar */}
        <div className="flex items-center justify-around px-4 pb-4 border-b border-gray-100">
          <QuickActionButton
            icon={Icons.Undo}
            label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
          />
          <QuickActionButton
            icon={Icons.Redo}
            label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
          />
          <QuickActionButton
            icon={Icons.Save}
            label={saved ? "Saved" : "Save"}
            onClick={onSave}
            variant={saved ? "success" : "primary"}
          />
        </div>

        {/* Menu groups */}
        <div className="overflow-y-auto pb-24 max-h-[60vh]">
          {groups.map((group) => (
            <div key={group.id} className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map((item) => renderMenuItem(item))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface QuickActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "primary" | "success"
}

function QuickActionButton({
  icon: IconComponent,
  label,
  onClick,
  disabled = false,
  variant = "default",
}: QuickActionButtonProps) {
  const variantClasses = {
    default: "text-gray-600 hover:bg-gray-100",
    primary: "bg-[var(--primary-700)] text-white hover:bg-[var(--primary-800)]",
    success: "bg-green-600 text-white hover:bg-green-700",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center w-20 h-16 rounded-xl transition-colors",
        "min-w-[64px] touch-manipulation",
        variantClasses[variant],
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <IconComponent className="w-6 h-6" />
      <span className="text-xs font-medium mt-1">{label}</span>
    </button>
  )
}

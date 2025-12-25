"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import * as Icons from "lucide-react"

interface BottomNavTab {
  id: string
  label: string
  icon: string
  badge?: number
}

interface MobileBottomNavProps {
  tabs: BottomNavTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function MobileBottomNav({ tabs, activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const IconComponent = iconMap[tab.icon]
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] rounded-lg transition-colors",
                isActive
                  ? "text-[var(--primary-700)]"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                isActive ? "bg-[var(--primary-50)]" : "hover:bg-gray-100"
              )}>
                {IconComponent ? (
                  <IconComponent
                    className={cn(
                      "w-6 h-6",
                      isActive ? "text-[var(--primary-700)]" : "text-gray-500"
                    )}
                  />
                ) : (
                  <Icon
                    name={tab.icon}
                    size={24}
                    className={cn(
                      isActive ? "text-[var(--primary-700)]" : "text-gray-500"
                    )}
                  />
                )}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium mt-1",
                isActive ? "text-[var(--primary-700)]" : "text-gray-500"
              )}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Icon mapping for lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  canvas: Icons.Box,
  tools: Icons.Wrench,
  tree: Icons.ListTree,
  properties: Icons.Sliders,
  ai: Icons.Bot,
  chat: Icons.MessageCircle,
  select: Icons.MousePointer2,
  sketch: Icons.Pencil,
  extrude: Icons.Box,
  fillet: Icons.CircleEllipsis,
  measure: Icons.Ruler,
  section: Icons.Scissors,
  undo: Icons.Undo,
  redo: Icons.Redo,
  save: Icons.Save,
  menu: Icons.Menu,
  close: Icons.X,
  plus: Icons.Plus,
  maximize: Icons.Maximize,
  grid: Icons.Grid3X3,
  settings: Icons.Settings,
  help: Icons.HelpCircle,
  camera: Icons.Camera,
  zoom: Icons.ZoomIn,
}

export const DEFAULT_BOTTOM_NAV_TABS: BottomNavTab[] = [
  { id: "canvas", label: "Canvas", icon: "canvas" },
  { id: "tools", label: "Tools", icon: "tools" },
  { id: "tree", label: "Scene", icon: "tree" },
  { id: "properties", label: "Props", icon: "properties" },
  { id: "ai", label: "AI", icon: "ai" },
]

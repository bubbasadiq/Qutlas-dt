"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

interface Tool {
  id: string
  label: string
  icon: string
  shortcut?: string
}

const tools: Tool[] = [
  { id: "select", label: "Select", icon: "upload", shortcut: "V" },
  { id: "sketch", label: "Sketch", icon: "api", shortcut: "S" },
  { id: "extrude", label: "Extrude", icon: "mesh", shortcut: "E" },
  { id: "fillet", label: "Fillet", icon: "gear", shortcut: "F" },
  { id: "measure", label: "Measure", icon: "cmm", shortcut: "M" },
  { id: "section", label: "Section", icon: "fixture", shortcut: "X" },
]

export interface ToolbarProps {
  onToolSelect: (toolId: string) => void
  activeTool?: string
}

export const SidebarTools: React.FC<ToolbarProps> = ({ onToolSelect, activeTool }) => {
  const [isUploadHover, setIsUploadHover] = useState(false)

  return (
    <div className="w-56 bg-white border-r border-[var(--neutral-200)] flex flex-col">
      {/* Upload Area */}
      <div className="p-4 border-b border-[var(--neutral-200)]">
        <div
          onMouseEnter={() => setIsUploadHover(true)}
          onMouseLeave={() => setIsUploadHover(false)}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isUploadHover
              ? "border-[var(--primary-500)] bg-[var(--primary-50)]"
              : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
          }`}
        >
          <Icon
            name="upload"
            size={32}
            className={`mx-auto mb-2 ${isUploadHover ? "text-[var(--primary-700)]" : "text-[var(--neutral-400)]"}`}
          />
          <p className="text-sm font-medium text-[var(--neutral-700)]">Upload CAD</p>
          <p className="text-xs text-[var(--neutral-400)] mt-1">STEP, IGES, STL</p>
        </div>
      </div>

      {/* Tools */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-3">Tools</h3>
        <div className="space-y-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTool === tool.id
                  ? "bg-[var(--primary-700)] text-white"
                  : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name={tool.icon} size={18} className={activeTool === tool.id ? "text-white" : ""} />
                <span className="font-medium">{tool.label}</span>
              </div>
              {tool.shortcut && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    activeTool === tool.id
                      ? "bg-white/20 text-white"
                      : "bg-[var(--neutral-100)] text-[var(--neutral-500)]"
                  }`}
                >
                  {tool.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Insert Catalog */}
      <div className="p-4 border-t border-[var(--neutral-200)]">
        <Link href="/catalog">
          <Button className="w-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)]">
            <Icon name="catalog" size={18} className="mr-2" />
            Insert from Catalog
          </Button>
        </Link>
      </div>
    </div>
  )
}

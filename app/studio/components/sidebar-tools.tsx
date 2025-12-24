"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { useOcctWorker } from "@/hooks/use-occt-worker"

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

interface SidebarToolsProps {
  activeTool?: string
  onToolSelect?: (toolId: string) => void
}

export const SidebarTools: React.FC<SidebarToolsProps> = ({ activeTool: externalActiveTool, onToolSelect }) => {
  const [isUploadHover, setIsUploadHover] = useState(false)
  const { activeTool: contextActiveTool, selectTool, selectObject, objects, addObject } = useWorkspace()
  const { loadFile } = useOcctWorker()
  
  const activeTool = externalActiveTool || contextActiveTool

  // handle CAD file upload
  const handleUpload = async (file: File) => {
    const objectId = await loadFile(file) // OCCT worker parses file & returns object ID
    addObject(objectId, { 
      type: 'compound',
      dimensions: {},
      params: { length: 100, width: 50, height: 25 } 
    })
    selectObject(objectId)
  }
  
  const handleToolSelect = (toolId: string) => {
    selectTool(toolId)
    if (onToolSelect) {
      onToolSelect(toolId)
    }
  }

  return (
    <div className="w-full bg-white flex flex-col">
      {/* Upload Area */}
      <div className="p-3">
        <input
          type="file"
          accept=".stp,.step,.iges,.stl"
          className="hidden"
          id="cad-upload"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <label
          htmlFor="cad-upload"
          onMouseEnter={() => setIsUploadHover(true)}
          onMouseLeave={() => setIsUploadHover(false)}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors block ${
            isUploadHover
              ? "border-[var(--primary-500)] bg-[var(--primary-50)]"
              : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
          }`}
        >
          <Icon
            name="upload"
            size={24}
            className={`mx-auto mb-1 ${isUploadHover ? "text-[var(--primary-700)]" : "text-[var(--neutral-400)]"}`}
          />
          <p className="text-xs font-medium text-[var(--neutral-700)]">Upload CAD</p>
          <p className="text-xs text-[var(--neutral-400)] mt-0.5">STEP, IGES, STL</p>
        </label>
      </div>

      {/* Tools */}
      <div className="flex-1 px-3 pb-3 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-2">Tools</h3>
        <div className="space-y-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs transition-colors ${
                activeTool === tool.id
                  ? "bg-[var(--primary-700)] text-white"
                  : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name={tool.icon} size={16} className={activeTool === tool.id ? "text-white" : ""} />
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
    </div>
  )
}

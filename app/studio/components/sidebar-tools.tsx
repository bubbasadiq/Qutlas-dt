"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { useCadmiumWorker } from "@/hooks/use-cadmium-worker"
import { useIsMobile } from "@/hooks/use-media-query"
import { toast } from "sonner"

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
  const isMobile = useIsMobile()
  const [isUploadHover, setIsUploadHover] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { activeTool: contextActiveTool, selectTool, selectObject, objects, addObject } = useWorkspace()
  const cadmium = useCadmiumWorker()
  
  const activeTool = externalActiveTool || contextActiveTool

  // handle CAD file upload
  const handleUpload = async (file: File) => {
    setIsUploading(true)
    const uploadToast = toast.loading(`Uploading ${file.name}...`)
    
    try {
      // For MVP: Create a default box when file is uploaded
      // Full CAD file parsing will be implemented later
      const result = await cadmium.createBox(100, 50, 25)
      addObject(result.geometryId, { 
        type: 'box',
        dimensions: { width: 100, height: 50, depth: 25 },
        params: { length: 100, width: 50, height: 25 },
        description: file.name,
      })
      selectObject(result.geometryId)
      toast.success('File uploaded successfully', { id: uploadToast })
    } catch (error) {
      toast.error('Failed to upload file', { id: uploadToast })
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleToolSelect = (toolId: string) => {
    selectTool(toolId)
    if (onToolSelect) {
      onToolSelect(toolId)
    }
  }

  // Mobile optimized styles with larger touch targets
  const mobileButtonClass = isMobile
    ? "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm transition-colors min-h-[48px] touch-manipulation"
    : "w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs transition-colors"

  const iconSize = isMobile ? 20 : 16

  return (
    <div className={`w-full bg-white ${isMobile ? '' : 'flex flex-col'}`}>
      {/* Upload Area - Simplified for mobile */}
      <div className={`${isMobile ? 'p-3' : 'p-3'}`}>
        <input
          type="file"
          accept=".stp,.step,.iges,.stl"
          className="hidden"
          id="cad-upload"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <label
          htmlFor="cad-upload"
          onMouseEnter={() => !isMobile && setIsUploadHover(true)}
          onMouseLeave={() => !isMobile && setIsUploadHover(false)}
          className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors block touch-manipulation ${
            isMobile ? 'py-4' : ''
          } ${
            isUploading 
              ? "border-[var(--neutral-200)] bg-[var(--bg-100)] cursor-wait"
              : isUploadHover
              ? "border-[var(--primary-500)] bg-[var(--primary-50)]"
              : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2">
              <div className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'} mx-auto mb-2 border-2 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin`} />
              <p className="text-sm font-medium text-[var(--neutral-700)]">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <Icon
                name="upload"
                size={isMobile ? 28 : 24}
                className={`mb-2 ${isUploadHover ? "text-[var(--primary-700)]" : "text-[var(--neutral-400)]"}`}
              />
              <p className="text-sm font-medium text-[var(--neutral-700)]">Upload CAD</p>
              <p className="text-xs text-[var(--neutral-400)] mt-0.5">STEP, IGES, STL</p>
            </div>
          )}
        </label>
      </div>

      {/* Tools */}
      <div className={`${isMobile ? 'px-3 pb-3' : 'flex-1 px-3 pb-3 overflow-y-auto'}`}>
        <h3 className={`${isMobile ? 'text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-3' : 'text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-2'}`}>Tools</h3>
        <div className="space-y-1.5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`${mobileButtonClass} ${
                activeTool === tool.id
                  ? "bg-[var(--primary-700)] text-white"
                  : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name={tool.icon} size={iconSize} className={activeTool === tool.id ? "text-white" : ""} />
                <span className="font-medium">{tool.label}</span>
              </div>
              {tool.shortcut && (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
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

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Square, Circle, CircleDot, Upload, Box, Cylinder, Wrench, Layers, MousePointer2, Pencil, Ruler, Plus, Minus, Crosshair, Disc, ChevronRight, Triangle, ArrowUpDown, RefreshCw, CheckSquare, SquareX, Move3D, Gauge, Ruler as Ruler2, Maximize2 } from "lucide-react"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { toast } from "sonner"

interface Tool {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  shortcut?: string
}

const tools: Tool[] = [
  { id: "select", label: "Select", icon: MousePointer2, shortcut: "V" },
  { id: "sketch", label: "Sketch", icon: Pencil, shortcut: "S" },
  { id: "extrude", label: "Extrude", icon: Box, shortcut: "E" },
  { id: "fillet", label: "Fillet", icon: Wrench, shortcut: "F" },
  { id: "measure-distance", label: "Measure Distance", icon: Ruler },
  { id: "measure-angle", label: "Measure Angle", icon: Maximize2 },
  { id: "section", label: "Section", icon: Layers, shortcut: "X" },
]

const booleanTools: Tool[] = [
  { id: "union", label: "Union", icon: Plus, shortcut: "U" },
  { id: "subtract", label: "Subtract", icon: Minus, shortcut: "S" },
  { id: "intersect", label: "Intersect", icon: Crosshair, shortcut: "I" },
  { id: "hole", label: "Hole", icon: Disc, shortcut: "H" },
]

const transformTools: Tool[] = [
  { id: "move", label: "Move", icon: Move3D, shortcut: "M" },
  { id: "rotate", label: "Rotate", icon: RefreshCw, shortcut: "R" },
  { id: "scale", label: "Scale", icon: ArrowUpDown, shortcut: "S" },
]

const selectTools: Tool[] = [
  { id: "select-all", label: "Select All", icon: CheckSquare, shortcut: "A" },
  { id: "select-none", label: "Select None", icon: SquareX, shortcut: "Esc" },
]

const shapeTools: Tool[] = [
  { id: "create-box", label: "Box", icon: Square },
  { id: "create-cylinder", label: "Cylinder", icon: Circle },
  { id: "create-sphere", label: "Sphere", icon: CircleDot },
  { id: "create-cone", label: "Cone", icon: Triangle },
  { id: "create-torus", label: "Torus", icon: Circle },
]

interface SidebarToolsProps {
  activeTool?: string
  onToolSelect?: (toolId: string) => void
}

export const SidebarTools: React.FC<SidebarToolsProps> = ({ activeTool: externalActiveTool, onToolSelect }) => {
  const isMobile = useIsMobile()
  const [isUploadHover, setIsUploadHover] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    tools: true,
    modify: true,
    shapes: !isMobile,
    transform: false,
    select: false,
  })
  const { activeTool: contextActiveTool, selectTool, selectObject, objects, addObject, performBoolean } = useWorkspace()
  
  const activeTool = externalActiveTool || contextActiveTool

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  // handle CAD file upload
  const handleUpload = async (file: File) => {
    setIsUploading(true)
    const uploadToast = toast.loading(`Uploading ${file.name}...`)
    
    try {
      // Upload the raw CAD file to Supabase Storage via the S3-compatible endpoint.
      const objectKey = `uploads/${Date.now()}-${file.name}`
      const presignRes = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: "cad-files",
          key: objectKey,
          method: "PUT",
          expiresInSeconds: 60 * 10,
        }),
      })

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}))
        throw new Error(err.error || "Failed to prepare upload")
      }

      const { url } = await presignRes.json()

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      })

      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => "")
        throw new Error(`Upload failed (${uploadRes.status}): ${text}`)
      }

      // Add a usable placeholder object in the scene.
      const id = `geo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      addObject(id, {
        type: "box",
        dimensions: { width: 100, height: 50, depth: 25 },
        params: { length: 100, width: 50, height: 25 },
        description: file.name,
        sourceFile: {
          bucket: "cad-files",
          key: objectKey,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        },
      })

      selectObject(id)
      toast.success("File uploaded successfully", { id: uploadToast })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file", { id: uploadToast })
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleToolSelect = async (toolId: string) => {
    selectTool(toolId)
    if (onToolSelect) {
      onToolSelect(toolId)
    }

    // Handle shape creation tools
    if (toolId === 'create-box') {
      const id = `box_${Date.now()}`
      addObject(id, {
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        visible: true,
        selected: true,
      })
      selectObject(id)
      toast.success('Box created')
    } else if (toolId === 'create-cylinder') {
      const id = `cylinder_${Date.now()}`
      addObject(id, {
        type: 'cylinder',
        dimensions: { radius: 50, height: 100 },
        visible: true,
        selected: true,
      })
      selectObject(id)
      toast.success('Cylinder created')
    } else if (toolId === 'create-sphere') {
      const id = `sphere_${Date.now()}`
      addObject(id, {
        type: 'sphere',
        dimensions: { radius: 50 },
        visible: true,
        selected: true,
      })
      selectObject(id)
      toast.success('Sphere created')
    } else if (toolId === 'create-cone') {
      const id = `cone_${Date.now()}`
      addObject(id, {
        type: 'cone',
        dimensions: { radius: 50, height: 100 },
        visible: true,
        selected: true,
      })
      selectObject(id)
      toast.success('Cone created')
    } else if (toolId === 'create-torus') {
      const id = `torus_${Date.now()}`
      addObject(id, {
        type: 'torus',
        dimensions: { majorRadius: 50, minorRadius: 15 },
        visible: true,
        selected: true,
      })
      selectObject(id)
      toast.success('Torus created')
    } else if (toolId === 'move') {
      toast.info('Move tool activated - drag object to move')
      selectTool('move')
    } else if (toolId === 'rotate') {
      toast.info('Rotate tool activated - use handles to rotate')
      selectTool('rotate')
    } else if (toolId === 'scale') {
      toast.info('Scale tool activated - use handles to scale')
      selectTool('scale')
    } else if (toolId === 'select-all') {
      const allIds = Object.keys(objects)
      allIds.forEach(id => selectObject(id))
      toast.success(`Selected ${allIds.length} objects`)
    } else if (toolId === 'select-none') {
      Object.keys(objects).forEach(id => {
        const obj = objects[id]
        if (obj.selected) {
          selectObject(id)
        }
      })
      toast.success('Deselected all objects')
    } else if (toolId === 'measure-distance') {
      toast.info('Measure Distance tool activated - select two points')
      selectTool('measure-distance')
    } else if (toolId === 'measure-angle') {
      toast.info('Measure Angle tool activated - select three points')
      selectTool('measure-angle')
    } else if (toolId === 'union' || toolId === 'subtract' || toolId === 'intersect') {
      // Boolean operations require exactly 2 objects selected
      const selectedIds = Object.values(objects)
        .filter(obj => obj.selected)
        .map(obj => obj.id)

      if (selectedIds.length !== 2) {
        toast.error(`Select exactly 2 objects to perform ${toolId} operation`)
        return
      }

      const [targetId, toolObjId] = selectedIds

      try {
        toast.loading(`Performing ${toolId} operation...`)
        await performBoolean(toolId as 'union' | 'subtract' | 'intersect', targetId, toolObjId)
        toast.success(`${toolId} completed successfully`)
      } catch (error) {
        toast.error(`${toolId} operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else if (toolId === 'hole') {
      toast.info('Select a face to place a hole')
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
              <Upload
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
      <div className={`${isMobile ? 'pb-3' : 'flex-1 pb-3 overflow-y-auto'}`}>
        {/* Tools Group */}
        <div className="border-b border-[var(--neutral-200)]">
          <button
            onClick={() => toggleGroup('tools')}
            className="w-full flex items-center gap-2 px-3 py-3 hover:bg-[var(--neutral-50)] transition-colors"
          >
            <Wrench size={16} className="text-[var(--neutral-600)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-700)]">Tools</span>
            <span className="ml-auto text-xs text-[var(--neutral-500)]">{tools.length}</span>
            <ChevronRight 
              size={14} 
              className={`transition-transform text-[var(--neutral-500)] ${expandedGroups.tools ? 'rotate-90' : ''}`}
            />
          </button>
          {expandedGroups.tools && (
            <div className="px-3 pb-3 space-y-1.5">
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
                    <tool.icon size={iconSize} className={activeTool === tool.id ? "text-white" : ""} />
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
          )}
        </div>

        {/* Modify Group */}
        <div className="border-b border-[var(--neutral-200)]">
          <button
            onClick={() => toggleGroup('modify')}
            className="w-full flex items-center gap-2 px-3 py-3 hover:bg-[var(--neutral-50)] transition-colors"
          >
            <Layers size={16} className="text-[var(--neutral-600)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-700)]">Modify</span>
            <span className="ml-auto text-xs text-[var(--neutral-500)]">{booleanTools.length}</span>
            <ChevronRight 
              size={14} 
              className={`transition-transform text-[var(--neutral-500)] ${expandedGroups.modify ? 'rotate-90' : ''}`}
            />
          </button>
          {expandedGroups.modify && (
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
              {booleanTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    activeTool === tool.id
                      ? "bg-[var(--primary-50)] border-[var(--primary-200)] text-[var(--primary-700)]"
                      : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)] hover:bg-[var(--bg-100)] text-[var(--neutral-700)]"
                  }`}
                >
                  <tool.icon size={14} />
                  <span className="text-xs font-medium">{tool.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transform Group */}
        <div className="border-b border-[var(--neutral-200)]">
          <button
            onClick={() => toggleGroup('transform')}
            className="w-full flex items-center gap-2 px-3 py-3 hover:bg-[var(--neutral-50)] transition-colors"
          >
            <RefreshCw size={16} className="text-[var(--neutral-600)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-700)]">Transform</span>
            <span className="ml-auto text-xs text-[var(--neutral-500)]">{transformTools.length}</span>
            <ChevronRight
              size={14}
              className={`transition-transform text-[var(--neutral-500)] ${expandedGroups.transform ? 'rotate-90' : ''}`}
            />
          </button>
          {expandedGroups.transform && (
            <div className="px-3 pb-3 space-y-1.5">
              {transformTools.map((tool) => (
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
                    <tool.icon size={iconSize} className={activeTool === tool.id ? "text-white" : ""} />
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
          )}
        </div>

        {/* Select Group */}
        <div className="border-b border-[var(--neutral-200)]">
          <button
            onClick={() => toggleGroup('select')}
            className="w-full flex items-center gap-2 px-3 py-3 hover:bg-[var(--neutral-50)] transition-colors"
          >
            <CheckSquare size={16} className="text-[var(--neutral-600)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-700)]">Select</span>
            <span className="ml-auto text-xs text-[var(--neutral-500)]">{selectTools.length}</span>
            <ChevronRight
              size={14}
              className={`transition-transform text-[var(--neutral-500)] ${expandedGroups.select ? 'rotate-90' : ''}`}
            />
          </button>
          {expandedGroups.select && (
            <div className="px-3 pb-3 space-y-1.5">
              {selectTools.map((tool) => (
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
                    <tool.icon size={iconSize} className={activeTool === tool.id ? "text-white" : ""} />
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
          )}
        </div>

        {/* Create Shapes Group */}
        <div className="border-b border-[var(--neutral-200)]">
          <button
            onClick={() => toggleGroup('shapes')}
            className="w-full flex items-center gap-2 px-3 py-3 hover:bg-[var(--neutral-50)] transition-colors"
          >
            <Box size={16} className="text-[var(--neutral-600)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-700)]">Create Shapes</span>
            <span className="ml-auto text-xs text-[var(--neutral-500)]">{shapeTools.length}</span>
            <ChevronRight 
              size={14} 
              className={`transition-transform text-[var(--neutral-500)] ${expandedGroups.shapes ? 'rotate-90' : ''}`}
            />
          </button>
          {expandedGroups.shapes && (
            <div className="px-3 pb-3 grid grid-cols-5 gap-2">
              {shapeTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 border-dashed transition-colors ${
                    activeTool === tool.id
                      ? "border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                      : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)] hover:bg-[var(--bg-100)] text-[var(--neutral-700)]"
                  }`}
                >
                  <tool.icon size={isMobile ? 24 : 20} className="mb-1" />
                  <span className="text-xs font-medium">{tool.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

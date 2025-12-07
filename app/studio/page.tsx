"use client"

import { useState } from "react"
import { SidebarTools } from "./components/sidebar-tools"
import { CanvasViewer } from "./components/canvas-viewer"
import { PropertiesPanel } from "./components/properties-panel"

export default function StudioWorkspacePage() {
  const [activeTool, setActiveTool] = useState<string>("select")
  const [selectedObject, setSelectedObject] = useState<string | undefined>("Box_001")
  const [viewType, setViewType] = useState("iso")

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar */}
      <SidebarTools activeTool={activeTool} onToolSelect={setActiveTool} />

      {/* Center Canvas */}
      <CanvasViewer activeTool={activeTool} onViewChange={setViewType} />

      {/* Right Properties Panel */}
      <PropertiesPanel selectedObject={selectedObject} />
    </div>
  )
}

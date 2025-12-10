"use client"

import type React from "react"
import { useState } from "react"
import { SidebarTools } from "../sidebar-tools"
import { CanvasViewer } from "../canvas-viewer"
import { PropertiesPanel } from "../properties-panel"
import { CollaboratorsIndicator } from "../collaborators-indicator"
import { useWorkspace } from "@/lib/workspace-hook"

export const WorkspaceLayout: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { activeTool, selectTool, selectedObject, objects } = useWorkspace()
  const [viewType, setViewType] = useState<string>("iso")

  return (
    <div className="flex h-full w-full bg-[var(--bg-100)]">
      {/* Sidebar Tools */}
      <SidebarTools />

      {/* Main Canvas + Top Bar */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--neutral-200)] bg-white">
          <h2 className="text-lg font-semibold text-[var(--neutral-900)]">Workspace</h2>
          <CollaboratorsIndicator projectId={projectId} />
        </div>

        {/* Canvas */}
        <CanvasViewer
          activeTool={activeTool}
          onViewChange={setViewType}
        />
      </div>

      {/* Properties Panel */}
      <PropertiesPanel selectedObject={selectedObject} />
    </div>
  )
}

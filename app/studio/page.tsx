"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SidebarTools } from "./components/sidebar-tools"
import { CanvasViewer } from "./components/canvas-viewer"
import { PropertiesPanel } from "./components/properties-panel"
import { IntentChat } from "@/components/intent-chat"
import { AuthGuard } from "@/components/auth-guard"

function StudioContent() {
  const searchParams = useSearchParams()
  const [activeTool, setActiveTool] = useState<string>("select")
  const [selectedObject, setSelectedObject] = useState<string | undefined>("Box_001")
  const [viewType, setViewType] = useState("iso")
  const [geometryData, setGeometryData] = useState<any>(null)
  const [initialIntent, setInitialIntent] = useState<string | undefined>(undefined)

  useEffect(() => {
    const intent = searchParams.get("intent")
    if (intent) {
      setInitialIntent(decodeURIComponent(intent))
    }
  }, [searchParams])

  const handleGeometryGenerated = (geometry: any) => {
    setGeometryData(geometry)
    if (geometry?.geometry?.id) {
      setSelectedObject(geometry.geometry.id)
    }
  }

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar with Tools */}
      <div className="flex flex-col h-full">
        <SidebarTools activeTool={activeTool} onToolSelect={setActiveTool} />

        <div className="w-56 flex-1 p-4 border-r border-t border-[var(--neutral-200)] bg-white overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[var(--accent-500)] flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-[var(--neutral-900)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)]">AI Assistant</p>
          </div>
          <IntentChat
            variant="workspace"
            placeholder="Describe changes..."
            onGeometryGenerated={handleGeometryGenerated}
            initialIntent={initialIntent}
          />
        </div>
      </div>

      {/* Center Canvas */}
      <CanvasViewer activeTool={activeTool} onViewChange={setViewType} />

      {/* Right Properties Panel */}
      <PropertiesPanel selectedObject={selectedObject} />
    </div>
  )
}

export default function StudioWorkspacePage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-200)]">Loading workspace...</div>
        }
      >
        <StudioContent />
      </Suspense>
    </AuthGuard>
  )
}

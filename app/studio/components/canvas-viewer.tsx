"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

export interface CanvasViewerProps {
  activeTool?: string
  onViewChange?: (viewType: string) => void
}

export const CanvasViewer: React.FC<CanvasViewerProps> = ({ activeTool, onViewChange }) => {
  const [viewType, setViewType] = useState<string>("iso")
  const [showGrid, setShowGrid] = useState(true)

  const handleViewChange = (view: string) => {
    setViewType(view)
    onViewChange?.(view)
  }

  return (
    <div className="flex-1 bg-[var(--bg-100)] relative flex flex-col">
      {/* Canvas Placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-white shadow-lg mx-auto mb-6 flex items-center justify-center">
            <Icon name="mesh" size={48} className="text-[var(--primary-700)]" />
          </div>
          <h3 className="text-lg font-serif text-[var(--neutral-900)] mb-2">3D Viewport Ready</h3>
          <p className="text-sm text-[var(--neutral-500)] max-w-xs mx-auto">
            Upload a CAD file or use the sketch tools to start designing
          </p>
        </div>
      </div>

      {/* View Controls - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-2 flex flex-col gap-2">
        <div className="flex gap-1">
          {["iso", "top", "front", "right"].map((view) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewType === view
                  ? "bg-[var(--primary-700)] text-white"
                  : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            showGrid
              ? "bg-[var(--accent-100)] text-[var(--accent-700)]"
              : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
          }`}
        >
          Grid {showGrid ? "On" : "Off"}
        </button>
      </div>

      {/* Active Tool Indicator - Top Right */}
      {activeTool && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-4 py-2">
          <p className="text-sm">
            <span className="text-[var(--neutral-500)]">Tool:</span>{" "}
            <span className="font-medium text-[var(--primary-700)]">
              {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
            </span>
          </p>
        </div>
      )}

      {/* Toolbar - Top Center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="simulation" size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="cmm" size={18} />
        </Button>
        <div className="w-px h-6 bg-[var(--neutral-200)]" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="camera" size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="download" size={18} />
        </Button>
      </div>

      {/* Measurement Overlay */}
      {activeTool === "measure" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[var(--accent-500)] text-[var(--neutral-900)] rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm font-medium">Click two points to measure distance</p>
        </div>
      )}
    </div>
  )
}

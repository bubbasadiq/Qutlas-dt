"use client"

import * as Icons from "lucide-react"

interface ViewportControlsProps {
  viewportController: {
    viewFront: () => void
    viewTop: () => void
    viewRight: () => void
    viewIsometric: () => void
    toggleGrid: () => void
  }
}

export function ViewportControls({ viewportController }: ViewportControlsProps) {
  return (
    <div className="absolute right-4 top-20 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-1.5 space-y-1">
      <button
        onClick={() => viewportController.viewFront()}
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold transition-colors"
        title="Front View"
      >
        <Icons.RectangleVertical className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={() => viewportController.viewTop()}
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold transition-colors"
        title="Top View"
      >
        <Icons.Square className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={() => viewportController.viewRight()}
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold transition-colors"
        title="Right View"
      >
        <Icons.RectangleHorizontal className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={() => viewportController.viewIsometric()}
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold transition-colors"
        title="Isometric View"
      >
        <Icons.Box className="w-4 h-4 text-gray-700" />
      </button>
      
      <div className="border-t border-gray-200 my-1" />
      
      <button
        onClick={() => viewportController.toggleGrid()}
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold transition-colors"
        title="Toggle Grid"
      >
        <Icons.Grid3x3 className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  )
}
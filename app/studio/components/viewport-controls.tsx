"use client"

import { Icon } from "@/components/ui/icon"

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
    <div className="absolute right-4 top-20 bg-white border border-gray-200 rounded shadow-lg p-2 space-y-2">
      <button
        onClick={() => viewportController.viewFront()}
        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold"
        title="Front View"
      >
        <Icon name="front-view" className="w-6 h-6" />
      </button>
      
      <button
        onClick={() => viewportController.viewTop()}
        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold"
        title="Top View"
      >
        <Icon name="top-view" className="w-6 h-6" />
      </button>
      
      <button
        onClick={() => viewportController.viewRight()}
        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold"
        title="Right View"
      >
        <Icon name="right-view" className="w-6 h-6" />
      </button>
      
      <button
        onClick={() => viewportController.viewIsometric()}
        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold"
        title="Isometric View"
      >
        <Icon name="iso-view" className="w-6 h-6" />
      </button>
      
      <div className="border-t" />
      
      <button
        onClick={() => viewportController.toggleGrid()}
        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded text-xs font-semibold"
        title="Toggle Grid"
      >
        <Icon name="grid" className="w-6 h-6" />
      </button>
    </div>
  )
}
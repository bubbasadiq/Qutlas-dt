/**
 * Workspace-related type definitions for Canvas Viewer
 */

export interface CanvasViewerProps {
  activeTool?: string
  onViewChange?: (view: ViewState) => void
}

export interface ViewState {
  camera?: {
    position: [number, number, number]
    target: [number, number, number]
  }
  zoom?: number
}

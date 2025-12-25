"use client"

import { IntentChat } from "./intent-chat"
import { useWorkspace } from "@/hooks/use-workspace"
import { useAIGeometry } from "@/hooks/use-ai-geometry"
import { toast } from "sonner"

interface IntentChatWorkspaceProps {
  placeholder?: string
  initialIntent?: string
  className?: string
}

/**
 * Workspace-specific wrapper for IntentChat that uses workspace context
 * Only use this in pages that have WorkspaceProvider available
 */
export function IntentChatWorkspace({
  placeholder = "Describe what to create or modify...",
  initialIntent,
  className,
}: IntentChatWorkspaceProps) {
  const { addObject, selectObject } = useWorkspace()
  const { isGenerating, progress, status, error, generateGeometry } = useAIGeometry()

  const handleGeometryGenerated = (geometry: any) => {
    if (geometry?.geometry) {
      const geoData = geometry.geometry
      const id = geoData.id || `geo_${Date.now()}`

      addObject(id, {
        type: geoData.type || "box",
        dimensions: geoData.dimensions || {},
        features: geoData.features || [],
        material: geoData.material || "aluminum",
        description: geoData.description || "",
        params: geoData.dimensions || {},
        color: '#0077ff',
        visible: true,
        selected: false,
      })

      selectObject(id)
      toast.success('Geometry created successfully!')
    }
  }

  return (
    <IntentChat
      variant="workspace"
      placeholder={placeholder}
      initialIntent={initialIntent}
      className={className}
      onGeometryGenerated={handleGeometryGenerated}
      workspaceContext={{
        addObject,
        selectObject,
        isGenerating,
        progress,
        status,
        error,
        generateGeometry,
      }}
    />
  )
}

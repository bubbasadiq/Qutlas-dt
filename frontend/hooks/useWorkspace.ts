"use client"

import { useState, useEffect, useCallback } from "react"
import { initOcctWorker, OcctWorkerClient } from "@/lib/occt-worker-client"

export function useWorkspace() {
  const [activeTool, setActiveTool] = useState<string>("select")
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [objects, setObjects] = useState<any[]>([])
  const [occtClient, setOcctClient] = useState<OcctWorkerClient | null>(null)

  // Initialize OCCT Worker
  useEffect(() => {
    const client = initOcctWorker()
    setOcctClient(client)
  }, [])

  // Tool selection
  const selectTool = useCallback((toolId: string) => {
    setActiveTool(toolId)
  }, [])

  // Add object (from upload or parametric creation)
  const addObject = useCallback(
    async (objectData: ArrayBuffer) => {
      if (!occtClient) return
      const result = await occtClient.loadObject(objectData)
      setObjects((prev) => [...prev, result])
      setSelectedObject(result.id)
    },
    [occtClient]
  )

  // Update object parameters
  const updateObjectParams = useCallback(
    async (objectId: string, params: Record<string, number>) => {
      if (!occtClient) return
      const result = await occtClient.updateParameters(objectId, params)
      setObjects((prev) =>
        prev.map((obj) => (obj.id === objectId ? { ...obj, ...result } : obj))
      )
    },
    [occtClient]
  )

  // Select object in canvas
  const selectObject = useCallback((objectId: string | null) => {
    setSelectedObject(objectId)
  }, [])

  return {
    activeTool,
    selectTool,
    objects,
    selectedObject,
    selectObject,
    addObject,
    updateObjectParams,
  }
}

"use client"

import { useCollaboration } from "@/hooks/use-collaboration"
import { useWorkspace } from "@/hooks/use-workspace"
import { useEffect, useState } from "react"

interface CollaboratorsIndicatorProps {
  projectId: string
}

export function CollaboratorsIndicator({ projectId }: CollaboratorsIndicatorProps) {
  const { collaborators, isConnected } = useCollaboration({ projectId })
  const { shapes } = useWorkspace()
  const [activeCollaborators, setActiveCollaborators] = useState(collaborators)

  // Subscribe to workspace changes for collaborator activity
  useEffect(() => {
    const updateActive = () => {
      // Map collaborators to shapes they’re editing (if any)
      const updated = collaborators.map((collab: any) => {
        const editingShape = shapes.find((s: any) => s.editorId === collab.userId)
        return { ...collab, editingShape }
      })
      setActiveCollaborators(updated)
    }

    updateActive()
    const unsubscribe = shapes.onChange?.(updateActive)
    return () => unsubscribe?.()
  }, [collaborators, shapes])

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
      <span className="text-sm text-[var(--neutral-500)]">{activeCollaborators.length} online</span>
      <div className="flex -space-x-2">
        {activeCollaborators.slice(0, 3).map((collab: any, idx) => (
          <div
            key={idx}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{
              backgroundColor: collab.color || "#2a2a72",
              border: collab.editingShape ? "2px solid #fff" : "none", // highlight active editing
            }}
            title={`${collab.userName}${collab.editingShape ? ` editing ${collab.editingShape.name}` : ""}`}
          >
            {collab.userName?.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  )
}

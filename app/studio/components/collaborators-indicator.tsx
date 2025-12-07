"use client"

import { useCollaboration } from "@/hooks/use-collaboration"

interface CollaboratorsIndicatorProps {
  projectId: string
}

export function CollaboratorsIndicator({ projectId }: CollaboratorsIndicatorProps) {
  const { collaborators, isConnected } = useCollaboration({ projectId })

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
      <span className="text-sm text-[var(--neutral-500)]">{collaborators.length} online</span>
      <div className="flex -space-x-2">
        {collaborators.slice(0, 3).map((collab: any, idx) => (
          <div
            key={idx}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: collab.color || "#2a2a72" }}
            title={collab.userName}
          >
            {collab.userName?.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  )
}

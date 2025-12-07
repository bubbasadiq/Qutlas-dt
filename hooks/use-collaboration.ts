"use client"

import { useEffect, useRef, useState } from "react"
import { CollaborationManager } from "@/lib/collaboration"
import { useAuth } from "@/lib/auth-context"

interface UseCollaborationProps {
  projectId: string
  enabled?: boolean
}

export function useCollaboration({ projectId, enabled = true }: UseCollaborationProps) {
  const { user } = useAuth()
  const managerRef = useRef<CollaborationManager | null>(null)
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !user || !projectId) return

    managerRef.current = new CollaborationManager({
      roomName: `project:${projectId}`,
      userId: user.id,
      userName: user.name,
    })

    // Listen to geometry changes
    managerRef.current.onGeometryChange(() => {
      // Trigger re-render with updated geometry
    })

    // Update collaborators list
    const interval = setInterval(() => {
      if (managerRef.current) {
        setCollaborators(managerRef.current.getCollaborators())
      }
    }, 1000)

    setIsConnected(true)

    return () => {
      clearInterval(interval)
      managerRef.current?.destroy()
      setIsConnected(false)
    }
  }, [projectId, enabled, user])

  return {
    manager: managerRef.current,
    collaborators,
    isConnected,
    updateCursor: (pos: { x: number; y: number }) => {
      managerRef.current?.updateCursor(pos)
    },
  }
}

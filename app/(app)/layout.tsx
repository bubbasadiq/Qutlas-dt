"use client"

import { WorkspaceProvider } from "@/hooks/use-workspace"
import { AuthGuard } from "@/components/auth-guard"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

function KeyboardShortcutsManager() {
  useKeyboardShortcuts()
  return null
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <WorkspaceProvider>
        <KeyboardShortcutsManager />
        {children}
      </WorkspaceProvider>
    </AuthGuard>
  )
}

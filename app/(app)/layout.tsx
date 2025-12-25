"use client"

import { WorkspaceProvider } from "@/hooks/use-workspace"
import { AuthGuard } from "@/components/auth-guard"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { OnboardingTour } from "@/components/onboarding-tour"
import { Suspense } from "react"

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
        <Suspense fallback={null}>
          <OnboardingTour />
        </Suspense>
        {children}
      </WorkspaceProvider>
    </AuthGuard>
  )
}

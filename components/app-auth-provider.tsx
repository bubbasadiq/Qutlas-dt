"use client"

import { AuthProvider } from "@/lib/auth-context"

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

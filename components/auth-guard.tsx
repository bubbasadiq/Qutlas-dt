"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = "/auth/login" }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      // Store the current path in sessionStorage so we can redirect back after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterAuth", window.location.pathname)
      }
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // This should never render because of the useEffect redirect
  }

  return <>{children}</>
}
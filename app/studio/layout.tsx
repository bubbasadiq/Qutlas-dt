"use client"

import type React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  return (
    <div className="h-screen bg-[var(--bg-50)] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[var(--neutral-200)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-700)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-serif font-semibold text-lg text-[var(--neutral-900)] hidden sm:inline">Qutlas</span>
          </Link>

          <div className="h-6 w-px bg-[var(--neutral-200)]" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--neutral-900)]">Untitled Design</span>
            <span className="text-xs text-[var(--neutral-400)]">Saved</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Collaborators */}
          <div className="flex -space-x-2 mr-2">
            {user && (
              <div className="w-8 h-8 rounded-full bg-[var(--primary-700)] flex items-center justify-center text-white text-xs font-medium ring-2 ring-white">
                {user.name?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm">
            Share
          </Button>
          <Button size="sm" className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)]">
            Submit to Production
          </Button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

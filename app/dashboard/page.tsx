"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { useAuth } from "@/lib/auth-context"

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [projects] = useState<any[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-50)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-700)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="font-serif font-semibold text-xl text-[var(--neutral-900)]">Qutlas</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[var(--primary-700)] border-b-2 border-[var(--primary-700)] pb-1"
            >
              Dashboard
            </Link>
            <Link
              href="/studio"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Workspace
            </Link>
            <Link
              href="/catalog"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Catalog
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[var(--neutral-900)]">{user.name}</p>
              <p className="text-xs text-[var(--neutral-500)]">{user.company}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">Welcome back, {user.name}</h1>
            <p className="text-[var(--neutral-500)]">Here's what's happening with your projects</p>
          </div>
          <Link href="/studio">
            <Button className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
              <span className="mr-2">+</span> New Project
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Active Projects", value: projects.length, icon: "catalog", color: "var(--primary-700)" },
            { label: "In Production", value: 0, icon: "factory", color: "var(--accent-500)" },
            { label: "Completed", value: 0, icon: "quality-check", color: "var(--success)" },
            { label: "Pending Review", value: 0, icon: "clock", color: "var(--warning)" },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-white border-[var(--neutral-200)]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--neutral-500)] mb-1">{stat.label}</p>
                    <p className="text-3xl font-semibold text-[var(--neutral-900)]">{stat.value}</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon name={stat.icon} size={24} className="text-[var(--primary-700)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Projects */}
        <Card className="bg-white border-[var(--neutral-200)]">
          <CardHeader className="border-b border-[var(--neutral-100)]">
            <CardTitle className="text-xl font-serif text-[var(--neutral-900)]">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-200)] flex items-center justify-center mx-auto mb-4">
                  <Icon name="upload" size={32} className="text-[var(--neutral-400)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">No projects yet</h3>
                <p className="text-[var(--neutral-500)] mb-6 max-w-sm mx-auto">
                  Create your first project to start designing and manufacturing.
                </p>
                <Link href="/studio">
                  <Button className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                    Create Your First Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div>{/* Project list would go here */}</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

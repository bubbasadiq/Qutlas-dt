"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"
import { AuthGuard } from "@/components/auth-guard"
import { LoadingSpinner, LoadingOverlay } from "@/components/loading-spinner"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

interface Project {
  id: string
  name: string
  created_at: string
  status: string
}

interface Stats {
  activeProjects: number
  inProduction: number
  completed: number
  pending: number
}

function DashboardContent() {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats>({
    activeProjects: 0,
    inProduction: 0,
    completed: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects/list')
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        toast.error('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats({
          activeProjects: data.activeProjects || 0,
          inProduction: data.inProduction || 0,
          completed: data.completed || 0,
          pending: data.pending || 0,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchProjects()
    fetchStats()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {loading && <LoadingOverlay />}
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="blue" size="md" href="/" />

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
              <p className="text-sm font-medium text-[var(--neutral-900)]">{user.name || user.email}</p>
              <p className="text-xs text-[var(--neutral-500)]">{user.company || 'Personal'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
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
            <h1 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">
              Welcome back, {user.name || 'there'}
            </h1>
            <p className="text-[var(--neutral-500)]">Here&apos;s what&apos;s happening with your projects</p>
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
            { label: "Active Projects", value: stats.activeProjects, icon: "catalog", color: "var(--primary-700)" },
            { label: "In Production", value: stats.inProduction, icon: "factory", color: "var(--accent-500)" },
            { label: "Completed", value: stats.completed, icon: "quality-check", color: "var(--success)" },
            { label: "Pending Review", value: stats.pending, icon: "clock", color: "var(--warning)" },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-white border-[var(--neutral-200)]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--neutral-500)] mb-1">{stat.label}</p>
                    {statsLoading ? (
                      <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-3xl font-semibold text-[var(--neutral-900)]">{stat.value}</p>
                    )}
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
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : projects.length === 0 ? (
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
              <div className="space-y-2">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/studio?project=${project.id}`}
                    className="block p-4 border border-[var(--neutral-200)] rounded-lg hover:bg-[var(--bg-50)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--neutral-900)]">{project.name}</p>
                        <p className="text-sm text-[var(--neutral-500)]">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                          {project.status || 'draft'}
                        </span>
                        <Icon name="chevron-right" size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

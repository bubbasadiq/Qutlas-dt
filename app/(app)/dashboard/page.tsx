"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"
import { useProjects } from "@/hooks/use-projects"
import { useUserStats } from "@/hooks/use-stats"
import { toast } from "sonner"

export const dynamic = "force-dynamic"

function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const projects = useProjects()
  const userStats = useUserStats()

  const handleCreateProject = () => {
    router.push("/studio")
  }

  const handleViewProject = (projectId: string) => {
    router.push(`/studio?project=${projectId}`)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
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
          <Button onClick={handleCreateProject} className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
            <span className="mr-2">+</span> New Project
          </Button>
        </div>

        {/* Stats Grid - Dynamic data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { 
              label: "Active Projects", 
              value: projects.data.filter(p => p.status === "active").length, 
              icon: "catalog", 
              color: "var(--primary-700)" 
            },
            { 
              label: "In Production", 
              value: userStats.totalCompletedJobs || 0, 
              icon: "factory", 
              color: "var(--accent-500)" 
            },
            { 
              label: "Completed", 
              value: projects.data.filter(p => p.status === "completed").length, 
              icon: "quality-check", 
              color: "var(--success)" 
            },
            { 
              label: "Pending Review", 
              value: projects.data.filter(p => p.status === "review").length, 
              icon: "clock", 
              color: "var(--warning)" 
            },
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

        {/* Recent Projects - Dynamic data */}
        <Card className="bg-white border-[var(--neutral-200)]">
          <CardHeader className="border-b border-[var(--neutral-100)]">
            <CardTitle className="text-xl font-serif text-[var(--neutral-900)]">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {projects.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-700)]"></div>
              </div>
            ) : projects.error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">Failed to load projects: {projects.error}</p>
                <Button onClick={handleCreateProject} className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                  Create Your First Project
                </Button>
              </div>
            ) : projects.data.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-200)] flex items-center justify-center mx-auto mb-4">
                  <Icon name="upload" size={32} className="text-[var(--neutral-400)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">No projects yet</h3>
                <p className="text-[var(--neutral-500)] mb-6 max-w-sm mx-auto">
                  Create your first project to start designing and manufacturing.
                </p>
                <Button onClick={handleCreateProject} className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.data.slice(0, 6).map((project: any) => (
                  <div key={project.id} className="bg-[var(--bg-50)] rounded-xl border border-[var(--neutral-100)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewProject(project.id)}>
                    <div className="aspect-video bg-[var(--bg-100)]">
                      <img src={project.thumbnail || "/placeholder.svg?height=200&width=300"} alt={project.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-[var(--neutral-900)]">{project.name}</h3>
                          <p className="text-xs text-[var(--neutral-500)]">{project.description}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-100)] text-[var(--accent-700)]">
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--neutral-400)]">
                        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                        <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-[var(--neutral-200)] cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/catalog")}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-100)] flex items-center justify-center mx-auto mb-4">
                <Icon name="catalog" size={28} className="text-[var(--primary-700)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">Browse Catalog</h3>
              <p className="text-sm text-[var(--neutral-500)]">Explore thousands of ready-to-manufacture parts</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--neutral-200)] cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/studio")}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-100)] flex items-center justify-center mx-auto mb-4">
                <Icon name="upload" size={28} className="text-[var(--accent-700)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">Create New Project</h3>
              <p className="text-sm text-[var(--neutral-500)]">Start designing from scratch or upload CAD files</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--neutral-200)] cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/settings")}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--success-100)] flex items-center justify-center mx-auto mb-4">
                <Icon name="settings" size={28} className="text-[var(--success-700)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">Account Settings</h3>
              <p className="text-sm text-[var(--neutral-500)]">Manage your profile and preferences</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
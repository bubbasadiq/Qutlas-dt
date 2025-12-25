// app/studio/components/job-browser.tsx
// Job browser and management component

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export type JobStatus = 'in_progress' | 'submitted' | 'manufacturing' | 'completed' | 'cancelled'

export interface JobListItem {
  id: string
  title: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  material?: string
  process?: string
  thumbnail?: string
}

interface JobBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelectJob: (jobId: string) => void
  onLoadJob: (jobId: string) => void
  onDeleteJob?: (jobId: string) => void
  onDuplicateJob?: (jobId: string) => void
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: string }> = {
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: 'edit-2' },
  submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-700', icon: 'send' },
  manufacturing: { label: 'Manufacturing', color: 'bg-yellow-100 text-yellow-700', icon: 'loader' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: 'x-circle' },
}

export function JobBrowser({
  isOpen,
  onClose,
  onSelectJob,
  onLoadJob,
  onDeleteJob,
  onDuplicateJob,
}: JobBrowserProps) {
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchJobs()
    }
  }, [isOpen])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      // Simulate API call - in production, this would call the jobs API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock data for demonstration
      setJobs([
        {
          id: 'job_demo_1',
          title: 'Aluminum Bracket Assembly',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          material: 'aluminum-6061',
          process: 'cnc-milling',
        },
        {
          id: 'job_demo_2',
          title: 'Steel Shaft Component',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          material: 'steel-4140',
          process: 'cnc-turning',
        },
        {
          id: 'job_demo_3',
          title: 'Prototype Enclosure',
          status: 'submitted',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          material: 'abs',
          process: '3d-printing',
        },
      ])
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
    return a.title.localeCompare(b.title)
  })

  const handleLoad = () => {
    if (selectedJobId) {
      onLoadJob(selectedJobId)
      toast.success('Job loaded successfully')
      onClose()
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) {
      return
    }

    try {
      // In production, call delete API
      setJobs(prev => prev.filter(j => j.id !== jobId))
      toast.success('Job deleted')
      
      if (onDeleteJob) {
        onDeleteJob(jobId)
      }
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  const handleDuplicate = async (jobId: string) => {
    try {
      // In production, call duplicate API
      const job = jobs.find(j => j.id === jobId)
      if (!job) return

      const newJob: JobListItem = {
        ...job,
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${job.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'in_progress',
      }

      setJobs(prev => [newJob, ...prev])
      toast.success('Job duplicated')

      if (onDuplicateJob) {
        onDuplicateJob(jobId)
      }
    } catch (error) {
      toast.error('Failed to duplicate job')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="folder" className="w-5 h-5" />
            Job Browser
          </DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
              className="px-3 py-2 border border-[var(--neutral-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="px-3 py-2 border border-[var(--neutral-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 text-xs text-[var(--neutral-500)]">
            <span>{filteredJobs.length} jobs</span>
            <span>•</span>
            <span>{jobs.filter(j => j.status === 'in_progress').length} in progress</span>
            <span>•</span>
            <span>{jobs.filter(j => j.status === 'completed').length} completed</span>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="loader" className="w-8 h-8 animate-spin text-[var(--primary-500)]" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="folder-open" className="w-12 h-12 mx-auto mb-3 text-[var(--neutral-300)]" />
              <p className="text-[var(--neutral-500)]">No jobs found</p>
              <p className="text-sm text-[var(--neutral-400)] mt-1">
                {searchQuery ? 'Try a different search term' : 'Save your first job to see it here'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredJobs.map((job) => {
                const statusConfig = STATUS_CONFIG[job.status]
                const isSelected = selectedJobId === job.id

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      isSelected ? 'bg-[var(--primary-50)]' : 'hover:bg-[var(--bg-100)]'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-[var(--neutral-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="cube" className="w-8 h-8 text-[var(--neutral-400)]" />
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-[var(--neutral-900)] truncate">
                            {job.title}
                          </h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            statusConfig.color
                          )}>
                            {statusConfig.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-[var(--neutral-500)]">
                          <span className="flex items-center gap-1">
                            <Icon name="clock" className="w-3 h-3" />
                            Updated {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
                          </span>
                          {job.material && (
                            <span className="flex items-center gap-1">
                              <Icon name="box" className="w-3 h-3" />
                              {job.material}
                            </span>
                          )}
                          {job.process && (
                            <span className="flex items-center gap-1">
                              <Icon name="settings" className="w-3 h-3" />
                              {job.process}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(job.id)}
                          className="w-8 h-8"
                          title="Duplicate"
                        >
                          <Icon name="copy" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(job.id)}
                          className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Icon name="trash-2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center bg-[var(--neutral-50)]">
          <p className="text-xs text-[var(--neutral-500)]">
            Jobs are saved automatically
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleLoad}
              disabled={!selectedJobId}
            >
              <Icon name="download" className="w-4 h-4 mr-2" />
              Load Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// lib/job-manager.ts
// Job management operations

import { 
  saveJob, 
  loadJob, 
  generateJobId, 
  type Job, 
  type JobStatus,
  type JobMetadata,
  saveJobVersion,
  loadJobVersion,
  listJobs,
  deleteJob,
  duplicateJob,
  updateJobStatus,
  type SaveJobOptions
} from './job-persistence'
import type { WorkspaceObject } from '@/hooks/use-workspace'

export interface JobManagerOptions {
  autoSave?: boolean
  autoSaveInterval?: number
  onSave?: (jobId: string) => void
  onLoad?: (job: Job) => void
  onError?: (error: Error) => void
}

export interface JobManagerState {
  currentJobId: string | null
  isDirty: boolean
  lastSaved: Date | null
  isSaving: boolean
}

export class JobManager {
  private options: Required<JobManagerOptions>
  private state: JobManagerState
  private userId: string | null = null
  private autoSaveTimer: NodeJS.Timeout | null = null

  constructor(options: JobManagerOptions = {}) {
    this.options = {
      autoSave: options.autoSave ?? false,
      autoSaveInterval: options.autoSaveInterval ?? 30000,
      onSave: options.onSave ?? (() => {}),
      onLoad: options.onLoad ?? (() => {}),
      onError: options.onError ?? ((err) => console.error(err)),
    }

    this.state = {
      currentJobId: null,
      isDirty: false,
      lastSaved: null,
      isSaving: false,
    }
  }

  setUser(userId: string) {
    this.userId = userId
  }

  async createNewJob(
    workspace: Job['workspace'],
    design?: Job['design'],
    options?: SaveJobOptions
  ): Promise<string> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    const jobId = generateJobId()
    const result = await saveJob(this.userId, jobId, workspace, design, undefined, options)

    if (!result.success) {
      throw new Error(result.error || 'Failed to create job')
    }

    this.state.currentJobId = jobId
    this.state.isDirty = false
    this.state.lastSaved = new Date()

    return jobId
  }

  async saveCurrentJob(
    workspace: Job['workspace'],
    design?: Job['design'],
    analysis?: Job['analysis'],
    options?: SaveJobOptions
  ): Promise<void> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    if (!this.state.currentJobId) {
      // Auto-create if no job exists
      await this.createNewJob(workspace, design, options)
      return
    }

    this.state.isSaving = true

    try {
      const result = await saveJob(
        this.userId,
        this.state.currentJobId,
        workspace,
        design,
        analysis,
        options
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to save job')
      }

      this.state.isDirty = false
      this.state.lastSaved = new Date()
      this.options.onSave(this.state.currentJobId)
    } finally {
      this.state.isSaving = false
    }
  }

  async loadJob(jobId: string): Promise<Job> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    const result = await loadJob(this.userId, jobId)

    if (!result.success || !result.job) {
      throw new Error(result.error || 'Failed to load job')
    }

    this.state.currentJobId = jobId
    this.state.isDirty = false
    this.options.onLoad(result.job)

    return result.job
  }

  async saveVersion(workspace: Job['workspace'], version: number): Promise<void> {
    if (!this.userId || !this.state.currentJobId) {
      throw new Error('No current job to save version for')
    }

    await saveJobVersion(this.userId, this.state.currentJobId, workspace, version)
  }

  async loadVersion(jobId: string, version: number): Promise<Job['workspace']> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    const result = await loadJobVersion(this.userId, jobId, version)

    if (!result.success || !result.workspace) {
      throw new Error(result.error || 'Failed to load version')
    }

    return result.workspace
  }

  async listJobs(options?: {
    status?: JobStatus
    limit?: number
    offset?: number
  }): Promise<JobMetadata[]> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    const result = await listJobs(this.userId, options)
    
    if (result.error) {
      throw new Error(result.error)
    }

    return result.jobs
  }

  async deleteJob(jobId: string): Promise<void> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    const result = await deleteJob(this.userId, jobId)

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete job')
    }

    if (this.state.currentJobId === jobId) {
      this.state.currentJobId = null
    }
  }

  async duplicateJob(jobId: string): Promise<string> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    const result = await duplicateJob(this.userId, jobId)

    if (!result.success || !result.newJobId) {
      throw new Error(result.error || 'Failed to duplicate job')
    }

    return result.newJobId
  }

  async updateStatus(jobId: string, status: JobStatus): Promise<void> {
    if (!this.userId) {
      throw new Error('User not set. Call setUser() first.')
    }

    const result = await updateJobStatus(this.userId, jobId, status)

    if (!result.success) {
      throw new Error(result.error || 'Failed to update status')
    }
  }

  markDirty() {
    this.state.isDirty = true
  }

  getState(): Readonly<JobManagerState> {
    return { ...this.state }
  }

  getCurrentJobId(): string | null {
    return this.state.currentJobId
  }

  isDirty(): boolean {
    return this.state.isDirty
  }

  isSaving(): boolean {
    return this.state.isSaving
  }

  getLastSaved(): Date | null {
    return this.state.lastSaved
  }

  startAutoSave(
    getWorkspace: () => Job['workspace'],
    getDesign?: () => Job['design']
  ) {
    if (!this.options.autoSave) return

    this.stopAutoSave()

    this.autoSaveTimer = setInterval(async () => {
      if (this.state.isDirty && this.state.currentJobId) {
        try {
          await this.saveCurrentJob(getWorkspace(), getDesign?.())
        } catch (error) {
          this.options.onError(error instanceof Error ? error : new Error(String(error)))
        }
      }
    }, this.options.autoSaveInterval)
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  destroy() {
    this.stopAutoSave()
  }
}

// Singleton instance for app-wide use
let jobManagerInstance: JobManager | null = null

export function getJobManager(): JobManager {
  if (!jobManagerInstance) {
    jobManagerInstance = new JobManager({
      autoSave: true,
      autoSaveInterval: 30000,
    })
  }
  return jobManagerInstance
}

// Helper function to convert workspace objects for job storage
export function workspaceToJobObjects(objects: Record<string, WorkspaceObject>): Record<string, WorkspaceObject> {
  return objects
}

// Helper function to restore workspace from job
export function jobToWorkspace(job: Job): Job['workspace'] {
  return job.workspace
}

// lib/job-persistence.ts
// Job save and load operations using Supabase S3

import { uploadObject, getDownloadUrl, presignUrl } from './storage/supabase-s3'
import type { WorkspaceObject } from '@/hooks/use-workspace'
import type { GeometryIntent } from './geometry-generator'

export type JobStatus = 'in_progress' | 'submitted' | 'manufacturing' | 'completed' | 'cancelled'

export interface JobMetadata {
  id: string
  userId: string
  title: string
  description?: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  tags?: string[]
  material?: string
  process?: string
}

export interface JobDesign {
  intent: string
  aiConversation: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  parameters: Record<string, any>
}

export interface JobAnalysis {
  manufacturability: {
    score: number
    issues: Array<{ id: string; severity: string; message: string; fix: string }>
    timestamp: string
  }
  toolpath: {
    id: string
    strategy: string
    estimatedTime: number
    timestamp: string
  }
  quote: {
    totalPrice: number
    leadTimeDays: number
    breakdown: Record<string, number>
    timestamp: string
  }
}

export interface JobExport {
  formats: string[]
  files: Array<{
    format: string
    bucket: string
    key: string
    size: number
    url: string
  }>
}

export interface Job {
  id: string
  userId: string
  title: string
  description?: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  workspace: {
    objects: Record<string, WorkspaceObject>
    selectedObjectId: string | null
    activeTool: string
  }
  design: JobDesign
  analysis: JobAnalysis
  export?: JobExport
  tags?: string[]
  notes?: string
}

export interface SaveJobOptions {
  title?: string
  description?: string
  tags?: string[]
  notes?: string
  includeAnalysis?: boolean
}

const JOBS_BUCKET = 'jobs'
const VERSIONS_BUCKET = 'job-versions'

// Generate unique job ID
export function generateJobId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `job_${timestamp}_${random}`
}

// Save job to S3
export async function saveJob(
  userId: string,
  jobId: string,
  workspace: Job['workspace'],
  design?: JobDesign,
  analysis?: JobAnalysis,
  options?: SaveJobOptions
): Promise<{ success: boolean; jobId: string; error?: string }> {
  try {
    const job: Job = {
      id: jobId,
      userId,
      title: options?.title || `Job ${new Date().toLocaleDateString()}`,
      description: options?.description,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspace,
      design: design || {
        intent: '',
        aiConversation: [],
        parameters: {},
      },
      analysis: analysis || {
        manufacturability: { score: 100, issues: [], timestamp: new Date().toISOString() },
        toolpath: { id: '', strategy: '', estimatedTime: 0, timestamp: new Date().toISOString() },
        quote: { totalPrice: 0, leadTimeDays: 0, breakdown: {}, timestamp: new Date().toISOString() },
      },
      tags: options?.tags,
      notes: options?.notes,
    }

    const jobContent = JSON.stringify(job, null, 2)
    const jobKey = `${userId}/${jobId}.json`

    // Upload job file
    await uploadObject({
      bucket: JOBS_BUCKET,
      key: jobKey,
      body: jobContent,
      contentType: 'application/json',
    })

    // Save metadata to Supabase database (if needed for listing)
    // This would typically be a separate API call
    
    return { success: true, jobId }
  } catch (error) {
    console.error('Failed to save job:', error)
    return {
      success: false,
      jobId: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Save job version
export async function saveJobVersion(
  userId: string,
  jobId: string,
  workspace: Job['workspace'],
  versionNumber: number
): Promise<{ success: boolean; versionNumber: number; error?: string }> {
  try {
    const versionKey = `${userId}/${jobId}/versions/v${versionNumber}.json`

    await uploadObject({
      bucket: VERSIONS_BUCKET,
      key: versionKey,
      body: JSON.stringify({
        workspace,
        timestamp: new Date().toISOString(),
      }, null, 2),
      contentType: 'application/json',
    })

    return { success: true, versionNumber }
  } catch (error) {
    console.error('Failed to save job version:', error)
    return {
      success: false,
      versionNumber: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Load job from S3
export async function loadJob(
  userId: string,
  jobId: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    const jobKey = `${userId}/${jobId}.json`
    const url = getDownloadUrl({ bucket: JOBS_BUCKET, key: jobKey })

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load job: ${response.status}`)
    }

    const job = await response.json()
    return { success: true, job }
  } catch (error) {
    console.error('Failed to load job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Load job version
export async function loadJobVersion(
  userId: string,
  jobId: string,
  versionNumber: number
): Promise<{ success: boolean; workspace?: Job['workspace']; error?: string }> {
  try {
    const versionKey = `${userId}/${jobId}/versions/v${versionNumber}.json`
    const url = getDownloadUrl({ bucket: VERSIONS_BUCKET, key: versionKey })

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load version: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, workspace: data.workspace }
  } catch (error) {
    console.error('Failed to load job version:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get presigned URL for download
export async function getJobDownloadUrl(
  userId: string,
  jobId: string
): Promise<{ url: string; expiresAt: Date }> {
  const jobKey = `${userId}/${jobId}.json`
  const url = presignUrl({
    method: 'GET',
    bucket: JOBS_BUCKET,
    key: jobKey,
    expiresInSeconds: 3600, // 1 hour
  })

  return {
    url,
    expiresAt: new Date(Date.now() + 3600 * 1000),
  }
}

// List all jobs for a user
export async function listJobs(
  userId: string,
  options?: {
    status?: JobStatus
    limit?: number
    offset?: number
  }
): Promise<{ jobs: JobMetadata[]; total: number; error?: string }> {
  // In a real implementation, this would query the Supabase database
  // For now, return empty list as S3 doesn't support listing without pagination
  try {
    // This would typically be an API call to Supabase
    // const response = await fetch(`/api/jobs?userId=${userId}`)
    // return response.json()
    
    return { jobs: [], total: 0 }
  } catch (error) {
    return {
      jobs: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Delete job
export async function deleteJob(
  userId: string,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, this would:
    // 1. Delete from S3
    // 2. Delete versions from S3
    // 3. Delete metadata from database
    
    console.log(`Deleting job ${jobId} for user ${userId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Update job status
export async function updateJobStatus(
  userId: string,
  jobId: string,
  status: JobStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    // Load, update, and save the job
    const { job } = await loadJob(userId, jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    const result = await saveJob(userId, jobId, job.workspace, job.design, job.analysis, {
      title: job.title,
      description: job.description,
      tags: job.tags,
      notes: job.notes,
    })

    return { success: result.success, error: result.error }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Duplicate job
export async function duplicateJob(
  userId: string,
  sourceJobId: string
): Promise<{ success: boolean; newJobId?: string; error?: string }> {
  try {
    const { job } = await loadJob(userId, sourceJobId)
    if (!job) {
      throw new Error('Source job not found')
    }

    const newJobId = generateJobId()
    const result = await saveJob(userId, newJobId, job.workspace, job.design, job.analysis, {
      title: `${job.title} (Copy)`,
      description: job.description,
      tags: job.tags,
    })

    return { success: result.success, newJobId: result.jobId, error: result.error }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Export job to format
export async function exportJob(
  userId: string,
  jobId: string,
  format: 'stl' | 'step' | 'obj'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // In a real implementation, this would:
    // 1. Generate the 3D model in the requested format
    // 2. Upload to S3
    // 3. Return presigned URL
    
    console.log(`Exporting job ${jobId} as ${format}`)
    return { success: false, error: 'Export not yet implemented' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

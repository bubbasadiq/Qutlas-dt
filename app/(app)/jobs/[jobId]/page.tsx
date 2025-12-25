"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPriceNGN } from "@/lib/quote/estimate"

type Job = {
  id: string
  status: string
  createdAt?: string
  updatedAt?: string
  quote?: {
    breakdown?: {
      totalPrice?: number
      leadTimeDays?: number
    }
    material?: { name?: string }
    process?: string
  }
  tracking?: {
    estimatedCompletion?: string
    timeline?: Array<{ status: string; timestamp: string; note?: string }>
  }
  payment?: {
    status?: string
    reference?: string
    transactionId?: string
    amount?: number
    currency?: string
    verifiedAt?: string
  }
}

export default function JobTrackingPage() {
  const params = useParams<{ jobId: string }>()
  const router = useRouter()

  const jobId = params.jobId
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/jobs/${jobId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Failed to load job (${res.status})`)
        }

        const data = (await res.json()) as Job
        if (!cancelled) setJob(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load job")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    const interval = setInterval(run, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [jobId])

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-[var(--neutral-500)]">Loading job…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-red-600">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Link href="/studio">
              <Button>Go to Studio</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!job) return null

  const total = job.quote?.breakdown?.totalPrice ?? job.payment?.amount ?? 0

  return (
    <div className="min-h-screen bg-[var(--bg-50)] p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--neutral-900)]">Job Tracking</h1>
            <p className="text-sm text-[var(--neutral-500)]">Job ID: {job.id}</p>
          </div>
          <Link href="/studio">
            <Button variant="outline">Back to Studio</Button>
          </Link>
        </div>

        <Card className="bg-white border-[var(--neutral-200)]">
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Current status</span>
              <span className="font-medium">{job.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Total</span>
              <span className="font-medium">{formatPriceNGN(total)}</span>
            </div>
            {job.tracking?.estimatedCompletion && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--neutral-600)]">Estimated completion</span>
                <span className="font-medium">{new Date(job.tracking.estimatedCompletion).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--neutral-200)]">
          <CardHeader>
            <CardTitle className="text-lg">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Status</span>
              <span className="font-medium">{job.payment?.status || "unpaid"}</span>
            </div>
            {job.payment?.reference && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--neutral-600)]">Reference</span>
                <span className="font-mono text-xs">{job.payment.reference}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--neutral-200)]">
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {job.tracking?.timeline?.length ? (
              <ol className="space-y-3">
                {job.tracking.timeline
                  .slice()
                  .reverse()
                  .map((item, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--neutral-900)]">{item.status}</p>
                        {item.note && <p className="text-xs text-[var(--neutral-500)]">{item.note}</p>}
                      </div>
                      <p className="text-xs text-[var(--neutral-500)]">{new Date(item.timestamp).toLocaleString()}</p>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--neutral-500)]">No updates yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

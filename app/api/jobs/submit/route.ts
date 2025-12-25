import crypto from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { uploadObject } from "@/lib/storage/supabase-s3"

const JOBS_BUCKET = "jobs"

type JobStatus = "draft" | "submitted" | "paid" | "manufacturing" | "completed" | "cancelled"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json()) as {
      workspaceData?: unknown
      quote?: any
      manufacturability?: any
      toolpath?: any
    }

    if (!body.workspaceData) {
      return NextResponse.json({ error: "Missing workspaceData" }, { status: 400 })
    }

    const jobId = `job_${Date.now().toString(36)}_${crypto.randomBytes(5).toString("hex")}`
    const now = new Date().toISOString()

    const leadTimeDays =
      (typeof body.quote?.breakdown?.leadTimeDays === "number" ? body.quote.breakdown.leadTimeDays : undefined) ??
      (typeof body.quote?.leadTimeDays === "number" ? body.quote.leadTimeDays : 7)

    const estimatedCompletion = new Date(Date.now() + leadTimeDays * 24 * 60 * 60 * 1000).toISOString()

    const job: any = {
      id: jobId,
      userId: user.id,
      status: "submitted" satisfies JobStatus,
      createdAt: now,
      updatedAt: now,
      workspace: body.workspaceData,
      quote: body.quote,
      manufacturability: body.manufacturability,
      toolpath: body.toolpath,
      payment: {
        status: "unpaid",
      },
      tracking: {
        estimatedCompletion,
        timeline: [{ status: "submitted", timestamp: now, note: "Submitted for manufacturing" }],
      },
    }

    await uploadObject({
      bucket: JOBS_BUCKET,
      key: `${user.id}/${jobId}.json`,
      body: JSON.stringify(job, null, 2),
      contentType: "application/json",
    })

    return NextResponse.json({ jobId }, { status: 200 })
  } catch (error) {
    console.error("Job submit failed:", error)
    const message = error instanceof Error ? error.message : "Failed to submit job"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

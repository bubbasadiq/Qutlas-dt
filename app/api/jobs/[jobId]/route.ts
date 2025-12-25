import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getDownloadUrl, uploadObject } from "@/lib/storage/supabase-s3"

const JOBS_BUCKET = "jobs"

function jobKey(userId: string, jobId: string) {
  return `${userId}/${jobId}.json`
}

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = getDownloadUrl({ bucket: JOBS_BUCKET, key: jobKey(user.id, jobId), expiresInSeconds: 60 })
    const res = await fetch(url)

    if (res.status === 404) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json({ error: `Failed to load job (${res.status}): ${text}` }, { status: 500 })
    }

    const job = await res.json()
    return NextResponse.json(job)
  } catch (error) {
    console.error("Failed to load job:", error)
    const message = error instanceof Error ? error.message : "Failed to load job"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const patch = (await request.json()) as Record<string, any>

    const url = getDownloadUrl({ bucket: JOBS_BUCKET, key: jobKey(user.id, jobId), expiresInSeconds: 60 })
    const res = await fetch(url)

    if (res.status === 404) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json({ error: `Failed to load job (${res.status}): ${text}` }, { status: 500 })
    }

    const job = (await res.json()) as any
    const now = new Date().toISOString()

    const updated = {
      ...job,
      ...patch,
      updatedAt: now,
    }

    await uploadObject({
      bucket: JOBS_BUCKET,
      key: jobKey(user.id, jobId),
      body: JSON.stringify(updated, null, 2),
      contentType: "application/json",
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update job:", error)
    const message = error instanceof Error ? error.message : "Invalid request"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

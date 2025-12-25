import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

const inMemoryJobs: any[] = []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let jobs: any[] = []
  let dbSource = false

  try {
    let query = supabase.from("jobs").select("*", { count: "exact" }).eq("user_id", user.id)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (!error && data) {
      jobs = data
      dbSource = true
    }
  } catch (dbError) {
    console.warn("Database not available, using in-memory storage:", dbError)
  }

  if (!dbSource) {
    jobs = inMemoryJobs.filter((j) => j.user_id === user.id && (!status || j.status === status))
  }

  return NextResponse.json({ jobs, source: dbSource ? "database" : "memory" })
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quoteId, partId, quantity, material, parameters, totalPrice, toolpath, process } = body as {
      quoteId?: string
      partId?: string
      quantity?: number
      material?: string
      parameters?: Record<string, any>
      totalPrice?: number
      toolpath?: any
      process?: string
    }

    if (!quoteId && !partId) {
      return NextResponse.json({ error: "Missing partId or quoteId" }, { status: 400 })
    }

    let job: any = {
      id: `job-${Date.now()}`,
      user_id: user.id,
      quote_id: quoteId || null,
      part_id: partId || null,
      hub_id: null,
      quantity: quantity || 1,
      material: material || null,
      parameters: { ...(parameters || {}), _toolpath: toolpath, _process: process },
      total_price: totalPrice || 0,
      status: "pending_admin_assignment",
      created_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    let dbJob = null

    try {
      const result = await supabase.from("jobs").insert([job]).select().single()

      if (!result.error && result.data) {
        job = result.data
        dbJob = job
      }
    } catch (dbError) {
      console.warn("Database not available, using in-memory storage:", dbError)
    }

    if (!dbJob) {
      inMemoryJobs.push(job)
    }

    if (quoteId) {
      try {
        await supabase.from("quotes").update({ status: "accepted", job_id: job.id }).eq("id", quoteId)
      } catch (e) {
        console.warn("Failed to update quote status:", e)
      }
    }

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("Job creation error:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

// app/api/jobs/route.ts
// Jobs API with database persistence

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

const inMemoryJobs: any[] = []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const userId = searchParams.get("userId")

  let jobs: any[] = []
  let dbSource = false

  try {
    let query = supabase.from("jobs").select("*", { count: "exact" })

    if (status) {
      query = query.eq("status", status)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error, count } = await query.order("created_at", { ascending: false })

    if (!error && data && data.length > 0) {
      jobs = data
      dbSource = true
    }
  } catch (dbError) {
    console.warn("Database not available, using in-memory storage:", dbError)
  }

  if (!dbSource) {
    let filtered = [...inMemoryJobs]

    if (status) {
      filtered = filtered.filter((job) => job.status === status)
    }

    if (userId) {
      filtered = filtered.filter((job) => job.userId === userId)
    }

    jobs = filtered
  }

  return NextResponse.json({ jobs, source: dbSource ? "database" : "memory" })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, quoteId, partId, hubId, quantity, material, parameters, totalPrice } = body

    const required = ["userId", "hubId"]
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    let job: any = {
      id: `job-${Date.now()}`,
      user_id: userId,
      quote_id: quoteId || null,
      part_id: partId || null,
      hub_id: hubId,
      quantity: quantity || 1,
      material: material || null,
      parameters: parameters || {},
      total_price: totalPrice || 0,
      status: "pending",
      created_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    let dbJob = null

    try {
      const result = await supabase
        .from("jobs")
        .insert([job])
        .select()
        .single()

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

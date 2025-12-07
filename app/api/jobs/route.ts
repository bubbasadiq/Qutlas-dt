import { NextResponse } from "next/server"

// In-memory job storage for demo - use database in production
const jobs: any[] = []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const userId = searchParams.get("userId")

  let filtered = [...jobs]

  if (status) {
    filtered = filtered.filter((job) => job.status === status)
  }

  if (userId) {
    filtered = filtered.filter((job) => job.userId === userId)
  }

  return NextResponse.json({ jobs: filtered })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const required = ["partId", "quantity", "material", "hubId"]
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const job = {
      id: `job-${Date.now()}`,
      ...body,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [{ status: "pending", timestamp: new Date().toISOString(), note: "Job created" }],
    }

    jobs.push(job)

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  // Demo job data
  const job = {
    id: jobId,
    partId: "part-001",
    partName: "Precision Bracket",
    quantity: 10,
    material: "Aluminum 6061-T6",
    hubId: "hub-001",
    hubName: "TechHub LA",
    status: "in_progress",
    totalPrice: 288.0,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timeline: [
      {
        status: "pending",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Job created",
      },
      {
        status: "confirmed",
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Hub confirmed job",
      },
      {
        status: "in_progress",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Production started",
      },
    ],
  }

  return NextResponse.json(job)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  try {
    const body = await request.json()

    // In production, update job in database
    const updatedJob = {
      id: jobId,
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(updatedJob)
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

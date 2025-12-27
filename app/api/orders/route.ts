import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's jobs (orders)
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform jobs to order format
    const orders = (jobs || []).map((job: any) => ({
      id: job.id,
      status: job.status || "pending",
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      totalPrice: job.quote?.breakdown?.totalPrice || job.total_price || 0,
      quantity: job.quantity || 1,
      material: job.quote?.material?.name || job.material || "Unknown",
      process: job.quote?.process || job.process || "Unknown",
      estimatedCompletion: job.tracking?.estimatedCompletion || null,
    }))

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error("Error in orders API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

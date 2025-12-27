import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = params

    // Fetch specific job (order)
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .single()

    if (error || !job) {
      console.error("Error fetching order:", error)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Transform job to detailed order format
    const order = {
      id: job.id,
      status: job.status || "pending",
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      totalPrice: job.quote?.breakdown?.totalPrice || job.total_price || 0,
      quantity: job.quantity || 1,
      material: job.quote?.material?.name || job.material || "Unknown",
      process: job.quote?.process || job.process || "Unknown",
      estimatedCompletion: job.tracking?.estimatedCompletion || null,
      deliveryAddress: job.delivery_address || null,
      tracking: {
        carrier: job.tracking?.carrier || null,
        trackingNumber: job.tracking?.trackingNumber || null,
        estimatedDelivery: job.tracking?.estimatedDelivery || null,
        timeline: job.tracking?.timeline || [
          {
            status: "Order Received",
            timestamp: job.created_at,
            note: "Your order has been received and is being processed",
          },
        ],
      },
      payment: job.payment
        ? {
            status: job.payment.status || "pending",
            method: job.payment.method || "card",
            reference: job.payment.reference || job.payment.transactionId || "N/A",
            amount: job.payment.amount || job.total_price || 0,
            paidAt: job.payment.verifiedAt || null,
          }
        : null,
      breakdown: job.quote?.breakdown
        ? {
            subtotal: job.quote.breakdown.subtotal || 0,
            platformFee: job.quote.breakdown.platformFee || 0,
            shipping: job.quote.breakdown.shipping || 0,
            tax: job.quote.breakdown.tax || 0,
            total: job.quote.breakdown.totalPrice || 0,
          }
        : {
            subtotal: job.total_price || 0,
            platformFee: 0,
            shipping: 0,
            tax: 0,
            total: job.total_price || 0,
          },
    }

    return NextResponse.json(order, { status: 200 })
  } catch (error) {
    console.error("Error in order detail API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

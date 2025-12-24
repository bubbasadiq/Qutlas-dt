// app/api/payment/verify/route.ts
// Payment verification endpoint using Flutterwave

import { NextResponse } from "next/server"
import Flutterwave from "flutterwave-node-v3"
import { supabase } from "@/lib/supabaseClient"

function getFlutterwave() {
  const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
  
  if (!publicKey || !secretKey) {
    throw new Error("Flutterwave keys not configured")
  }
  
  return new Flutterwave(publicKey, secretKey)
}

export async function POST(req: Request) {
  try {
    const flutterwave = getFlutterwave()
    const { transaction_id, tx_ref } = await req.json()

    if (!transaction_id && !tx_ref) {
      return NextResponse.json({ error: "Missing transaction_id or tx_ref" }, { status: 400 })
    }

    let response

    if (transaction_id) {
      response = await flutterwave.Transaction.verify({
        id: transaction_id,
      })
    } else if (tx_ref) {
      response = await flutterwave.Transaction.verify({
        tx_ref: tx_ref,
      })
    } else {
      return NextResponse.json({ error: "Invalid verification parameters" }, { status: 400 })
    }

    if (response.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const { data } = response
    const reference = data.tx_ref

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: data.status === "successful" ? "completed" : "failed",
        transaction_id: data.id.toString(),
        verified_at: new Date().toISOString(),
      })
      .eq("tx_ref", reference)

    if (updateError) {
      console.error("Update error:", updateError)
    }

    if (data.status === "successful") {
      const { data: payment } = await supabase
        .from("payments")
        .select("job_id")
        .eq("tx_ref", reference)
        .single()

      if (payment?.job_id) {
        await supabase
          .from("jobs")
          .update({
            status: "paid",
            payment_date: new Date().toISOString(),
          })
          .eq("id", payment.job_id)
      }
    }

    return NextResponse.json({
      success: data.status === "successful",
      status: data.status,
      data: {
        id: data.id,
        tx_ref: data.tx_ref,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
      },
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

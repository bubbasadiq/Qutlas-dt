// app/api/payment/create/route.ts
// Payment initialization endpoint using Flutterwave

import { NextResponse } from "next/server"
import Flutterwave from "flutterwave-node-v3"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: Request) {
  try {
    const flutterwave = new Flutterwave(
      process.env.FLUTTERWAVE_PUBLIC_KEY!,
      process.env.FLUTTERWAVE_SECRET_KEY!
    )

    const { jobId, amount, email, name, phone, description } = await req.json()

    if (!jobId || !amount || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const tx_ref = `qutlas_${jobId}_${Date.now()}`

    const payload = {
      tx_ref,
      amount: Math.round(amount * 100) / 100,
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
      meta: {
        jobId,
      },
      customer: {
        email,
        phonenumber: phone || "",
        name,
      },
      customizations: {
        title: "Qutlas - Manufacturing Quote",
        description: description || "Manufacturing service payment",
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
    }

    const response = await flutterwave.Transaction.initialize(payload)

    if (response.status !== "success") {
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 400 })
    }

    const { data } = response

    const { error: dbError } = await supabase
      .from("payments")
      .insert([
        {
          tx_ref,
          job_id: jobId,
          amount,
          currency: "NGN",
          status: "pending",
          customer_email: email,
          customer_name: name,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
    }

    return NextResponse.json({
      success: true,
      data: data,
      link: data.link,
      tx_ref,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

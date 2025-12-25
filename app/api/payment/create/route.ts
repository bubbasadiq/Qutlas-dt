// app/api/payment/create/route.ts
// Payment initialization endpoint using Flutterwave

import { NextResponse } from "next/server"
import Flutterwave from "flutterwave-node-v3"
import { supabase } from "@/lib/supabaseClient"

// Extend the Flutterwave type to include our specific response structure
interface FlutterwaveResponse {
  status: string
  data: {
    link: string
    [key: string]: any
  }
}

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
    const { jobId, amount, email, name, phone, description, currency } = await req.json()

    if (!jobId || !amount || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const tx_ref = `qutlas_${jobId}_${Date.now()}`

    // Default to NGN for Flutterwave, but allow USD for international
    const paymentCurrency = currency === "USD" ? "USD" : "NGN"

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || ""

    const payload = {
      tx_ref,
      amount: Math.round(amount * 100) / 100,
      currency: paymentCurrency,
      redirect_url: `${origin}/payment/verify`,
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
        logo: `${origin}/logo.png`,
      },
    }

    const response = await flutterwave.Transaction.initialize(payload) as FlutterwaveResponse

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
         currency: paymentCurrency,
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

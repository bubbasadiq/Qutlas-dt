// app/api/payment/create/route.ts
// Payment initialization endpoint using Flutterwave (NGN-only)

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import Flutterwave from "flutterwave-node-v3"
import { supabase } from "@/lib/supabaseClient"
import { getDownloadUrl, uploadObject } from "@/lib/storage/supabase-s3"

const JOBS_BUCKET = "jobs"

// Extend the Flutterwave type to include our specific response structure
interface FlutterwaveResponse {
  status: string
  data: {
    link: string
    [key: string]: any
  }
}

function getFlutterwave() {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!publicKey || !secretKey) {
    throw new Error("Flutterwave keys not configured")
  }

  return new Flutterwave(publicKey, secretKey)
}

async function loadJob(userId: string, jobId: string) {
  const url = getDownloadUrl({ bucket: JOBS_BUCKET, key: `${userId}/${jobId}.json`, expiresInSeconds: 60 })
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to load job (${res.status}): ${text}`)
  }
  return (await res.json()) as any
}

async function saveJob(userId: string, jobId: string, job: any) {
  await uploadObject({
    bucket: JOBS_BUCKET,
    key: `${userId}/${jobId}.json`,
    body: JSON.stringify(job, null, 2),
    contentType: "application/json",
  })
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const flutterwave = getFlutterwave()
    const { jobId, amount, email, name, phone, description } = (await req.json()) as {
      jobId?: string
      amount?: number
      email?: string
      name?: string
      phone?: string
      description?: string
    }

    if (!jobId || !amount || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const tx_ref = `qutlas_${user.id}__${jobId}__${Date.now()}`

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || ""

    const payload = {
      tx_ref,
      amount: Math.round(amount * 100) / 100,
      currency: "NGN",
      redirect_url: `${origin}/payment/verify`,
      meta: {
        jobId,
        userId: user.id,
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

    const response = (await flutterwave.Transaction.initialize(payload)) as FlutterwaveResponse

    if (response.status !== "success") {
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 400 })
    }

    // Best-effort: persist pending payment information into the job JSON in S3
    try {
      const job = await loadJob(user.id, jobId)
      job.updatedAt = new Date().toISOString()
      job.payment = {
        status: "pending",
        reference: tx_ref,
        amount,
        currency: "NGN",
        customer: { email, name, phone },
        createdAt: new Date().toISOString(),
      }
      await saveJob(user.id, jobId, job)
    } catch (err) {
      console.warn("Failed to attach payment metadata to job:", err)
    }

    // Best-effort: log payment in DB (may be unavailable / RLS)
    try {
      await supabase
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
    } catch (dbError) {
      console.warn("Failed to insert payment record:", dbError)
    }

    return NextResponse.json({
      success: true,
      data: response.data,
      link: response.data.link,
      tx_ref,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

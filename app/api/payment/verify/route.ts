// app/api/payment/verify/route.ts
// Payment verification endpoint using Flutterwave

import { NextResponse } from "next/server"
import Flutterwave from "flutterwave-node-v3"
import { supabase } from "@/lib/supabaseClient"
import { getDownloadUrl, uploadObject } from "@/lib/storage/supabase-s3"

const JOBS_BUCKET = "jobs"

function getFlutterwave() {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!publicKey || !secretKey) {
    throw new Error("Flutterwave keys not configured")
  }

  return new Flutterwave(publicKey, secretKey)
}

function parseTxRef(txRef: string): { userId: string; jobId: string } | null {
  if (!txRef.startsWith("qutlas_")) return null

  // Preferred format: qutlas_{userId}__{jobId}__{timestamp}
  const withoutPrefix = txRef.slice("qutlas_".length)
  if (withoutPrefix.includes("__")) {
    const parts = withoutPrefix.split("__")
    if (parts.length >= 2) {
      return { userId: parts[0], jobId: parts[1] }
    }
  }

  // Legacy format: qutlas_{jobId}_{timestamp}
  const legacyParts = withoutPrefix.split("_")
  if (legacyParts.length >= 2) {
    // In legacy format we can't reliably infer userId.
    return null
  }

  return null
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
    const flutterwave = getFlutterwave()
    const { transaction_id, tx_ref } = (await req.json()) as { transaction_id?: string; tx_ref?: string }

    if (!transaction_id && !tx_ref) {
      return NextResponse.json({ error: "Missing transaction_id or tx_ref" }, { status: 400 })
    }

    const response = transaction_id
      ? await flutterwave.Transaction.verify({ id: transaction_id })
      : await flutterwave.Transaction.verify({ tx_ref: tx_ref! })

    if (response.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const { data } = response
    const reference = data.tx_ref as string

    // Best-effort: update payments table
    try {
      await supabase
        .from("payments")
        .update({
          status: data.status === "successful" ? "completed" : "failed",
          transaction_id: data.id?.toString?.() ?? String(data.id ?? ""),
          verified_at: new Date().toISOString(),
        })
        .eq("tx_ref", reference)
    } catch (err) {
      console.warn("Failed to update payment record:", err)
    }

    // Best-effort: update jobs table
    if (data.status === "successful") {
      try {
        const { data: payment } = await supabase.from("payments").select("job_id").eq("tx_ref", reference).single()

        if (payment?.job_id) {
          await supabase
            .from("jobs")
            .update({
              status: "paid",
              payment_date: new Date().toISOString(),
            })
            .eq("id", payment.job_id)
        }
      } catch (err) {
        console.warn("Failed to update job status in DB:", err)
      }
    }

    // Update S3 job JSON (preferred source-of-truth for app)
    const parsed = parseTxRef(reference)
    if (parsed) {
      try {
        const job = await loadJob(parsed.userId, parsed.jobId)
        const now = new Date().toISOString()

        job.updatedAt = now
        job.payment = {
          ...(job.payment || {}),
          status: data.status === "successful" ? "paid" : "failed",
          reference,
          transactionId: data.id,
          amount: data.amount,
          currency: data.currency,
          verifiedAt: now,
        }

        if (data.status === "successful") {
          job.status = "paid"
          job.tracking = job.tracking || {}
          job.tracking.timeline = Array.isArray(job.tracking.timeline) ? job.tracking.timeline : []
          job.tracking.timeline.push({ status: "paid", timestamp: now, note: "Payment confirmed" })
        }

        await saveJob(parsed.userId, parsed.jobId, job)
      } catch (err) {
        console.warn("Failed to update job JSON after payment verification:", err)
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
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

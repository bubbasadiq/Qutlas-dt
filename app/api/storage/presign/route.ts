import { NextResponse } from "next/server"
import { presignUrl } from "@/lib/storage/supabase-s3"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bucket, key, method, expiresInSeconds } = body as {
      bucket: string
      key: string
      method: "GET" | "PUT"
      expiresInSeconds?: number
    }

    if (!bucket || !key || (method !== "GET" && method !== "PUT")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const url = presignUrl({ method, bucket, key, expiresInSeconds })

    return NextResponse.json({ url, bucket, key })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to presign"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

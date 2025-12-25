import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getDownloadUrl } from "@/lib/storage/supabase-s3"

const WORKSPACES_BUCKET = "workspaces"

type WorkspaceIndexEntry = {
  id: string
  name: string
  created_at: string
  updated_at?: string
}

function indexKey(userId: string) {
  return `${userId}/index.json`
}

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const url = getDownloadUrl({ bucket: WORKSPACES_BUCKET, key: indexKey(user.id), expiresInSeconds: 60 })
    const res = await fetch(url)

    if (res.status === 404) return NextResponse.json([], { status: 200 })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json({ error: `Failed to list workspaces (${res.status}): ${text}` }, { status: 500 })
    }

    const data = (await res.json()) as unknown
    const entries = Array.isArray(data) ? (data as WorkspaceIndexEntry[]) : []

    entries.sort((a, b) => {
      const aTime = Date.parse(a.updated_at || a.created_at)
      const bTime = Date.parse(b.updated_at || b.created_at)
      return bTime - aTime
    })

    return NextResponse.json(entries, { status: 200 })
  } catch (error) {
    console.error("Workspace list failed:", error)
    const message = error instanceof Error ? error.message : "Failed to list workspaces"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

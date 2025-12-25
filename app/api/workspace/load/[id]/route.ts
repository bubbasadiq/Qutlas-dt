import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getDownloadUrl } from "@/lib/storage/supabase-s3"

const WORKSPACES_BUCKET = "workspaces"

function workspaceKey(userId: string, workspaceId: string) {
  return `${userId}/${workspaceId}.json`
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const url = getDownloadUrl({ bucket: WORKSPACES_BUCKET, key: workspaceKey(user.id, params.id), expiresInSeconds: 60 })
    const res = await fetch(url)

    if (res.status === 404) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json({ error: `Failed to load workspace (${res.status}): ${text}` }, { status: 500 })
    }

    const workspace = await res.json()
    return NextResponse.json(workspace, { status: 200 })
  } catch (error) {
    console.error("Workspace load failed:", error)
    const message = error instanceof Error ? error.message : "Failed to load workspace"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

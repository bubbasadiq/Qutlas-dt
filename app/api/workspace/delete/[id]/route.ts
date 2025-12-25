import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { deleteObject, getDownloadUrl, uploadObject } from "@/lib/storage/supabase-s3"

const WORKSPACES_BUCKET = "workspaces"

type WorkspaceIndexEntry = {
  id: string
  name: string
  created_at: string
  updated_at?: string
}

function workspaceKey(userId: string, workspaceId: string) {
  return `${userId}/${workspaceId}.json`
}

function indexKey(userId: string) {
  return `${userId}/index.json`
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await deleteObject({ bucket: WORKSPACES_BUCKET, key: workspaceKey(user.id, id) })

    // Update index (best-effort)
    try {
      const url = getDownloadUrl({ bucket: WORKSPACES_BUCKET, key: indexKey(user.id), expiresInSeconds: 60 })
      const res = await fetch(url)

      let entries: WorkspaceIndexEntry[] = []
      if (res.ok) {
        const json = (await res.json()) as unknown
        if (Array.isArray(json)) entries = json as WorkspaceIndexEntry[]
      }

      const next = entries.filter((e) => e.id !== id)

      await uploadObject({
        bucket: WORKSPACES_BUCKET,
        key: indexKey(user.id),
        body: JSON.stringify(next, null, 2),
        contentType: "application/json",
      })
    } catch (indexErr) {
      console.warn("Failed to update workspace index during delete:", indexErr)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Workspace delete failed:", error)
    const message = error instanceof Error ? error.message : "Failed to delete workspace"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

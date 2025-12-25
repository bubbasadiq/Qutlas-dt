// app/api/cad/download/[partId]/route.ts
// CAD file download endpoint

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

const sampleCadFiles: Record<string, string> = {
  "part-001": "bracket.stp",
  "part-002": "bolt-m8.stp",
  "part-003": "enclosure.stp",
  "part-004": "shaft.stp",
  "part-005": "gear.stp",
  "part-006": "l-bracket.stp",
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partId: string }> }
) {
  const { partId } = await params

  let cadFilePath: string | null = null
  let dbSource = false

  try {
    const { data, error } = await supabase
      .from("catalog_parts")
      .select("cad_file_path")
      .eq("id", partId)
      .single()

    if (!error && data?.cad_file_path) {
      cadFilePath = data.cad_file_path
      dbSource = true
    }
  } catch (dbError) {
    console.warn("Database not available, using sample data:", dbError)
  }

  // Prefer Supabase Storage (S3) for CAD files.
  // DB paths may be stored as either:
  // - "cad-files/<key>"  (bucket + key)
  // - "<key>"           (assumed in cad-files bucket)
  // - legacy "/cad/<filename>" paths (mapped to cad-files/samples)
  if (!cadFilePath && sampleCadFiles[partId]) {
    cadFilePath = sampleCadFiles[partId]
  }

  if (!cadFilePath) {
    return NextResponse.json({ error: "CAD file not available" }, { status: 404 })
  }

  const { getDownloadUrl } = await import("@/lib/storage/supabase-s3")

  let bucket = "cad-files"
  let key = cadFilePath

  if (cadFilePath.startsWith("/cad/")) {
    bucket = "cad-files"
    key = `samples/${cadFilePath.replace("/cad/", "")}`
  } else if (cadFilePath.includes("/")) {
    // If the first segment looks like a bucket name, treat it as such
    const [first, ...rest] = cadFilePath.split("/")
    if (first && rest.length > 0) {
      bucket = first
      key = rest.join("/")
    }
  }

  const downloadUrl = getDownloadUrl({ bucket, key, expiresInSeconds: 60 * 15 })

  return NextResponse.json({
    downloadUrl,
    filename: sampleCadFiles[partId] || `${partId}.stp`,
    partId,
    source: dbSource ? "database" : "sample",
    bucket,
    key,
  })
}

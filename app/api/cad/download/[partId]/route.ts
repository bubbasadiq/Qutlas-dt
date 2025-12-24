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

  if (!cadFilePath && sampleCadFiles[partId]) {
    cadFilePath = `/cad/${sampleCadFiles[partId]}`
  }

  if (!cadFilePath) {
    return NextResponse.json({ error: "CAD file not available" }, { status: 404 })
  }

  return NextResponse.json({
    downloadUrl: `/api/files${cadFilePath}`,
    filename: sampleCadFiles[partId] || `${partId}.stp`,
    partId,
    source: dbSource ? "database" : "sample",
  })
}

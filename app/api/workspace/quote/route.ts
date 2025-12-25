import { NextResponse } from "next/server"
import { assessManufacturability } from "@/lib/manufacturability/assess"
import { selectToolpath } from "@/lib/toolpath/select-toolpath"
import { estimateQuote } from "@/lib/quote/estimate"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      objects = [],
      quantity = 1,
      material,
      process = "CNC Milling",
    } = body as {
      objects: Array<{ type?: string; params?: Record<string, any>; dimensions?: Record<string, any>; features?: any[] }>
      quantity?: number
      material?: string
      process?: string
    }

    if (!Array.isArray(objects) || objects.length === 0) {
      return NextResponse.json({ error: "No objects provided" }, { status: 400 })
    }

    // For MVP we quote based on the first object.
    const obj = objects[0]
    const geometryParams = obj.params || obj.dimensions || {}
    const featureCount = Array.isArray(obj.features) ? obj.features.length : 0

    const toolpath = selectToolpath({
      process,
      material,
      objectType: obj.type,
      geometryParams,
      featureCount,
    })

    const manufacturability = assessManufacturability({ parameters: geometryParams, process })

    const quote = estimateQuote({
      quantity,
      material,
      process,
      toolpathId: toolpath.id,
      geometryParams,
      featureCount,
    })

    return NextResponse.json({
      quantity,
      material,
      process,
      toolpath,
      manufacturability,
      quote,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate quote"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

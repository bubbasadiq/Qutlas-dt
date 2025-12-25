import { NextResponse } from "next/server"
import { assessManufacturability } from "@/lib/manufacturability/assess"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { parameters = {}, process } = body as {
      parameters: Record<string, any>
      material?: string
      process?: string
    }

    const result = assessManufacturability({ parameters, process })

    return NextResponse.json({
      manufacturability: result.score,
      issues: result.issues,
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
      recommendations:
        result.issues.length > 0
          ? result.issues.filter((i) => i.severity === "error").map((i) => i.fix)
          : ["Design meets all manufacturability requirements"],
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

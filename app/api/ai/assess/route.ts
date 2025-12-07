import { NextResponse } from "next/server"

// Manufacturability assessment rules from master prompt
const rules = [
  {
    id: "min_wall_thickness",
    description: "Minimum wall thickness check",
    severity: "error",
    check: (params: any) => params.wallThickness >= 2,
    message: "Wall thickness must be at least 2mm for CNC milling",
    fix: "Increase wall thickness to 2mm or greater",
  },
  {
    id: "min_hole_diameter",
    description: "Minimum hole diameter check",
    severity: "warning",
    check: (params: any) => !params.holeDiameter || params.holeDiameter >= 3,
    message: "Hole diameter should be at least 3mm for standard tooling",
    fix: "Increase hole diameter or specify specialty tooling",
  },
  {
    id: "aspect_ratio",
    description: "Aspect ratio check for stability",
    severity: "info",
    check: (params: any) => {
      if (!params.length || !params.width || !params.height) return true
      const maxDim = Math.max(params.length, params.width, params.height)
      const minDim = Math.min(params.length, params.width, params.height)
      return maxDim / minDim <= 10
    },
    message: "High aspect ratio may cause vibration during machining",
    fix: "Consider adding fixtures or reducing aspect ratio",
  },
  {
    id: "hole_to_edge",
    description: "Hole to edge distance check",
    severity: "warning",
    check: (params: any) => {
      if (!params.holeDiameter || !params.width) return true
      return params.width / 2 > params.holeDiameter * 1.5
    },
    message: "Holes should be at least 1.5x diameter from edge",
    fix: "Move holes further from edges or reduce hole diameter",
  },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { parameters, material, process } = body

    const issues: any[] = []
    let passedChecks = 0

    for (const rule of rules) {
      const passed = rule.check(parameters)
      if (passed) {
        passedChecks++
      } else {
        issues.push({
          id: rule.id,
          severity: rule.severity,
          message: rule.message,
          fix: rule.fix,
        })
      }
    }

    const manufacturability = Math.round((passedChecks / rules.length) * 100)

    return NextResponse.json({
      manufacturability,
      issues,
      passedChecks,
      totalChecks: rules.length,
      recommendations:
        issues.length > 0
          ? issues.filter((i) => i.severity === "error").map((i) => i.fix)
          : ["Design meets all manufacturability requirements"],
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

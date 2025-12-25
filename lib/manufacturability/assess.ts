export type ManufacturabilitySeverity = "error" | "warning" | "info"

export interface ManufacturabilityIssue {
  id: string
  severity: ManufacturabilitySeverity
  message: string
  fix: string
}

export interface ManufacturabilityResult {
  score: number
  issues: ManufacturabilityIssue[]
  passedChecks: number
  totalChecks: number
}

function normalize(s: string | undefined) {
  return (s || "").trim().toLowerCase()
}

export function assessManufacturability(params: {
  parameters: Record<string, any>
  process?: string
}): ManufacturabilityResult {
  const process = normalize(params.process)
  const isCnc = process.includes("cnc") || process.includes("milling") || process.includes("machin")
  const isPrinting = process.includes("print") || process.includes("additive")

  const rules: Array<{
    id: string
    severity: ManufacturabilitySeverity
    check: (p: Record<string, any>) => boolean
    message: string
    fix: string
  }> = []

  // Process-specific baseline constraints
  if (isPrinting) {
    rules.push({
      id: "min_wall_thickness",
      severity: "error",
      check: (p) => (p.wallThickness ?? p.wall_thickness ?? 0) >= 0.8,
      message: "Wall thickness must be at least 0.8mm for most additive processes",
      fix: "Increase wall thickness to 0.8mm or greater",
    })
  } else if (isCnc) {
    rules.push({
      id: "min_wall_thickness",
      severity: "error",
      check: (p) => (p.wallThickness ?? p.wall_thickness ?? 0) >= 2,
      message: "Wall thickness must be at least 2mm for CNC milling",
      fix: "Increase wall thickness to 2mm or greater",
    })
  }

  rules.push({
    id: "min_hole_diameter",
    severity: "warning",
    check: (p) => !p.holeDiameter || p.holeDiameter >= 3,
    message: "Hole diameter should be at least 3mm for standard tooling",
    fix: "Increase hole diameter or specify specialty tooling",
  })

  rules.push({
    id: "aspect_ratio",
    severity: "info",
    check: (p) => {
      const length = p.length ?? p.width ?? p.x
      const width = p.width ?? p.depth ?? p.y
      const height = p.height ?? p.depth ?? p.z
      if (!length || !width || !height) return true
      const maxDim = Math.max(length, width, height)
      const minDim = Math.min(length, width, height)
      return maxDim / minDim <= 10
    },
    message: "High aspect ratio may cause vibration or warping during manufacturing",
    fix: "Consider adding fixtures/supports or reducing aspect ratio",
  })

  rules.push({
    id: "hole_to_edge",
    severity: "warning",
    check: (p) => {
      if (!p.holeDiameter || !p.width) return true
      return p.width / 2 > p.holeDiameter * 1.5
    },
    message: "Holes should be at least 1.5x diameter from the edge",
    fix: "Move holes further from edges or reduce hole diameter",
  })

  let passedChecks = 0
  const issues: ManufacturabilityIssue[] = []

  for (const rule of rules) {
    const passed = rule.check(params.parameters)
    if (passed) passedChecks++
    else {
      issues.push({
        id: rule.id,
        severity: rule.severity,
        message: rule.message,
        fix: rule.fix,
      })
    }
  }

  const score = rules.length === 0 ? 100 : Math.round((passedChecks / rules.length) * 100)

  return {
    score,
    issues,
    passedChecks,
    totalChecks: rules.length,
  }
}

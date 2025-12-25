export interface ToolpathSelection {
  id: string
  name: string
  strategy: string
  notes?: string
}

function normalize(s: string | undefined) {
  return (s || "").trim().toLowerCase()
}

export function selectToolpath(params: {
  process?: string
  material?: string
  objectType?: string
  geometryParams?: Record<string, any>
  featureCount?: number
}): ToolpathSelection {
  const process = normalize(params.process)
  const material = normalize(params.material)
  const objectType = normalize(params.objectType)
  const featureCount = params.featureCount ?? 0

  const cnc = process.includes("cnc") || process.includes("milling") || process.includes("machin")
  const turning = process.includes("turn") || objectType === "cylinder"
  const laser = process.includes("laser")
  const printing = process.includes("print") || process.includes("additive")
  const sheet = process.includes("sheet") || process.includes("bend")

  if (laser) {
    return {
      id: "laser-2d-contour",
      name: "2D Contour Cut",
      strategy: "Lead-in + Contour (1 pass) + Lead-out",
      notes: "Best for profiles cut from sheet stock",
    }
  }

  if (printing) {
    return {
      id: "print-slice",
      name: "Slicing",
      strategy: "Auto-orient + Slice (infill + perimeters)",
      notes: "Layer-based toolpath; supports complex geometry",
    }
  }

  if (sheet) {
    return {
      id: "sheet-cut-bend",
      name: "Cut + Bend",
      strategy: "Laser cut flat pattern + press brake bends",
      notes: "Requires valid bend radii and reliefs",
    }
  }

  if (cnc) {
    if (turning) {
      return {
        id: "cnc-turning",
        name: "Turning + Finish",
        strategy: "Rough turning + finish turning + part-off",
        notes: "For axisymmetric parts",
      }
    }

    const isHighFeature = featureCount > 3
    const uses3DStrategy = objectType === "torus" || objectType === "cone" || isHighFeature

    return {
      id: uses3DStrategy ? "cnc-3d-adaptive" : "cnc-2p5-pocket",
      name: uses3DStrategy ? "3D Adaptive + Finishing" : "2.5D Pocket + Contour",
      strategy: uses3DStrategy
        ? "Adaptive clearing (3D) + rest machining + finish passes"
        : "Pocketing (2.5D) + contour finishing",
      notes: material.includes("titan") ? "May require reduced stepdown and specialized tooling" : undefined,
    }
  }

  return {
    id: "default",
    name: "Standard",
    strategy: "Automatic",
    notes: "Select a manufacturing process to get a specific toolpath",
  }
}

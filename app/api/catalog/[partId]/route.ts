import { NextResponse } from "next/server"

// Sample part data - in production, fetch from database
const getPartById = (partId: string) => {
  const parts: Record<string, any> = {
    "part-001": {
      id: "part-001",
      name: "Precision Bracket",
      description:
        "High-precision aluminum bracket suitable for mounting electronics, sensors, and mechanical assemblies.",
      category: "brackets",
      material: "Aluminum 6061-T6",
      process: "CNC Milling",
      basePrice: 32,
      leadTime: "3-5 days",
      manufacturability: 96,
      thumbnail: "/placeholder.svg?height=400&width=400",
      parameters: [
        { name: "length", value: 100, unit: "mm", min: 50, max: 200 },
        { name: "width", value: 50, unit: "mm", min: 25, max: 100 },
        { name: "height", value: 25, unit: "mm", min: 10, max: 50 },
        { name: "holeDiameter", value: 6, unit: "mm", min: 3, max: 12 },
      ],
      materials: [
        { name: "Aluminum 6061-T6", priceMultiplier: 1.0 },
        { name: "Aluminum 7075", priceMultiplier: 1.3 },
        { name: "Steel 1018", priceMultiplier: 0.9 },
        { name: "Stainless 304", priceMultiplier: 1.5 },
      ],
      specifications: [
        { label: "Tolerance", value: "±0.1mm" },
        { label: "Surface Finish", value: "Ra 1.6μm" },
        { label: "Max Temp", value: "150°C" },
        { label: "Weight", value: "45g" },
      ],
    },
  }

  return parts[partId] || null
}

export async function GET(request: Request, { params }: { params: Promise<{ partId: string }> }) {
  const { partId } = await params

  const part = getPartById(partId)

  if (!part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 })
  }

  return NextResponse.json(part)
}

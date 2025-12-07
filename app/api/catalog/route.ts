import { NextResponse } from "next/server"

// Sample catalog data - in production, fetch from database
const catalogItems = [
  {
    id: "part-001",
    name: "Precision Bracket",
    description: "High-precision aluminum bracket for mounting",
    category: "brackets",
    material: "Aluminum 6061-T6",
    process: "CNC Milling",
    basePrice: 32,
    leadTime: "3-5 days",
    manufacturability: 96,
    thumbnail: "/placeholder.svg?height=200&width=200",
    parameters: [
      { name: "length", value: 100, unit: "mm", min: 50, max: 200 },
      { name: "width", value: 50, unit: "mm", min: 25, max: 100 },
      { name: "height", value: 25, unit: "mm", min: 10, max: 50 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "part-002",
    name: "Hex Socket Bolt M8",
    description: "Standard hex socket bolt",
    category: "fasteners",
    material: "Steel",
    process: "CNC",
    basePrice: 4,
    leadTime: "2 days",
    manufacturability: 99,
    thumbnail: "/placeholder.svg?height=200&width=200",
    parameters: [
      { name: "diameter", value: 8, unit: "mm", min: 4, max: 16 },
      { name: "length", value: 30, unit: "mm", min: 10, max: 100 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "part-003",
    name: "Electronics Enclosure",
    description: "Protective enclosure for electronics",
    category: "enclosures",
    material: "ABS",
    process: "3D Printing",
    basePrice: 28,
    leadTime: "4 days",
    manufacturability: 94,
    thumbnail: "/placeholder.svg?height=200&width=200",
    parameters: [
      { name: "length", value: 150, unit: "mm", min: 50, max: 300 },
      { name: "width", value: 100, unit: "mm", min: 50, max: 200 },
      { name: "height", value: 50, unit: "mm", min: 20, max: 100 },
    ],
    createdAt: new Date().toISOString(),
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const limit = Number.parseInt(searchParams.get("limit") || "20")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  let filtered = [...catalogItems]

  if (category && category !== "all") {
    filtered = filtered.filter((item) => item.category === category)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(
      (item) => item.name.toLowerCase().includes(searchLower) || item.description.toLowerCase().includes(searchLower),
    )
  }

  const total = filtered.length
  const items = filtered.slice(offset, offset + limit)

  return NextResponse.json({
    items,
    total,
    limit,
    offset,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const required = ["name", "category", "material", "process", "basePrice"]
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const newItem = {
      id: `part-${Date.now()}`,
      ...body,
      manufacturability: body.manufacturability || 95,
      createdAt: new Date().toISOString(),
    }

    // In production, save to database
    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

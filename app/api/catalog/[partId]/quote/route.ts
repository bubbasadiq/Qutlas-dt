import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ partId: string }> }) {
  const { partId } = await params

  try {
    const body = await request.json()
    const { quantity = 1, material, parameters } = body

    // Calculate quote based on parameters
    const basePrice = 32 // Would fetch from DB
    const materialMultiplier = material?.priceMultiplier || 1.0

    // Volume-based pricing
    let volumeDiscount = 1.0
    if (quantity >= 10) volumeDiscount = 0.9
    if (quantity >= 50) volumeDiscount = 0.8
    if (quantity >= 100) volumeDiscount = 0.7

    const unitPrice = basePrice * materialMultiplier * volumeDiscount
    const totalPrice = unitPrice * quantity

    // Lead time calculation
    let leadTimeDays = 3
    if (quantity > 10) leadTimeDays = 5
    if (quantity > 50) leadTimeDays = 7

    const quote = {
      partId,
      quantity,
      material: material?.name || "Aluminum 6061-T6",
      unitPrice: Math.round(unitPrice * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
      leadTimeDays,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      breakdown: {
        baseCost: basePrice * quantity,
        materialCost: basePrice * quantity * (materialMultiplier - 1),
        volumeDiscount: basePrice * quantity * (1 - volumeDiscount),
      },
    }

    return NextResponse.json(quote)
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

// app/api/quote/create/route.ts
// Quote generation endpoint

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: Request) {
  try {
    const { partId, quantity, material, parameters, userId } = await req.json()

    if (!partId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let part
    let partError

    try {
      const result = await supabase
        .from("catalog_parts")
        .select("*")
        .eq("id", partId)
        .single()

      part = result.data
      partError = result.error
    } catch (e) {
      partError = e
    }

    if (partError || !part) {
      part = getSamplePart(partId)
    }

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    const basePrice = part.basePrice || 32
    const materialMultiplier =
      part.materials?.find((m: any) => m.name === material)?.priceMultiplier ||
      part.materials?.find((m: any) => m.name === part.material)?.priceMultiplier ||
      1.0

    let volumeDiscount = 1.0
    if (quantity >= 10) volumeDiscount = 0.95
    if (quantity >= 50) volumeDiscount = 0.9
    if (quantity >= 100) volumeDiscount = 0.85

    const unitPrice = basePrice * materialMultiplier * volumeDiscount
    const subtotal = unitPrice * quantity

    const platformFee = subtotal * 0.15
    const totalPrice = subtotal + platformFee

    const leadTimeDays = part.leadTimeDays || 5
    const calculatedLeadTime =
      quantity > 50 ? leadTimeDays + 3 : quantity > 10 ? leadTimeDays + 1 : leadTimeDays

    const quote = {
      partId,
      partName: part.name,
      quantity,
      material: material || part.material || "Aluminum 6061-T6",
      parameters: parameters || {},
      basePrice,
      materialMultiplier,
      volumeDiscount,
      unitPrice: Math.round(unitPrice * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
      leadTimeDays: calculatedLeadTime,
      manufacturability: part.manufacturability || 95,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    let quoteRecord
    try {
      const result = await supabase
        .from("quotes")
        .insert([
          {
            part_id: partId,
            user_id: userId,
            quantity,
            material: quote.material,
            parameters,
            base_price: quote.basePrice,
            material_multiplier: quote.materialMultiplier,
            volume_discount: quote.volumeDiscount,
            unit_price: quote.unitPrice,
            subtotal: quote.subtotal,
            platform_fee: quote.platformFee,
            total_price: quote.totalPrice,
            lead_time_days: quote.leadTimeDays,
            manufacturability: quote.manufacturability,
            status: "pending",
            expires_at: quote.validUntil,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      quoteRecord = result.data
      if (result.error) throw result.error
    } catch (e) {
      console.error("Database error saving quote:", e)
    }

    return NextResponse.json({
      quoteId: quoteRecord?.id || `quote-${Date.now()}`,
      ...quote,
      savedToDatabase: !!quoteRecord,
    })
  } catch (error) {
    console.error("Quote creation error:", error)
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 })
  }
}

function getSamplePart(partId: string) {
  const parts: Record<string, any> = {
    "part-001": {
      id: "part-001",
      name: "Precision Bracket",
      basePrice: 32,
      material: "Aluminum 6061-T6",
      materials: [
        { name: "Aluminum 6061-T6", priceMultiplier: 1.0 },
        { name: "Aluminum 7075", priceMultiplier: 1.3 },
        { name: "Steel 1018", priceMultiplier: 0.9 },
        { name: "Stainless 304", priceMultiplier: 1.5 },
      ],
      leadTimeDays: 5,
      manufacturability: 96,
    },
    "part-002": {
      id: "part-002",
      name: "Hex Socket Bolt M8",
      basePrice: 4,
      material: "Steel",
      materials: [
        { name: "Steel", priceMultiplier: 1.0 },
        { name: "Stainless 304", priceMultiplier: 1.5 },
        { name: "Brass", priceMultiplier: 2.0 },
      ],
      leadTimeDays: 3,
      manufacturability: 99,
    },
    "part-003": {
      id: "part-003",
      name: "Electronics Enclosure",
      basePrice: 28,
      material: "ABS",
      materials: [
        { name: "ABS", priceMultiplier: 1.0 },
        { name: "Aluminum 6061-T6", priceMultiplier: 1.2 },
        { name: "Nylon", priceMultiplier: 0.9 },
      ],
      leadTimeDays: 4,
      manufacturability: 94,
    },
  }
  return parts[partId] || null
}

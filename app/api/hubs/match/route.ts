import { NextResponse } from "next/server"

// Hub matching algorithm based on master prompt spec
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { partId, material, process, quantity, userLocation } = body

    // Sample hub data - in production, fetch from database
    const hubs = [
      {
        id: "hub-001",
        name: "TechHub LA",
        capabilities: ["CNC Milling", "Laser Cutting", "3D Printing"],
        materials: ["Aluminum", "Steel", "ABS"],
        rating: 4.9,
        currentLoad: 0.6,
        location: { lat: 34.0522, lng: -118.2437 },
        basePrice: 30,
        avgLeadTime: 3,
      },
      {
        id: "hub-002",
        name: "MechPrecision Toronto",
        capabilities: ["CNC Milling", "CNC Turning"],
        materials: ["Aluminum", "Steel", "Brass"],
        rating: 4.7,
        currentLoad: 0.4,
        location: { lat: 43.6532, lng: -79.3832 },
        basePrice: 25,
        avgLeadTime: 5,
      },
      {
        id: "hub-003",
        name: "FastCut NYC",
        capabilities: ["Laser Cutting", "Waterjet"],
        materials: ["Steel", "Aluminum"],
        rating: 4.8,
        currentLoad: 0.7,
        location: { lat: 40.7128, lng: -74.006 },
        basePrice: 35,
        avgLeadTime: 2,
      },
    ]

    // Scoring weights from spec
    const weights = {
      compatibility: 0.5,
      load: 0.25,
      distance: 0.15,
      rating: 0.1,
    }

    // Score each hub
    const scoredHubs = hubs.map((hub) => {
      // Compatibility score
      const hasProcess = hub.capabilities.some((c) => c.toLowerCase().includes(process?.toLowerCase() || ""))
      const hasMaterial = hub.materials.some((m) => m.toLowerCase().includes(material?.toLowerCase() || ""))
      const compatibilityScore = (hasProcess ? 0.5 : 0) + (hasMaterial ? 0.5 : 0)

      // Load score (prefer less busy hubs)
      const loadScore = 1 - hub.currentLoad

      // Distance score (simplified - would use actual geolocation)
      const distanceScore = 0.8 // Placeholder

      // Rating score (normalized to 0-1)
      const ratingScore = hub.rating / 5

      // Calculate total score
      const totalScore =
        weights.compatibility * compatibilityScore +
        weights.load * loadScore +
        weights.distance * distanceScore +
        weights.rating * ratingScore

      // Calculate price estimate
      const priceEstimate = hub.basePrice * (quantity || 1) * (1 + hub.currentLoad * 0.2)

      return {
        hubId: hub.id,
        hubName: hub.name,
        score: Math.round(totalScore * 100) / 100,
        priceEstimate: Math.round(priceEstimate * 100) / 100,
        leadTimeDays: hub.avgLeadTime + (hub.currentLoad > 0.7 ? 2 : 0),
        rating: hub.rating,
        compatibility: {
          process: hasProcess,
          material: hasMaterial,
        },
      }
    })

    // Sort by score descending
    scoredHubs.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      matches: scoredHubs.slice(0, 10),
      query: { partId, material, process, quantity },
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

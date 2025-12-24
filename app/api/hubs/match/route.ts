// app/api/hubs/match/route.ts
// Hub matching API with database-backed queries

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

const sampleHubs = [
  {
    id: "hub-001",
    name: "TechHub LA",
    capabilities: ["CNC Milling", "Laser Cutting", "3D Printing"],
    materials: ["Aluminum", "Steel", "ABS"],
    rating: 4.9,
    currentLoad: 0.6,
    location: { lat: 34.0522, lng: -118.2437, city: "Los Angeles", country: "USA" },
    basePrice: 30,
    avgLeadTime: 3,
    certified: true,
    completedJobs: 1234,
  },
  {
    id: "hub-002",
    name: "MechPrecision Toronto",
    capabilities: ["CNC Milling", "CNC Turning"],
    materials: ["Aluminum", "Steel", "Brass"],
    rating: 4.7,
    currentLoad: 0.4,
    location: { lat: 43.6532, lng: -79.3832, city: "Toronto", country: "Canada" },
    basePrice: 25,
    avgLeadTime: 5,
    certified: true,
    completedJobs: 892,
  },
  {
    id: "hub-003",
    name: "FastCut NYC",
    capabilities: ["Laser Cutting", "Waterjet"],
    materials: ["Steel", "Aluminum"],
    rating: 4.8,
    currentLoad: 0.7,
    location: { lat: 40.7128, lng: -74.006, city: "New York", country: "USA" },
    basePrice: 35,
    avgLeadTime: 2,
    certified: true,
    completedJobs: 2156,
  },
  {
    id: "hub-004",
    name: "EuroTech Berlin",
    capabilities: ["CNC Milling", "Sheet Metal", "3D Printing"],
    materials: ["Aluminum", "Steel", "Stainless", "Brass"],
    rating: 4.8,
    currentLoad: 0.5,
    location: { lat: 52.52, lng: 13.405, city: "Berlin", country: "Germany" },
    basePrice: 28,
    avgLeadTime: 4,
    certified: true,
    completedJobs: 1567,
  },
  {
    id: "hub-005",
    name: "AsiaFab Shenzhen",
    capabilities: ["CNC Milling", "CNC Turning", "Injection Molding"],
    materials: ["Aluminum", "Steel", "Plastic", "Titanium"],
    rating: 4.6,
    currentLoad: 0.55,
    location: { lat: 22.5431, lng: 114.0579, city: "Shenzhen", country: "China" },
    basePrice: 20,
    avgLeadTime: 5,
    certified: true,
    completedJobs: 3421,
  },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { partId, material, process, quantity, leadTimeRequirement } = body

    let hubs: any[] = []
    let dbSource = false

    try {
      let query = supabase.from("hubs").select("*")

      if (process) {
        query = query.contains("capabilities", [process])
      }

      if (material) {
        query = query.contains("materials", [material])
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        hubs = data
        dbSource = true
      }
    } catch (dbError) {
      console.warn("Database not available, using sample data:", dbError)
    }

    if (!dbSource) {
      hubs = sampleHubs.filter((hub) => {
        const hasProcess = !process || hub.capabilities.some((c: string) => c.toLowerCase().includes(process.toLowerCase()))
        const hasMaterial = !material || hub.materials.some((m: string) => m.toLowerCase().includes(material.toLowerCase()))
        return hasProcess && hasMaterial
      })
    }

    const weights = {
      compatibility: 0.5,
      load: 0.25,
      distance: 0.15,
      rating: 0.1,
    }

    const scoredHubs = hubs.map((hub) => {
      const hasProcess = !process || hub.capabilities?.some((c: string) => c.toLowerCase().includes(process.toLowerCase()))
      const hasMaterial = !material || hub.materials?.some((m: string) => m.toLowerCase().includes(material.toLowerCase()))
      const compatibilityScore = (hasProcess ? 0.5 : 0) + (hasMaterial ? 0.5 : 0)

      const currentLoad = hub.currentLoad ?? hub.avgLeadTime ? hub.avgLeadTime / 10 : 0.5
      const loadScore = 1 - currentLoad

      const distanceScore = 0.8

      const rating = hub.rating ?? 4.5
      const ratingScore = rating / 5

      const totalScore =
        weights.compatibility * compatibilityScore +
        weights.load * loadScore +
        weights.distance * distanceScore +
        weights.rating * ratingScore

      const basePrice = hub.basePrice || 30
      const quantityMultiplier = quantity && quantity > 10 ? 0.95 : quantity && quantity > 50 ? 0.9 : 1
      const priceEstimate = basePrice * (quantity || 1) * quantityMultiplier

      const avgLeadTime = hub.avgLeadTime || 5
      const leadTime = quantity && quantity > 50 ? avgLeadTime + 3 : quantity && quantity > 10 ? avgLeadTime + 1 : avgLeadTime

      const fitsLeadTime = !leadTimeRequirement || leadTime <= leadTimeRequirement

      return {
        hubId: hub.id,
        hubName: hub.name,
        hubLocation: hub.location?.city || hub.location || "Unknown",
        rating: rating,
        completedJobs: hub.completedJobs || 0,
        certified: hub.certified ?? true,
        score: Math.round(totalScore * 100) / 100,
        priceEstimate: Math.round(priceEstimate * 100) / 100,
        leadTimeDays: leadTime,
        fitsLeadTime,
        compatibility: {
          process: hasProcess,
          material: hasMaterial,
        },
      }
    })

    scoredHubs.sort((a, b) => {
      if (a.fitsLeadTime && !b.fitsLeadTime) return -1
      if (!a.fitsLeadTime && b.fitsLeadTime) return 1
      return b.score - a.score
    })

    return NextResponse.json({
      matches: scoredHubs,
      alternatives: scoredHubs.slice(3, 6),
      query: { partId, material, process, quantity, leadTimeRequirement },
      source: dbSource ? "database" : "sample",
    })
  } catch (error) {
    console.error("Hub matching error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

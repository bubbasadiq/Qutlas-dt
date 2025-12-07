import { NextResponse } from "next/server"

const hubs = [
  {
    id: "hub-001",
    name: "TechHub LA",
    location: { city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
    capabilities: ["CNC Milling", "Laser Cutting", "3D Printing"],
    materials: ["Aluminum", "Steel", "ABS", "Nylon"],
    rating: 4.9,
    completedJobs: 1234,
    avgLeadTime: 3,
    certified: true,
  },
  {
    id: "hub-002",
    name: "MechPrecision Toronto",
    location: { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
    capabilities: ["CNC Milling", "CNC Turning", "Sheet Metal"],
    materials: ["Aluminum", "Steel", "Brass", "Titanium"],
    rating: 4.7,
    completedJobs: 892,
    avgLeadTime: 5,
    certified: true,
  },
  {
    id: "hub-003",
    name: "FastCut NYC",
    location: { city: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
    capabilities: ["Laser Cutting", "Waterjet", "Sheet Metal"],
    materials: ["Steel", "Aluminum", "Stainless"],
    rating: 4.8,
    completedJobs: 2156,
    avgLeadTime: 2,
    certified: true,
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const capability = searchParams.get("capability")
  const material = searchParams.get("material")

  let filtered = [...hubs]

  if (capability) {
    filtered = filtered.filter((hub) => hub.capabilities.includes(capability))
  }

  if (material) {
    filtered = filtered.filter((hub) => hub.materials.includes(material))
  }

  return NextResponse.json({ hubs: filtered })
}

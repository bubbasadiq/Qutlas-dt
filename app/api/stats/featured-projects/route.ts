// app/api/stats/featured-projects/route.ts
// Featured projects for public display

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    // Get featured projects (public, no auth required)
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_featured", true)
      .order("featured_order", { ascending: true })
      .limit(6)

    if (error) {
      throw error
    }

    return NextResponse.json({
      projects: projects || [],
      source: "database"
    })
  } catch (error) {
    console.error("Error fetching featured projects:", error)
    
    // Fallback to sample data
    return NextResponse.json({
      projects: [
        {
          id: "featured-001",
          name: "Aerospace Drone Frame",
          description: "Lightweight carbon fiber drone frame for aerospace applications",
          created_at: new Date().toISOString(),
          thumbnail: "/placeholder.svg?height=200&width=200",
          status: "completed",
          user_name: "AeroTech Solutions",
          likes: 42
        },
        {
          id: "featured-002",
          name: "Medical Device Housing",
          description: "Precision machined enclosure for medical diagnostic equipment",
          created_at: new Date().toISOString(),
          thumbnail: "/placeholder.svg?height=200&width=200",
          status: "completed",
          user_name: "MediTech Innovations",
          likes: 38
        },
        {
          id: "featured-003",
          name: "Automotive Suspension Component",
          description: "High-strength aluminum suspension arm for electric vehicles",
          created_at: new Date().toISOString(),
          thumbnail: "/placeholder.svg?height=200&width=200",
          status: "completed",
          user_name: "AutoDrive Systems",
          likes: 56
        }
      ],
      source: "sample"
    })
  }
}
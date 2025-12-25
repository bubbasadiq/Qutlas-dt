// app/api/stats/platform/route.ts
// Platform statistics endpoint

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    // Get total users count
    const { count: usersCount, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    // Get total projects count
    const { count: projectsCount, error: projectsError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })

    // Get total parts count
    const { count: partsCount, error: partsError } = await supabase
      .from("catalog_parts")
      .select("*", { count: "exact", head: true })

    // Get total manufacturing hubs count
    const { count: hubsCount, error: hubsError } = await supabase
      .from("manufacturing_hubs")
      .select("*", { count: "exact", head: true })

    if (usersError || projectsError || partsError || hubsError) {
      throw new Error("Failed to fetch statistics")
    }

    return NextResponse.json({
      totalUsers: usersCount || 0,
      totalProjects: projectsCount || 0,
      totalParts: partsCount || 0,
      totalHubs: hubsCount || 0,
      source: "database"
    })
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    
    // Fallback to sample data if database fails
    return NextResponse.json({
      totalUsers: 1245,
      totalProjects: 3872,
      totalParts: 1423,
      totalHubs: 187,
      source: "sample"
    })
  }
}
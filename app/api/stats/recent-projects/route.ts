// app/api/stats/recent-projects/route.ts
// Recent projects for authenticated user

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabaseAccessToken = cookieStore.get("sb-access-token")?.value
    
    if (!supabaseAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseAccessToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's recent projects
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)

    if (error) {
      throw error
    }

    return NextResponse.json({
      projects: projects || [],
      source: "database"
    })
  } catch (error) {
    console.error("Error fetching recent projects:", error)
    
    // Fallback to sample data
    return NextResponse.json({
      projects: [
        {
          id: "proj-001",
          name: "Robot Arm Bracket",
          description: "Custom bracket for robotic arm assembly",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          thumbnail: "/placeholder.svg?height=200&width=200",
          status: "active"
        },
        {
          id: "proj-002", 
          name: "Electronics Enclosure",
          description: "Protective enclosure for IoT device",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          thumbnail: "/placeholder.svg?height=200&width=200",
          status: "completed"
        },
        {
          id: "proj-003",
          name: "Drive Shaft Assembly",
          description: "Precision drive shaft with custom gearing",
          created_at: new Date(Date.now() - 259200000).toISOString(),
          thumbnail: "/placeholder.svg?height=200&width=200",
          status: "active"
        }
      ],
      source: "sample"
    })
  }
}
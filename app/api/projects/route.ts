// app/api/projects/route.ts
// Projects API endpoints

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

    // Get user's projects
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      projects: projects || [],
      source: "database"
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { name, description, workspaceData } = body

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Create new project
    const { data: project, error } = await supabase
      .from("projects")
      .insert([{
        id: `proj-${Date.now()}`,
        name,
        description: description || "",
        user_id: user.id,
        workspace_data: workspaceData || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active"
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
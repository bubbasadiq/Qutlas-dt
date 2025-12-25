// app/api/stats/testimonials/route.ts
// Testimonials endpoint

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    // Get testimonials from database
    const { data: testimonials, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json({
      testimonials: testimonials || [],
      source: "database"
    })
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    
    // Fallback to sample data
    return NextResponse.json({
      testimonials: [
        {
          id: "test-001",
          quote: "Qutlas revolutionized our prototyping process. We went from 4 weeks to 4 days for complex parts!",
          author: "Sarah Johnson",
          title: "Lead Engineer",
          company: "AeroTech Solutions",
          avatar: "/avatars/sarah.jpg"
        },
        {
          id: "test-002",
          quote: "The AI-powered design suggestions saved us countless hours of manual CAD work.",
          author: "Michael Chen",
          title: "Product Manager",
          company: "MediTech Innovations",
          avatar: "/avatars/michael.jpg"
        },
        {
          id: "test-003",
          quote: "Being able to get instant quotes and route to manufacturing hubs globally is a game changer.",
          author: "Emily Rodriguez",
          title: "Operations Director",
          company: "AutoDrive Systems",
          avatar: "/avatars/emily.jpg"
        },
        {
          id: "test-004",
          quote: "The manufacturability feedback helped us catch design issues before they became expensive problems.",
          author: "David Wilson",
          title: "CTO",
          company: "Robotics Inc.",
          avatar: "/avatars/david.jpg"
        }
      ],
      source: "sample"
    })
  }
}
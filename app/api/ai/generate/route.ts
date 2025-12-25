// app/api/ai/generate/route.ts
// API route for AI geometry generation using Deepseek

import { NextRequest, NextResponse } from 'next/server'
import { generateGeometryFromIntent as parseDeepseekIntent, generateGeometryFromIntent as deepseekGenerate } from '@/lib/deepseek-client'
import { generateMeshFromIntent, intentToWorkspaceObject, type GeometryIntent } from '@/lib/geometry-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { intent, conversationHistory } = body

    if (!intent || typeof intent !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Intent is required and must be a string' },
        { status: 400 }
      )
    }

    // Check if Deepseek API key is configured
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI geometry generation is not configured. Please set DEEPSEEK_API_KEY.' },
        { status: 503 }
      )
    }

    // Generate geometry from intent using Deepseek
    const deepseekResult = await deepseekGenerate(intent, conversationHistory)

    if (deepseekResult.error) {
      return NextResponse.json(
        { success: false, error: deepseekResult.error },
        { status: 500 }
      )
    }

    // Validate the generated intent
    if (!deepseekResult.intent || !deepseekResult.intent.type) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate valid geometry intent' },
        { status: 500 }
      )
    }

    // Generate the actual geometry mesh
    const geometryResult = generateMeshFromIntent(deepseekResult.intent)
    
    if (!geometryResult.success) {
      return NextResponse.json(
        { success: false, error: geometryResult.errors?.join(', ') || 'Failed to generate geometry' },
        { status: 500 }
      )
    }

    // Convert to workspace object format
    const workspaceObject = intentToWorkspaceObject(deepseekResult.intent, geometryResult.geometry?.id)

    return NextResponse.json({
      success: true,
      intent: deepseekResult.intent,
      geometry: {
        id: geometryResult.geometry?.id,
        type: geometryResult.geometry?.type,
        dimensions: geometryResult.geometry?.dimensions,
        features: geometryResult.geometry?.features,
        material: geometryResult.geometry?.material,
        volume: geometryResult.geometry?.volume,
        boundingBox: geometryResult.geometry?.boundingBox,
      },
      workspaceObject,
      conversationHistory: deepseekResult.conversationHistory,
      warnings: geometryResult.warnings,
    })
  } catch (error) {
    console.error('AI geometry generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Geometry Generation API',
    endpoints: {
      POST: 'Generate geometry from natural language intent',
    },
    example: {
      intent: 'Create a 100mm aluminum box with 5mm holes in each corner',
    },
  })
}

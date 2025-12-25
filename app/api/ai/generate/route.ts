// API Route for AI Geometry Generation
// Parses user intent and returns structured geometry operations

import { NextResponse } from 'next/server'
import { parseIntent } from '@/lib/geometry/intent-parser'
import { buildOperationSequence } from '@/lib/geometry/operation-sequencer'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { intent } = await req.json()

    if (!intent || typeof intent !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Intent is required and must be a string' 
        },
        { status: 400 }
      )
    }

    console.log('🤖 AI Generate API: Received intent:', intent)

    // Parse natural language intent into structured geometry
    const parseResult = await parseIntent(intent)
    
    console.log('🤖 AI Generate API: Parsed intent successfully')

    // Build operation sequence from parsed intent
    const operations = buildOperationSequence(parseResult.intent)
    
    console.log('🤖 AI Generate API: Built operation sequence:', operations.length, 'operations')

    return NextResponse.json({
      success: true,
      intent: parseResult.intent,
      operations,
      processingTime: parseResult.processingTime,
    })
  } catch (error) {
    console.error('AI generation error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate geometry',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

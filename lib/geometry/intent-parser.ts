// AI Geometry Intent Parser - Converts natural language to structured geometry specs

import { GEOMETRY_INTENT_SYSTEM_PROMPT } from '@/lib/prompts/geometry-intent-parser'
import type { GeometryIntent } from './operation-sequencer'
import { parseIntentWithDeepseek, refineIntentWithDeepseek } from './deepseek-provider'

export interface ParseIntentResult {
  intent: GeometryIntent
  rawResponse: string
  processingTime: number
}

/**
 * Parses natural language CAD intent into structured geometry specification
 * Uses Deepseek to understand user intent and extract parameters
 */
export async function parseIntent(userIntent: string): Promise<ParseIntentResult> {
  const startTime = Date.now()

  try {
    const fullText = await parseIntentWithDeepseek(userIntent, GEOMETRY_INTENT_SYSTEM_PROMPT)

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/) || fullText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response')
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr) as GeometryIntent

    // Validate required fields
    if (!parsed.baseGeometry || !parsed.baseGeometry.type) {
      throw new Error('Invalid intent: missing base geometry')
    }

    const processingTime = Date.now() - startTime

    return {
      intent: parsed,
      rawResponse: fullText,
      processingTime,
    }
  } catch (error) {
    throw new Error(`Intent parsing failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Refines an existing geometry based on user feedback
 */
export async function refineIntent(
  originalIntent: GeometryIntent,
  userFeedback: string
): Promise<ParseIntentResult> {
  const startTime = Date.now()

  const refinementPrompt = `
Original geometry:
${JSON.stringify(originalIntent, null, 2)}

User wants to change:
${userFeedback}

Output the UPDATED geometry JSON with the requested modifications.
`

  try {
    const fullText = await refineIntentWithDeepseek(refinementPrompt, GEOMETRY_INTENT_SYSTEM_PROMPT)

    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/) || fullText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from refinement response')
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr) as GeometryIntent

    const processingTime = Date.now() - startTime

    return {
      intent: parsed,
      rawResponse: fullText,
      processingTime,
    }
  } catch (error) {
    throw new Error(`Intent refinement failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Validates that an intent can be executed
 */
export function validateIntent(intent: GeometryIntent): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check base geometry
  if (!intent.baseGeometry) {
    errors.push('Missing base geometry')
  } else {
    if (!intent.baseGeometry.type) {
      errors.push('Base geometry missing type')
    }
    if (!intent.baseGeometry.parameters) {
      errors.push('Base geometry missing parameters')
    }
  }

  // Check features
  if (intent.features) {
    intent.features.forEach((feature, idx) => {
      if (!feature.type) {
        errors.push(`Feature ${idx} missing type`)
      }
      if (!feature.parameters) {
        errors.push(`Feature ${idx} missing parameters`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

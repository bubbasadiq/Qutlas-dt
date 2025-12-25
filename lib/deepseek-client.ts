// lib/deepseek-client.ts
// Deepseek API client for AI-powered geometry generation

import type { GeometryIntent, GeometryFeature } from './geometry-generator'

export interface DeepseekConfig {
  apiKey: string
  baseUrl?: string
  model?: string
  timeout?: number
}

export interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepseekResponse {
  intent: GeometryIntent
  conversationHistory?: DeepseekMessage[]
  error?: string
}

const DEFAULT_CONFIG: DeepseekConfig = {
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  timeout: 30000,
}

const GEOMETRY_SYSTEM_PROMPT = `You are a CAD geometry assistant. Your task is to parse natural language design intent and convert it into structured geometry specifications.

You must respond with a valid JSON object containing the geometry specification. The JSON must follow this exact structure:

{
  "intent": {
    "type": "box" | "cylinder" | "sphere" | "cone" | "torus" | "extrusion" | "custom",
    "description": "Brief description of the part",
    "dimensions": {
      "width": number,      // X dimension in mm (for box)
      "height": number,     // Y dimension in mm (for box)
      "depth": number,      // Z dimension in mm (for box)
      "length": number,     // Alias for width (primary dimension)
      "radius": number,     // Radius in mm (for cylinder, sphere, cone, torus)
      "diameter": number,   // Diameter in mm (alternative to radius)
      "majorRadius": number, // Outer radius for torus
      "minorRadius": number, // Tube radius for torus
      "tube": number,       // Alias for minorRadius
      "height": number      // Height/length in mm
    },
    "material": "aluminum" | "steel" | "stainless-steel" | "brass" | "titanium" | "plastic" | "abs" | "nylon" | "resin" | "other",
    "tolerance": "standard" | "precision" | "high-precision",
    "features": [
      {
        "type": "hole" | "fillet" | "chamfer" | "slot" | "pocket" | "boss" | "thread" | "cutout",
        "parameters": {
          "diameter": number,      // For holes, slots
          "radius": number,        // For fillets
          "width": number,         // For slots, pockets
          "depth": number,         // For holes, pockets, cutouts
          "position": { "x": number, "y": number, "z": number },
          "count": number,         // Number of holes or features
          "pattern": "linear" | "circular" | "grid",
          "spacing": number,       // Pattern spacing
          "direction": "through" | "blind" | "counterbore" | "countersink"
        }
      }
    ],
    "quantity": number,     // Number of parts to manufacture
    "process": "cnc-milling" | "cnc-turning" | "laser-cutting" | "3d-printing" | "sheet-metal"
  }
}

Rules for dimension parsing:
- All dimensions must be in millimeters (mm)
- If user provides inches, convert to mm (1 inch = 25.4mm)
- Default dimensions: 50mm for unspecified sizes
- Minimum feature sizes: 3mm for holes, 0.8mm wall thickness

Material mapping:
- "aluminum" or "alu" → "aluminum-6061"
- "steel" or "mild steel" → "steel-4140"
- "stainless" or "ss" → "stainless-steel-304"
- "brass" → "brass-360"
- "titanium" or "ti" → "titanium-ti6al4v"
- "abs" → "abs"
- "plastic" → "abs"
- "resin" → "resin"
- "pla" → "pla"

Process inference:
- Complex 3D parts with holes/features → "cnc-milling"
- Cylindrical parts (shafts, pins) → "cnc-turning"
- Flat parts from sheet → "laser-cutting"
- Complex organic shapes → "3d-printing"
- Sheet metal parts with bends → "sheet-metal"

Example inputs and outputs:
- "Create a 100mm cube" → type: "box", dimensions: {width: 100, height: 100, depth: 100}
- "Make a cylinder 50mm diameter, 100mm long" → type: "cylinder", dimensions: {diameter: 50, height: 100}
- "100x50x25mm aluminum bracket with 8mm holes" → type: "box", dimensions: {width: 100, height: 50, depth: 25}, material: "aluminum", features: [{type: "hole", diameter: 8, count: 2}]
- "Sphere 25mm radius" → type: "sphere", dimensions: {radius: 25}
- "Bearing: 40mm OD, 20mm ID, 15mm height" → type: "cylinder", dimensions: {outerDiameter: 40, innerDiameter: 20, height: 15}

If you cannot parse the intent, respond with an error object:
{"error": "Unable to parse design intent", "message": "Specific reason why parsing failed"}`

export class DeepseekClient {
  private config: DeepseekConfig

  constructor(config?: Partial<DeepseekConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  private async makeRequest(messages: DeepseekMessage[], maxTokens?: number): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: maxTokens ?? 2048,
          temperature: 0.1,
          stream: false,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Deepseek API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Deepseek API request timed out')
      }
      throw error
    }
  }

  private parseJsonResponse(content: string): any {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        // Continue to try other methods
      }
    }

    // Try parsing the whole content as JSON
    try {
      return JSON.parse(content)
    } catch {
      // Return error if parsing fails
      return { error: 'Invalid JSON response', raw: content }
    }
  }

  async generateGeometry(
    userIntent: string,
    conversationHistory?: DeepseekMessage[]
  ): Promise<DeepseekResponse> {
    const messages: DeepseekMessage[] = [
      { role: 'system', content: GEOMETRY_SYSTEM_PROMPT },
    ]

    // Add conversation history for context
    if (conversationHistory && conversationHistory.length > 0) {
      // Include last 5 messages for context
      const recentHistory = conversationHistory.slice(-5)
      messages.push(...recentHistory)
    }

    // Add current user intent
    messages.push({ role: 'user', content: userIntent })

    try {
      const responseContent = await this.makeRequest(messages)
      const parsedResponse = this.parseJsonResponse(responseContent)

      if (parsedResponse.error) {
        return {
          intent: this.createDefaultIntent(userIntent),
          error: parsedResponse.error,
        }
      }

      // Validate and normalize the intent
      const validatedIntent = this.validateAndNormalizeIntent(parsedResponse)

      return {
        intent: validatedIntent,
        conversationHistory: [
          ...(messages.slice(1) as DeepseekMessage[]),
          { role: 'assistant', content: JSON.stringify(validatedIntent) },
        ],
      }
    } catch (error) {
      return {
        intent: this.createDefaultIntent(userIntent),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async refineGeometry(
    currentIntent: GeometryIntent,
    refinementRequest: string,
    conversationHistory: DeepseekMessage[]
  ): Promise<DeepseekResponse> {
    const messages: DeepseekMessage[] = [
      { role: 'system', content: GEOMETRY_SYSTEM_PROMPT },
    ]

    // Add the original intent as context
    messages.push({
      role: 'system',
      content: `Current geometry specification:\n${JSON.stringify(currentIntent, null, 2)}`,
    })

    // Add conversation history
    messages.push(...conversationHistory.slice(-5) as DeepseekMessage[])

    // Add refinement request
    messages.push({ role: 'user', content: refinementRequest })

    try {
      const responseContent = await this.makeRequest(messages)
      const parsedResponse = this.parseJsonResponse(responseContent)

      if (parsedResponse.error) {
        return {
          intent: { ...currentIntent, ...parsedResponse },
          error: parsedResponse.error,
        }
      }

      const validatedIntent = this.validateAndNormalizeIntent(parsedResponse)

      return {
        intent: validatedIntent,
        conversationHistory: [
          ...(messages.slice(1) as DeepseekMessage[]),
          { role: 'assistant', content: JSON.stringify(validatedIntent) },
        ],
      }
    } catch (error) {
      return {
        intent: currentIntent,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private validateAndNormalizeIntent(data: any): GeometryIntent {
    // Basic validation and normalization
    const intent: GeometryIntent = {
      type: this.normalizeType(data.type || 'box'),
      description: data.description || 'AI-generated geometry',
      dimensions: this.normalizeDimensions(data.dimensions || {}),
      material: this.normalizeMaterial(data.material || 'aluminum'),
      tolerance: data.tolerance || 'standard',
      features: this.normalizeFeatures(data.features || []),
      quantity: Math.max(1, parseInt(data.quantity) || 1),
      process: this.normalizeProcess(data.process || 'cnc-milling'),
    }

    return intent
  }

  private normalizeType(type: string): GeometryIntent['type'] {
    const normalized = type.toLowerCase().trim()
    const typeMap: Record<string, GeometryIntent['type']> = {
      'box': 'box',
      'cube': 'box',
      'rectangle': 'box',
      'cylinder': 'cylinder',
      'shaft': 'cylinder',
      'pin': 'cylinder',
      'sphere': 'sphere',
      'ball': 'sphere',
      'cone': 'cone',
      'pyramid': 'cone',
      'torus': 'torus',
      'ring': 'torus',
      'donut': 'torus',
      'extrusion': 'extrusion',
      'profile': 'extrusion',
    }
    return typeMap[normalized] || 'box'
  }

  private normalizeDimensions(dims: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {}

    // Handle width/length
    if (dims.width) normalized.width = dims.width
    else if (dims.length) normalized.width = dims.length

    // Handle depth (alias for width or secondary dimension)
    if (dims.depth) normalized.depth = dims.depth
    else if (dims.y) normalized.depth = dims.y

    // Handle height
    if (dims.height) normalized.height = dims.height
    else if (dims.z) normalized.height = dims.z
    else normalized.height = 50 // Default

    // Handle radius/diameter
    if (dims.radius) normalized.radius = dims.radius
    else if (dims.diameter) normalized.radius = dims.diameter / 2
    else if (dims.outerDiameter) normalized.outerDiameter = dims.outerDiameter

    // Handle inner diameter (for tubes)
    if (dims.innerDiameter) normalized.innerDiameter = dims.innerDiameter
    else if (dims.id) normalized.innerDiameter = dims.id

    // Handle torus dimensions
    if (dims.majorRadius) normalized.majorRadius = dims.majorRadius
    if (dims.minorRadius) normalized.minorRadius = dims.minorRadius
    else if (dims.tube) normalized.tube = dims.tube

    return normalized
  }

  private normalizeMaterial(material: string): string {
    const normalized = material.toLowerCase().trim()
    const materialMap: Record<string, string> = {
      'aluminum': 'aluminum-6061',
      'alu': 'aluminum-6061',
      'aluminium': 'aluminum-6061',
      'steel': 'steel-4140',
      'carbon steel': 'steel-4140',
      'stainless': 'stainless-steel-304',
      'stainless steel': 'stainless-steel-304',
      'ss': 'stainless-steel-304',
      'brass': 'brass-360',
      'copper': 'copper-101',
      'titanium': 'titanium-ti6al4v',
      'ti': 'titanium-ti6al4v',
      'plastic': 'abs',
      'abs': 'abs',
      'nylon': 'nylon-6',
      'resin': 'resin',
      'pla': 'pla',
    }
    return materialMap[normalized] || 'aluminum-6061'
  }

  private normalizeProcess(process: string): GeometryIntent['process'] {
    const normalized = process.toLowerCase().trim()
    const processMap: Record<string, GeometryIntent['process']> = {
      'cnc': 'cnc-milling',
      'cnc milling': 'cnc-milling',
      'milling': 'cnc-milling',
      'machining': 'cnc-milling',
      'turning': 'cnc-turning',
      'cnc turning': 'cnc-turning',
      'laser': 'laser-cutting',
      'laser cutting': 'laser-cutting',
      '3d print': '3d-printing',
      '3d printing': '3d-printing',
      'additive': '3d-printing',
      'printing': '3d-printing',
      'sheet': 'sheet-metal',
      'sheet metal': 'sheet-metal',
      'bend': 'sheet-metal',
    }
    return processMap[normalized] || 'cnc-milling'
  }

  private normalizeFeatures(features: any[]): GeometryFeature[] {
    return features.map((feature) => ({
      type: feature.type || 'hole',
      parameters: feature.parameters || {},
    }))
  }

  private createDefaultIntent(userInput: string): GeometryIntent {
    return {
      type: 'box',
      description: userInput,
      dimensions: { width: 50, height: 50, depth: 50 },
      material: 'aluminum-6061',
      tolerance: 'standard',
      features: [],
      quantity: 1,
      process: 'cnc-milling',
    }
  }
}

// Export singleton instance with API key from environment
let clientInstance: DeepseekClient | null = null

export function getDeepseekClient(): DeepseekClient {
  if (!clientInstance) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set')
    }
    clientInstance = new DeepseekClient({ apiKey })
  }
  return clientInstance
}

export async function generateGeometryFromIntent(
  userIntent: string,
  conversationHistory?: DeepseekMessage[]
): Promise<DeepseekResponse> {
  const client = getDeepseekClient()
  return client.generateGeometry(userIntent, conversationHistory)
}

export async function refineGeometryWithIntent(
  currentIntent: GeometryIntent,
  refinementRequest: string,
  conversationHistory: DeepseekMessage[]
): Promise<DeepseekResponse> {
  const client = getDeepseekClient()
  return client.refineGeometry(currentIntent, refinementRequest, conversationHistory)
}

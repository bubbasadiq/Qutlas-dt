import { streamText, tool } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { GEOMETRY_INTENT_SYSTEM_PROMPT } from "@/lib/prompts/geometry-intent-parser"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const maxDuration = 30

// Tool for generating geometry based on user intent
const generateGeometryTool = tool({
  description:
    "Generate 3D geometry based on user description or sketch analysis. Returns geometry parameters that can be used to create the model.",
  parameters: z.object({
    description: z.string().describe("The user's description of what they want to create"),
    geometryType: z
      .enum(["box", "cylinder", "sphere", "extrusion", "revolution", "compound"])
      .describe("The base geometry type"),
    dimensions: z
      .object({
        width: z.number().optional().describe("Width in mm"),
        height: z.number().optional().describe("Height in mm"),
        depth: z.number().optional().describe("Depth in mm"),
        radius: z.number().optional().describe("Radius in mm"),
        diameter: z.number().optional().describe("Diameter in mm"),
      })
      .describe("Geometry dimensions"),
    features: z
      .array(
        z.object({
          type: z.enum(["hole", "fillet", "chamfer", "pocket", "boss", "rib"]),
          parameters: z.record(z.any()),
        }),
      )
      .optional()
      .describe("Additional features to add"),
    material: z.string().optional().describe("Suggested material"),
  }),
  execute: async ({ description, geometryType, dimensions, features, material }) => {
    // This would connect to the geometry kernel in production
    // For now, return the structured geometry data
    return {
      success: true,
      geometry: {
        id: `geo_${Date.now()}`,
        type: geometryType,
        dimensions,
        features: features || [],
        material: material || "aluminum",
        description,
        createdAt: new Date().toISOString(),
      },
      message: `Created ${geometryType} geometry with the specified parameters.`,
    }
  },
})

// Tool for modifying existing geometry
const modifyGeometryTool = tool({
  description: "Modify existing geometry with operations like adding holes, fillets, chamfers, etc.",
  parameters: z.object({
    operation: z.enum(["add_hole", "add_fillet", "add_chamfer", "extrude", "cut", "mirror", "pattern"]),
    parameters: z.record(z.any()).describe("Operation-specific parameters"),
    targetFace: z.string().optional().describe("The face or edge to apply the operation to"),
  }),
  execute: async ({ operation, parameters, targetFace }) => {
    return {
      success: true,
      operation,
      parameters,
      targetFace,
      message: `Applied ${operation} operation successfully.`,
    }
  },
})

// Tool for analyzing manufacturability
const analyzeManufacturabilityTool = tool({
  description: "Analyze the current geometry for manufacturability and provide DFM feedback.",
  parameters: z.object({
    analysisType: z.enum(["dfm", "tolerance", "material", "cost"]),
  }),
  execute: async ({ analysisType }) => {
    return {
      success: true,
      analysisType,
      score: 85,
      issues: [
        { severity: "warning", message: "Consider adding draft angles for easier mold release" },
        { severity: "info", message: "Wall thickness is optimal for CNC machining" },
      ],
      suggestions: ["Add 1-degree draft to vertical walls", "Consider aluminum 6061-T6 for best machinability"],
    }
  },
})

const analyzeSketchTool = tool({
  description:
    "Analyze an uploaded sketch or image to understand the intended geometry and convert it to CAD parameters.",
  parameters: z.object({
    analysisComplete: z.boolean().describe("Whether the sketch analysis is complete"),
    detectedShapes: z.array(z.string()).describe("Shapes detected in the sketch"),
    suggestedDimensions: z
      .object({
        width: z.number().optional(),
        height: z.number().optional(),
        depth: z.number().optional(),
      })
      .describe("Estimated dimensions based on sketch proportions"),
    confidence: z.number().min(0).max(100).describe("Confidence level of the analysis"),
  }),
  execute: async ({ analysisComplete, detectedShapes, suggestedDimensions, confidence }) => {
    return {
      success: true,
      analysisComplete,
      detectedShapes,
      suggestedDimensions,
      confidence,
      message: `Analyzed sketch with ${confidence}% confidence. Detected: ${detectedShapes.join(", ")}`,
    }
  },
})

const tools = {
  generateGeometry: generateGeometryTool,
  modifyGeometry: modifyGeometryTool,
  analyzeManufacturability: analyzeManufacturabilityTool,
  analyzeSketch: analyzeSketchTool,
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const systemPrompt = `You are Qutlas AI, an expert CAD/CAM assistant that helps users create and modify 3D geometry for manufacturing.

Your capabilities:
1. Generate 3D geometry from natural language descriptions
2. Analyze sketches and images to understand intended geometry
3. Modify existing geometry with operations like holes, fillets, chamfers
4. Analyze designs for manufacturability (DFM)
5. Suggest materials and manufacturing processes

When a user attaches a sketch or image:
1. Carefully analyze the image to understand the intended shape
2. Use the analyzeSketch tool to document what you see
3. Then use generateGeometry to create the corresponding 3D model
4. Explain your interpretation and ask for confirmation if uncertain

When a user describes a part they want to create:
1. Understand their intent and requirements
2. Use the generateGeometry tool with appropriate parameters
3. Explain what you created and any design decisions

When modifying geometry:
1. Clarify the operation if needed
2. Use the modifyGeometry tool with precise parameters
3. Confirm the changes made

Always be helpful, precise with dimensions (default to mm), and consider manufacturability.
If you see an image, describe what you see and how you'll interpret it for CAD creation.`

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    tools,
    maxTokens: 2000,
  })

  return result.toDataStreamResponse()
}

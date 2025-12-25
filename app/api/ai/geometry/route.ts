import { tool } from "ai"
import { z } from "zod"
import { GEOMETRY_INTENT_SYSTEM_PROMPT } from "@/lib/prompts/geometry-intent-parser"
import { callDeepseek } from "@/lib/geometry/deepseek-provider"

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
    try {
      // Note: Worker operations would be executed client-side
      // This API primarily provides the structured intent for the client
      // The actual geometry generation happens in the browser via the Cadmium Worker
      
      const geometrySpec = {
        id: `geo_${Date.now()}`,
        type: geometryType,
        dimensions,
        features: features || [],
        material: material || "aluminum",
        description,
        createdAt: new Date().toISOString(),
      };
      
      // Validate dimensions based on geometry type
      if (geometryType === 'box') {
        if (!dimensions.width || !dimensions.height || !dimensions.depth) {
          throw new Error('Box requires width, height, and depth');
        }
        if (dimensions.width <= 0 || dimensions.height <= 0 || dimensions.depth <= 0) {
          throw new Error('Box dimensions must be positive');
        }
      } else if (geometryType === 'cylinder') {
        if (!dimensions.radius || !dimensions.height) {
          throw new Error('Cylinder requires radius and height');
        }
        if (dimensions.radius <= 0 || dimensions.height <= 0) {
          throw new Error('Cylinder dimensions must be positive');
        }
      } else if (geometryType === 'sphere') {
        if (!dimensions.radius) {
          throw new Error('Sphere requires radius');
        }
        if (dimensions.radius <= 0) {
          throw new Error('Sphere radius must be positive');
        }
      }
      
      return {
        success: true,
        geometry: geometrySpec,
        message: `Created ${geometryType} specification. Client will generate the 3D mesh using Cadmium Worker.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create geometry specification',
      };
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
    try {
      // Validate operation parameters
      if (operation === 'add_hole') {
        if (!parameters.diameter || !parameters.depth) {
          throw new Error('Hole operation requires diameter and depth');
        }
        if (parameters.diameter <= 0 || parameters.depth <= 0) {
          throw new Error('Hole dimensions must be positive');
        }
      } else if (operation === 'add_fillet') {
        if (!parameters.radius) {
          throw new Error('Fillet operation requires radius');
        }
        if (parameters.radius <= 0) {
          throw new Error('Fillet radius must be positive');
        }
      } else if (operation === 'add_chamfer') {
        if (!parameters.distance) {
          throw new Error('Chamfer operation requires distance');
        }
        if (parameters.distance <= 0) {
          throw new Error('Chamfer distance must be positive');
        }
      }
      
      return {
        success: true,
        operation,
        parameters,
        targetFace,
        message: `Validated ${operation} operation. Client will execute via Cadmium Worker.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to validate ${operation} operation`,
      };
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
    // Implement basic DFM analysis logic
    const issues: Array<{ severity: string; message: string }> = [];
    const suggestions: string[] = [];
    let score = 100;
    
    if (analysisType === 'dfm') {
      // Design for Manufacturing analysis
      issues.push({
        severity: "info",
        message: "Design appears manufacturable with standard CNC processes"
      });
      
      // Check for common DFM issues (would be based on actual geometry in production)
      suggestions.push("Verify wall thickness is ≥ 1mm for structural integrity");
      suggestions.push("Ensure holes are ≥ 2mm diameter for standard drill bits");
      suggestions.push("Consider adding draft angles (1-3°) for molded parts");
      
      score = 85;
    } else if (analysisType === 'tolerance') {
      issues.push({
        severity: "info",
        message: "Standard tolerances (±0.1mm) assumed"
      });
      
      suggestions.push("Specify tighter tolerances (±0.05mm) for critical dimensions");
      suggestions.push("Looser tolerances (±0.2mm) acceptable for non-critical features");
      
      score = 90;
    } else if (analysisType === 'material') {
      suggestions.push("Aluminum 6061-T6: Excellent machinability, good strength");
      suggestions.push("Stainless Steel 304: Higher corrosion resistance, harder to machine");
      suggestions.push("ABS Plastic: Ideal for 3D printing, lower strength");
      
      score = 95;
    } else if (analysisType === 'cost') {
      issues.push({
        severity: "info",
        message: "Cost estimate requires material and quantity selection"
      });
      
      suggestions.push("Larger batch sizes (100+) reduce per-unit costs");
      suggestions.push("Simpler geometries reduce machining time and cost");
      
      score = 80;
    }
    
    return {
      success: true,
      analysisType,
      score,
      issues,
      suggestions,
    };
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
If you see an image, describe what you see and how you'll interpret it for CAD creation.

Respond in plain text. Tool usage has been disabled in this configuration.`

  try {
    // Format messages for Deepseek API
    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
    ]

    const response = await callDeepseek(formattedMessages)

    // Return as plain JSON response
    return new Response(JSON.stringify({ message: response }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process request',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

// Core intent structures - these are what the kernel receives

export type Intent = PrimitiveIntent | OperationIntent

export interface PrimitiveIntent {
  id: string  // Content-addressed ID
  type: 'box' | 'cylinder' | 'sphere' | 'extrusion' | 'cone' | 'torus'
  parameters: Record<string, number>  // width, height, depth, radius, etc.
  transform?: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
  timestamp: number
}

export interface OperationIntent {
  id: string
  type: 'union' | 'subtract' | 'intersect' | 'fillet' | 'hole' | 'chamfer'
  target: string  // ID of target primitive/operation
  operand?: string  // ID of tool (for boolean)
  parameters: Record<string, any>  // radius, edges, etc.
  timestamp: number
}

export interface GeometryIR {
  part: string
  operations: Intent[]
  constraints: ManufacturingConstraint[]
  hash: string  // Content hash of all operations
}

export interface ManufacturingConstraint {
  type: 'min_wall_thickness' | 'tool_diameter' | 'max_overhang' | 'process' | 'material'
  value: any
}

// Hash generation - deterministic
export function hashGeometryIR(ir: Omit<GeometryIR, 'hash'>): string {
  // Simple hash implementation - in production, use blake3
  const serialized = JSON.stringify({
    part: ir.part,
    operations: ir.operations.map(op => ({
      ...op,
      // Sort parameters for deterministic hash
      parameters: Object.keys(op.parameters || {}).sort().reduce((acc, key) => {
        acc[key] = op.parameters[key]
        return acc
      }, {} as Record<string, any>)
    })),
    constraints: ir.constraints
  })
  
  // Simple hash for now - would use blake3 in production
  let hash = 0
  for (let i = 0; i < serialized.length; i++) {
    const char = serialized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return `intent_${Math.abs(hash).toString(36)}_${serialized.length}`
}

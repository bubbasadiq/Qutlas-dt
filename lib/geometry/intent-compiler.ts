import type { WorkspaceObject } from '@/hooks/use-workspace'
import { PrimitiveIntent, OperationIntent, GeometryIR, hashGeometryIR, Intent } from './intent-ast'

export class IntentCompiler {
  /**
   * Convert workspace objects to canonical Intent IR
   * This is the ONLY input to the kernel
   */
  compileWorkspace(objects: Record<string, WorkspaceObject>): GeometryIR {
    const operations: Intent[] = []
    
    // Sort objects by creation order (deterministic)
    const sortedIds = Object.keys(objects).sort()
    
    for (const id of sortedIds) {
      const obj = objects[id]
      operations.push(this.objectToIntent(id, obj))
    }
    
    const ir: Omit<GeometryIR, 'hash'> = {
      part: 'workspace_part',
      operations,
      constraints: [
        { type: 'process', value: 'cnc_mill' },
        { type: 'min_wall_thickness', value: 1.0 }
      ]
    }
    
    const hash = hashGeometryIR(ir)
    
    return {
      ...ir,
      hash
    }
  }
  
  /**
   * Convert single workspace object to Intent
   */
  private objectToIntent(id: string, obj: WorkspaceObject): PrimitiveIntent {
    // Map workspace object type to intent type
    let intentType: PrimitiveIntent['type']
    
    switch (obj.type) {
      case 'box':
      case 'cylinder':
      case 'sphere':
      case 'cone':
      case 'torus':
      case 'extrusion':
        intentType = obj.type
        break
      default:
        // For compound or unknown types, treat as box for now
        intentType = 'box'
    }
    
    // Convert dimensions to Record<string, number>
    const parameters: Record<string, number> = {}
    if (obj.dimensions) {
      for (const [key, value] of Object.entries(obj.dimensions)) {
        if (typeof value === 'number') {
          parameters[key] = value
        }
      }
    }
    
    return {
      id,
      type: intentType,
      parameters,
      timestamp: Date.now()
    }
  }
  
  /**
   * Convert boolean operation to Intent
   */
  compileBooleanOp(
    operation: 'union' | 'subtract' | 'intersect',
    targetId: string,
    toolId: string,
    timestamp?: number
  ): OperationIntent {
    return {
      id: `${operation}_${targetId}_${toolId}_${Date.now()}`,
      type: operation,
      target: targetId,
      operand: toolId,
      parameters: {},
      timestamp: timestamp || Date.now()
    }
  }
  
  /**
   * Convert feature operation to Intent
   */
  compileFeatureOp(
    operation: 'fillet' | 'hole' | 'chamfer',
    targetId: string,
    parameters: Record<string, any>,
    timestamp?: number
  ): OperationIntent {
    return {
      id: `${operation}_${targetId}_${Date.now()}`,
      type: operation,
      target: targetId,
      parameters,
      timestamp: timestamp || Date.now()
    }
  }
}

// Geometry System Types

export interface MeshData {
  vertices: Float32Array | number[]
  indices: Uint32Array | number[]
  normals: Float32Array | number[]
}

export interface GeometryObject {
  type: string
  geometryId?: string
  dimensions: Record<string, number>
  features?: GeometryFeature[]
  material?: string
  description?: string
  meshData?: MeshData
  color?: string
  visible?: boolean
  selected?: boolean
  [key: string]: any
}

export interface GeometryFeature {
  type: string
  name: string
  parameters: Record<string, any>
  description?: string
}

export interface GeometryIntent {
  intent: string
  baseGeometry: {
    type: string
    parameters: Record<string, any>
    position?: { x: number; y: number; z: number }
  }
  features?: GeometryFeature[]
  material?: string
  units?: string
  manufacturability?: {
    processes: string[]
    complexity: string
    warnings?: string[]
    constraints?: string[]
  }
  clarifications?: string[]
  confidence?: number
}

export interface GeometryOperation {
  id: string
  type: 'CREATE' | 'MODIFY' | 'FEATURE' | 'BOOLEAN' | 'ANALYZE' | 'EXPORT'
  operation: string
  parameters: any
  dependsOn: string[]
  streaming: boolean
  description: string
  estimatedTime?: number
}

export interface ExecutionProgress {
  current: number
  total: number
  operation: GeometryOperation
  status: 'pending' | 'running' | 'complete' | 'error'
  result?: any
  error?: string
}

export interface BoundingBox {
  min_x: number
  min_y: number
  min_z: number
  max_x: number
  max_y: number
  max_z: number
}

export interface DFMReport {
  score: number
  warnings: string[]
  recommendations: string[]
  estimatedCost?: number
  manufacturingTime?: number
}

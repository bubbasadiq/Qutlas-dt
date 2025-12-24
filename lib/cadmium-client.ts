// Cadmium Client - Direct WASM interface (non-worker)
// For lightweight operations that don't need background threading

export interface MeshData {
  vertices: number[]
  indices: number[]
  normals?: number[]
}

export interface BoundingBox {
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export class Geometry {
  constructor(public readonly id: string, public readonly meshData: MeshData) {}
  
  isNull(): boolean {
    return !this.meshData || this.meshData.vertices.length === 0
  }
}

// Cadmium WASM Module interface
let cadmiumModule: any = null
let isInitialized = false

export class CadmiumClient {
  private static instance: CadmiumClient
  
  private constructor() {}
  
  static getInstance(): CadmiumClient {
    if (!CadmiumClient.instance) {
      CadmiumClient.instance = new CadmiumClient()
    }
    return CadmiumClient.instance
  }
  
  async initialize(): Promise<void> {
    if (isInitialized) return
    
    try {
      // Dynamic import of Cadmium WASM module
      const module = await import('../wasm/cadmium-core/pkg/cadmium_core')
      await module.default()
      cadmiumModule = module
      isInitialized = true
      
      console.log('✅ Cadmium WASM module initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Cadmium WASM:', error)
      // Fallback: continue without WASM (will use THREE.js primitives)
      console.warn('⚠️ Continuing without Cadmium WASM - using fallback geometry')
    }
  }
  
  private ensureInitialized() {
    if (!isInitialized || !cadmiumModule) {
      throw new Error('CadmiumClient not initialized. Call initialize() first.')
    }
  }
  
  // Basic Shape Creation
  createBox(width: number, height: number, depth: number): Geometry {
    this.ensureInitialized()
    
    const mesh = cadmiumModule.create_box(width, height, depth)
    const meshData = this.extractMeshData(mesh)
    const id = this.generateId()
    
    return new Geometry(id, meshData)
  }
  
  createCylinder(radius: number, height: number): Geometry {
    this.ensureInitialized()
    
    const mesh = cadmiumModule.create_cylinder(radius, height, 32)
    const meshData = this.extractMeshData(mesh)
    const id = this.generateId()
    
    return new Geometry(id, meshData)
  }
  
  createSphere(radius: number): Geometry {
    this.ensureInitialized()
    
    const mesh = cadmiumModule.create_sphere(radius, 32, 32)
    const meshData = this.extractMeshData(mesh)
    const id = this.generateId()
    
    return new Geometry(id, meshData)
  }
  
  createCone(radius: number, height: number): Geometry {
    this.ensureInitialized()
    
    const mesh = cadmiumModule.create_cone(radius, height, 32)
    const meshData = this.extractMeshData(mesh)
    const id = this.generateId()
    
    return new Geometry(id, meshData)
  }
  
  createTorus(majorRadius: number, minorRadius: number): Geometry {
    this.ensureInitialized()
    
    const mesh = cadmiumModule.create_torus(majorRadius, minorRadius, 32, 16)
    const meshData = this.extractMeshData(mesh)
    const id = this.generateId()
    
    return new Geometry(id, meshData)
  }
  
  // Boolean Operations (simplified for MVP)
  unionShapes(shape1: Geometry, shape2: Geometry): Geometry {
    this.ensureInitialized()
    
    // For MVP: just merge meshes
    const combinedVertices = [...shape1.meshData.vertices, ...shape2.meshData.vertices]
    const offset = shape1.meshData.vertices.length / 3
    const offsetIndices = shape2.meshData.indices.map(idx => idx + offset)
    const combinedIndices = [...shape1.meshData.indices, ...offsetIndices]
    const combinedNormals = [
      ...(shape1.meshData.normals || []),
      ...(shape2.meshData.normals || [])
    ]
    
    return new Geometry(this.generateId(), {
      vertices: combinedVertices,
      indices: combinedIndices,
      normals: combinedNormals
    })
  }
  
  cutShapes(shape1: Geometry, shape2: Geometry): Geometry {
    this.ensureInitialized()
    
    // For MVP: return first shape (CSG subtraction is complex)
    return new Geometry(this.generateId(), { ...shape1.meshData })
  }
  
  intersectShapes(shape1: Geometry, shape2: Geometry): Geometry {
    this.ensureInitialized()
    
    // For MVP: return first shape
    return new Geometry(this.generateId(), { ...shape1.meshData })
  }
  
  // Feature Operations
  addHole(geometry: Geometry, position: Vector3, diameter: number, depth: number): Geometry {
    this.ensureInitialized()
    
    // For MVP: return original geometry
    return new Geometry(this.generateId(), { ...geometry.meshData })
  }
  
  addFillet(geometry: Geometry, edgeIndex: number, radius: number): Geometry {
    this.ensureInitialized()
    
    // For MVP: return original geometry
    return new Geometry(this.generateId(), { ...geometry.meshData })
  }
  
  addChamfer(geometry: Geometry, edgeIndex: number, distance: number): Geometry {
    this.ensureInitialized()
    
    // For MVP: return original geometry
    return new Geometry(this.generateId(), { ...geometry.meshData })
  }
  
  // Mesh Data Extraction
  getMeshData(geometry: Geometry): MeshData {
    return geometry.meshData
  }
  
  getBoundingBox(geometry: Geometry): BoundingBox {
    const vertices = geometry.meshData.vertices
    
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    
    for (let i = 0; i < vertices.length; i += 3) {
      minX = Math.min(minX, vertices[i])
      maxX = Math.max(maxX, vertices[i])
      minY = Math.min(minY, vertices[i + 1])
      maxY = Math.max(maxY, vertices[i + 1])
      minZ = Math.min(minZ, vertices[i + 2])
      maxZ = Math.max(maxZ, vertices[i + 2])
    }
    
    return {
      x: minX,
      y: minY,
      z: minZ,
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ
    }
  }
  
  // Export Functions
  exportToSTL(geometry: Geometry, filename: string): string {
    this.ensureInitialized()
    
    const mesh = this.meshDataToWASM(geometry.meshData)
    return cadmiumModule.export_stl(mesh, filename)
  }
  
  exportToOBJ(geometry: Geometry, filename: string): string {
    this.ensureInitialized()
    
    const mesh = this.meshDataToWASM(geometry.meshData)
    return cadmiumModule.export_obj(mesh, filename)
  }
  
  // Utility methods
  private extractMeshData(wasmMesh: any): MeshData {
    return {
      vertices: Array.from(wasmMesh.vertices || []),
      indices: Array.from(wasmMesh.faces || []),
      normals: Array.from(wasmMesh.normals || [])
    }
  }
  
  private meshDataToWASM(meshData: MeshData): any {
    // Convert JS mesh data back to WASM format if needed
    return meshData
  }
  
  private generateId(): string {
    return `cad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Convenience initialization
export async function initializeCadmium(): Promise<CadmiumClient> {
  const client = CadmiumClient.getInstance()
  await client.initialize()
  return client
}

// Custom error types
export class CadmiumError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'CadmiumError'
  }
}

export class CadmiumInitializationError extends CadmiumError {
  constructor(message: string) {
    super(message, 'INITIALIZATION_FAILED')
    this.name = 'CadmiumInitializationError'
  }
}

export class CadmiumOperationError extends CadmiumError {
  constructor(message: string) {
    super(message, 'OPERATION_FAILED')
    this.name = 'CadmiumOperationError'
  }
}

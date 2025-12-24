// Type definitions for OCCT WASM module
export interface MeshData {
  vertices: number[]
  indices: number[]
  normals?: number[]
  colors?: number[]
}

export interface BoundingBox {
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
}

export interface DFMScore {
  machiningScore: number
  moldingScore: number
  printingScore: number
}

export interface DFMWarning {
  type: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

export interface DFMReport {
  warnings: DFMWarning[]
  scores: DFMScore
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export class Geometry {
  private _handle: any
  
  constructor(handle?: any) {
    this._handle = handle
  }
  
  get handle() {
    return this._handle
  }
  
  isNull(): boolean {
    return !this._handle || this._handle.isNull()
  }
}

// OCCT WASM Module interface
declare global {
  interface Window {
    OCCTModule: any
  }
}

export class OCCTClient {
  private static instance: OCCTClient
  private wasmModule: any = null
  private isInitialized: boolean = false
  
  private constructor() {}
  
  static getInstance(): OCCTClient {
    if (!OCCTClient.instance) {
      OCCTClient.instance = new OCCTClient()
    }
    return OCCTClient.instance
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      // Use the unified loader
      const { initializeOCCTModule } = await import('./occt-loader')
      this.wasmModule = await initializeOCCTModule()
      this.isInitialized = true
      
      console.log('✅ OCCT WASM module initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize OCCT WASM:', error)
      throw new OCCTInitializationError(`Failed to initialize OCCT: ${error}`)
    }
  }
  
  private ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('OCCTClient not initialized. Call initialize() first.')
    }
  }
  
  // Basic Shape Creation
  createBox(width: number, height: number, depth: number): Geometry {
    this.ensureInitialized()
    const geometry = this.wasmModule.createBox(width, height, depth)
    return new Geometry(geometry)
  }
  
  createCylinder(radius: number, height: number): Geometry {
    this.ensureInitialized()
    const geometry = this.wasmModule.createCylinder(radius, height)
    return new Geometry(geometry)
  }
  
  createSphere(radius: number): Geometry {
    this.ensureInitialized()
    const geometry = this.wasmModule.createSphere(radius)
    return new Geometry(geometry)
  }
  
  createCone(radius: number, height: number): Geometry {
    this.ensureInitialized()
    const geometry = this.wasmModule.createCone(radius, height)
    return new Geometry(geometry)
  }
  
  createTorus(majorRadius: number, minorRadius: number): Geometry {
    this.ensureInitialized()
    const geometry = this.wasmModule.createTorus(majorRadius, minorRadius)
    return new Geometry(geometry)
  }
  
  // Boolean Operations
  unionShapes(shape1: Geometry, shape2: Geometry): Geometry {
    this.ensureInitialized()
    const result = this.wasmModule.unionShapes(shape1.handle, shape2.handle)
    return new Geometry(result)
  }
  
  cutShapes(shape1: Geometry, shape2: Geometry): Geometry {
    this.ensureInitialized()
    const result = this.wasmModule.cutShapes(shape1.handle, shape2.handle)
    return new Geometry(result)
  }
  
  intersectShapes(shape1: Geometry, shape2: Geometry): Geometry {
    this.ensureInitialized()
    const result = this.wasmModule.intersectShapes(shape1.handle, shape2.handle)
    return new Geometry(result)
  }
  
  // Feature Operations
  addHole(geometry: Geometry, position: Vector3, diameter: number, depth: number): Geometry {
    this.ensureInitialized()
    const pos = { x: position.x, y: position.y, z: position.z }
    const result = this.wasmModule.addHole(geometry.handle, pos, diameter, depth)
    return new Geometry(result)
  }
  
  addFillet(geometry: Geometry, edgeIndex: number, radius: number): Geometry {
    this.ensureInitialized()
    const result = this.wasmModule.addFillet(geometry.handle, edgeIndex, radius)
    return new Geometry(result)
  }
  
  addChamfer(geometry: Geometry, edgeIndex: number, distance: number): Geometry {
    this.ensureInitialized()
    const result = this.wasmModule.addChamfer(geometry.handle, edgeIndex, distance)
    return new Geometry(result)
  }
  
  extrude(profile: Geometry, distance: number): Geometry {
    this.ensureInitialized()
    const result = this.wasmModule.extrude(profile.handle, distance)
    return new Geometry(result)
  }
  
  revolve(profile: Geometry, axis: Vector3, angle: number): Geometry {
    this.ensureInitialized()
    const axisObj = { x: axis.x, y: axis.y, z: axis.z }
    const result = this.wasmModule.revolve(profile.handle, axisObj, angle)
    return new Geometry(result)
  }
  
  // Mesh Generation
  getMeshData(geometry: Geometry): MeshData {
    this.ensureInitialized()
    const meshData = this.wasmModule.getMeshData(geometry.handle)
    
    return {
      vertices: this.valToArray(meshData.vertices),
      indices: this.valToArray(meshData.indices),
      normals: meshData.normals ? this.valToArray(meshData.normals) : []
    }
  }
  
  getBoundingBox(geometry: Geometry): BoundingBox {
    this.ensureInitialized()
    return this.wasmModule.getBoundingBox(geometry.handle)
  }
  
  analyzeManufacturability(geometry: Geometry): DFMReport {
    this.ensureInitialized()
    return this.wasmModule.analyzeManufacturability(geometry.handle)
  }
  
  // Export Functions
  exportToSTEP(geometry: Geometry, filename: string): boolean {
    this.ensureInitialized()
    return this.wasmModule.exportToSTEP(geometry.handle, filename)
  }
  
  exportToIGES(geometry: Geometry, filename: string): boolean {
    this.ensureInitialized()
    return this.wasmModule.exportToIGES(geometry.handle, filename)
  }
  
  exportToSTL(geometry: Geometry, filename: string): boolean {
    this.ensureInitialized()
    return this.wasmModule.exportToSTL(geometry.handle, filename)
  }
  
  // Utility function to convert emscripten::val to array
  private valToArray(val: any): number[] {
    const result: number[] = []
    const length = val.length || 0
    for (let i = 0; i < length; i++) {
      result.push(val.get(i))
    }
    return result
  }
}

// Convenience initialization
export async function initializeOCCT(): Promise<OCCTClient> {
  const client = OCCTClient.getInstance()
  await client.initialize()
  return client
}

// Custom error types
export class OCCTError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'OCCTError'
  }
}

export class OCCTInitializationError extends OCCTError {
  constructor(message: string) {
    super(message, 'INITIALIZATION_FAILED')
    this.name = 'OCCTInitializationError'
  }
}

export class OCCTOperationError extends OCCTError {
  constructor(message: string) {
    super(message, 'OPERATION_FAILED')
    this.name = 'OCCTOperationError'
  }
}
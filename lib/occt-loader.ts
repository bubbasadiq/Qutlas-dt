/**
 * Unified OCCT WASM Module Loader
 * Works in both browser and worker contexts
 */

export interface OCCTModuleType {
  // Geometry wrapper class
  Geometry: any
  
  // Basic shape creation
  createBox(width: number, height: number, depth: number): any
  createCylinder(radius: number, height: number): any
  createSphere(radius: number): any
  createCone(radius: number, height: number): any
  createTorus(majorRadius: number, minorRadius: number): any
  
  // Boolean operations
  unionShapes(shape1: any, shape2: any): any
  cutShapes(shape1: any, shape2: any): any
  intersectShapes(shape1: any, shape2: any): any
  
  // Feature operations
  addHole(geometry: any, position: any, diameter: number, depth: number): any
  addFillet(geometry: any, edgeIndex: number, radius: number): any
  addChamfer(geometry: any, edgeIndex: number, distance: number): any
  extrude(profile: any, distance: number): any
  revolve(profile: any, axis: any, angle: number): any
  
  // Mesh generation
  getMeshData(geometry: any): any
  getBoundingBox(geometry: any): any
  analyzeManufacturability(geometry: any): any
  
  // Export functions
  exportToSTEP(geometry: any, filename: string): boolean
  exportToIGES(geometry: any, filename: string): boolean
  exportToSTL(geometry: any, filename: string): boolean
}

let occtModuleInstance: OCCTModuleType | null = null
let initializationPromise: Promise<OCCTModuleType> | null = null

/**
 * Initialize OCCT WASM module with proper singleton pattern
 */
export async function initializeOCCTModule(): Promise<OCCTModuleType> {
  // Return existing instance if already initialized
  if (occtModuleInstance) {
    return occtModuleInstance
  }
  
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise
  }
  
  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log('🔧 Initializing OCCT WASM module...')
      
      // Determine if we're in a worker context
      const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
      
      // Load the OCCT module factory
      let OCCTModuleFactory: any
      
      if (isWorker) {
        // In worker: use importScripts or dynamic import
        try {
          OCCTModuleFactory = await import(/* webpackIgnore: true */ '/occt/occt.js')
          OCCTModuleFactory = OCCTModuleFactory.default || OCCTModuleFactory
        } catch (e) {
          console.error('Failed to load OCCT module in worker:', e)
          throw new Error('Failed to load OCCT WASM module in worker context')
        }
      } else {
        // In browser: load via script tag or dynamic import
        if (typeof window !== 'undefined') {
          // Check if already loaded
          if ((window as any).OCCTModule) {
            OCCTModuleFactory = (window as any).OCCTModule
          } else {
            // Dynamically load the script
            OCCTModuleFactory = await import(/* webpackIgnore: true */ '/occt/occt.js')
            OCCTModuleFactory = OCCTModuleFactory.default || OCCTModuleFactory
          }
        } else {
          throw new Error('Cannot load OCCT module: not in browser or worker context')
        }
      }
      
      // Initialize the module with proper locateFile callback
      const module = await OCCTModuleFactory({
        locateFile: (path: string) => {
          // Ensure WASM file is loaded from correct location
          if (path.endsWith('.wasm')) {
            return '/occt/occt.wasm'
          }
          return path
        },
        onRuntimeInitialized: () => {
          console.log('✅ OCCT WASM runtime initialized')
        }
      })
      
      occtModuleInstance = module
      console.log('✅ OCCT WASM module ready')
      
      return module
    } catch (error) {
      console.error('❌ Failed to initialize OCCT WASM module:', error)
      initializationPromise = null
      throw error
    }
  })()
  
  return initializationPromise
}

/**
 * Get the initialized OCCT module instance
 * Throws error if not initialized
 */
export function getOCCTModule(): OCCTModuleType {
  if (!occtModuleInstance) {
    throw new Error('OCCT module not initialized. Call initializeOCCTModule() first.')
  }
  return occtModuleInstance
}

/**
 * Check if OCCT module is initialized
 */
export function isOCCTInitialized(): boolean {
  return occtModuleInstance !== null
}

/**
 * Reset module instance (for testing or reinitialization)
 */
export function resetOCCTModule(): void {
  occtModuleInstance = null
  initializationPromise = null
}

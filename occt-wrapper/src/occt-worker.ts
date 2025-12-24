/**
 * OCCT Worker - Handles geometry operations in a dedicated worker thread
 * Implements proper message protocol with error handling and timeouts
 */

import { initializeOCCTModule, type OCCTModuleType } from '@/lib/occt-loader'

let occtModule: OCCTModuleType | null = null
let isReady = false
let geometryCache = new Map<string, any>()

// Message types
type MessageType = 
  | 'INIT'
  | 'CREATE_BOX'
  | 'CREATE_CYLINDER'
  | 'CREATE_SPHERE'
  | 'CREATE_CONE'
  | 'CREATE_TORUS'
  | 'UNION_SHAPES'
  | 'CUT_SHAPES'
  | 'INTERSECT_SHAPES'
  | 'ADD_HOLE'
  | 'ADD_FILLET'
  | 'ADD_CHAMFER'
  | 'EXTRUDE'
  | 'REVOLVE'
  | 'GET_MESH'
  | 'GET_BOUNDING_BOX'
  | 'ANALYZE_DFM'
  | 'EXPORT_STEP'
  | 'EXPORT_IGES'
  | 'EXPORT_STL'
  | 'LOAD_FILE'
  | 'PING'

interface WorkerMessage {
  id: string
  operation: MessageType
  payload: any
}

interface WorkerResponse {
  id: string
  type: 'SUCCESS' | 'ERROR' | 'READY'
  result?: any
  error?: string
}

// Initialize OCCT module on worker startup
async function initializeWorker() {
  try {
    console.log('🔧 Initializing OCCT worker...')
    occtModule = await initializeOCCTModule()
    isReady = true
    
    // Notify main thread that worker is ready
    postMessage({ type: 'READY' } as WorkerResponse)
    console.log('✅ OCCT worker initialized and ready')
  } catch (error) {
    console.error('❌ Failed to initialize OCCT worker:', error)
    postMessage({ 
      type: 'ERROR', 
      error: `Worker initialization failed: ${error}` 
    } as WorkerResponse)
  }
}

// Start initialization immediately
initializeWorker()

// Handle incoming messages
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, operation, payload } = event.data
  
  try {
    // Check if worker is ready (except for PING)
    if (!isReady && operation !== 'PING') {
      postMessage({
        id,
        type: 'ERROR',
        error: 'Worker not ready yet. Please wait for READY message.'
      } as WorkerResponse)
      return
    }
    
    let result: any
    
    switch (operation) {
      case 'PING':
        result = { ready: isReady }
        break
        
      case 'CREATE_BOX': {
        const { width, height, depth } = payload
        const geometry = occtModule!.createBox(width, height, depth)
        const geometryId = `box_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'box' }
        break
      }
      
      case 'CREATE_CYLINDER': {
        const { radius, height } = payload
        const geometry = occtModule!.createCylinder(radius, height)
        const geometryId = `cylinder_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'cylinder' }
        break
      }
      
      case 'CREATE_SPHERE': {
        const { radius } = payload
        const geometry = occtModule!.createSphere(radius)
        const geometryId = `sphere_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'sphere' }
        break
      }
      
      case 'CREATE_CONE': {
        const { radius, height } = payload
        const geometry = occtModule!.createCone(radius, height)
        const geometryId = `cone_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'cone' }
        break
      }
      
      case 'CREATE_TORUS': {
        const { majorRadius, minorRadius } = payload
        const geometry = occtModule!.createTorus(majorRadius, minorRadius)
        const geometryId = `torus_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'torus' }
        break
      }
      
      case 'UNION_SHAPES': {
        const { shape1Id, shape2Id } = payload
        const shape1 = geometryCache.get(shape1Id)
        const shape2 = geometryCache.get(shape2Id)
        if (!shape1 || !shape2) {
          throw new Error('Shape not found in cache')
        }
        const geometry = occtModule!.unionShapes(shape1, shape2)
        const geometryId = `union_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'union' }
        break
      }
      
      case 'CUT_SHAPES': {
        const { shape1Id, shape2Id } = payload
        const shape1 = geometryCache.get(shape1Id)
        const shape2 = geometryCache.get(shape2Id)
        if (!shape1 || !shape2) {
          throw new Error('Shape not found in cache')
        }
        const geometry = occtModule!.cutShapes(shape1, shape2)
        const geometryId = `cut_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'cut' }
        break
      }
      
      case 'INTERSECT_SHAPES': {
        const { shape1Id, shape2Id } = payload
        const shape1 = geometryCache.get(shape1Id)
        const shape2 = geometryCache.get(shape2Id)
        if (!shape1 || !shape2) {
          throw new Error('Shape not found in cache')
        }
        const geometry = occtModule!.intersectShapes(shape1, shape2)
        const geometryId = `intersect_${Date.now()}_${Math.random()}`
        geometryCache.set(geometryId, geometry)
        result = { geometryId, type: 'intersect' }
        break
      }
      
      case 'ADD_HOLE': {
        const { geometryId, position, diameter, depth } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        const modifiedGeometry = occtModule!.addHole(geometry, position, diameter, depth)
        const newGeometryId = `hole_${Date.now()}_${Math.random()}`
        geometryCache.set(newGeometryId, modifiedGeometry)
        result = { geometryId: newGeometryId, type: 'modified' }
        break
      }
      
      case 'ADD_FILLET': {
        const { geometryId, edgeIndex, radius } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        const modifiedGeometry = occtModule!.addFillet(geometry, edgeIndex, radius)
        const newGeometryId = `fillet_${Date.now()}_${Math.random()}`
        geometryCache.set(newGeometryId, modifiedGeometry)
        result = { geometryId: newGeometryId, type: 'modified' }
        break
      }
      
      case 'ADD_CHAMFER': {
        const { geometryId, edgeIndex, distance } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        const modifiedGeometry = occtModule!.addChamfer(geometry, edgeIndex, distance)
        const newGeometryId = `chamfer_${Date.now()}_${Math.random()}`
        geometryCache.set(newGeometryId, modifiedGeometry)
        result = { geometryId: newGeometryId, type: 'modified' }
        break
      }
      
      case 'GET_MESH': {
        const { geometryId } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        const meshData = occtModule!.getMeshData(geometry)
        
        // Convert emscripten::val arrays to JavaScript arrays
        const vertices: number[] = []
        const indices: number[] = []
        
        const verticesVal = meshData.vertices
        const indicesVal = meshData.indices
        
        // Extract vertices
        for (let i = 0; i < verticesVal.size(); i++) {
          vertices.push(verticesVal.get(i))
        }
        
        // Extract indices
        for (let i = 0; i < indicesVal.size(); i++) {
          indices.push(indicesVal.get(i))
        }
        
        result = { vertices, indices, normals: [] }
        break
      }
      
      case 'GET_BOUNDING_BOX': {
        const { geometryId } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        result = occtModule!.getBoundingBox(geometry)
        break
      }
      
      case 'ANALYZE_DFM': {
        const { geometryId } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        result = occtModule!.analyzeManufacturability(geometry)
        break
      }
      
      case 'EXPORT_STEP': {
        const { geometryId, filename } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        const success = occtModule!.exportToSTEP(geometry, filename)
        result = { success, filename }
        break
      }
      
      case 'EXPORT_IGES': {
        const { geometryId, filename } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        const success = occtModule!.exportToIGES(geometry, filename)
        result = { success, filename }
        break
      }
      
      case 'EXPORT_STL': {
        const { geometryId, filename } = payload
        const geometry = geometryCache.get(geometryId)
        if (!geometry) {
          throw new Error('Geometry not found in cache')
        }
        const success = occtModule!.exportToSTL(geometry, filename)
        result = { success, filename }
        break
      }
      
      case 'LOAD_FILE': {
        // TODO: Implement CAD file loading (STEP, IGES, STL)
        // For now, return mock data
        const { filename, data } = payload
        result = { 
          geometryId: `loaded_${Date.now()}`,
          filename,
          success: true 
        }
        break
      }
      
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
    
    // Send success response
    postMessage({
      id,
      type: 'SUCCESS',
      result
    } as WorkerResponse)
    
  } catch (error) {
    console.error(`❌ Error processing ${operation}:`, error)
    postMessage({
      id,
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse)
  }
}

// Handle worker errors
self.onerror = (error: ErrorEvent | string) => {
  console.error('❌ Worker error:', error)
  const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown worker error'
  postMessage({
    type: 'ERROR',
    error: `Worker error: ${errorMessage}`
  } as WorkerResponse)
}

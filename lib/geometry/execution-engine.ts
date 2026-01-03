// Execution Engine - Orchestrates geometry operations through the Cadmium worker

import type { GeometryOperation } from './operation-sequencer'
import * as THREE from 'three'

export interface ExecutionProgress {
  current: number
  total: number
  operation: GeometryOperation
  status: 'pending' | 'running' | 'complete' | 'error'
  result?: any
  error?: string
}

export type ProgressCallback = (progress: ExecutionProgress) => void
export type MeshCallback = (geometryId: string, mesh: MeshData) => void

export interface MeshData {
  vertices: Float32Array | number[]
  indices: Uint32Array | number[]
  normals: Float32Array | number[]
}

export class ExecutionEngine {
  private worker: Worker | null = null
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>()
  private isReady = false
  private geometryCache = new Map<string, any>()
  private initPromise: Promise<void> | null = null
  private initTimeoutId: ReturnType<typeof setTimeout> | null = null
  private useFallbackMode = false

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize worker synchronously but track readiness asynchronously
      this.initPromise = this.initWorker()
    }
  }

  /**
   * Waits for the worker to be ready before executing operations
   */
  async ensureReady(): Promise<void> {
    if (this.isReady && !this.useFallbackMode) return

    if (!this.initPromise) {
      throw new Error('Worker initialization not started. This should not happen.')
    }

    try {
      await this.initPromise
    } catch (error) {
      console.warn('Worker initialization failed, falling back to basic geometry:', error)
      this.useFallbackMode = true
      // In fallback mode, we're ready with basic shapes only
    }
  }

  private async initWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('/workers/cadmium-worker.js', {
          type: 'module',
          name: 'cadmium-worker'
        })

        // Set up message handler first, before worker sends READY
        this.worker.onmessage = (event) => {
          const { id, type, result, error } = event.data

          if (type === 'READY') {
            this.isReady = true
            console.log('✅ Execution engine worker ready')
            
            // Clear initialization timeout
            if (this.initTimeoutId) {
              clearTimeout(this.initTimeoutId)
              this.initTimeoutId = null
            }
            
            resolve()  // Resolve the initialization promise
            return
          }

          const pending = this.pendingRequests.get(id)
          if (!pending) {
            console.warn('Received response for unknown request:', id)
            return
          }

          this.pendingRequests.delete(id)

          if (type === 'ERROR' || error) {
            pending.reject(new Error(error || 'Unknown worker error'))
          } else {
            pending.resolve(result)
          }
        }

        this.worker.onerror = (error) => {
          console.error('Worker error:', error)
          reject(error)
        }

        // Set initialization timeout (10 seconds)
        this.initTimeoutId = setTimeout(() => {
          console.warn('Worker initialization timed out - will use fallback mode')
          reject(new Error('Worker initialization timed out after 10 seconds'))
        }, 10000)

      } catch (error) {
        console.error('Failed to initialize execution engine worker:', error)
        reject(error)
      }
    })
  }

  /**
   * Creates basic geometry using fallback (Three.js) when worker is unavailable
   */
  async createBasicGeometry(type: string, dimensions: Record<string, number>): Promise<any> {
    const geometryId = `geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    let geometry: THREE.BufferGeometry
    
    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          dimensions.width || 100,
          dimensions.height || 100,
          dimensions.depth || 100
        )
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          dimensions.radius || 50,
          dimensions.radius || 50,
          dimensions.height || 100,
          dimensions.segments || 32
        )
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          dimensions.radius || 50,
          dimensions.segmentsLat || 32,
          dimensions.segmentsLon || 32
        )
        break
      case 'cone':
        geometry = new THREE.ConeGeometry(
          dimensions.radius || 50,
          dimensions.height || 100,
          dimensions.segments || 32
        )
        break
      case 'torus':
        geometry = new THREE.TorusGeometry(
          dimensions.majorRadius || 100,
          dimensions.minorRadius || 30,
          dimensions.segmentsMinor || 16,
          dimensions.segmentsMajor || 32
        )
        break
      default:
        throw new Error(`Unknown geometry type: ${type}`)
    }
    
    // Convert to our mesh format
    const meshData = {
      vertices: Array.from(geometry.attributes.position.array),
      indices: geometry.index ? Array.from(geometry.index.array) : [],
      normals: Array.from(geometry.attributes.normal.array)
    }
    
    return {
      geometryId,
      mesh: meshData
    }
  }

  /**
   * Executes a sequence of geometry operations
   */
  async executeSequence(
    operations: GeometryOperation[],
    onProgress?: ProgressCallback,
    onMeshUpdate?: MeshCallback
  ): Promise<string> {
    if (!this.isReady && !this.useFallbackMode) {
      throw new Error('Execution engine not ready')
    }

    let lastGeometryId = ''

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i]

      onProgress?.({
        current: i,
        total: operations.length,
        operation,
        status: 'running',
      })

      try {
        let result: any
        
        // Use fallback for basic shapes if in fallback mode
        if (this.useFallbackMode) {
          result = await this.executeFallbackOperation(operation, lastGeometryId)
        } else {
          result = await this.executeOperation(operation, lastGeometryId)
        }

        onProgress?.({
          current: i + 1,
          total: operations.length,
          operation,
          status: 'complete',
          result,
        })

        // If operation produces a geometry, cache it and notify
        if (result?.geometryId) {
          lastGeometryId = result.geometryId
          this.geometryCache.set(result.geometryId, result)

          if (result.mesh && onMeshUpdate) {
            onMeshUpdate(result.geometryId, result.mesh)
          }
        }
      } catch (error) {
        onProgress?.({
          current: i + 1,
          total: operations.length,
          operation,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        })

        throw error
      }
    }

    return lastGeometryId
  }

  /**
   * Executes a fallback operation using Three.js
   */
  private async executeFallbackOperation(operation: GeometryOperation, currentGeometryId: string): Promise<any> {
    const params = operation.parameters
    
    switch (operation.operation) {
      case 'CREATE_BOX':
        return this.createBasicGeometry('box', {
          width: params.width,
          height: params.height,
          depth: params.depth
        })
      
      case 'CREATE_CYLINDER':
        return this.createBasicGeometry('cylinder', {
          radius: params.radius || params.diameter / 2,
          height: params.height,
          segments: params.segments || 32
        })
      
      case 'CREATE_SPHERE':
        return this.createBasicGeometry('sphere', {
          radius: params.radius || params.diameter / 2
        })
      
      case 'CREATE_CONE':
        return this.createBasicGeometry('cone', {
          radius: params.radius || params.diameter / 2,
          height: params.height
        })
      
      case 'CREATE_TORUS':
        return this.createBasicGeometry('torus', {
          majorRadius: params.majorRadius,
          minorRadius: params.minorRadius
        })
      
      default:
        throw new Error(`Fallback not available for operation: ${operation.operation}`)
    }
  }

  /**
   * Executes a single geometry operation
   */
  private async executeOperation(operation: GeometryOperation, currentGeometryId: string): Promise<any> {
    if (!this.worker && !this.useFallbackMode) {
      throw new Error('Worker not initialized')
    }

    // If in fallback mode, use fallback operation
    if (this.useFallbackMode) {
      return this.executeFallbackOperation(operation, currentGeometryId)
    }

    const requestId = this.generateRequestId()
    
    // Map operation to worker message format
    const payload = this.mapOperationToPayload(operation, currentGeometryId)

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject })

      this.worker!.postMessage({
        id: requestId,
        operation: operation.operation,
        payload,
      })

      // Timeout after 30 seconds
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          reject(new Error(`Operation ${operation.operation} timed out`))
        }
      }, 30000)

      // Store timeout for cleanup
      const pending = this.pendingRequests.get(requestId)
      if (pending) {
        // Override pending to include timeout cleanup
        this.pendingRequests.set(requestId, {
          resolve: (value) => {
            clearTimeout(timeoutId)
            resolve(value)
          },
          reject: (error) => {
            clearTimeout(timeoutId)
            reject(error)
          }
        })
      }
    })
  }

  /**
   * Maps a geometry operation to worker payload format
   */
  private mapOperationToPayload(operation: GeometryOperation, currentGeometryId: string): any {
    const params = operation.parameters

    switch (operation.operation) {
      case 'CREATE_BOX':
        return {
          width: params.width,
          height: params.height,
          depth: params.depth,
        }

      case 'CREATE_CYLINDER':
        return {
          radius: params.radius || params.diameter / 2,
          height: params.height,
          segments: params.segments || 32,
        }

      case 'CREATE_SPHERE':
        return {
          radius: params.radius || params.diameter / 2,
          segmentsLat: params.segmentsLat || 32,
          segmentsLon: params.segmentsLon || 32,
        }

      case 'CREATE_CONE':
        return {
          radius: params.radius || params.diameter / 2,
          height: params.height,
          segments: params.segments || 32,
        }

      case 'CREATE_TORUS':
        return {
          majorRadius: params.majorRadius,
          minorRadius: params.minorRadius,
          segmentsMajor: params.segmentsMajor || 32,
          segmentsMinor: params.segmentsMinor || 16,
        }

      case 'LOAD_MESH':
        return {
          mesh: params.mesh
        }

      case 'ADD_HOLE':
        return {
          geometryId: currentGeometryId,
          position: params.position || { x: 0, y: 0, z: 0 },
          diameter: params.diameter,
          depth: params.depth,
        }

      case 'ADD_FILLET':
        return {
          geometryId: currentGeometryId,
          edgeIndex: params.edgeIndex || 0,
          radius: params.radius,
        }

      case 'ADD_CHAMFER':
        return {
          geometryId: currentGeometryId,
          edgeIndex: params.edgeIndex || 0,
          distance: params.distance,
        }

      case 'BOOLEAN_UNION':
      case 'BOOLEAN_SUBTRACT':
      case 'BOOLEAN_INTERSECT':
        return {
          geometryId1: currentGeometryId,
          geometryId2: params.toolGeometryId,
        }

      case 'EXPORT_STL':
        return {
          geometryId: currentGeometryId,
          filename: params.filename || 'model.stl',
        }

      case 'EXPORT_OBJ':
        return {
          geometryId: currentGeometryId,
          filename: params.filename || 'model.obj',
        }

      default:
        return params
    }
  }

  /**
   * Gets cached geometry by ID
   */
  getGeometry(geometryId: string): any {
    return this.geometryCache.get(geometryId)
  }

  /**
   * Exports geometry to file format
   */
  async exportGeometry(geometryId: string, format: 'stl' | 'obj'): Promise<string> {
    const operation = format === 'stl' ? 'EXPORT_STL' : 'EXPORT_OBJ'
    
    const result = await this.executeOperation(
      {
        id: this.generateRequestId(),
        type: 'EXPORT',
        operation,
        parameters: { filename: `model.${format}` },
        dependsOn: [],
        streaming: false,
        description: `Export as ${format.toUpperCase()}`,
      },
      geometryId
    )

    return result.content
  }

  /**
   * Clears geometry cache
   */
  clearCache() {
    this.geometryCache.clear()
    
    if (this.worker) {
      const requestId = this.generateRequestId()
      this.worker.postMessage({
        id: requestId,
        operation: 'CLEAR_CACHE',
        payload: {},
      })
    }
  }

  /**
   * Generates unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Terminates the worker
   */
  dispose() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingRequests.clear()
    this.geometryCache.clear()
  }
}

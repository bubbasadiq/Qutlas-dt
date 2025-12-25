// Execution Engine - Orchestrates geometry operations through the Cadmium worker

import type { GeometryOperation } from './operation-sequencer'

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
    if (this.isReady) return

    if (!this.initPromise) {
      throw new Error('Worker initialization not started. This should not happen.')
    }

    try {
      await this.initPromise
    } catch (error) {
      console.error('Worker initialization failed:', error)
      throw error
    }
  }

  private async initWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('@/workers/cadmium-worker.ts', import.meta.url), {
          type: 'module',
        })

        // Set up message handler first, before worker sends READY
        this.worker.onmessage = (event) => {
          const { id, type, result, error } = event.data

          if (type === 'READY') {
            this.isReady = true
            console.log('✅ Execution engine worker ready')
            
            // Clear initialization timeout
            const initTimeout = (this as any).initTimeout
            if (initTimeout) {
              clearTimeout(initTimeout)
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

        // Set initialization timeout
        const initTimeout = setTimeout(() => {
          reject(new Error('Worker initialization timed out after 10 seconds'))
        }, 10000)

        // Store timeout so we can clear it when READY is received
        ;(this as any).initTimeout = initTimeout

      } catch (error) {
        console.error('Failed to initialize execution engine worker:', error)
        reject(error)
      }
    })
  }

  /**
   * Executes a sequence of geometry operations
   */
  async executeSequence(
    operations: GeometryOperation[],
    onProgress?: ProgressCallback,
    onMeshUpdate?: MeshCallback
  ): Promise<string> {
    if (!this.isReady) {
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
        const result = await this.executeOperation(operation, lastGeometryId)

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
   * Executes a single geometry operation
   */
  private async executeOperation(operation: GeometryOperation, currentGeometryId: string): Promise<any> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
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
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          reject(new Error(`Operation ${operation.operation} timed out`))
        }
      }, 30000)
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

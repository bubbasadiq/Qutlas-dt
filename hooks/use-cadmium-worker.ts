import { useRef, useCallback, useEffect, useState } from 'react'

export interface MeshData {
  vertices: number[]
  indices: number[]
  normals?: number[]
}

export interface GeometryResult {
  geometryId: string
  mesh: MeshData
}

export interface UseCadmiumWorkerReturn {
  createBox: (width: number, height: number, depth: number) => Promise<GeometryResult>
  createCylinder: (radius: number, height: number) => Promise<GeometryResult>
  createSphere: (radius: number) => Promise<GeometryResult>
  createCone: (radius: number, height: number) => Promise<GeometryResult>
  createTorus: (majorRadius: number, minorRadius: number) => Promise<GeometryResult>
  booleanUnion: (geometryId1: string, geometryId2: string) => Promise<GeometryResult>
  booleanSubtract: (geometryId1: string, geometryId2: string) => Promise<GeometryResult>
  booleanIntersect: (geometryId1: string, geometryId2: string) => Promise<GeometryResult>
  addHole: (geometryId: string, position: {x: number, y: number, z: number}, diameter: number, depth: number) => Promise<GeometryResult>
  addFillet: (geometryId: string, edgeIndex: number, radius: number) => Promise<GeometryResult>
  addChamfer: (geometryId: string, edgeIndex: number, distance: number) => Promise<GeometryResult>
  getMesh: (geometryId: string) => Promise<MeshData>
  exportSTL: (geometryId: string, filename: string) => Promise<{content: string, format: string}>
  exportOBJ: (geometryId: string, filename: string) => Promise<{content: string, format: string}>
  clearCache: () => Promise<void>
  isReady: boolean
}

export function useCadmiumWorker(): UseCadmiumWorkerReturn {
  const workerRef = useRef<Worker | null>(null)
  const callbacksRef = useRef<Map<string, Function>>(new Map())
  const isReadyRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Initialize worker
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/cadmium-worker.ts', import.meta.url),
          { type: 'module' }
        )
        
        workerRef.current.onmessage = (event: MessageEvent) => {
          const { id, result, error, type } = event.data
          
          if (type === 'READY') {
            console.log('✅ Cadmium Worker is ready')
            isReadyRef.current = true
            setIsReady(true)
            return
          }
          
          if (type === 'ERROR' && !id) {
            console.error('❌ Cadmium Worker error:', error)
            return
          }
          
          const callback = callbacksRef.current.get(id)
          if (callback) {
            callbacksRef.current.delete(id)
            if (error) {
              callback(error, null)
            } else {
              callback(null, result)
            }
          }
        }
        
        workerRef.current.onerror = (error) => {
          console.error('❌ Cadmium Worker error:', error)
        }
      } catch (error) {
        console.error('❌ Failed to create Cadmium Worker:', error)
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])
  
  const runOperation = useCallback((operation: string, payload: any, timeout = 30000): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      
      if (!isReadyRef.current) {
        reject(new Error('Worker not ready yet'))
        return
      }
      
      const id = Math.random().toString(36).substr(2, 9)
      
      // Set timeout for operation
      const timeoutId = setTimeout(() => {
        callbacksRef.current.delete(id)
        reject(new Error(`Operation ${operation} timed out after ${timeout}ms`))
      }, timeout)
      
      callbacksRef.current.set(id, (error: string | null, result: any) => {
        clearTimeout(timeoutId)
        if (error) {
          reject(new Error(error))
        } else {
          resolve(result)
        }
      })
      
      workerRef.current.postMessage({ id, operation, payload })
    })
  }, [])
  
  return {
    isReady,
    
    createBox: useCallback((width: number, height: number, depth: number) => 
      runOperation('CREATE_BOX', { width, height, depth }),
      [runOperation]
    ),
    
    createCylinder: useCallback((radius: number, height: number) => 
      runOperation('CREATE_CYLINDER', { radius, height, segments: 32 }),
      [runOperation]
    ),
    
    createSphere: useCallback((radius: number) => 
      runOperation('CREATE_SPHERE', { radius, segmentsLat: 32, segmentsLon: 32 }),
      [runOperation]
    ),
    
    createCone: useCallback((radius: number, height: number) => 
      runOperation('CREATE_CONE', { radius, height, segments: 32 }),
      [runOperation]
    ),
    
    createTorus: useCallback((majorRadius: number, minorRadius: number) => 
      runOperation('CREATE_TORUS', { majorRadius, minorRadius, segmentsMajor: 32, segmentsMinor: 16 }),
      [runOperation]
    ),
    
    booleanUnion: useCallback((geometryId1: string, geometryId2: string) => 
      runOperation('BOOLEAN_UNION', { geometryId1, geometryId2 }),
      [runOperation]
    ),
    
    booleanSubtract: useCallback((geometryId1: string, geometryId2: string) => 
      runOperation('BOOLEAN_SUBTRACT', { geometryId1, geometryId2 }),
      [runOperation]
    ),
    
    booleanIntersect: useCallback((geometryId1: string, geometryId2: string) => 
      runOperation('BOOLEAN_INTERSECT', { geometryId1, geometryId2 }),
      [runOperation]
    ),
    
    addHole: useCallback((geometryId: string, position: {x: number, y: number, z: number}, diameter: number, depth: number) => 
      runOperation('ADD_HOLE', { geometryId, position, diameter, depth }),
      [runOperation]
    ),
    
    addFillet: useCallback((geometryId: string, edgeIndex: number, radius: number) => 
      runOperation('ADD_FILLET', { geometryId, edgeIndex, radius }),
      [runOperation]
    ),
    
    addChamfer: useCallback((geometryId: string, edgeIndex: number, distance: number) => 
      runOperation('ADD_CHAMFER', { geometryId, edgeIndex, distance }),
      [runOperation]
    ),
    
    getMesh: useCallback((geometryId: string) => 
      runOperation('GET_MESH', { geometryId }),
      [runOperation]
    ),
    
    exportSTL: useCallback((geometryId: string, filename: string) => 
      runOperation('EXPORT_STL', { geometryId, filename }),
      [runOperation]
    ),
    
    exportOBJ: useCallback((geometryId: string, filename: string) => 
      runOperation('EXPORT_OBJ', { geometryId, filename }),
      [runOperation]
    ),
    
    clearCache: useCallback(async () => {
      await runOperation('CLEAR_CACHE', {})
    }, [runOperation])
  }
}

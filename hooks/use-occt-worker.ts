import { useRef, useCallback, useEffect, useState } from 'react'

export interface UseOCCTWorkerReturn {
  createBox: (width: number, height: number, depth: number) => Promise<any>
  createCylinder: (radius: number, height: number) => Promise<any>
  createSphere: (radius: number) => Promise<any>
  createCone: (radius: number, height: number) => Promise<any>
  createTorus: (majorRadius: number, minorRadius: number) => Promise<any>
  unionShapes: (shape1: any, shape2: any) => Promise<any>
  cutShapes: (shape1: any, shape2: any) => Promise<any>
  addHole: (geometry: any, position: {x: number, y: number, z: number}, diameter: number, depth: number) => Promise<any>
  addFillet: (geometry: any, edgeIndex: number, radius: number) => Promise<any>
  addChamfer: (geometry: any, edgeIndex: number, distance: number) => Promise<any>
  getMesh: (geometry: any) => Promise<{vertices: number[], indices: number[], normals?: number[]}>
  exportSTEP: (geometry: any, filename: string) => Promise<boolean>
  loadFile: (file: File) => Promise<string>
  isReady: boolean
}

export function useOCCTWorker(): UseOCCTWorkerReturn {
  const workerRef = useRef<Worker | null>(null)
  const callbacksRef = useRef<Map<string, Function>>(new Map())
  const isReadyRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Initialize worker
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../occt-wrapper/src/occt-worker.ts', import.meta.url),
        { type: 'module' }
      )
      
      workerRef.current.onmessage = (event: MessageEvent) => {
        const { id, result, error, type } = event.data
        
        if (type === 'READY') {
          console.log('✅ OCCT Worker is ready')
          isReadyRef.current = true
          setIsReady(true)
          return
        }
        
        if (type === 'ERROR') {
          console.error('❌ OCCT Worker error:', event.data.error)
          return
        }
        
        const callback = callbacksRef.current.get(id)
        if (callback) {
          callbacksRef.current.delete(id)
          callback(error, result)
        }
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
      
      const id = Math.random().toString(36)
      
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
    createBox: useCallback((w: number, h: number, d: number) => 
      runOperation('CREATE_BOX', { width: w, height: h, depth: d }),
      [runOperation]
    ),
    createCylinder: useCallback((r: number, h: number) => 
      runOperation('CREATE_CYLINDER', { radius: r, height: h }),
      [runOperation]
    ),
    createSphere: useCallback((r: number) => 
      runOperation('CREATE_SPHERE', { radius: r }),
      [runOperation]
    ),
    createCone: useCallback((r: number, h: number) => 
      runOperation('CREATE_CONE', { radius: r, height: h }),
      [runOperation]
    ),
    createTorus: useCallback((majorR: number, minorR: number) => 
      runOperation('CREATE_TORUS', { majorRadius: majorR, minorRadius: minorR }),
      [runOperation]
    ),
    unionShapes: useCallback((s1: any, s2: any) => 
      runOperation('UNION_SHAPES', { shape1: s1, shape2: s2 }),
      [runOperation]
    ),
    cutShapes: useCallback((s1: any, s2: any) => 
      runOperation('CUT_SHAPES', { shape1: s1, shape2: s2 }),
      [runOperation]
    ),
    addHole: useCallback((geo: any, pos: {x: number, y: number, z: number}, d: number, depth: number) => 
      runOperation('ADD_HOLE', { geometry: geo, position: pos, diameter: d, depth }),
      [runOperation]
    ),
    addFillet: useCallback((geo: any, edgeIdx: number, rad: number) => 
      runOperation('ADD_FILLET', { geometry: geo, edgeIndex: edgeIdx, radius: rad }),
      [runOperation]
    ),
    addChamfer: useCallback((geo: any, edgeIdx: number, dist: number) => 
      runOperation('ADD_CHAMFER', { geometry: geo, edgeIndex: edgeIdx, distance: dist }),
      [runOperation]
    ),
    getMesh: useCallback((geo: any) => 
      runOperation('GET_MESH', { geometry: geo }),
      [runOperation]
    ),
    exportSTEP: useCallback((geo: any, filename: string) => 
      runOperation('EXPORT_STEP', { geometry: geo, filename }),
      [runOperation]
    ),
    loadFile: useCallback(async (file: File) => {
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const result = await runOperation('LOAD_FILE', { 
        filename: file.name, 
        data: Array.from(data) 
      })
      return result.geometryId
    }, [runOperation])
  }
}
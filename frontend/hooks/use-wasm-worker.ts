"use client"

import { useEffect, useRef, useCallback } from "react"

export interface WorkerMessage {
  id: string
  result?: unknown
  error?: string
}

export const useWasmWorker = () => {
  const workerRef = useRef<Worker | null>(null)
  const callbacksRef = useRef<Map<string, (result: WorkerMessage) => void>>(new Map())
  const idCounterRef = useRef(0)

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL("@/frontend/workers/geometry-worker.ts", import.meta.url), {
      type: "module",
    })

    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { id } = event.data
      const callback = callbacksRef.current.get(id)

      if (callback) {
        callback(event.data)
        callbacksRef.current.delete(id)
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  const invokeWorker = useCallback(<T,>(message: Record<string, unknown>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const id = `${idCounterRef.current++}`

      const timeout = setTimeout(() => {
        callbacksRef.current.delete(id)
        reject(new Error("Worker timeout"))
      }, 30000)

      callbacksRef.current.set(id, (result: WorkerMessage) => {
        clearTimeout(timeout)

        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve(result.result as T)
        }
      })

      if (workerRef.current) {
        workerRef.current.postMessage({ ...message, id })
      } else {
        reject(new Error("Worker not initialized"))
      }
    })
  }, [])

  const validateAsset = useCallback(
    (file: File) => {
      return file.arrayBuffer().then((buffer) =>
        invokeWorker<Record<string, unknown>>({
          type: "validate-asset",
          data: buffer,
        }),
      )
    },
    [invokeWorker],
  )

  const applyParameters = useCallback(
    (params: Record<string, number>) => {
      return invokeWorker<{
        mesh: { vertex_count: number; face_count: number; hash: string }
        bounding_box: { min: [number, number, number]; max: [number, number, number] }
      }>({
        type: "apply-parameters",
        params,
      })
    },
    [invokeWorker],
  )

  const solveConstraint = useCallback(
    (constraint: Record<string, unknown>) => {
      return invokeWorker<{ status: string; message: string }>({
        type: "solve-constraint",
        constraint,
      })
    },
    [invokeWorker],
  )

  return {
    validateAsset,
    applyParameters,
    solveConstraint,
  }
}

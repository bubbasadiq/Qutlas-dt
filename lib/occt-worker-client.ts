let worker: Worker | null = null

export interface OcctWorkerClient {
  loadObject: (data: ArrayBuffer) => Promise<any>
  updateParameters: (objectId: string, params: Record<string, number>) => Promise<any>
}

export function initOcctWorker(): OcctWorkerClient {
  if (!worker) {
    worker = new Worker(new URL("@/occt-wrapper/src/occt-worker.ts", import.meta.url), {
      type: "module",
    })
  }

  const callbacks = new Map<string, (result: any) => void>()
  let idCounter = 0

  worker.onmessage = (event: MessageEvent) => {
    const { id, result, error } = event.data
    const cb = callbacks.get(id)
    if (cb) {
      callbacks.delete(id)
      if (error) throw new Error(error)
      cb(result)
    }
  }

  function postMessageWithResponse(message: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `${idCounter++}`
      callbacks.set(id, resolve)
      worker?.postMessage({ ...message, id })
      setTimeout(() => {
        if (callbacks.has(id)) {
          callbacks.delete(id)
          reject(new Error("OCCT Worker Timeout"))
        }
      }, 30000)
    })
  }

  return {
    loadObject: (data: ArrayBuffer) => postMessageWithResponse({ type: "load-object", data }),
    updateParameters: (objectId: string, params: Record<string, number>) =>
      postMessageWithResponse({ type: "update-parameters", objectId, params }),
  }
}

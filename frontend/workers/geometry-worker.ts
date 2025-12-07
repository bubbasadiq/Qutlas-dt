/**
 * WebWorker for WASM geometry operations
 * Runs heavy computation off the main thread
 */

import init, { validate_asset, apply_parameters, solve_constraint } from "@/wasm/cadmium-core"

let wasmReady = false

// Initialize WASM module
init().then(() => {
  wasmReady = true
  postMessage({ type: "ready" })
})

interface ValidateAssetMessage {
  type: "validate-asset"
  id: string
  data: ArrayBuffer
}

interface ApplyParametersMessage {
  type: "apply-parameters"
  id: string
  params: Record<string, number>
}

interface ConstraintSolveMessage {
  type: "solve-constraint"
  id: string
  constraint: {
    constraint_type: string
    entity_ids: string[]
    value?: number
  }
}

type Message = ValidateAssetMessage | ApplyParametersMessage | ConstraintSolveMessage

self.onmessage = async (event: MessageEvent<Message>) => {
  const { id, type } = event.data

  if (!wasmReady) {
    postMessage({
      id,
      error: "WASM not ready",
    })
    return
  }

  try {
    switch (type) {
      case "validate-asset": {
        const msg = event.data as ValidateAssetMessage
        const assetBytes = new Uint8Array(msg.data)
        const result = validate_asset(assetBytes)
        postMessage({ id, result })
        break
      }

      case "apply-parameters": {
        const msg = event.data as ApplyParametersMessage
        const result = apply_parameters(JSON.stringify(msg.params))
        postMessage({ id, result })
        break
      }

      case "solve-constraint": {
        const msg = event.data as ConstraintSolveMessage
        const result = solve_constraint(JSON.stringify(msg.constraint))
        postMessage({ id, result })
        break
      }

      default:
        postMessage({ id, error: "Unknown message type" })
    }
  } catch (error) {
    postMessage({
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

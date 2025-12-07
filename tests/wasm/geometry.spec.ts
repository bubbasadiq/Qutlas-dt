// Test WASM geometry determinism: op-log replay produces identical results
import { describe, it, expect } from "vitest"
import * as wasmModule from "../../wasm/cadmium-core/pkg"

describe("WASM Geometry Determinism", () => {
  it("should produce identical mesh hashes for same operation log", async () => {
    // Define reproducible operation log
    const opLog = [
      { type: "create-box", params: { length: 100, width: 50, height: 30 } },
      { type: "fillet-edges", params: { radius: 5 } },
      { type: "boolean", params: { operation: "union", other: "box-2" } },
    ]

    // First run
    const result1 = wasmModule.executeOpLog(opLog)
    const hash1 = wasmModule.hashGeometry(result1)

    // Second run with identical log
    const result2 = wasmModule.executeOpLog(opLog)
    const hash2 = wasmModule.hashGeometry(result2)

    expect(hash1).toBe(hash2)
  })

  it("should validate asset geometry bounds", async () => {
    const asset = wasmModule.createBox(100, 50, 30)
    const bounds = wasmModule.getBoundingBox(asset)

    expect(bounds.min).toEqual([0, 0, 0])
    expect(bounds.max).toEqual([100, 50, 30])
  })

  it("should apply parametric changes correctly", async () => {
    const asset = wasmModule.createBox(100, 50, 30)

    const updated = wasmModule.applyParameters(asset, {
      length: 150,
      width: 60,
      height: 40,
    })

    const bounds = wasmModule.getBoundingBox(updated)
    expect(bounds.max).toEqual([150, 60, 40])
  })
})

let occtInstance: any = null
let wasmLoading = false
let wasmReady = false

export async function initOpenCascade(): Promise<any> {
  if (wasmReady) {
    return occtInstance
  }

  if (wasmLoading) {
    // Wait for the existing load to complete
    while (wasmLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return occtInstance
  }

  wasmLoading = true

  try {
    const ocFullJS = await import("/occt/opencascade.full.js")
    occtInstance = await new Promise((resolve, reject) => {
      new ocFullJS.default({
        locateFile: (path: string) => {
          if (path.endsWith(".wasm")) return "/occt/opencascade.full.wasm"
          return path
        },
      }).then(resolve).catch(reject)
    })
    wasmReady = true
    return occtInstance
  } catch (error) {
    console.error("Failed to initialize OpenCascade:", error)
    wasmLoading = false
    throw error
  }
}

export function isOcctReady(): boolean {
  return wasmReady
}

export async function makeBox(width: number, height: number, depth: number) {
  const occt = await initOpenCascade()
  return occt.makeBox(width, height, depth)
}

export async function mesh(shape: any, deflection: number = 0.1) {
  const occt = await initOpenCascade()
  return occt.mesh(shape, deflection)
}

export async function exportSTEP(shape: any) {
  const occt = await initOpenCascade()
  return occt.exportSTEP(shape)
}

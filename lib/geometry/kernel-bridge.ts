import { GeometryIR } from './intent-ast'

/**
 * Bridge to Rust geometry kernel (WASM)
 * Handles all communication with the deterministic compiler
 */
export class KernelBridge {
  private kernel: any = null  // Will be the WASM kernel instance
  private isReady = false
  private initPromise: Promise<void> | null = null
  
  /**
   * Initialize WASM kernel
   */
  async initialize(): Promise<void> {
    if (this.isReady) return
    
    if (!this.initPromise) {
      this.initPromise = this.doInitialize()
    }
    
    return this.initPromise
  }
  
  private async doInitialize(): Promise<void> {
    try {
      console.log('🔧 Initializing Geometry Kernel...')
      
      // Try to dynamically import WASM
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wasmModule = await import('../../wasm/cadmium-core/pkg') as any

        // Create kernel instance
        this.kernel = new wasmModule.GeometryKernel()
        this.isReady = true

        console.log('✅ Geometry Kernel ready (WASM)')
      } catch (wasmError) {
        console.warn('WASM kernel not available, will use fallback mode:', wasmError)
        // Fallback: Continue without kernel
        // (Will use legacy execution engine)
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize kernel:', error)
      // Fallback: Continue without kernel
      // (Will use legacy THREE.js geometry)
    }
  }
  
  /**
   * Core: Compile intent to deterministic geometry
   */
  async compileIntent(ir: GeometryIR): Promise<KernelResult> {
    if (!this.isReady || !this.kernel) {
      console.warn('Kernel not ready, returning fallback')
      return {
        status: 'fallback',
        intentHash: ir.hash,
        mesh: null,
        error: 'Kernel not initialized - using fallback mode'
      }
    }
    
    try {
      const intentJson = JSON.stringify(ir)
      const resultJson = this.kernel.compile_intent(intentJson)
      const result = JSON.parse(resultJson)
      
      // Check if result contains an error
      if (result.code === 'COMPILE_ERROR' || result.message) {
        return {
          status: 'error',
          intentHash: ir.hash,
          mesh: null,
          error: result.message || 'Compilation error'
        }
      }
      
      return {
        status: result.status,
        intentHash: result.intent_hash,
        mesh: result.mesh ? {
          vertices: new Float32Array(result.mesh.vertices),
          indices: new Uint32Array(result.mesh.indices),
          normals: new Float32Array(result.mesh.normals),
        } : null,
        step: result.step,
        topology: result.topology,
      }
    } catch (error) {
      console.error('Kernel compilation error:', error)
      return {
        status: 'error',
        intentHash: ir.hash,
        mesh: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Check if kernel is ready
   */
  isKernelReady(): boolean {
    return this.isReady && this.kernel !== null
  }
}

export interface KernelResult {
  status: 'compiled' | 'cached' | 'fallback' | 'error'
  intentHash: string
  mesh: {
    vertices: Float32Array
    indices: Uint32Array
    normals: Float32Array
  } | null
  topology?: any
  step?: any
  error?: string
}

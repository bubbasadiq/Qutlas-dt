import { GeometryIR } from './intent-ast'

/**
 * Enhanced bridge to Rust geometry kernel (WASM)
 * Handles both legacy Intent IR and new Semantic IR systems
 */
export class KernelBridge {
  private kernel: any = null  // Will be the WASM kernel instance
  private isReady = false
  private initPromise: Promise<void> | null = null
  private semanticIREnabled = true
  private analysisCache = new Map<string, any>()
  private validationCache = new Map<string, ValidationResult>()

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
        const wasmModule = await import('../../wasm/geometry-kernel/pkg') as any

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
  /**
   * Compile legacy Intent IR (backward compatibility)
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
   * Compile semantic IR (enhanced system)
   */
  async compileSemanticIR(semanticIR: SemanticIR): Promise<SemanticKernelResult> {
    if (!this.isReady || !this.kernel) {
      console.warn('Kernel not ready, returning fallback')
      return {
        status: 'fallback',
        nodes: [],
        mesh: null,
        manufacturing_analysis: null,
        validation_result: null,
        error: 'Kernel not initialized - using fallback mode'
      }
    }

    try {
      const semanticJson = JSON.stringify(semanticIR)
      const resultJson = this.kernel.compile_semantic_ir(semanticJson)
      const result = JSON.parse(resultJson)

      if (result.status === 'error') {
        return {
          status: 'error',
          nodes: [],
          mesh: null,
          manufacturing_analysis: null,
          validation_result: result.validation_result || null,
          error: result.error?.message || 'Semantic compilation error'
        }
      }

      return {
        status: result.status,
        nodes: result.nodes_processed || 0,
        mesh: result.mesh ? {
          vertices: new Float32Array(result.mesh.vertices || []),
          indices: new Uint32Array(result.mesh.indices || []),
          normals: new Float32Array(result.mesh.normals || []),
        } : null,
        manufacturing_analysis: result.manufacturing_analysis || null,
        validation_result: result.validation_result || null,
        topology: result.topology || null,
        step: result.step || null
      }
    } catch (error) {
      console.error('Semantic kernel compilation error:', error)
      return {
        status: 'error',
        nodes: [],
        mesh: null,
        manufacturing_analysis: null,
        validation_result: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate semantic IR structure and constraints
   */
  async validateSemanticIR(semanticIR: SemanticIR): Promise<ValidationResult> {
    if (!this.isReady || !this.kernel) {
      return {
        valid: false,
        errors: [{ message: 'Kernel not initialized', code: 'KERNEL_NOT_READY' }],
        warnings: [],
        manufacturing_analysis: null
      }
    }

    // Check cache first
    const cacheKey = JSON.stringify(semanticIR)
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!
    }

    try {
      const semanticJson = JSON.stringify(semanticIR)
      const resultJson = this.kernel.validate_semantic_ir(semanticJson)
      const result = JSON.parse(resultJson)

      const validationResult: ValidationResult = {
        valid: result.valid,
        errors: result.errors || [],
        warnings: result.warnings || [],
        manufacturing_analysis: result.manufacturing_analysis || null,
        summary: result.summary || 'Validation completed'
      }

      // Cache result for 5 minutes
      this.validationCache.set(cacheKey, validationResult)
      setTimeout(() => this.validationCache.delete(cacheKey), 5 * 60 * 1000)

      return validationResult
    } catch (error) {
      console.error('Semantic IR validation error:', error)
      return {
        valid: false,
        errors: [{ message: error instanceof Error ? error.message : 'Validation error', code: 'VALIDATION_ERROR' }],
        warnings: [],
        manufacturing_analysis: null
      }
    }
  }

  /**
   * Add a node to the semantic IR graph
   */
  async addIRNode(node: IRNodeData): Promise<AddNodeResult> {
    if (!this.isReady || !this.kernel) {
      return {
        success: false,
        error: 'Kernel not initialized'
      }
    }

    try {
      const nodeJson = JSON.stringify(node)
      const resultJson = this.kernel.add_ir_node(nodeJson)
      const result = JSON.parse(resultJson)

      return {
        success: result.status === 'success',
        node_id: result.node_id || null,
        error: result.error || null
      }
    } catch (error) {
      console.error('Add IR node error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get IR graph statistics and analysis
   */
  async getIRGraphStats(): Promise<IRGraphStats> {
    if (!this.isReady || !this.kernel) {
      return {
        node_count: 0,
        edge_count: 0,
        root_count: 0,
        leaf_count: 0,
        max_depth: 0,
        avg_dependencies: 0
      }
    }

    try {
      const resultJson = this.kernel.get_ir_graph_stats()
      return JSON.parse(resultJson)
    } catch (error) {
      console.error('Get IR graph stats error:', error)
      return {
        node_count: 0,
        edge_count: 0,
        root_count: 0,
        leaf_count: 0,
        max_depth: 0,
        avg_dependencies: 0
      }
    }
  }

  /**
   * Get cache statistics for performance monitoring
   */
  async getCacheStats(): Promise<CacheStats> {
    if (!this.isReady || !this.kernel) {
      return {
        compiler_cache_size: 0,
        analyzer_cache_total: 0,
        analyzer_cache_fresh: 0,
        ir_graph_nodes: 0
      }
    }

    try {
      const resultJson = this.kernel.get_cache_stats()
      return JSON.parse(resultJson)
    } catch (error) {
      console.error('Get cache stats error:', error)
      return {
        compiler_cache_size: 0,
        analyzer_cache_total: 0,
        analyzer_cache_fresh: 0,
        ir_graph_nodes: 0
      }
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (this.isReady && this.kernel) {
      this.kernel.clear_cache()
    }
    this.analysisCache.clear()
    this.validationCache.clear()
  }

  /**
   * Set mesh subdivision level
   */
  async setSubdivisions(subdivisions: number): Promise<void> {
    if (this.isReady && this.kernel) {
      this.kernel.set_subdivisions(Math.max(4, Math.min(64, subdivisions)))
    }
  }

  /**
   * Get kernel version and capabilities
   */
  async getKernelInfo(): Promise<KernelInfo> {
    if (!this.isReady || !this.kernel) {
      return {
        name: 'qutlas-geometry-kernel',
        version: 'unknown',
        features: [],
        architecture: 'fallback',
        ir_system: 'legacy',
        legacy_support: true
      }
    }

    try {
      const resultJson = this.kernel.get_kernel_version()
      return JSON.parse(resultJson)
    } catch (error) {
      console.error('Get kernel info error:', error)
      return {
        name: 'qutlas-geometry-kernel',
        version: 'unknown',
        features: [],
        architecture: 'error',
        ir_system: 'unknown',
        legacy_support: true
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

// Enhanced interfaces for semantic IR system

export interface SemanticIR {
  nodes: IRNodeData[]
  constraints?: ConstraintData[]
  metadata?: {
    version: string
    created_at: string
    created_by?: string
  }
}

export interface IRNodeData {
  id?: string
  node_type: 'primitive' | 'feature' | 'boolean_op' | 'constraint' | 'analysis'
  content: {
    type: string
    data: any
  }
  dependencies?: string[]
  metadata?: {
    name?: string
    description?: string
    created_at?: string
  }
}

export interface ConstraintData {
  id: string
  constraint_type: string
  parameters: Record<string, any>
  affected_nodes: string[]
}

export interface SemanticKernelResult {
  status: 'compiled' | 'cached' | 'fallback' | 'error'
  nodes: number
  mesh: {
    vertices: Float32Array
    indices: Uint32Array
    normals: Float32Array
  } | null
  manufacturing_analysis: ManufacturingAnalysis | null
  validation_result: ValidationResult | null
  topology?: TopologyData | null
  step?: string | null
  error?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  manufacturing_analysis: ManufacturingAnalysis | null
  summary?: string
}

export interface ValidationError {
  message: string
  code: string
  node_id?: string
  context?: Record<string, any>
}

export interface ValidationWarning {
  message: string
  severity: 'low' | 'medium' | 'high'
  node_id?: string
  suggestion?: string
}

export interface ManufacturingAnalysis {
  manufacturability_score: number
  compatible_processes: string[]
  constraint_violations: ConstraintViolation[]
  complexity_score: number
  tool_access_issues: ToolAccessIssue[]
}

export interface ConstraintViolation {
  node_id: string
  constraint_type: string
  severity: 'minor' | 'major' | 'critical'
  description: string
  affected_processes: string[]
}

export interface ToolAccessIssue {
  node_id: string
  issue_type: string
  description: string
  solutions: string[]
}

export interface TopologyData {
  vertices: number
  edges: number
  faces: number
  shells: number
  solids: number
  is_manifold: boolean
  genus: number
}

export interface AddNodeResult {
  success: boolean
  node_id?: string | null
  error?: string | null
}

export interface IRGraphStats {
  node_count: number
  edge_count: number
  root_count: number
  leaf_count: number
  max_depth: number
  avg_dependencies: number
}

export interface CacheStats {
  compiler_cache_size: number
  analyzer_cache_total: number
  analyzer_cache_fresh: number
  ir_graph_nodes: number
}

export interface KernelInfo {
  name: string
  version: string
  features: string[]
  architecture: string
  ir_system: string
  legacy_support: boolean
}

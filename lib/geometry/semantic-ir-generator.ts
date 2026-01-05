/**
 * Enhanced Semantic IR Generator
 *
 * Converts workspace objects into sophisticated semantic IR that leverages
 * the advanced geometry kernel capabilities including manufacturing constraints,
 * feature-based modeling, and assembly-scale reasoning.
 */

import { WorkspaceObject } from '@/hooks/use-workspace'
import { SemanticIR, IRNodeData, ConstraintData } from './kernel-bridge'

export interface EnhancedWorkspaceObject extends Omit<WorkspaceObject, 'material'> {
  // Enhanced properties for semantic IR
  features?: Feature[]
  manufacturingConstraints?: ManufacturingConstraint[]
  material?: MaterialProperties | string
  tolerances?: Tolerance[]
  surfaceFinish?: SurfaceFinish
  assemblyConstraints?: AssemblyConstraint[]
  transform?: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
}

export interface Feature {
  id: string
  type: 'hole' | 'fillet' | 'chamfer' | 'extrude' | 'cut' | 'shell' | 'draft'
  parameters: Record<string, number>
  location?: {
    face?: string
    position: [number, number, number]
    orientation?: [number, number, number]
  }
  manufacturingProcess?: string[]
  toolAccess?: 'top' | 'side' | 'bottom' | 'any'
}

export interface ManufacturingConstraint {
  type: 'min_wall_thickness' | 'max_aspect_ratio' | 'draft_angle' | 'min_feature_size' | 'tool_access'
  value: number
  process: 'cnc_milling' | '3d_printing' | 'injection_molding' | 'laser_cutting' | 'any'
  severity: 'warning' | 'error'
  description?: string
}

export interface MaterialProperties {
  name: string
  density: number // g/cm³
  tensile_strength?: number // MPa
  yield_strength?: number // MPa
  elastic_modulus?: number // GPa
  thermal_conductivity?: number // W/m·K
  cost_per_kg?: number // USD
  manufacturability: {
    cnc_rating: number // 0-10
    printing_rating: number // 0-10
    molding_rating: number // 0-10
  }
}

export interface Tolerance {
  type: 'dimensional' | 'geometric' | 'surface'
  feature?: string
  value: number
  unit: 'mm' | 'degrees' | 'microns'
  grade?: string // ISO tolerance grade
}

export interface SurfaceFinish {
  roughness: number // Ra in micrometers
  process: 'machined' | 'cast' | 'printed' | 'polished'
  requirements?: string[]
}

export interface AssemblyConstraint {
  type: 'mate' | 'align' | 'insert' | 'clearance'
  target_object?: string
  parameters: Record<string, any>
}

/**
 * Enhanced Semantic IR Generator
 */
export class SemanticIRGenerator {
  /**
   * Generate semantic IR from workspace objects with full manufacturing awareness
   */
  static generateFromWorkspace(
    objects: Record<string, WorkspaceObject>,
    options: {
      includeManufacturing?: boolean
      targetProcess?: string
      materialDatabase?: Record<string, MaterialProperties>
      featureDetection?: boolean
    } = {}
  ): SemanticIR {
    const {
      includeManufacturing = true,
      targetProcess = 'cnc_milling',
      materialDatabase = {},
      featureDetection = true
    } = options

    const nodes: IRNodeData[] = []
    const constraints: ConstraintData[] = []

    // Process each object into semantic IR nodes
    Object.entries(objects).forEach(([id, obj]) => {
      const enhancedObj = obj as EnhancedWorkspaceObject

      // Create primitive node
      const primitiveNode = this.createPrimitiveNode(id, enhancedObj, materialDatabase)
      nodes.push(primitiveNode)

      // Add feature nodes if present
      if (enhancedObj.features && featureDetection) {
        enhancedObj.features.forEach((feature, index) => {
          const featureNode = this.createFeatureNode(
            `${id}_feature_${index}`,
            feature,
            id,
            targetProcess
          )
          nodes.push(featureNode)
        })
      }

      // Add manufacturing constraint nodes
      if (includeManufacturing && enhancedObj.manufacturingConstraints) {
        enhancedObj.manufacturingConstraints.forEach((constraint, index) => {
          const constraintNode = this.createConstraintNode(
            `${id}_constraint_${index}`,
            constraint,
            id
          )
          nodes.push(constraintNode)
        })
      }

      // Generate assembly constraints
      if (enhancedObj.assemblyConstraints) {
        enhancedObj.assemblyConstraints.forEach((constraint, index) => {
          const assemblyConstraint = this.createAssemblyConstraint(
            `${id}_assembly_${index}`,
            constraint,
            id
          )
          constraints.push(assemblyConstraint)
        })
      }
    })

    // Add global manufacturing constraints based on target process
    if (includeManufacturing) {
      const globalConstraints = this.generateGlobalConstraints(targetProcess, Object.keys(objects))
      constraints.push(...globalConstraints)
    }

    return {
      nodes,
      constraints,
      metadata: {
        version: '2.0', // Enhanced semantic IR version
        created_at: new Date().toISOString(),
        created_by: 'qutlas-enhanced-generator'
      }
    }
  }

  /**
   * Create primitive node with enhanced material and manufacturing data
   */
  private static createPrimitiveNode(
    id: string,
    obj: EnhancedWorkspaceObject,
    materialDatabase: Record<string, MaterialProperties>
  ): IRNodeData {
    const material = typeof obj.material === 'string'
      ? materialDatabase[obj.material] || this.getDefaultMaterial('aluminum')
      : obj.material || this.getDefaultMaterial('aluminum')

    return {
      id,
      node_type: 'primitive',
      content: {
        type: 'geometric_primitive',
        data: {
          primitive_type: obj.type || 'box',
          parameters: this.normalizeDimensions(obj.dimensions || {}),
          transform: obj.transform || {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          material_properties: material,
          surface_finish: obj.surfaceFinish || {
            roughness: 3.2, // Standard machined finish
            process: 'machined'
          },
          manufacturing_metadata: {
            complexity_score: this.calculateComplexityScore(obj),
            volume_estimate: this.estimateVolume(obj),
            surface_area_estimate: this.estimateSurfaceArea(obj),
            tool_access_analysis: this.analyzeToolAccess(obj),
            recommended_processes: this.getRecommendedProcesses(obj, material)
          }
        }
      },
      dependencies: [],
      metadata: {
        name: obj.description || `${obj.type} ${id}`,
        description: `Enhanced ${obj.type} primitive with manufacturing awareness`,
        created_at: new Date().toISOString()
      }
    }
  }

  /**
   * Create feature node with manufacturing constraints
   */
  private static createFeatureNode(
    id: string,
    feature: Feature,
    parentId: string,
    targetProcess: string
  ): IRNodeData {
    return {
      id,
      node_type: 'feature',
      content: {
        type: 'manufacturing_feature',
        data: {
          feature_type: feature.type,
          parameters: feature.parameters,
          location: feature.location,
          manufacturing_constraints: this.getFeatureConstraints(feature, targetProcess),
          tool_requirements: this.getToolRequirements(feature, targetProcess),
          process_compatibility: this.assessProcessCompatibility(feature),
          cost_impact: this.estimateFeatureCost(feature, targetProcess)
        }
      },
      dependencies: [parentId],
      metadata: {
        name: `${feature.type} feature`,
        description: `Manufacturing-aware ${feature.type} feature`,
        created_at: new Date().toISOString()
      }
    }
  }

  /**
   * Create constraint node for manufacturing limitations
   */
  private static createConstraintNode(
    id: string,
    constraint: ManufacturingConstraint,
    targetId: string
  ): IRNodeData {
    return {
      id,
      node_type: 'constraint',
      content: {
        type: 'manufacturing_constraint',
        data: {
          constraint_type: constraint.type,
          value: constraint.value,
          target_process: constraint.process,
          severity: constraint.severity,
          validation_rules: this.getValidationRules(constraint),
          violation_consequences: this.getViolationConsequences(constraint),
          remediation_suggestions: this.getRemediationSuggestions(constraint)
        }
      },
      dependencies: [targetId],
      metadata: {
        name: `${constraint.type} constraint`,
        description: constraint.description || `Manufacturing constraint for ${constraint.process}`,
        created_at: new Date().toISOString()
      }
    }
  }

  /**
   * Create assembly constraint
   */
  private static createAssemblyConstraint(
    id: string,
    constraint: AssemblyConstraint,
    sourceId: string
  ): ConstraintData {
    return {
      id,
      constraint_type: 'assembly_constraint',
      parameters: {
        type: constraint.type,
        source_object: sourceId,
        target_object: constraint.target_object,
        ...constraint.parameters
      },
      affected_nodes: [sourceId, constraint.target_object].filter(Boolean) as string[]
    }
  }

  /**
   * Generate global manufacturing constraints for the entire design
   */
  private static generateGlobalConstraints(
    targetProcess: string,
    objectIds: string[]
  ): ConstraintData[] {
    const constraints: ConstraintData[] = []

    switch (targetProcess) {
      case 'cnc_milling':
        constraints.push({
          id: 'global_min_feature_size',
          constraint_type: 'minimum_feature_size',
          parameters: {
            min_diameter: 0.5, // mm
            min_width: 0.2, // mm
            reason: 'Tool size limitations'
          },
          affected_nodes: objectIds
        })
        constraints.push({
          id: 'global_tool_access',
          constraint_type: 'tool_accessibility',
          parameters: {
            max_aspect_ratio: 10,
            min_corner_radius: 0.1,
            reason: 'CNC tool access requirements'
          },
          affected_nodes: objectIds
        })
        break

      case '3d_printing':
        constraints.push({
          id: 'global_overhang_angle',
          constraint_type: 'overhang_limitation',
          parameters: {
            max_angle: 45, // degrees
            support_threshold: 0.1, // mm
            reason: 'Support structure requirements'
          },
          affected_nodes: objectIds
        })
        break

      case 'injection_molding':
        constraints.push({
          id: 'global_draft_angle',
          constraint_type: 'draft_angle_requirement',
          parameters: {
            min_angle: 0.5, // degrees
            wall_thickness: 1.0, // mm
            reason: 'Part ejection requirements'
          },
          affected_nodes: objectIds
        })
        break
    }

    return constraints
  }

  /**
   * Normalize dimensions to consistent format
   */
  private static normalizeDimensions(dimensions: Record<string, any>): Record<string, number> {
    const normalized: Record<string, number> = {}

    // Handle different dimension formats
    Object.entries(dimensions).forEach(([key, value]) => {
      if (typeof value === 'number') {
        normalized[key] = value
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value)
        if (!isNaN(parsed)) {
          normalized[key] = parsed
        }
      }
    })

    return normalized
  }

  /**
   * Calculate geometry complexity score (0-10)
   */
  private static calculateComplexityScore(obj: EnhancedWorkspaceObject): number {
    let score = 1 // Base score

    // Add complexity for features
    if (obj.features) {
      score += obj.features.length * 0.5

      // Complex features add more
      obj.features.forEach(feature => {
        if (['fillet', 'chamfer'].includes(feature.type)) score += 0.3
        if (['shell', 'draft'].includes(feature.type)) score += 0.5
        if (feature.type === 'extrude') score += 0.4
      })
    }

    // Add complexity for constraints
    if (obj.manufacturingConstraints) {
      score += obj.manufacturingConstraints.length * 0.2
    }

    return Math.min(score, 10)
  }

  /**
   * Estimate volume based on primitive type and dimensions
   */
  private static estimateVolume(obj: EnhancedWorkspaceObject): number {
    const dims = obj.dimensions || {}

    switch (obj.type) {
      case 'box':
        return (dims.width || 0) * (dims.height || 0) * (dims.depth || 0)
      case 'cylinder':
        return Math.PI * Math.pow(dims.radius || 0, 2) * (dims.height || 0)
      case 'sphere':
        return (4/3) * Math.PI * Math.pow(dims.radius || 0, 3)
      case 'cone':
        return (1/3) * Math.PI * Math.pow(dims.radius || 0, 2) * (dims.height || 0)
      default:
        return 1000 // Default estimate
    }
  }

  /**
   * Estimate surface area
   */
  private static estimateSurfaceArea(obj: EnhancedWorkspaceObject): number {
    const dims = obj.dimensions || {}

    switch (obj.type) {
      case 'box':
        const w = dims.width || 0
        const h = dims.height || 0
        const d = dims.depth || 0
        return 2 * (w*h + w*d + h*d)
      case 'cylinder':
        const r = dims.radius || 0
        const height = dims.height || 0
        return 2 * Math.PI * r * (r + height)
      case 'sphere':
        return 4 * Math.PI * Math.pow(dims.radius || 0, 2)
      default:
        return 1000
    }
  }

  /**
   * Analyze tool access for manufacturing
   */
  private static analyzeToolAccess(obj: EnhancedWorkspaceObject): {
    top_accessible: boolean
    side_accessible: boolean
    bottom_accessible: boolean
    required_setups: number
  } {
    // Simplified analysis - would be more sophisticated in practice
    return {
      top_accessible: true,
      side_accessible: true,
      bottom_accessible: false,
      required_setups: obj.features ? Math.min(obj.features.length, 3) : 1
    }
  }

  /**
   * Get recommended manufacturing processes
   */
  private static getRecommendedProcesses(
    obj: EnhancedWorkspaceObject,
    material: MaterialProperties
  ): string[] {
    const processes = []
    const volume = this.estimateVolume(obj)

    // Volume-based recommendations
    if (volume < 1000) processes.push('cnc_milling')
    if (volume < 10000) processes.push('3d_printing')
    if (volume > 5000) processes.push('injection_molding')

    // Material-based recommendations
    if (material.manufacturability.cnc_rating > 7) processes.push('cnc_milling')
    if (material.manufacturability.printing_rating > 7) processes.push('3d_printing')
    if (material.manufacturability.molding_rating > 7) processes.push('injection_molding')

    return processes.length > 0 ? processes : ['cnc_milling']
  }

  /**
   * Get default material properties
   */
  private static getDefaultMaterial(materialName: string): MaterialProperties {
    const materials: Record<string, MaterialProperties> = {
      aluminum: {
        name: 'Aluminum 6061',
        density: 2.70,
        tensile_strength: 310,
        yield_strength: 276,
        elastic_modulus: 69,
        thermal_conductivity: 167,
        cost_per_kg: 1.85,
        manufacturability: {
          cnc_rating: 9,
          printing_rating: 3,
          molding_rating: 6
        }
      },
      steel: {
        name: 'Steel 1045',
        density: 7.85,
        tensile_strength: 625,
        yield_strength: 530,
        elastic_modulus: 200,
        thermal_conductivity: 49,
        cost_per_kg: 0.85,
        manufacturability: {
          cnc_rating: 7,
          printing_rating: 2,
          molding_rating: 4
        }
      },
      plastic: {
        name: 'ABS Plastic',
        density: 1.04,
        tensile_strength: 40,
        yield_strength: 30,
        elastic_modulus: 2.3,
        thermal_conductivity: 0.25,
        cost_per_kg: 2.50,
        manufacturability: {
          cnc_rating: 6,
          printing_rating: 9,
          molding_rating: 10
        }
      }
    }

    return materials[materialName] || materials.aluminum
  }

  // Helper methods for feature and constraint analysis
  private static getFeatureConstraints(feature: Feature, process: string): any[] {
    return [] // Implementation would depend on specific constraints
  }

  private static getToolRequirements(feature: Feature, process: string): any {
    return {} // Implementation would specify tool requirements
  }

  private static assessProcessCompatibility(feature: Feature): number {
    return 8 // 0-10 compatibility score
  }

  private static estimateFeatureCost(feature: Feature, process: string): number {
    return 10.0 // Cost in USD
  }

  private static assessFeatureManufacturability(feature: Feature, process: string): number {
    return 7 // 0-10 manufacturability score
  }

  private static assessGeometryQuality(obj: EnhancedWorkspaceObject): number {
    return 8 // 0-10 quality score
  }

  private static getValidationRules(constraint: ManufacturingConstraint): any[] {
    return []
  }

  private static getViolationConsequences(constraint: ManufacturingConstraint): string[] {
    return []
  }

  private static getRemediationSuggestions(constraint: ManufacturingConstraint): string[] {
    return []
  }
}

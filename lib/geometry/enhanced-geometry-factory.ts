/**
 * Enhanced Geometry Factory
 *
 * Creates geometry objects with built-in manufacturing awareness,
 * feature detection, and process-specific constraints.
 */

import { WorkspaceObject } from '@/hooks/use-workspace'
import {
  EnhancedWorkspaceObject,
  Feature,
  ManufacturingConstraint,
  MaterialProperties,
  Tolerance,
  SurfaceFinish,
  AssemblyConstraint
} from './semantic-ir-generator'

export interface GeometryCreationOptions {
  targetProcess?: 'cnc_milling' | '3d_printing' | 'injection_molding' | 'laser_cutting'
  material?: string
  includeFeatures?: boolean
  autoConstraints?: boolean
  qualityLevel?: 'prototype' | 'production' | 'precision'
  volume?: 'low' | 'medium' | 'high'
}

export interface FeatureTemplate {
  type: Feature['type']
  defaultParameters: Record<string, number>
  applicableTo: string[] // Primitive types this feature can be applied to
  manufacturingImpact: {
    complexity_increase: number
    cost_multiplier: number
    time_increase: number
  }
  constraints: ManufacturingConstraint[]
}

/**
 * Enhanced Geometry Factory
 * Creates manufacturing-aware geometry with intelligent defaults
 */
export class EnhancedGeometryFactory {
  private static materialDatabase: Record<string, MaterialProperties> = {
    aluminum_6061: {
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
    aluminum_7075: {
      name: 'Aluminum 7075',
      density: 2.81,
      tensile_strength: 572,
      yield_strength: 503,
      elastic_modulus: 72,
      thermal_conductivity: 130,
      cost_per_kg: 2.20,
      manufacturability: {
        cnc_rating: 8,
        printing_rating: 2,
        molding_rating: 5
      }
    },
    steel_1045: {
      name: 'Carbon Steel 1045',
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
    stainless_316: {
      name: 'Stainless Steel 316',
      density: 8.00,
      tensile_strength: 580,
      yield_strength: 290,
      elastic_modulus: 200,
      thermal_conductivity: 16,
      cost_per_kg: 3.50,
      manufacturability: {
        cnc_rating: 6,
        printing_rating: 4,
        molding_rating: 3
      }
    },
    abs_plastic: {
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
    },
    pla_plastic: {
      name: 'PLA Plastic',
      density: 1.24,
      tensile_strength: 37,
      yield_strength: 25,
      elastic_modulus: 3.5,
      thermal_conductivity: 0.13,
      cost_per_kg: 1.80,
      manufacturability: {
        cnc_rating: 5,
        printing_rating: 10,
        molding_rating: 8
      }
    },
    titanium: {
      name: 'Titanium Ti-6Al-4V',
      density: 4.43,
      tensile_strength: 1170,
      yield_strength: 1100,
      elastic_modulus: 114,
      thermal_conductivity: 7,
      cost_per_kg: 35.00,
      manufacturability: {
        cnc_rating: 4,
        printing_rating: 7,
        molding_rating: 2
      }
    }
  }

  private static featureTemplates: Record<string, FeatureTemplate> = {
    through_hole: {
      type: 'hole',
      defaultParameters: {
        diameter: 6.0,
        depth: 0, // Through hole
        chamfer_angle: 45,
        chamfer_depth: 0.2
      },
      applicableTo: ['box', 'cylinder', 'sphere'],
      manufacturingImpact: {
        complexity_increase: 1.2,
        cost_multiplier: 1.1,
        time_increase: 0.3
      },
      constraints: [
        {
          type: 'min_feature_size',
          value: 0.5,
          process: 'cnc_milling',
          severity: 'error',
          description: 'Minimum drill bit size limitation'
        }
      ]
    },
    counterbore: {
      type: 'hole',
      defaultParameters: {
        diameter: 6.0,
        depth: 10.0,
        counterbore_diameter: 12.0,
        counterbore_depth: 3.0
      },
      applicableTo: ['box', 'cylinder'],
      manufacturingImpact: {
        complexity_increase: 1.5,
        cost_multiplier: 1.3,
        time_increase: 0.5
      },
      constraints: [
        {
          type: 'tool_access',
          value: 1,
          process: 'cnc_milling',
          severity: 'warning',
          description: 'Requires flat end mill for counterbore'
        }
      ]
    },
    edge_fillet: {
      type: 'fillet',
      defaultParameters: {
        radius: 2.0,
        blend_type: 1 // Constant radius
      },
      applicableTo: ['box', 'cylinder', 'cone'],
      manufacturingImpact: {
        complexity_increase: 1.3,
        cost_multiplier: 1.2,
        time_increase: 0.4
      },
      constraints: [
        {
          type: 'min_feature_size',
          value: 0.1,
          process: 'cnc_milling',
          severity: 'warning',
          description: 'Small fillets may require specialized tooling'
        }
      ]
    },
    chamfer_45: {
      type: 'chamfer',
      defaultParameters: {
        distance: 1.0,
        angle: 45
      },
      applicableTo: ['box', 'cylinder', 'cone'],
      manufacturingImpact: {
        complexity_increase: 1.1,
        cost_multiplier: 1.05,
        time_increase: 0.2
      },
      constraints: []
    },
    shell_hollow: {
      type: 'shell',
      defaultParameters: {
        thickness: 2.0,
        offset_direction: -1 // Inward
      },
      applicableTo: ['box', 'cylinder', 'sphere'],
      manufacturingImpact: {
        complexity_increase: 2.0,
        cost_multiplier: 0.8, // Less material
        time_increase: 0.7
      },
      constraints: [
        {
          type: 'min_wall_thickness',
          value: 0.8,
          process: 'cnc_milling',
          severity: 'error',
          description: 'Thin walls may break during machining'
        }
      ]
    }
  }

  /**
   * Create enhanced box with manufacturing awareness
   */
  static createBox(
    id: string,
    dimensions: { width: number; height: number; depth: number },
    options: GeometryCreationOptions = {}
  ): EnhancedWorkspaceObject {
    const baseObject = this.createBaseObject(id, 'box', dimensions, options)

    // Add box-specific features if requested
    if (options.includeFeatures) {
      baseObject.features = this.suggestBoxFeatures(dimensions, options)
    }

    // Add box-specific constraints
    baseObject.manufacturingConstraints = [
      ...baseObject.manufacturingConstraints || [],
      ...this.getBoxConstraints(dimensions, options)
    ]

    return baseObject
  }

  /**
   * Create enhanced cylinder with manufacturing awareness
   */
  static createCylinder(
    id: string,
    dimensions: { radius: number; height: number },
    options: GeometryCreationOptions = {}
  ): EnhancedWorkspaceObject {
    const baseObject = this.createBaseObject(id, 'cylinder', dimensions, options)

    // Add cylinder-specific features
    if (options.includeFeatures) {
      baseObject.features = this.suggestCylinderFeatures(dimensions, options)
    }

    // Add cylinder-specific constraints
    baseObject.manufacturingConstraints = [
      ...baseObject.manufacturingConstraints || [],
      ...this.getCylinderConstraints(dimensions, options)
    ]

    return baseObject
  }

  /**
   * Create enhanced sphere with manufacturing awareness
   */
  static createSphere(
    id: string,
    dimensions: { radius: number },
    options: GeometryCreationOptions = {}
  ): EnhancedWorkspaceObject {
    const baseObject = this.createBaseObject(id, 'sphere', dimensions, options)

    // Spheres are challenging to manufacture - add appropriate warnings
    baseObject.manufacturingConstraints = [
      ...baseObject.manufacturingConstraints || [],
      ...this.getSphereConstraints(dimensions, options)
    ]

    return baseObject
  }

  /**
   * Create enhanced cone with manufacturing awareness
   */
  static createCone(
    id: string,
    dimensions: { radius: number; height: number },
    options: GeometryCreationOptions = {}
  ): EnhancedWorkspaceObject {
    const baseObject = this.createBaseObject(id, 'cone', dimensions, options)

    if (options.includeFeatures) {
      baseObject.features = this.suggestConeFeatures(dimensions, options)
    }

    baseObject.manufacturingConstraints = [
      ...baseObject.manufacturingConstraints || [],
      ...this.getConeConstraints(dimensions, options)
    ]

    return baseObject
  }

  /**
   * Create enhanced torus with manufacturing awareness
   */
  static createTorus(
    id: string,
    dimensions: { majorRadius: number; minorRadius: number },
    options: GeometryCreationOptions = {}
  ): EnhancedWorkspaceObject {
    const baseObject = this.createBaseObject(id, 'torus', dimensions, options)

    // Torus is complex to manufacture
    baseObject.manufacturingConstraints = [
      ...baseObject.manufacturingConstraints || [],
      ...this.getTorusConstraints(dimensions, options)
    ]

    return baseObject
  }

  /**
   * Add manufacturing feature to existing object
   */
  static addFeature(
    object: EnhancedWorkspaceObject,
    featureType: string,
    parameters?: Record<string, number>,
    location?: Feature['location']
  ): Feature {
    const template = this.featureTemplates[featureType]
    if (!template) {
      throw new Error(`Unknown feature type: ${featureType}`)
    }

    // Check if feature is applicable to this primitive type
    if (!template.applicableTo.includes(object.type || 'box')) {
      throw new Error(`Feature ${featureType} not applicable to ${object.type}`)
    }

    const feature: Feature = {
      id: `${object.id || 'obj'}_${featureType}_${Date.now()}`,
      type: template.type,
      parameters: { ...template.defaultParameters, ...parameters },
      location,
      manufacturingProcess: this.getProcessesForFeature(template.type),
      toolAccess: this.determineToolAccess(template.type, location)
    }

    // Add feature to object
    if (!object.features) object.features = []
    object.features.push(feature)

    // Add feature constraints
    if (!object.manufacturingConstraints) object.manufacturingConstraints = []
    object.manufacturingConstraints.push(...template.constraints)

    return feature
  }

  /**
   * Create base object with common properties
   */
  private static createBaseObject(
    id: string,
    type: string,
    dimensions: Record<string, number>,
    options: GeometryCreationOptions
  ): EnhancedWorkspaceObject {
    const material = this.getMaterialProperties(options.material || 'aluminum_6061')
    const surfaceFinish = this.getSurfaceFinish(options.targetProcess || 'cnc_milling', options.qualityLevel || 'production')
    const tolerances = this.getTolerances(options.qualityLevel || 'production')

    return {
      id,
      type,
      dimensions,
      visible: true,
      selected: true,
      material,
      surfaceFinish,
      tolerances,
      manufacturingConstraints: this.getGlobalConstraints(options),
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      features: [],
      assemblyConstraints: []
    }
  }

  /**
   * Get material properties by name
   */
  private static getMaterialProperties(materialName: string): MaterialProperties {
    return this.materialDatabase[materialName] || this.materialDatabase.aluminum_6061
  }

  /**
   * Get appropriate surface finish for process and quality level
   */
  private static getSurfaceFinish(process: string, quality: string): SurfaceFinish {
    const finishes: Record<string, Record<string, SurfaceFinish>> = {
      cnc_milling: {
        prototype: { roughness: 6.3, process: 'machined', requirements: ['General use'] },
        production: { roughness: 3.2, process: 'machined', requirements: ['Standard finish'] },
        precision: { roughness: 0.8, process: 'machined', requirements: ['Fine machining', 'Polished'] }
      },
      '3d_printing': {
        prototype: { roughness: 25, process: 'printed', requirements: ['As-printed'] },
        production: { roughness: 12, process: 'printed', requirements: ['Post-processed'] },
        precision: { roughness: 6, process: 'printed', requirements: ['Sanded', 'Vapor smoothed'] }
      },
      injection_molding: {
        prototype: { roughness: 0.4, process: 'molded', requirements: ['Textured'] },
        production: { roughness: 0.2, process: 'molded', requirements: ['Polished mold'] },
        precision: { roughness: 0.1, process: 'molded', requirements: ['Mirror finish'] }
      }
    }

    return finishes[process]?.[quality] || finishes.cnc_milling.production
  }

  /**
   * Get tolerances based on quality level
   */
  private static getTolerances(quality: string): Tolerance[] {
    const toleranceValues: Record<string, number> = {
      prototype: 0.5,
      production: 0.1,
      precision: 0.02
    }

    return [
      {
        type: 'dimensional',
        value: toleranceValues[quality] || 0.1,
        unit: 'mm',
        grade: quality === 'precision' ? 'IT7' : quality === 'production' ? 'IT9' : 'IT11'
      }
    ]
  }

  /**
   * Get global manufacturing constraints based on options
   */
  private static getGlobalConstraints(options: GeometryCreationOptions): ManufacturingConstraint[] {
    const constraints: ManufacturingConstraint[] = []

    const process = options.targetProcess || 'cnc_milling'

    switch (process) {
      case 'cnc_milling':
        constraints.push({
          type: 'min_feature_size',
          value: 0.5,
          process: 'cnc_milling',
          severity: 'error',
          description: 'Minimum feature size for CNC milling'
        })
        break

      case '3d_printing':
        constraints.push({
          type: 'min_feature_size',
          value: 0.1,
          process: '3d_printing',
          severity: 'warning',
          description: 'Minimum printable feature size'
        })
        break

      case 'injection_molding':
        constraints.push({
          type: 'min_wall_thickness',
          value: 0.8,
          process: 'injection_molding',
          severity: 'error',
          description: 'Minimum wall thickness for injection molding'
        })
        break
    }

    return constraints
  }

  /**
   * Suggest features for box geometry
   */
  private static suggestBoxFeatures(dimensions: any, options: GeometryCreationOptions): Feature[] {
    const features: Feature[] = []
    const { width, height, depth } = dimensions

    // Suggest mounting holes for larger boxes
    if (width > 50 && height > 50) {
      features.push({
        id: `mounting_hole_1`,
        type: 'hole',
        parameters: { diameter: 6.0, depth: 0 },
        location: {
          position: [width * 0.1, height * 0.1, 0],
          face: 'top'
        },
        manufacturingProcess: ['cnc_milling'],
        toolAccess: 'top'
      })
    }

    // Suggest edge fillets for production parts
    if (options.qualityLevel === 'production' || options.qualityLevel === 'precision') {
      features.push({
        id: `edge_fillet_1`,
        type: 'fillet',
        parameters: { radius: Math.min(width, height, depth) * 0.05 },
        manufacturingProcess: ['cnc_milling'],
        toolAccess: 'any'
      })
    }

    return features
  }

  /**
   * Suggest features for cylinder geometry
   */
  private static suggestCylinderFeatures(dimensions: any, options: GeometryCreationOptions): Feature[] {
    const features: Feature[] = []
    const { radius, height } = dimensions

    // Suggest center hole for hollow cylinders
    if (options.targetProcess === 'cnc_milling' && radius > 10) {
      features.push({
        id: `center_hole`,
        type: 'hole',
        parameters: { diameter: radius * 0.6, depth: height },
        location: {
          position: [0, 0, 0],
          face: 'center'
        },
        manufacturingProcess: ['cnc_milling'],
        toolAccess: 'top'
      })
    }

    return features
  }

  /**
   * Suggest features for cone geometry
   */
  private static suggestConeFeatures(dimensions: any, options: GeometryCreationOptions): Feature[] {
    const features: Feature[] = []
    // Cones typically don't have common features, but could add tip rounding
    return features
  }

  // Constraint generation methods for different primitive types
  private static getBoxConstraints(dimensions: any, options: GeometryCreationOptions): ManufacturingConstraint[] {
    const constraints: ManufacturingConstraint[] = []
    const { width, height, depth } = dimensions

    // Aspect ratio constraint for thin parts
    const aspectRatio = Math.max(width, height, depth) / Math.min(width, height, depth)
    if (aspectRatio > 10) {
      constraints.push({
        type: 'max_aspect_ratio',
        value: aspectRatio,
        process: 'any',
        severity: 'warning',
        description: 'High aspect ratio may cause vibration during machining'
      })
    }

    return constraints
  }

  private static getCylinderConstraints(dimensions: any, options: GeometryCreationOptions): ManufacturingConstraint[] {
    const constraints: ManufacturingConstraint[] = []
    const { radius, height } = dimensions

    const aspectRatio = height / (2 * radius)
    if (aspectRatio > 5) {
      constraints.push({
        type: 'max_aspect_ratio',
        value: aspectRatio,
        process: 'cnc_milling',
        severity: 'warning',
        description: 'Tall cylinders may require steady rest for turning'
      })
    }

    return constraints
  }

  private static getSphereConstraints(dimensions: any, options: GeometryCreationOptions): ManufacturingConstraint[] {
    return [
      {
        type: 'tool_access',
        value: 1,
        process: 'cnc_milling',
        severity: 'warning',
        description: 'Spheres require specialized toolpaths and multiple setups'
      }
    ]
  }

  private static getConeConstraints(dimensions: any, options: GeometryCreationOptions): ManufacturingConstraint[] {
    return [
      {
        type: 'tool_access',
        value: 1,
        process: 'cnc_milling',
        severity: 'warning',
        description: 'Cone angles may require angled tooling or indexing'
      }
    ]
  }

  private static getTorusConstraints(dimensions: any, options: GeometryCreationOptions): ManufacturingConstraint[] {
    return [
      {
        type: 'tool_access',
        value: 1,
        process: 'cnc_milling',
        severity: 'error',
        description: 'Torus geometry requires 5-axis machining or specialized tooling'
      }
    ]
  }

  // Helper methods
  private static getProcessesForFeature(featureType: Feature['type']): string[] {
    const processMap: Record<Feature['type'], string[]> = {
      hole: ['cnc_milling', 'laser_cutting'],
      fillet: ['cnc_milling'],
      chamfer: ['cnc_milling', 'laser_cutting'],
      extrude: ['3d_printing'],
      cut: ['cnc_milling', 'laser_cutting'],
      shell: ['cnc_milling', '3d_printing'],
      draft: ['injection_molding']
    }

    return processMap[featureType] || ['cnc_milling']
  }

  private static determineToolAccess(featureType: Feature['type'], location?: Feature['location']): Feature['toolAccess'] {
    if (location?.face) {
      return location.face as Feature['toolAccess']
    }
    return 'any'
  }

  /**
   * Get manufacturing complexity estimate for an object
   */
  static estimateComplexity(object: EnhancedWorkspaceObject): {
    complexity_score: number
    manufacturing_time: number
    cost_multiplier: number
    recommended_processes: string[]
  } {
    let complexity = 1
    let timeMultiplier = 1
    let costMultiplier = 1

    // Base complexity by primitive type
    const baseComplexity: Record<string, number> = {
      box: 1.0,
      cylinder: 1.2,
      sphere: 2.0,
      cone: 1.5,
      torus: 3.0
    }

    complexity = baseComplexity[object.type || 'box'] || 1.0

    // Add complexity for features
    if (object.features) {
      object.features.forEach(feature => {
        const template = this.featureTemplates[`${feature.type}_template`]
        if (template) {
          complexity *= template.manufacturingImpact.complexity_increase
          timeMultiplier += template.manufacturingImpact.time_increase
          costMultiplier *= template.manufacturingImpact.cost_multiplier
        }
      })
    }

    // Determine recommended processes
    const material = object.material || this.materialDatabase.aluminum_6061
    const recommendedProcesses = []

    if (material.manufacturability.cnc_rating >= 7) recommendedProcesses.push('cnc_milling')
    if (material.manufacturability.printing_rating >= 7) recommendedProcesses.push('3d_printing')
    if (material.manufacturability.molding_rating >= 7) recommendedProcesses.push('injection_molding')

    return {
      complexity_score: Math.min(complexity, 10),
      manufacturing_time: timeMultiplier,
      cost_multiplier,
      recommended_processes
    }
  }

  /**
   * Validate object manufacturability
   */
  static validateManufacturability(object: EnhancedWorkspaceObject, targetProcess: string): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check constraints
    if (object.manufacturingConstraints) {
      object.manufacturingConstraints.forEach(constraint => {
        if (constraint.process === targetProcess || constraint.process === 'any') {
          if (constraint.severity === 'error') {
            errors.push(constraint.description || `${constraint.type} constraint violated`)
          } else {
            warnings.push(constraint.description || `${constraint.type} may cause issues`)
          }
        }
      })
    }

    // Add suggestions based on analysis
    const complexity = this.estimateComplexity(object)
    if (complexity.complexity_score > 7) {
      suggestions.push('Consider simplifying geometry to reduce manufacturing complexity')
    }
    if (complexity.cost_multiplier > 2) {
      suggestions.push('High cost features detected - consider alternatives')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
}

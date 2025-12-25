// lib/manufacturability/constraints.ts
// Physical constraints database for manufacturability analysis

import { 
  getMaterialProperties, 
  getMinWallThickness, 
  getMinFeatureSize,
  isMaterialProcessCompatible,
  getMaxDepthRatio,
  type Severity 
} from './rules'

export interface ConstraintViolation {
  id: string
  severity: Severity
  category: string
  message: string
  fix: string
  currentValue?: number
  recommendedValue?: number
}

export interface ConstraintCheck {
  id: string
  name: string
  category: string
  check: (params: ConstraintParams) => ConstraintResult
}

export interface ConstraintResult {
  passed: boolean
  violation?: ConstraintViolation
}

export interface ConstraintParams {
  dimensions: Record<string, number>
  features: Array<{ type: string; parameters: Record<string, any> }>
  material: string
  process: string
  volume?: number
}

// Wall thickness constraints
export const WALL_THICKNESS_CHECK: ConstraintCheck = {
  id: 'wall_thickness',
  name: 'Minimum Wall Thickness',
  category: 'Geometry',
  check: (params: ConstraintParams): ConstraintResult => {
    const { dimensions, material, process } = params
    
    // Calculate actual wall thickness from dimensions
    const width = dimensions.width || dimensions.length || 0
    const height = dimensions.height || 0
    const depth = dimensions.depth || 0
    
    // For simple geometry, estimate wall thickness as min dimension
    const minDimension = Math.min(width, height, depth)
    
    // For hollow parts, check wall thickness directly
    const innerDiameter = dimensions.innerDiameter || dimensions.id || 0
    const outerDiameter = dimensions.outerDiameter || dimensions.diameter || 0
    
    let wallThickness = 0
    if (innerDiameter > 0 && outerDiameter > 0) {
      wallThickness = (outerDiameter - innerDiameter) / 2
    } else {
      wallThickness = minDimension / 10 // Estimate for solid parts
    }
    
    const minRequired = getMinWallThickness(material, process)
    
    if (wallThickness < minRequired) {
      return {
        passed: false,
        violation: {
          id: 'wall_thickness',
          severity: 'error',
          category: 'Geometry',
          message: `Wall thickness ${wallThickness.toFixed(2)}mm is below minimum required (${minRequired}mm for ${process})`,
          fix: `Increase wall thickness to at least ${minRequired}mm`,
          currentValue: wallThickness,
          recommendedValue: minRequired,
        }
      }
    }
    
    // Check for excessively thick walls (material waste warning)
    if (wallThickness > 50) {
      return {
        passed: true, // Not a violation, just inefficient
        violation: {
          id: 'wall_thickness_thick',
          severity: 'info',
          category: 'Geometry',
          message: `Very thick wall (${wallThickness.toFixed(2)}mm) - consider redesign to reduce material`,
          fix: 'Consider hollowing the part or using less material',
          currentValue: wallThickness,
        }
      }
    }
    
    return { passed: true }
  }
}

// Hole diameter constraints
export const HOLE_DIAMETER_CHECK: ConstraintCheck = {
  id: 'hole_diameter',
  name: 'Hole Diameter',
  category: 'Features',
  check: (params: ConstraintParams): ConstraintResult => {
    const { features, material, process } = params
    
    const holes = features.filter(f => f.type === 'hole' || f.type === 'bore')
    if (holes.length === 0) return { passed: true }
    
    const props = getMaterialProperties(material)
    const minHoleSize = props.minFeatureSize * 1.5
    
    for (const hole of holes) {
      const diameter = hole.parameters.diameter || hole.parameters.size || 0
      
      if (diameter < minHoleSize) {
        return {
          passed: false,
          violation: {
            id: 'hole_diameter_small',
            severity: 'error',
            category: 'Features',
            message: `Hole diameter ${diameter.toFixed(2)}mm is below minimum manufacturable size`,
            fix: `Increase hole diameter to at least ${minHoleSize.toFixed(2)}mm or use a different manufacturing process`,
            currentValue: diameter,
            recommendedValue: minHoleSize,
          }
        }
      }
    }
    
    return { passed: true }
  }
}

// Hole depth constraints
export const HOLE_DEPTH_CHECK: ConstraintCheck = {
  id: 'hole_depth',
  name: 'Hole Depth Ratio',
  category: 'Features',
  check: (params: ConstraintParams): ConstraintResult => {
    const { dimensions, features, material } = params
    
    const holes = features.filter(f => f.type === 'hole' || f.type === 'bore')
    if (holes.length === 0) return { passed: true }
    
    const maxRatio = getMaxDepthRatio(material, 'cnc-milling')
    const partHeight = dimensions.height || dimensions.length || 100
    
    for (const hole of holes) {
      const depth = hole.parameters.depth || partHeight / 2
      const diameter = hole.parameters.diameter || 10
      const depthRatio = depth / diameter
      
      if (depthRatio > maxRatio) {
        return {
          passed: false,
          violation: {
            id: 'hole_depth_ratio',
            severity: 'warning',
            category: 'Features',
            message: `Hole depth ratio ${depthRatio.toFixed(1)} exceeds recommended maximum (${maxRatio})`,
            fix: 'Consider using a shorter hole, larger diameter, or consider through-hole if possible',
            currentValue: depthRatio,
            recommendedValue: maxRatio,
          }
        }
      }
    }
    
    return { passed: true }
  }
}

// Aspect ratio constraints
export const ASPECT_RATIO_CHECK: ConstraintCheck = {
  id: 'aspect_ratio',
  name: 'Aspect Ratio',
  category: 'Geometry',
  check: (params: ConstraintParams): ConstraintResult => {
    const { dimensions } = params
    
    const width = dimensions.width || dimensions.length || 0
    const height = dimensions.height || 0
    const depth = dimensions.depth || 0
    
    if (width === 0 || height === 0 || depth === 0) return { passed: true }
    
    const maxDim = Math.max(width, height, depth)
    const minDim = Math.min(width, height, depth)
    const ratio = maxDim / minDim
    
    if (ratio > 30) {
      return {
        passed: false,
        violation: {
          id: 'aspect_ratio_extreme',
          severity: 'error',
          category: 'Geometry',
          message: `Extremely high aspect ratio (${ratio.toFixed(1)}) will cause manufacturing and handling issues`,
          fix: 'Consider adding support features, increasing cross-section, or redesigning',
          currentValue: ratio,
          recommendedValue: 20,
        }
      }
    }
    
    if (ratio > 20) {
      return {
        passed: false,
        violation: {
          id: 'aspect_ratio_high',
          severity: 'warning',
          category: 'Geometry',
          message: `High aspect ratio (${ratio.toFixed(1)}) may cause vibration or deflection`,
          fix: 'Consider adding fixtures, reducing length, or increasing cross-section',
          currentValue: ratio,
          recommendedValue: 15,
        }
      }
    }
    
    if (ratio > 15) {
      return {
        passed: true,
        violation: {
          id: 'aspect_ratio_moderate',
          severity: 'info',
          category: 'Geometry',
          message: `Moderate aspect ratio (${ratio.toFixed(1)}) - consider vibration in design`,
          fix: 'May require special fixtures or slower feed rates',
          currentValue: ratio,
        }
      }
    }
    
    return { passed: true }
  }
}

// Edge radius constraints
export const EDGE_RADIUS_CHECK: ConstraintCheck = {
  id: 'edge_radius',
  name: 'Edge Radius',
  category: 'Features',
  check: (params: ConstraintParams): ConstraintResult => {
    const { features, material, process } = params
    
    const fillets = features.filter(f => f.type === 'fillet')
    if (fillets.length === 0) return { passed: true }
    
    const props = getMaterialProperties(material)
    const minRadius = props.minFeatureSize / 2
    
    for (const fillet of fillets) {
      const radius = fillet.parameters.radius || 0
      
      if (radius < minRadius) {
        return {
          passed: false,
          violation: {
            id: 'edge_radius_small',
            severity: 'warning',
            category: 'Features',
            message: `Fillet radius ${radius.toFixed(2)}mm may be difficult to machine`,
            fix: `Increase fillet radius to at least ${minRadius.toFixed(2)}mm or remove the feature`,
            currentValue: radius,
            recommendedValue: minRadius,
          }
        }
      }
    }
    
    return { passed: true }
  }
}

// Thread constraints
export const THREAD_CHECK: ConstraintCheck = {
  id: 'thread',
  name: 'Thread Feasibility',
  category: 'Features',
  check: (params: ConstraintParams): ConstraintResult => {
    const { features, material, process } = params
    
    const threads = features.filter(f => f.type === 'thread')
    if (threads.length === 0) return { passed: true }
    
    if (!process.toLowerCase().includes('cnc')) {
      return {
        passed: false,
        violation: {
          id: 'thread_process',
          severity: 'error',
          category: 'Features',
          message: 'Threads require CNC machining - selected process cannot produce threads',
          fix: 'Change manufacturing process to CNC milling or turning',
        }
      }
    }
    
    for (const thread of threads) {
      const size = thread.parameters.size || 'M6'
      const sizeNum = parseFloat(size.replace('M', ''))
      
      if (sizeNum > 36) {
        return {
          passed: false,
          violation: {
            id: 'thread_size_large',
            severity: 'warning',
            category: 'Features',
            message: `Large thread size (${size}) may require special tooling`,
            fix: 'Consider using standard thread sizes up to M36',
            currentValue: sizeNum,
          }
        }
      }
      
      if (sizeNum < 2) {
        return {
          passed: false,
          violation: {
            id: 'thread_size_small',
            severity: 'error',
            category: 'Features',
            message: `Thread size ${size} is too small for reliable manufacturing`,
            fix: 'Use M3 or larger threads for better reliability',
            currentValue: sizeNum,
          }
        }
      }
    }
    
    return { passed: true }
  }
}

// Material-process compatibility check
export const MATERIAL_COMPATIBILITY_CHECK: ConstraintCheck = {
  id: 'material_process',
  name: 'Material-Process Compatibility',
  category: 'Material',
  check: (params: ConstraintParams): ConstraintResult => {
    const { material, process } = params
    
    if (!isMaterialProcessCompatible(material, process)) {
      return {
        passed: false,
        violation: {
          id: 'material_process_incompatible',
          severity: 'error',
          category: 'Material',
          message: `${material} is not compatible with ${process}`,
          fix: `Select a compatible material for ${process} or change the manufacturing process`,
        }
      }
    }
    
    return { passed: true }
  }
}

// Feature count constraints
export const FEATURE_COUNT_CHECK: ConstraintCheck = {
  id: 'feature_count',
  name: 'Feature Complexity',
  category: 'Geometry',
  check: (params: ConstraintParams): ConstraintResult => {
    const { features, process } = params
    
    const holeCount = features.filter(f => f.type === 'hole').length
    const complexCount = features.filter(f => 
      ['pocket', 'slot', 'boss', 'cutout', 'thread', 'bore'].includes(f.type)
    ).length
    
    if (complexCount > 10) {
      return {
        passed: false,
        violation: {
          id: 'feature_count_high',
          severity: 'warning',
          category: 'Geometry',
          message: `High feature complexity (${complexCount} complex features) will increase manufacturing time and cost`,
          fix: 'Consider simplifying the design or combining features',
        }
      }
    }
    
    if (holeCount > 20) {
      return {
        passed: true,
        violation: {
          id: 'hole_count_many',
          severity: 'info',
          category: 'Geometry',
          message: `${holeCount} holes - consider using a production method like EDM or stamping for high volumes`,
        }
      }
    }
    
    return { passed: true }
  }
}

// Undercut detection
export const UNDERCUT_CHECK: ConstraintCheck = {
  id: 'undercut',
  name: 'Undercut Detection',
  category: 'Geometry',
  check: (params: ConstraintParams): ConstraintResult => {
    const { features, process } = params
    
    const undercuts = features.filter(f => f.type === 'undercut')
    if (undercuts.length === 0) return { passed: true }
    
    if (!process.toLowerCase().includes('5axis') && !process.toLowerCase().includes('edm')) {
      return {
        passed: false,
        violation: {
          id: 'undercut_process',
          severity: 'warning',
          category: 'Geometry',
          message: 'Undercuts detected - require 5-axis machining or EDM',
          fix: 'Use 5-axis CNC or wire EDM, or redesign to eliminate undercuts',
        }
      }
    }
    
    return { passed: true }
  }
}

// Draft angle check (for casting/printing)
export const DRAFT_ANGLE_CHECK: ConstraintCheck = {
  id: 'draft_angle',
  name: 'Draft Angle',
  category: 'Geometry',
  check: (params: ConstraintParams): ConstraintResult => {
    const { dimensions, features, process } = params
    
    // Only check for 3D printing or specific processes
    if (!process.toLowerCase().includes('print')) {
      return { passed: true }
    }
    
    const hasVerticalWalls = !features.some(f => f.type === 'draft')
    
    if (hasVerticalWalls && process.toLowerCase().includes('sls')) {
      return {
        passed: true,
        violation: {
          id: 'draft_angle_sls',
          severity: 'info',
          category: 'Geometry',
          message: 'SLA printing - vertical walls may require support structures',
          fix: 'Consider adding 1-2° draft angle to vertical surfaces to reduce support needs',
        }
      }
    }
    
    return { passed: true }
  }
}

// All constraint checks
export const ALL_CONSTRAINT_CHECKS: ConstraintCheck[] = [
  WALL_THICKNESS_CHECK,
  HOLE_DIAMETER_CHECK,
  HOLE_DEPTH_CHECK,
  ASPECT_RATIO_CHECK,
  EDGE_RADIUS_CHECK,
  THREAD_CHECK,
  MATERIAL_COMPATIBILITY_CHECK,
  FEATURE_COUNT_CHECK,
  UNDERCUT_CHECK,
  DRAFT_ANGLE_CHECK,
]

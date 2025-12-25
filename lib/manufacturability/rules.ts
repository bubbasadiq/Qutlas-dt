// lib/manufacturability/rules.ts
// Manufacturing rules database for manufacturability assessment

export type Severity = 'critical' | 'error' | 'warning' | 'info'

export interface ManufacturingRule {
  id: string
  name: string
  description: string
  severity: Severity
  process: string[]
  category: string
  check: (params: RuleParams) => boolean
  message: string
  fix: string
  reference?: string
}

export interface RuleParams {
  dimensions: Record<string, number>
  features: Array<{ type: string; parameters: Record<string, any> }>
  material: string
  process: string
  volume?: number
}

// Material properties for rule evaluation
export const MATERIAL_PROPERTIES: Record<string, {
  density: number
  machinability: number // 1-10, higher is easier
  minWallThickness: { [key: string]: number }
  maxDepthRatio: number
  minFeatureSize: number
}> = {
  'aluminum-6061': {
    density: 2.7,
    machinability: 9,
    minWallThickness: { cnc: 1.5, printing: 0.8, sheet: 1.0 },
    maxDepthRatio: 8,
    minFeatureSize: 2.0,
  },
  'aluminum-7075': {
    density: 2.81,
    machinability: 7,
    minWallThickness: { cnc: 1.5, printing: 0.8, sheet: 1.0 },
    maxDepthRatio: 7,
    minFeatureSize: 2.0,
  },
  'steel-4140': {
    density: 7.85,
    machinability: 6,
    minWallThickness: { cnc: 2.0, printing: 1.5, sheet: 1.5 },
    maxDepthRatio: 5,
    minFeatureSize: 3.0,
  },
  'stainless-steel-304': {
    density: 8.0,
    machinability: 4,
    minWallThickness: { cnc: 2.0, printing: 1.5, sheet: 1.5 },
    maxDepthRatio: 4,
    minFeatureSize: 3.0,
  },
  'brass-360': {
    density: 8.5,
    machinability: 10,
    minWallThickness: { cnc: 1.0, printing: 1.0, sheet: 1.0 },
    maxDepthRatio: 10,
    minFeatureSize: 1.5,
  },
  'titanium-ti6al4v': {
    density: 4.43,
    machinability: 3,
    minWallThickness: { cnc: 2.5, printing: 1.5, sheet: 2.0 },
    maxDepthRatio: 3,
    minFeatureSize: 4.0,
  },
  'abs': {
    density: 1.05,
    machinability: 8,
    minWallThickness: { cnc: 1.5, printing: 0.8, sheet: 1.0 },
    maxDepthRatio: 6,
    minFeatureSize: 1.5,
  },
  'nylon-6': {
    density: 1.14,
    machinability: 6,
    minWallThickness: { cnc: 2.0, printing: 1.0, sheet: 1.5 },
    maxDepthRatio: 5,
    minFeatureSize: 2.0,
  },
  'pla': {
    density: 1.24,
    machinability: 8,
    minWallThickness: { cnc: 1.0, printing: 0.6, sheet: 1.0 },
    maxDepthRatio: 6,
    minFeatureSize: 1.0,
  },
  'resin': {
    density: 1.15,
    machinability: 7,
    minWallThickness: { cnc: 1.0, printing: 0.5, sheet: 1.0 },
    maxDepthRatio: 5,
    minFeatureSize: 0.8,
  },
  'carbon-fiber': {
    density: 1.6,
    machinability: 3,
    minWallThickness: { cnc: 3.0, printing: 1.5, sheet: 2.0 },
    maxDepthRatio: 3,
    minFeatureSize: 4.0,
  },
}

export function getMaterialProperties(materialId: string) {
  return MATERIAL_PROPERTIES[materialId] || MATERIAL_PROPERTIES['aluminum-6061']
}

// Process compatibility matrix
export const PROCESS_COMPATIBILITY: Record<string, string[]> = {
  'cnc-milling': ['aluminum-6061', 'aluminum-7075', 'steel-4140', 'stainless-steel-304', 'brass-360', 'titanium-ti6al4v', 'abs', 'nylon-6', 'peek', 'delrin', 'carbon-fiber'],
  'cnc-turning': ['aluminum-6061', 'aluminum-7075', 'steel-4140', 'stainless-steel-304', 'brass-360', 'titanium-ti6al4v', 'copper-101'],
  'laser-cutting': ['acrylic', 'wood', 'leather', 'fabric', 'paper', 'stainless-steel-304', 'carbon-fiber'],
  '3d-printing': ['pla', 'abs', 'petg', 'resin', 'nylon-6', 'peek'],
  'sheet-metal': ['steel-4140', 'aluminum-6061', 'stainless-steel-304'],
}

// Hole diameter limits by process
export const HOLE_LIMITS: Record<string, { min: number; max: number }> = {
  'cnc-milling': { min: 2.0, max: 100 },
  'cnc-turning': { min: 3.0, max: 200 },
  'laser-cutting': { min: 0.5, max: 50 },
  '3d-printing': { min: 0.5, max: 50 },
  'sheet-metal': { min: 3.0, max: 150 },
}

// Thread size limits
export const THREAD_LIMITS: Record<string, { min: string; max: string }> = {
  'cnc-milling': { min: 'M2', max: 'M36' },
  'cnc-turning': { min: 'M2', max: 'M100' },
  '3d-printing': { min: 'M3', max: 'M12' },
}

// Edge radius limits
export const EDGE_RADIUS_LIMITS: Record<string, { min: number; max: number }> = {
  'cnc-milling': { min: 0.5, max: 10 },
  'cnc-turning': { min: 0.25, max: 5 },
  '3d-printing': { min: 0.3, max: 2 },
}

// Bend radius limits for sheet metal
export const BEND_RADIUS_LIMITS: Record<string, number> = {
  'aluminum-6061': 0.5,
  'steel-4140': 1.0,
  'stainless-steel-304': 1.5,
}

// Get minimum wall thickness for material and process
export function getMinWallThickness(material: string, process: string): number {
  const props = getMaterialProperties(material)
  const processKey = process.toLowerCase().includes('print') ? 'printing' 
    : process.toLowerCase().includes('cnc') || process.toLowerCase().includes('mill') ? 'cnc'
    : process.toLowerCase().includes('sheet') ? 'sheet'
    : 'cnc'
  return props.minWallThickness[processKey] || 2.0
}

// Get minimum feature size for material and process
export function getMinFeatureSize(material: string, process: string): number {
  const props = getMaterialProperties(material)
  return props.minFeatureSize
}

// Check if material is compatible with process
export function isMaterialProcessCompatible(material: string, process: string): boolean {
  const compatible = PROCESS_COMPATIBILITY[process.toLowerCase()]
  if (!compatible) return true
  return compatible.some(m => 
    material.toLowerCase().includes(m.toLowerCase()) || 
    m.toLowerCase().includes(material.toLowerCase())
  )
}

// Calculate tolerance based on process and material
export function getAchievableTolerance(process: string, material: string): number {
  let tolerance = 0.1 // Base tolerance in mm
  
  // Process precision
  if (process.toLowerCase().includes('cnc')) {
    tolerance = 0.05
  } else if (process.toLowerCase().includes('print')) {
    tolerance = 0.2
  } else if (process.toLowerCase().includes('laser')) {
    tolerance = 0.1
  } else if (process.toLowerCase().includes('sheet')) {
    tolerance = 0.15
  }
  
  // Material factor
  const props = getMaterialProperties(material)
  if (props.machinability < 5) {
    tolerance *= 1.5 // Less machinable materials have wider tolerances
  }
  
  return tolerance
}

// Calculate estimated surface finish
export function getEstimatedSurfaceFinish(process: string, material: string): string {
  if (process.toLowerCase().includes('cnc')) {
    return 'Ra 0.8-1.6 μm'
  } else if (process.toLowerCase().includes('print')) {
    return 'Ra 3.2-6.3 μm (as printed)'
  } else if (process.toLowerCase().includes('laser')) {
    return 'Ra 1.6-3.2 μm'
  }
  return 'Ra 3.2 μm'
}

// Calculate draft angle requirement
export function getDraftAngleRequirement(process: string, material: string): number {
  if (process.toLowerCase().includes('print')) {
    // 3D printing often needs no draft, but helps with removal
    return 0
  } else if (process.toLowerCase().includes('sheet')) {
    return 0 // Sheet metal bending
  }
  return 1 // Standard milling benefit
}

// Get maximum depth ratio for holes
export function getMaxDepthRatio(material: string, process: string): number {
  const props = getMaterialProperties(material)
  return props.maxDepthRatio
}

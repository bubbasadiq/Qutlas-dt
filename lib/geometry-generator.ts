// lib/geometry-generator.ts
// Geometry generation from AI intent

import * as THREE from 'three'
import type { WorkspaceObject } from '@/hooks/use-workspace'

export type GeometryType = 
  | 'box' 
  | 'cylinder' 
  | 'sphere' 
  | 'cone' 
  | 'torus' 
  | 'extrusion' 
  | 'custom'

export type MaterialType = 
  | 'aluminum-6061'
  | 'aluminum-7075'
  | 'steel-4140'
  | 'stainless-steel-304'
  | 'brass-360'
  | 'copper-101'
  | 'titanium-ti6al4v'
  | 'abs'
  | 'nylon-6'
  | 'peek'
  | 'delrin'
  | 'carbon-fiber'
  | 'resin'
  | 'pla'
  | 'other'

export type ProcessType = 
  | 'cnc-milling'
  | 'cnc-turning'
  | 'laser-cutting'
  | '3d-printing'
  | 'sheet-metal'

export type FeatureType = 
  | 'hole'
  | 'fillet'
  | 'chamfer'
  | 'slot'
  | 'pocket'
  | 'boss'
  | 'thread'
  | 'cutout'
  | 'bore'

export interface GeometryFeature {
  type: FeatureType
  parameters: Record<string, any>
}

export interface GeometryIntent {
  type: GeometryType
  description: string
  dimensions: {
    width?: number
    height?: number
    depth?: number
    length?: number
    radius?: number
    diameter?: number
    majorRadius?: number
    minorRadius?: number
    tube?: number
    outerDiameter?: number
    innerDiameter?: number
    wallThickness?: number
    [key: string]: number | undefined
  }
  material: MaterialType
  tolerance: 'standard' | 'precision' | 'high-precision'
  features: GeometryFeature[]
  quantity: number
  process: ProcessType
}

export interface GeometryGenerationResult {
  success: boolean
  geometry?: {
    id: string
    type: GeometryType
    dimensions: Record<string, number>
    features: GeometryFeature[]
    material: MaterialType
    process: ProcessType
    volume: number
    boundingBox: { width: number; height: number; depth: number }
  }
  mesh?: THREE.Mesh
  errors?: string[]
  warnings?: string[]
}

// Material colors for rendering
const MATERIAL_COLORS: Record<MaterialType, string> = {
  'aluminum-6061': '#C0C0C0',
  'aluminum-7075': '#B0B0B0',
  'steel-4140': '#808080',
  'stainless-steel-304': '#A8A8A8',
  'brass-360': '#DAA520',
  'copper-101': '#B87333',
  'titanium-ti6al4v': '#9FA0A3',
  'abs': '#FFFACD',
  'nylon-6': '#F5F5DC',
  'peek': '#DEB887',
  'delrin': '#FFFAF0',
  'carbon-fiber': '#2F4F4F',
  'resin': '#E6E6FA',
  'pla': '#FF6B6B',
  'other': '#0077FF',
}

export function getMaterialColor(material: MaterialType): string {
  return MATERIAL_COLORS[material] || MATERIAL_COLORS['other']
}

export function generateMeshFromIntent(intent: GeometryIntent): THREE.Mesh {
  const { type, dimensions, features } = intent
  let geometry: THREE.BufferGeometry

  // Extract dimensions with defaults
  const width = dimensions.width || dimensions.length || 50
  const height = dimensions.height || 50
  const depth = dimensions.depth || dimensions.width || 50
  const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 25)
  const majorRadius = dimensions.majorRadius || dimensions.radius || 50
  const minorRadius = dimensions.minorRadius || dimensions.tube || 15

  switch (type) {
    case 'box':
    case 'cube':
      geometry = new THREE.BoxGeometry(width, height, depth)
      break

    case 'cylinder':
      geometry = new THREE.CylinderGeometry(radius, radius, height, 32)
      break

    case 'sphere':
      geometry = new THREE.SphereGeometry(radius, 32, 32)
      break

    case 'cone':
      geometry = new THREE.ConeGeometry(radius, height, 32)
      break

    case 'torus':
      geometry = new THREE.TorusGeometry(majorRadius, minorRadius, 16, 48)
      break

    case 'extrusion':
      // For extrusion, create a box as base shape
      geometry = new THREE.BoxGeometry(width, height, depth)
      break

    default:
      geometry = new THREE.BoxGeometry(width, height, depth)
  }

  // Apply features (holes, fillets, etc.)
  geometry = applyFeatures(geometry, features, dimensions)

  // Create material with material color
  const materialColor = parseInt(getMaterialColor(intent.material).replace('#', '0x'))
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: materialColor,
    roughness: 0.4,
    metalness: intent.material.includes('steel') || intent.material.includes('titanium') ? 0.7 : 0.3,
  })

  const mesh = new THREE.Mesh(geometry, meshMaterial)
  mesh.castShadow = true
  mesh.receiveShadow = true

  return mesh
}

function applyFeatures(
  geometry: THREE.BufferGeometry,
  features: GeometryFeature[],
  dimensions: Record<string, number>
): THREE.BufferGeometry {
  // For now, we only support basic feature visualization
  // In a full implementation, this would modify the geometry
  // to actually cut holes, add fillets, etc.
  
  if (features.length === 0) {
    return geometry
  }

  // Check if we need to create a group for compound geometry
  const hasHoles = features.some(f => f.type === 'hole' || f.type === 'cutout' || f.type === 'bore')
  
  if (!hasHoles) {
    return geometry
  }

  // For compound geometry with holes, we'll return the base geometry
  // The actual hole cutting would require CSG operations
  // which are beyond pure THREE.js geometry primitives
  
  return geometry
}

export function generateGeometryFromIntent(
  intent: GeometryIntent,
  id?: string
): GeometryGenerationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate dimensions
  const { dimensions } = intent
  
  if (dimensions.width !== undefined && dimensions.width < 0.1) {
    errors.push('Width must be at least 0.1mm')
  }
  if (dimensions.height !== undefined && dimensions.height < 0.1) {
    errors.push('Height must be at least 0.1mm')
  }
  if (dimensions.depth !== undefined && dimensions.depth < 0.1) {
    errors.push('Depth must be at least 0.1mm')
  }
  if (dimensions.radius !== undefined && dimensions.radius < 0.1) {
    errors.push('Radius must be at least 0.1mm')
  }

  // Check for reasonable aspect ratios
  const maxDim = Math.max(
    dimensions.width || 0,
    dimensions.height || 0,
    dimensions.depth || 0
  )
  const minDim = Math.min(
    dimensions.width || 100,
    dimensions.height || 100,
    dimensions.depth || 100
  )
  
  if (maxDim / minDim > 50) {
    warnings.push('Extremely high aspect ratio detected - may cause manufacturing issues')
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings }
  }

  try {
    const mesh = generateMeshFromIntent(intent)
    
    // Calculate volume
    const volume = calculateVolume(intent)
    
    // Calculate bounding box
    geometry.computeBoundingBox()
    const bbox = geometry.boundingBox!
    const boundingBox = {
      width: bbox.max.x - bbox.min.x,
      height: bbox.max.y - bbox.min.y,
      depth: bbox.max.z - bbox.min.z,
    }

    return {
      success: true,
      geometry: {
        id: id || `geo_${Date.now()}`,
        type: intent.type,
        dimensions: intent.dimensions,
        features: intent.features,
        material: intent.material,
        process: intent.process,
        volume,
        boundingBox,
      },
      mesh,
      warnings,
    }
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error generating geometry'],
      warnings,
    }
  }
}

// Calculate volume based on geometry type
function calculateVolume(intent: GeometryIntent): number {
  const { type, dimensions } = intent
  
  switch (type) {
    case 'box': {
      const width = dimensions.width || dimensions.length || 50
      const height = dimensions.height || 50
      const depth = dimensions.depth || dimensions.width || 50
      return width * height * depth
    }
    
    case 'cylinder': {
      const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 25)
      const height = dimensions.height || 50
      return Math.PI * radius * radius * height
    }
    
    case 'sphere': {
      const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 25)
      return (4/3) * Math.PI * Math.pow(radius, 3)
    }
    
    case 'cone': {
      const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 25)
      const height = dimensions.height || 50
      return (1/3) * Math.PI * radius * radius * height
    }
    
    case 'torus': {
      const R = dimensions.majorRadius || dimensions.radius || 50
      const r = dimensions.minorRadius || dimensions.tube || 15
      return Math.PI * r * r * 2 * Math.PI * R
    }
    
    case 'extrusion': {
      const area = (dimensions.width || 50) * (dimensions.depth || 50)
      return area * (dimensions.height || 50)
    }
    
    default:
      return 100000 // Default 10cm³
  }
}

// Convert geometry intent to workspace object
export function intentToWorkspaceObject(
  intent: GeometryIntent,
  id?: string
): Partial<WorkspaceObject> {
  const geometryId = id || `geo_${Date.now()}`
  
  return {
    id: geometryId,
    type: intent.type,
    dimensions: intent.dimensions,
    features: intent.features,
    material: intent.material,
    description: intent.description,
    color: getMaterialColor(intent.material),
    visible: true,
    selected: false,
    params: intent.dimensions,
  }
}

// Update intent with refinement
export function refineIntent(
  currentIntent: GeometryIntent,
  refinement: Partial<GeometryIntent>
): GeometryIntent {
  return {
    ...currentIntent,
    ...refinement,
    dimensions: {
      ...currentIntent.dimensions,
      ...(refinement.dimensions || {}),
    },
    features: refinement.features || currentIntent.features,
  }
}

// Create a modification intent (e.g., "make it 20mm taller")
export function parseModification(
  currentIntent: GeometryIntent,
  modification: string
): Partial<GeometryIntent> {
  const modLower = modification.toLowerCase()
  const updates: Partial<GeometryIntent> = {}

  // Parse dimension modifications
  const dimensionPatterns = [
    { regex: /(\d+(?:\.\d+)?)\s*mm?\s*(?:taller|higher|longer|longer)/i, dim: 'height' },
    { regex: /(\d+(?:\.\d+)?)\s*mm?\s*(?:wider|wide)/i, dim: 'width' },
    { regex: /(\d+(?:\.\d+)?)\s*mm?\s*(?:deeper|deep)/i, dim: 'depth' },
    { regex: /(\d+(?:\.\d+)?)\s*mm?\s*(?:larger|bigger|big)/i, dim: 'width', action: 'scale' },
    { regex: /(\d+(?:\.\d+)?)\s*mm?\s*(?:radius|radius)/i, dim: 'radius' },
    { regex: /(\d+(?:\.\d+)?)\s*mm?\s*(?:diameter|dia)/i, dim: 'diameter' },
  ]

  for (const { regex, dim, action } of dimensionPatterns) {
    const match = modLower.match(regex)
    if (match) {
      const value = parseFloat(match[1])
      if (action === 'scale') {
        updates.dimensions = {
          width: value,
          height: currentIntent.dimensions.height || 50,
          depth: value,
        }
      } else {
        if (!updates.dimensions) updates.dimensions = {}
        updates.dimensions[dim] = value
      }
    }
  }

  // Parse material changes
  const materialPatterns = [
    { regex: /(?:change|set|make)\s+(?:material|to)\s+(?:aluminum|alu)/i, material: 'aluminum-6061' },
    { regex: /(?:change|set|make)\s+(?:material|to)\s+steel/i, material: 'steel-4140' },
    { regex: /(?:change|set|make)\s+(?:material|to)\s+(?:stainless|ss)/i, material: 'stainless-steel-304' },
    { regex: /(?:change|set|make)\s+(?:material|to)\s+brass/i, material: 'brass-360' },
    { regex: /(?:change|set|make)\s+(?:material|to)\s+(?:titanium|ti)/i, material: 'titanium-ti6al4v' },
    { regex: /(?:change|set|make)\s+(?:material|to)\s+plastic/i, material: 'abs' },
  ]

  for (const { regex, material } of materialPatterns) {
    if (regex.test(modLower)) {
      updates.material = material as MaterialType
      break
    }
  }

  // Parse feature additions
  const featurePatterns = [
    { regex: /(\d+)\s*(?:mm|)\s*(?:hole|holes)/i, type: 'hole', paramKey: 'diameter' },
    { regex: /fillet\s+(\d+(?:\.\d+)?)\s*mm/i, type: 'fillet', paramKey: 'radius' },
    { regex: /chamfer\s+(\d+(?:\.\d+)?)\s*mm/i, type: 'chamfer', paramKey: 'width' },
  ]

  if (modLower.includes('add') || modLower.includes('with')) {
    const features: GeometryFeature[] = [...currentIntent.features]
    
    for (const { regex, type, paramKey } of featurePatterns) {
      const match = modLower.match(regex)
      if (match) {
        const value = parseFloat(match[1])
        features.push({
          type: type as FeatureType,
          parameters: { [paramKey]: value },
        })
      }
    }
    
    if (features.length > currentIntent.features.length) {
      updates.features = features
    }
  }

  return updates
}

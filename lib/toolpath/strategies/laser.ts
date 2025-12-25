// lib/toolpath/strategies/laser.ts
// Laser cutting toolpath strategies

export interface LaserToolpathStrategy {
  id: string
  name: string
  description: string
  strategy: string
  suitableFor: string[]
  parameters: LaserToolpathParameters
  estimatedTime: LaserTimeEstimate
  notes?: string
}

export interface LaserToolpathParameters {
  power: number
  speed: number
  frequency: number
  gasAssist: string
  focusPosition: number
  kerfCompensation: number
}

export interface LaserTimeEstimate {
  cutMinutes: number
  setupMinutes: number
  totalMinutes: number
}

const LASER_STRATEGIES: LaserToolpathStrategy[] = [
  {
    id: 'laser-2d-contour',
    name: '2D Contour Cut',
    description: 'Standard single-pass contour cutting',
    strategy: 'Lead-in + Contour (1 pass) + Lead-out',
    suitableFor: ['flat', 'profile', 'simple'],
    parameters: {
      power: 80,
      speed: 15,
      frequency: 5000,
      gasAssist: 'Air',
      focusPosition: 0,
      kerfCompensation: 0.1,
    },
    estimatedTime: {
      cutMinutes: 5,
      setupMinutes: 5,
      totalMinutes: 10,
    },
    notes: 'Best for thin materials up to 6mm',
  },
  {
    id: 'laser-multi-pass',
    name: 'Multi-Pass Cut',
    description: 'For thick materials requiring multiple passes',
    strategy: 'Multiple passes with decreasing power',
    suitableFor: ['thick', 'acrylic', 'wood'],
    parameters: {
      power: 100,
      speed: 8,
      frequency: 5000,
      gasAssist: 'Air',
      focusPosition: 0,
      kerfCompensation: 0.15,
    },
    estimatedTime: {
      cutMinutes: 20,
      setupMinutes: 8,
      totalMinutes: 28,
    },
    notes: 'Use for materials over 6mm thickness',
  },
  {
    id: 'laser-edge-finish',
    name: 'Edge Finish Cut',
    description: 'Optimized for clean edge finish with minimal charring',
    strategy: 'Two-pass with different power levels',
    suitableFor: ['acrylic', 'visible-edges', 'display'],
    parameters: {
      power: 70,
      speed: 20,
      frequency: 3000,
      gasAssist: 'Nitrogen',
      focusPosition: -0.5,
      kerfCompensation: 0.08,
    },
    estimatedTime: {
      cutMinutes: 12,
      setupMinutes: 8,
      totalMinutes: 20,
    },
    notes: 'Produces cleaner edges with less discoloration',
  },
  {
    id: 'laser-scoring',
    name: 'Scoring Pass',
    description: 'Partial cut for fold lines in sheet metal',
    strategy: 'Partial depth scoring pass',
    suitableFor: ['fold-line', 'sheet-metal', 'snap-fit'],
    parameters: {
      power: 40,
      speed: 30,
      frequency: 5000,
      gasAssist: 'Air',
      focusPosition: 0,
      kerfCompensation: 0.05,
    },
    estimatedTime: {
      cutMinutes: 3,
      setupMinutes: 5,
      totalMinutes: 8,
    },
    notes: 'Creates controlled break line without full cut',
  },
]

const MATERIAL_LASER_DATA: Record<string, {
  thicknessRange: [number, number]
  powerRequired: number
  speedFactor: number
  gasRequired: string
}> = {
  'acrylic': {
    thicknessRange: [1, 20],
    powerRequired: 80,
    speedFactor: 1.0,
    gasRequired: 'Air',
  },
  'wood': {
    thicknessRange: [1, 15],
    powerRequired: 100,
    speedFactor: 0.7,
    gasRequired: 'Air',
  },
  'leather': {
    thicknessRange: [1, 6],
    powerRequired: 60,
    speedFactor: 1.2,
    gasRequired: 'Air',
  },
  'fabric': {
    thicknessRange: [1, 3],
    powerRequired: 50,
    speedFactor: 1.5,
    gasRequired: 'Air',
  },
  'paper': {
    thicknessRange: [0.1, 3],
    powerRequired: 40,
    speedFactor: 2.0,
    gasRequired: 'Air',
  },
  'stainless-steel-304': {
    thicknessRange: [0.5, 6],
    powerRequired: 100,
    speedFactor: 0.3,
    gasRequired: 'Oxygen',
  },
  'carbon-fiber': {
    thicknessRange: [0.5, 3],
    powerRequired: 90,
    speedFactor: 0.5,
    gasRequired: 'Air',
  },
}

export function getLaserToolpathStrategies(): LaserToolpathStrategy[] {
  return LASER_STRATEGIES
}

export function selectLaserToolpathStrategy(
  material: string,
  thickness: number,
  edgeQuality: 'standard' | 'high' = 'standard'
): LaserToolpathStrategy {
  const materialData = MATERIAL_LASER_DATA[material] || MATERIAL_LASER_DATA['acrylic']
  
  // Check if material supports the thickness
  const [minThickness, maxThickness] = materialData.thicknessRange
  if (thickness > maxThickness) {
    // Use multi-pass for thick materials
    return LASER_STRATEGIES.find(s => s.id === 'laser-multi-pass') || LASER_STRATEGIES[1]
  }
  
  if (edgeQuality === 'high') {
    return LASER_STRATEGIES.find(s => s.id === 'laser-edge-finish') || LASER_STRATEGIES[2]
  }
  
  return LASER_STRATEGIES.find(s => s.id === 'laser-2d-contour') || LASER_STRATEGIES[0]
}

export function calculateLaserTime(
  perimeterMm: number,
  material: string,
  thickness: number,
  strategy: LaserToolpathStrategy
): LaserTimeEstimate {
  const materialData = MATERIAL_LASER_DATA[material] || MATERIAL_LASER_DATA['acrylic']
  
  // Calculate base cut speed
  const baseSpeed = strategy.parameters.speed * materialData.speedFactor
  
  // Calculate number of passes for thick materials
  const passes = thickness > 6 ? Math.ceil(thickness / 3) : 1
  
  // Calculate cut time based on perimeter and speed
  // Speed is in mm/sec, so convert to minutes
  const cutTimeMinutes = (perimeterMm / baseSpeed / 60) * passes
  
  return {
    cutMinutes: Math.max(1, Math.round(cutTimeMinutes)),
    setupMinutes: strategy.estimatedTime.setupMinutes,
    totalMinutes: Math.round(cutTimeMinutes) + strategy.estimatedTime.setupMinutes,
  }
}

export function getLaserParameters(
  material: string,
  thickness: number
): { power: number; speed: number; focusOffset: number } {
  const materialData = MATERIAL_LASER_DATA[material] || MATERIAL_LASER_DATA['acrylic']
  
  // Adjust for thickness
  const thicknessFactor = thickness / 3 // Normalize to 3mm
  
  // Calculate power based on thickness
  const power = Math.min(100, materialData.powerRequired * Math.sqrt(thicknessFactor))
  
  // Adjust speed for thickness (thicker = slower)
  const speed = materialData.speedFactor * (20 / Math.sqrt(thicknessFactor))
  
  // Focus offset for thick materials (focus slightly below surface)
  const focusOffset = thickness > 10 ? -1 : thickness > 5 ? -0.5 : 0
  
  return {
    power: Math.round(power),
    speed: Math.round(speed * 10) / 10,
    focusOffset,
  }
}

export function calculateKerfCompensation(
  material: string,
  thickness: number,
  power: number
): number {
  // Kerf width depends on material, thickness, and power
  const baseKerf = 0.1 // Base kerf in mm
  
  // Adjust for power (higher power = wider kerf)
  const powerFactor = power / 80
  
  // Adjust for thickness (thicker = slightly wider kerf at edges)
  const thicknessFactor = 1 + (thickness / 50)
  
  return Math.round(baseKerf * powerFactor * thicknessFactor * 100) / 100
}

export function getGasRequirements(
  material: string
): { type: string; pressure: string; purpose: string } {
  const materialData = MATERIAL_LASER_DATA[material]
  
  if (materialData?.gasRequired === 'Oxygen') {
    return {
      type: 'Oxygen',
      pressure: '0.5-1.0 bar',
      purpose: 'Exothermic reaction aids cutting steel',
    }
  }
  
  if (material.includes('steel') || material.includes('metal')) {
    return {
      type: 'Nitrogen',
      pressure: '0.3-0.8 bar',
      purpose: 'Blows molten metal from kerf, prevents oxidation',
    }
  }
  
  return {
    type: 'Compressed Air',
    pressure: '0.2-0.5 bar',
    purpose: 'Removes debris and cools lens',
  }
}

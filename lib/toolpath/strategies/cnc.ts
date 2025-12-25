// lib/toolpath/strategies/cnc.ts
// CNC milling toolpath strategies

export interface CNCToolpathStrategy {
  id: string
  name: string
  description: string
  strategy: string
  suitableFor: string[]
  parameters: CNCToolpathParameters
  estimatedTime: CNCTimeEstimate
  notes?: string
}

export interface CNCToolpathParameters {
  roughingFeedRate: number
  finishingFeedRate: number
  spindleSpeed: number
  stepdown: number
  stepover: number
  toolDiameter: number
  coolant: boolean
}

export interface CNCTimeEstimate {
  roughingMinutes: number
  finishingMinutes: number
  setupMinutes: number
  totalMinutes: number
}

const CNC_STRATEGIES: CNCToolpathStrategy[] = [
  {
    id: 'cnc-2p5-pocket',
    name: '2.5D Pocket + Contour',
    description: 'Best for prismatic parts with simple features',
    strategy: 'Pocketing (2.5D) + contour finishing',
    suitableFor: ['box', 'plate', 'bracket', 'simple'],
    parameters: {
      roughingFeedRate: 800,
      finishingFeedRate: 400,
      spindleSpeed: 12000,
      stepdown: 2.0,
      stepover: 0.6,
      toolDiameter: 6,
      coolant: true,
    },
    estimatedTime: {
      roughingMinutes: 15,
      finishingMinutes: 5,
      setupMinutes: 10,
      totalMinutes: 30,
    },
    notes: 'Standard strategy for most prismatic parts',
  },
  {
    id: 'cnc-3d-adaptive',
    name: '3D Adaptive + Finishing',
    description: 'For complex 3D geometries with varying heights',
    strategy: 'Adaptive clearing (3D) + rest machining + finish passes',
    suitableFor: ['torus', 'cone', 'sphere', 'complex', 'organic'],
    parameters: {
      roughingFeedRate: 600,
      finishingFeedRate: 300,
      spindleSpeed: 15000,
      stepdown: 1.5,
      stepover: 0.4,
      toolDiameter: 6,
      coolant: true,
    },
    estimatedTime: {
      roughingMinutes: 25,
      finishingMinutes: 10,
      setupMinutes: 15,
      totalMinutes: 50,
    },
    notes: 'Best for complex 3D surfaces with varying geometry',
  },
  {
    id: 'cnc-high-speed',
    name: 'High-Speed Machining',
    description: 'Optimized for difficult materials and minimal material removal',
    strategy: 'Trochoidal milling + light passes',
    suitableFor: ['titanium', 'hard-materials', 'thin-walls'],
    parameters: {
      roughingFeedRate: 400,
      finishingFeedRate: 200,
      spindleSpeed: 18000,
      stepdown: 0.5,
      stepover: 0.15,
      toolDiameter: 3,
      coolant: true,
    },
    estimatedTime: {
      roughingMinutes: 40,
      finishingMinutes: 15,
      setupMinutes: 20,
      totalMinutes: 75,
    },
    notes: 'Reduces tool wear on difficult materials',
  },
  {
    id: 'cnc-rough-finish',
    name: 'Rough + Finish Two-Pass',
    description: 'Aggressive roughing followed by precision finishing',
    strategy: 'Heavy roughing pass + cleanup + finish pass',
    suitableFor: ['precision', 'large-parts', 'production'],
    parameters: {
      roughingFeedRate: 1000,
      finishingFeedRate: 350,
      spindleSpeed: 10000,
      stepdown: 3.0,
      stepover: 0.7,
      toolDiameter: 10,
      coolant: true,
    },
    estimatedTime: {
      roughingMinutes: 10,
      finishingMinutes: 8,
      setupMinutes: 10,
      totalMinutes: 28,
    },
    notes: 'Fast material removal with good finish',
  },
]

const MATERIAL_CUTTING_DATA: Record<string, {
  spindleSpeedRange: [number, number]
  feedRateRange: [number, number]
  toolLife: number
}> = {
  'aluminum-6061': {
    spindleSpeedRange: [8000, 18000],
    feedRateRange: [600, 1500],
    toolLife: 50,
  },
  'aluminum-7075': {
    spindleSpeedRange: [10000, 20000],
    feedRateRange: [800, 1800],
    toolLife: 40,
  },
  'steel-4140': {
    spindleSpeedRange: [3000, 8000],
    feedRateRange: [200, 500],
    toolLife: 30,
  },
  'stainless-steel-304': {
    spindleSpeedRange: [2000, 6000],
    feedRateRange: [150, 400],
    toolLife: 20,
  },
  'brass-360': {
    spindleSpeedRange: [6000, 15000],
    feedRateRange: [800, 2000],
    toolLife: 80,
  },
  'titanium-ti6al4v': {
    spindleSpeedRange: [2000, 5000],
    feedRateRange: [100, 300],
    toolLife: 15,
  },
}

export function getCNCToolpathStrategies(): CNCToolpathStrategy[] {
  return CNC_STRATEGIES
}

export function selectCNCToolpathStrategy(
  objectType: string,
  material: string,
  featureCount: number,
  volumeMm3: number
): CNCToolpathStrategy {
  const volumeCm3 = volumeMm3 / 1000
  
  // Check for high complexity
  const isHighComplexity = featureCount > 5 || 
    ['torus', 'cone', 'sphere'].includes(objectType.toLowerCase())
  
  // Check for difficult material
  const cuttingData = MATERIAL_CUTTING_DATA[material] || MATERIAL_CUTTING_DATA['aluminum-6061']
  const isDifficultMaterial = material.includes('titanium') || material.includes('stainless')
  
  // Check for large volume
  const isLargeVolume = volumeCm3 > 100
  
  if (isDifficultMaterial) {
    return CNC_STRATEGIES.find(s => s.id === 'cnc-high-speed') || CNC_STRATEGIES[0]
  }
  
  if (isHighComplexity) {
    return CNC_STRATEGIES.find(s => s.id === 'cnc-3d-adaptive') || CNC_STRATEGIES[1]
  }
  
  if (isLargeVolume) {
    return CNC_STRATEGIES.find(s => s.id === 'cnc-rough-finish') || CNC_STRATEGIES[3]
  }
  
  return CNC_STRATEGIES.find(s => s.id === 'cnc-2p5-pocket') || CNC_STRATEGIES[0]
}

export function calculateCNCTime(
  volumeMm3: number,
  material: string,
  strategy: CNCToolpathStrategy,
  complexityFactor: number = 1.0
): CNCTimeEstimate {
  const volumeCm3 = volumeMm3 / 1000
  const cuttingData = MATERIAL_CUTTING_DATA[material] || MATERIAL_CUTTING_DATA['aluminum-6061']
  
  // Adjust for material machinability
  const materialFactor = cuttingData.toolLife / 50 // Base on tool life
  
  // Calculate roughing time based on volume and feed rate
  const roughingRate = strategy.parameters.roughingFeedRate * strategy.parameters.stepdown * strategy.parameters.stepover
  const roughingTime = (volumeCm3 / roughingRate) * 60 / materialFactor
  
  // Calculate finishing time
  const surfaceAreaFactor = Math.pow(volumeCm3, 2/3)
  const finishingTime = (surfaceAreaFactor / strategy.parameters.finishingFeedRate) * 60 / materialFactor
  
  // Apply complexity factor
  const complexityAdjustedRoughing = roughingTime * complexityFactor
  const complexityAdjustedFinishing = finishingTime * complexityFactor
  
  return {
    roughingMinutes: Math.round(complexityAdjustedRoughing),
    finishingMinutes: Math.round(complexityAdjustedFinishing),
    setupMinutes: strategy.estimatedTime.setupMinutes,
    totalMinutes: Math.round(complexityAdjustedRoughing + complexityAdjustedFinishing + strategy.estimatedTime.setupMinutes),
  }
}

export function getCuttingParameters(
  material: string,
  toolDiameter: number = 6
): { spindleSpeed: number; feedRate: number; coolant: boolean } {
  const cuttingData = MATERIAL_CUTTING_DATA[material] || MATERIAL_CUTTING_DATA['aluminum-6061']
  
  // Calculate spindle speed based on tool diameter
  const surfaceSpeed = 150 // m/min typical
  const spindleSpeed = Math.round((surfaceSpeed * 1000) / (Math.PI * toolDiameter))
  
  // Clamp to material range
  const clampedSpindleSpeed = Math.max(
    cuttingData.spindleSpeedRange[0],
    Math.min(cuttingData.spindleSpeedRange[1], spindleSpeed)
  )
  
  // Calculate feed rate
  const feedPerTooth = 0.1 // mm/tooth typical
  const numTeeth = 2
  const feedRate = Math.round(clampedSpindleSpeed * feedPerTooth * numTeeth)
  
  return {
    spindleSpeed: clampedSpindleSpeed,
    feedRate: Math.min(cuttingData.feedRateRange[1], Math.max(cuttingData.feedRateRange[0], feedRate)),
    coolant: !material.includes('aluminum') && !material.includes('brass'), // Aluminum and brass typically don't need coolant
  }
}

export function estimateToolRequirements(
  objectType: string,
  features: Array<{ type: string; parameters: Record<string, any> }>
): Array<{ type: string; diameter: number; purpose: string }> {
  const tools = [
    { type: 'End Mill', diameter: 6, purpose: 'General roughing and finishing' },
  ]
  
  // Check for small features
  const smallHoles = features.filter(f => 
    f.type === 'hole' && (f.parameters.diameter || 0) < 5
  )
  
  if (smallHoles.length > 0) {
    tools.push({ type: 'End Mill', diameter: 3, purpose: 'Small features and detail work' })
  }
  
  // Check for ball-nose needed
  if (['sphere', 'torus', 'cone'].includes(objectType.toLowerCase())) {
    tools.push({ type: 'Ball Mill', diameter: 6, purpose: '3D surface finishing' })
  }
  
  // Check for drilling
  const holes = features.filter(f => f.type === 'hole')
  if (holes.length > 0) {
    tools.push({ type: 'Drill Bit', diameter: holes[0].parameters.diameter || 5, purpose: 'Hole creation' })
  }
  
  return tools
}

// lib/toolpath/strategies/sheet-metal.ts
// Sheet metal toolpath strategies

export interface SheetMetalToolpathStrategy {
  id: string
  name: string
  description: string
  strategy: string
  suitableFor: string[]
  parameters: SheetMetalToolpathParameters
  estimatedTime: SheetMetalTimeEstimate
  notes?: string
}

export interface SheetMetalToolpathParameters {
  materialThickness: number
  bendRadius: number
  bendAngle: number
  kerfCompensation: number
  reliefSize: number
  tabWidth: number
  nestingEfficiency: number
}

export interface SheetMetalTimeEstimate {
  cutMinutes: number
  bendMinutes: number
  finishMinutes: number
  setupMinutes: number
  totalMinutes: number
}

const SHEET_METAL_STRATEGIES: SheetMetalToolpathStrategy[] = [
  {
    id: 'sheet-simple',
    name: 'Simple Flat',
    description: 'Single part with basic cut profile',
    strategy: 'Laser cut flat pattern',
    suitableFor: ['flat', 'simple', 'gaskets'],
    parameters: {
      materialThickness: 2,
      bendRadius: 1,
      bendAngle: 0,
      kerfCompensation: 0.1,
      reliefSize: 3,
      tabWidth: 0,
      nestingEfficiency: 0.7,
    },
    estimatedTime: {
      cutMinutes: 10,
      bendMinutes: 0,
      finishMinutes: 5,
      setupMinutes: 10,
      totalMinutes: 25,
    },
    notes: 'No bending required',
  },
  {
    id: 'sheet-bend',
    name: 'Cut + Bend',
    description: 'Cut profile with bending operations',
    strategy: 'Laser cut flat pattern + press brake bends',
    suitableFor: ['enclosures', 'brackets', 'panels'],
    parameters: {
      materialThickness: 2,
      bendRadius: 1,
      bendAngle: 90,
      kerfCompensation: 0.1,
      reliefSize: 3,
      tabWidth: 0,
      nestingEfficiency: 0.75,
    },
    estimatedTime: {
      cutMinutes: 15,
      bendMinutes: 10,
      finishMinutes: 8,
      setupMinutes: 15,
      totalMinutes: 48,
    },
    notes: 'Includes bend sequence planning',
  },
  {
    id: 'sheet-tap-slot',
    name: 'Tab and Slot',
    description: 'Parts with interlocking features',
    strategy: 'Precision cut with tabs and slots',
    suitableFor: ['assemblies', 'interlocking', 'snap-fit'],
    parameters: {
      materialThickness: 2,
      bendRadius: 1,
      bendAngle: 0,
      kerfCompensation: 0.08,
      reliefSize: 2,
      tabWidth: 5,
      nestingEfficiency: 0.8,
    },
    estimatedTime: {
      cutMinutes: 20,
      bendMinutes: 0,
      finishMinutes: 10,
      setupMinutes: 15,
      totalMinutes: 45,
    },
    notes: 'Precision cut for assembly features',
  },
  {
    id: 'sheet-complex',
    name: 'Complex Assembly',
    description: 'Multi-bend part with many features',
    strategy: 'Multi-stage cut + multiple bends + assembly tabs',
    suitableFor: ['complex', 'multi-bend', 'production'],
    parameters: {
      materialThickness: 2,
      bendRadius: 1,
      bendAngle: 90,
      kerfCompensation: 0.1,
      reliefSize: 3,
      tabWidth: 5,
      nestingEfficiency: 0.75,
    },
    estimatedTime: {
      cutMinutes: 30,
      bendMinutes: 25,
      finishMinutes: 15,
      setupMinutes: 25,
      totalMinutes: 95,
    },
    notes: 'Multiple bending operations required',
  },
]

const MATERIAL_SHEET_DATA: Record<string, {
  thicknessRange: [number, number]
  bendFactor: number // Bend radius as multiple of thickness
  kerfWidth: number
  maxBendAngle: number
  laserPower: number
}> = {
  'aluminum-6061': {
    thicknessRange: [0.5, 6],
    bendFactor: 0.8,
    kerfWidth: 0.1,
    maxBendAngle: 180,
    laserPower: 100,
  },
  'steel-4140': {
    thicknessRange: [0.5, 6],
    bendFactor: 1.5,
    kerfWidth: 0.15,
    maxBendAngle: 180,
    laserPower: 100,
  },
  'stainless-steel-304': {
    thicknessRange: [0.5, 5],
    bendFactor: 1.2,
    kerfWidth: 0.12,
    maxBendAngle: 180,
    laserPower: 100,
  },
  'copper-101': {
    thicknessRange: [0.5, 3],
    bendFactor: 0.8,
    kerfWidth: 0.1,
    maxBendAngle: 180,
    laserPower: 90,
  },
}

export function getSheetMetalToolpathStrategies(): SheetMetalToolpathStrategy[] {
  return SHEET_METAL_STRATEGIES
}

export function selectSheetMetalToolpathStrategy(
  material: string,
  hasBends: boolean,
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): SheetMetalToolpathStrategy {
  if (!hasBends) {
    return SHEET_METAL_STRATEGIES.find(s => s.id === 'sheet-simple') || SHEET_METAL_STRATEGIES[0]
  }
  
  if (complexity === 'simple') {
    return SHEET_METAL_STRATEGIES.find(s => s.id === 'sheet-bend') || SHEET_METAL_STRATEGIES[1]
  }
  
  if (complexity === 'complex') {
    return SHEET_METAL_STRATEGIES.find(s => s.id === 'sheet-complex') || SHEET_METAL_STRATEGIES[3]
  }
  
  return SHEET_METAL_STRATEGIES.find(s => s.id === 'sheet-tap-slot') || SHEET_METAL_STRATEGIES[2]
}

export function calculateSheetMetalTime(
  areaMm2: number,
  material: string,
  bendCount: number,
  strategy: SheetMetalToolpathStrategy
): SheetMetalTimeEstimate {
  const materialData = MATERIAL_SHEET_DATA[material] || MATERIAL_SHEET_DATA['aluminum-6061']
  
  // Calculate cut time based on area and perimeter
  // Estimate perimeter from area (assuming somewhat square)
  const sideLength = Math.sqrt(areaMm2)
  const perimeterMm = sideLength * 4
  
  // Cut speed depends on material and thickness
  const cutSpeed = 15 / Math.sqrt(materialData.laserPower / 50) // mm/sec
  const cutMinutes = Math.max(2, Math.round(perimeterMm / cutSpeed / 60))
  
  // Bend time per bend
  const bendMinutes = bendCount * 5 // 5 minutes per bend including setup
  
  // Finish time based on complexity
  const finishMinutes = 5 + (bendCount * 2)
  
  return {
    cutMinutes,
    bendMinutes,
    finishMinutes,
    setupMinutes: strategy.estimatedTime.setupMinutes,
    totalMinutes: cutMinutes + bendMinutes + finishMinutes + strategy.estimatedTime.setupMinutes,
  }
}

export function getBendParameters(
  material: string,
  thickness: number,
  targetAngle: number
): { bendRadius: number; kFactor: number; bendDeduction: number } {
  const materialData = MATERIAL_SHEET_DATA[material] || MATERIAL_SHEET_DATA['aluminum-6061']
  
  // Calculate minimum bend radius
  const minBendRadius = thickness * materialData.bendFactor
  
  // K-factor (location of neutral axis) - typical values 0.3-0.5
  const kFactor = 0.33
  
  // Calculate bend deduction
  // Bend deduction = 2 * (bend radius + k-factor * thickness) * tan(bend angle / 2)
  const bendRadius = Math.max(minBendRadius, thickness)
  const bendAngleRad = (targetAngle * Math.PI) / 180
  const bendDeduction = 2 * (bendRadius + kFactor * thickness) * Math.tan(bendAngleRad / 2)
  
  return {
    bendRadius: Math.round(bendRadius * 100) / 100,
    kFactor,
    bendDeduction: Math.round(bendDeduction * 100) / 100,
  }
}

export function calculateReliefCutout(
  material: string,
  thickness: number,
  bendDirection: string
): { width: number; depth: number } {
  // Relief cutout dimensions for bend relief
  const width = thickness * 2 + 1 // Minimum 2x thickness + 1mm
  const depth = thickness * 1.5 // 1.5x thickness
  
  return {
    width: Math.max(3, Math.round(width)),
    depth: Math.max(2, Math.round(depth)),
  }
}

export function calculateFlangeLength(
  material: string,
  thickness: number,
  availableWidth: number
): number {
  const minFlangeWidth = thickness * 2 // Minimum 2x thickness
  
  // Also need space for bend radius and relief
  const bendRadius = thickness * 0.8
  const relief = thickness * 2
  
  const maxFlangeWidth = availableWidth - bendRadius - relief
  
  return Math.max(minFlangeWidth, Math.round(maxFlangeWidth))
}

export function getNestingEfficiency(
  shapeComplexity: 'simple' | 'medium' | 'complex'
): number {
  switch (shapeComplexity) {
    case 'simple':
      return 0.85
    case 'medium':
      return 0.75
    case 'complex':
      return 0.65
    default:
      return 0.75
  }
}

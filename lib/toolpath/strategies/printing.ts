// lib/toolpath/strategies/printing.ts
// 3D printing toolpath strategies

export interface PrintingToolpathStrategy {
  id: string
  name: string
  description: string
  strategy: string
  suitableFor: string[]
  parameters: PrintingToolpathParameters
  estimatedTime: PrintingTimeEstimate
  notes?: string
}

export interface PrintingToolpathParameters {
  layerHeight: number
  infillPercent: number
  infillPattern: 'grid' | 'triangular' | 'hexagonal' | 'gyroid' | 'cubic'
  perimeters: number
  topLayers: number
  bottomLayers: number
  supportType: 'none' | 'everywhere' | 'buildplate' | 'tree'
  supportAngle: number
  bedTemperature: number
  nozzleTemperature: number
  printSpeed: number
}

export interface PrintingTimeEstimate {
  printMinutes: number
  setupMinutes: number
  materialGrams: number
  totalMinutes: number
}

const PRINTING_STRATEGIES: PrintingToolpathStrategy[] = [
  {
    id: 'print-standard',
    name: 'Standard Quality',
    description: 'Balanced quality and speed for general use',
    strategy: 'Auto-orient + Slice (0.2mm layers, 20% infill)',
    suitableFor: ['functional', 'prototype', 'general'],
    parameters: {
      layerHeight: 0.2,
      infillPercent: 20,
      infillPattern: 'grid',
      perimeters: 3,
      topLayers: 5,
      bottomLayers: 4,
      supportType: 'buildplate',
      supportAngle: 45,
      bedTemperature: 60,
      nozzleTemperature: 200,
      printSpeed: 50,
    },
    estimatedTime: {
      printMinutes: 120,
      setupMinutes: 15,
      materialGrams: 150,
      totalMinutes: 135,
    },
    notes: 'Good balance of quality and speed',
  },
  {
    id: 'print-high-quality',
    name: 'High Quality',
    description: 'Fine layer height for detailed prints',
    strategy: 'Fine layers + higher perimeters + smooth surfaces',
    suitableFor: ['detailed', 'visual', 'presentation'],
    parameters: {
      layerHeight: 0.1,
      infillPercent: 30,
      infillPattern: 'gyroid',
      perimeters: 4,
      topLayers: 7,
      bottomLayers: 5,
      supportType: 'buildplate',
      supportAngle: 40,
      bedTemperature: 65,
      nozzleTemperature: 210,
      printSpeed: 40,
    },
    estimatedTime: {
      printMinutes: 240,
      setupMinutes: 20,
      materialGrams: 180,
      totalMinutes: 260,
    },
    notes: 'Best surface finish but longer print time',
  },
  {
    id: 'print-fast',
    name: 'Fast Print',
    description: 'Optimized for speed with acceptable quality',
    strategy: 'Thicker layers + higher infill + fewer perimeters',
    suitableFor: ['draft', 'concept', 'quick-prototype'],
    parameters: {
      layerHeight: 0.3,
      infillPercent: 15,
      infillPattern: 'grid',
      perimeters: 2,
      topLayers: 3,
      bottomLayers: 3,
      supportType: 'buildplate',
      supportAngle: 50,
      bedTemperature: 55,
      nozzleTemperature: 220,
      printSpeed: 80,
    },
    estimatedTime: {
      printMinutes: 60,
      setupMinutes: 10,
      materialGrams: 130,
      totalMinutes: 70,
    },
    notes: 'Fastest option, lower detail',
  },
  {
    id: 'print-functional',
    name: 'Functional Part',
    description: 'Optimized for strength and durability',
    strategy: 'High infill + more perimeters + solid layers',
    suitableFor: ['end-use', 'strength', 'mechanical'],
    parameters: {
      layerHeight: 0.2,
      infillPercent: 60,
      infillPattern: 'gyroid',
      perimeters: 4,
      topLayers: 6,
      bottomLayers: 5,
      supportType: 'everywhere',
      supportAngle: 45,
      bedTemperature: 65,
      nozzleTemperature: 215,
      printSpeed: 45,
    },
    estimatedTime: {
      printMinutes: 200,
      setupMinutes: 20,
      materialGrams: 250,
      totalMinutes: 220,
    },
    notes: 'Maximum strength for functional parts',
  },
  {
    id: 'print-minimal',
    name: 'Minimal Material',
    description: 'Uses least material with sparse infill',
    strategy: 'Sparse infill + minimal layers',
    suitableFor: ['large-parts', 'cost-reduction', 'validation'],
    parameters: {
      layerHeight: 0.25,
      infillPercent: 10,
      infillPattern: 'cubic',
      perimeters: 2,
      topLayers: 3,
      bottomLayers: 3,
      supportType: 'buildplate',
      supportAngle: 55,
      bedTemperature: 55,
      nozzleTemperature: 195,
      printSpeed: 70,
    },
    estimatedTime: {
      printMinutes: 90,
      setupMinutes: 10,
      materialGrams: 100,
      totalMinutes: 100,
    },
    notes: 'Minimal material usage',
  },
]

const MATERIAL_PRINT_DATA: Record<string, {
  nozzleTempRange: [number, number]
  bedTempRange: [number, number]
  layerHeightMin: number
  layerHeightMax: number
  minInfill: number
  maxInfill: number
  coolingRequired: boolean
}> = {
  'pla': {
    nozzleTempRange: [180, 220],
    bedTempRange: [40, 60],
    layerHeightMin: 0.1,
    layerHeightMax: 0.3,
    minInfill: 10,
    maxInfill: 50,
    coolingRequired: true,
  },
  'abs': {
    nozzleTempRange: [220, 250],
    bedTempRange: [80, 100],
    layerHeightMin: 0.15,
    layerHeightMax: 0.3,
    minInfill: 15,
    maxInfill: 60,
    coolingRequired: false,
  },
  'petg': {
    nozzleTempRange: [230, 250],
    bedTempRange: [60, 80],
    layerHeightMin: 0.12,
    layerHeightMax: 0.28,
    minInfill: 15,
    maxInfill: 60,
    coolingRequired: false,
  },
  'nylon-6': {
    nozzleTempRange: [240, 260],
    bedTempRange: [70, 90],
    layerHeightMin: 0.15,
    layerHeightMax: 0.3,
    minInfill: 20,
    maxInfill: 60,
    coolingRequired: false,
  },
  'resin': {
    nozzleTempRange: [0, 0], // SLA doesn't use nozzle temp
    bedTempRange: [0, 0],
    layerHeightMin: 0.025,
    layerHeightMax: 0.1,
    minInfill: 0, // N/A for SLA
    maxInfill: 100,
    coolingRequired: false,
  },
}

export function getPrintingToolpathStrategies(): PrintingToolpathStrategy[] {
  return PRINTING_STRATEGIES
}

export function selectPrintingToolpathStrategy(
  material: string,
  quality: 'draft' | 'standard' | 'high' | 'functional' = 'standard'
): PrintingToolpathStrategy {
  switch (quality) {
    case 'draft':
      return PRINTING_STRATEGIES.find(s => s.id === 'print-fast') || PRINTING_STRATEGIES[0]
    case 'high':
      return PRINTING_STRATEGIES.find(s => s.id === 'print-high-quality') || PRINTING_STRATEGIES[1]
    case 'functional':
      return PRINTING_STRATEGIES.find(s => s.id === 'print-functional') || PRINTING_STRATEGIES[3]
    default:
      return PRINTING_STRATEGIES.find(s => s.id === 'print-standard') || PRINTING_STRATEGIES[0]
  }
}

export function calculatePrintingTime(
  volumeMm3: number,
  material: string,
  strategy: PrintingToolpathStrategy,
  hasSupports: boolean = false
): PrintingTimeEstimate {
  const materialData = MATERIAL_PRINT_DATA[material] || MATERIAL_PRINT_DATA['pla']
  
  const volumeCm3 = volumeMm3 / 1000
  
  // Calculate material needed
  // Factor in infill percentage and wall thickness
  const infillFactor = 0.25 + (strategy.parameters.infillPercent / 100) * 0.5
  const wallFactor = strategy.parameters.perimeters * 0.2
  const topBottomFactor = (strategy.parameters.topLayers + strategy.parameters.bottomLayers) * 0.05
  
  const materialFactor = infillFactor + wallFactor + topBottomFactor
  const materialGrams = Math.round(volumeCm3 * 1.2 * materialFactor * 100) / 100 // ~1.2g/cm³ for PLA
  
  // Calculate base print time
  // Speed is in mm/s, convert to minutes
  const baseTimeMinutes = (volumeCm3 * 10) / strategy.parameters.printSpeed
  
  // Adjust for layer height (finer layers = slower)
  const layerTimeFactor = 0.2 / strategy.parameters.layerHeight
  
  // Adjust for infill (more infill = slower)
  const infillTimeFactor = 0.5 + (strategy.parameters.infillPercent / 100) * 1.5
  
  // Adjust for supports
  const supportFactor = hasSupports ? 1.3 : 1.0
  
  const printMinutes = Math.round(baseTimeMinutes * layerTimeFactor * infillTimeFactor * supportFactor)
  
  return {
    printMinutes,
    setupMinutes: strategy.estimatedTime.setupMinutes,
    materialGrams,
    totalMinutes: printMinutes + strategy.estimatedTime.setupMinutes,
  }
}

export function getPrintingParameters(
  material: string,
  volumeMm3: number
): { nozzleTemp: number; bedTemp: number; cooling: boolean; enclosure: boolean } {
  const materialData = MATERIAL_PRINT_DATA[material] || MATERIAL_PRINT_DATA['pla']
  
  // Select midpoint of temperature range
  const nozzleTemp = Math.round(
    (materialData.nozzleTempRange[0] + materialData.nozzleTempRange[1]) / 2
  )
  
  const bedTemp = Math.round(
    (materialData.bedTempRange[0] + materialData.bedTempRange[1]) / 2
  )
  
  // Enclosure needed for materials that warp
  const needsEnclosure = ['abs', 'nylon-6', 'pc'].includes(material.toLowerCase())
  
  return {
    nozzleTemp,
    bedTemp,
    cooling: materialData.coolingRequired,
    enclosure: needsEnclosure,
  }
}

export function calculateSupportMaterial(
  volumeMm3: number,
  hasOverhangs: boolean,
  supportType: string
): number {
  if (!hasOverhangs) return 0
  
  const supportVolume = volumeMm3 * 0.1 // Estimate 10% of volume for supports
  
  // Convert to grams (approximate)
  const supportGrams = Math.round(supportVolume / 1000 * 1.2)
  
  return supportGrams
}

export function estimatePrintQuality(
  layerHeight: number,
  perimeters: number
): 'draft' | 'standard' | 'high' | 'ultra' {
  if (layerHeight >= 0.3) return 'draft'
  if (layerHeight >= 0.2 && perimeters >= 3) return 'standard'
  if (layerHeight >= 0.12 && perimeters >= 4) return 'high'
  return 'ultra'
}

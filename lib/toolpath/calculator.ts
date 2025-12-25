// lib/toolpath/calculator.ts
// Toolpath time and cost estimation calculator

import { getDefaultMachineForProcess } from '../pricing/machines'
import { selectCNCToolpathStrategy, calculateCNCTime, getCuttingParameters } from './strategies/cnc'
import { selectLaserToolpathStrategy, calculateLaserTime, getLaserParameters } from './strategies/laser'
import { selectPrintingToolpathStrategy, calculatePrintingTime, getPrintingParameters } from './strategies/printing'
import { selectSheetMetalToolpathStrategy, calculateSheetMetalTime } from './strategies/sheet-metal'
import { estimateToolCosts } from '../pricing/tools'

export interface ToolpathEstimate {
  process: string
  strategy: string
  machine: string
  timeMinutes: number
  machineCost: number
  toolCost: number
  setupCost: number
  totalCost: number
  cuttingParameters: Record<string, any>
  tools: Array<{ type: string; diameter: number; purpose: string }>
  notes: string[]
}

export interface ToolpathCalculatorInput {
  objectType: string
  dimensions: Record<string, number>
  features: Array<{ type: string; parameters: Record<string, any> }>
  material: string
  process: string
  quantity: number
  volumeMm3?: number
}

export function calculateToolpath(input: ToolpathCalculatorInput): ToolpathEstimate {
  const { objectType, dimensions, features, material, process, quantity, volumeMm3 } = input
  
  // Calculate volume if not provided
  const volume = volumeMm3 || calculateVolume(dimensions, objectType)
  
  const featureCount = features.length
  const notes: string[] = []
  
  let timeMinutes = 0
  let machineCost = 0
  let toolCost = 0
  let setupCost = 0
  let strategyName = ''
  let cuttingParameters: Record<string, any> = {}
  let tools: Array<{ type: string; diameter: number; purpose: string }> = []
  
  const machine = getDefaultMachineForProcess(process)
  const hourlyRate = machine?.hourlyRate || 10000
  
  switch (process.toLowerCase()) {
    case 'cnc-milling':
    case 'cnc turning':
    case 'cnc-turning': {
      const strategy = selectCNCToolpathStrategy(objectType, material, featureCount, volume)
      const time = calculateCNCTime(volume, material, strategy, 1 + (featureCount * 0.1))
      const cuttingData = getCuttingParameters(material)
      
      timeMinutes = time.totalMinutes * quantity
      machineCost = (timeMinutes / 60) * hourlyRate
      toolCost = estimateToolCosts('cnc-milling', material, featureCount, volume) * quantity
      setupCost = (machine?.setupFee || 2000) * quantity
      strategyName = strategy.name
      cuttingParameters = {
        spindleSpeed: cuttingData.spindleSpeed,
        feedRate: cuttingData.feedRate,
        coolant: cuttingData.coolant,
        stepdown: strategy.parameters.stepdown,
        stepover: strategy.parameters.stepover,
      }
      notes.push(strategy.notes || '')
      
      if (material.includes('titanium')) {
        notes.push('Titanium requires special tooling and slower speeds')
      }
      break
    }
    
    case 'laser-cutting':
    case 'laser cutting': {
      // Estimate perimeter from dimensions
      const perimeter = calculatePerimeter(dimensions, objectType)
      const thickness = dimensions.depth || dimensions.height || 2
      const strategy = selectLaserToolpathStrategy(material, thickness)
      const time = calculateLaserTime(perimeter, material, thickness, strategy)
      
      timeMinutes = time.totalMinutes * quantity
      machineCost = (timeMinutes / 60) * hourlyRate
      toolCost = estimateToolCosts('laser-cutting', material) * quantity
      setupCost = (machine?.setupFee || 1000) * quantity
      strategyName = strategy.name
      
      const laserParams = getLaserParameters(material, thickness)
      cuttingParameters = {
        power: laserParams.power,
        speed: laserParams.speed,
        focusOffset: laserParams.focusOffset,
      }
      notes.push(strategy.notes || '')
      break
    }
    
    case '3d-printing':
    case '3d printing': {
      const hasSupports = features.some(f => f.type === 'overhang' || f.parameters.depth > 10)
      const quality = featureCount > 10 ? 'high' : featureCount > 5 ? 'standard' : 'draft'
      const strategy = selectPrintingToolpathStrategy(material, quality)
      const time = calculatePrintingTime(volume, material, strategy, hasSupports)
      
      timeMinutes = time.totalMinutes * quantity
      machineCost = (timeMinutes / 60) * hourlyRate
      toolCost = estimateToolCosts('3d-printing', material, featureCount, volume) * quantity
      setupCost = (machine?.setupFee || 500) * quantity
      strategyName = strategy.name
      
      const printParams = getPrintingParameters(material, volume)
      cuttingParameters = {
        layerHeight: strategy.parameters.layerHeight,
        infill: `${strategy.parameters.infillPercent}%`,
        nozzleTemp: printParams.nozzleTemp,
        bedTemp: printParams.bedTemp,
        cooling: printParams.cooling,
      }
      notes.push(strategy.notes || '')
      
      if (volume > 100000) {
        notes.push('Large volume may require multiple print batches')
      }
      break
    }
    
    case 'sheet-metal':
    case 'sheet metal': {
      const area = calculateArea(dimensions, objectType)
      const bendCount = features.filter(f => f.type === 'bend').length
      const hasBends = bendCount > 0
      const complexity = featureCount > 5 ? 'complex' : featureCount > 2 ? 'medium' : 'simple'
      const strategy = selectSheetMetalToolpathStrategy(material, hasBends, complexity)
      const time = calculateSheetMetalTime(area, material, bendCount, strategy)
      
      timeMinutes = time.totalMinutes * quantity
      machineCost = (timeMinutes / 60) * hourlyRate
      toolCost = estimateToolCosts('sheet-metal', material, featureCount, volume) * quantity
      setupCost = (machine?.setupFee || 1500) * quantity
      strategyName = strategy.name
      cuttingParameters = {
        materialThickness: strategy.parameters.materialThickness,
        bendRadius: strategy.parameters.bendRadius,
        kerfCompensation: strategy.parameters.kerfCompensation,
      }
      notes.push(strategy.notes || '')
      
      if (bendCount > 0) {
        notes.push(`${bendCount} bend operations required - sequence matters`)
      }
      break
    }
    
    default:
      // Default estimation
      timeMinutes = 30 * quantity
      machineCost = (timeMinutes / 60) * hourlyRate
      toolCost = 500 * quantity
      setupCost = 1000 * quantity
      strategyName = 'Standard'
      cuttingParameters = { note: 'Process not recognized, using defaults' }
      notes.push('Standard manufacturing process applied')
  }
  
  const totalCost = machineCost + toolCost + setupCost
  
  return {
    process,
    strategy: strategyName,
    machine: machine?.name || 'Standard Machine',
    timeMinutes,
    machineCost: Math.round(machineCost),
    toolCost: Math.round(toolCost),
    setupCost: Math.round(setupCost),
    totalCost: Math.round(totalCost),
    cuttingParameters,
    tools,
    notes,
  }
}

// Helper function to calculate volume
function calculateVolume(dimensions: Record<string, number>, type: string): number {
  const width = dimensions.width || dimensions.length || 50
  const height = dimensions.height || 50
  const depth = dimensions.depth || 50
  const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 25)
  
  switch (type.toLowerCase()) {
    case 'box':
    case 'cube':
      return width * height * depth
    case 'cylinder':
      return Math.PI * radius * radius * height
    case 'sphere':
      return (4/3) * Math.PI * Math.pow(radius, 3)
    case 'cone':
      return (1/3) * Math.PI * radius * radius * height
    case 'torus':
      const majorRadius = dimensions.majorRadius || dimensions.radius || 50
      const minorRadius = dimensions.minorRadius || dimensions.tube || 15
      return Math.PI * minorRadius * minorRadius * 2 * Math.PI * majorRadius
    default:
      return width * height * depth
  }
}

// Helper function to calculate perimeter
function calculatePerimeter(dimensions: Record<string, number>, type: string): number {
  const width = dimensions.width || dimensions.length || 50
  const height = dimensions.height || 50
  
  switch (type.toLowerCase()) {
    case 'box':
    case 'cube':
      return 2 * (width + height)
    case 'cylinder':
      return 2 * Math.PI * (dimensions.radius || 25)
    default:
      return 2 * (width + height)
  }
}

// Helper function to calculate area
function calculateArea(dimensions: Record<string, number>, type: string): number {
  const width = dimensions.width || dimensions.length || 50
  const height = dimensions.height || 50
  
  switch (type.toLowerCase()) {
    case 'box':
    case 'cube':
      return width * height
    case 'cylinder':
      return Math.PI * Math.pow(dimensions.radius || 25, 2)
    default:
      return width * height
  }
}

// Estimate total lead time based on process and quantity
export function estimateLeadTime(
  process: string,
  quantity: number,
  timeMinutes: number
): { days: number; weeks: number } {
  const processBaseDays: Record<string, number> = {
    'cnc-milling': 3,
    'cnc-turning': 2,
    'laser-cutting': 2,
    '3d-printing': 3,
    'sheet-metal': 4,
  }
  
  const baseDays = processBaseDays[process.toLowerCase()] || 3
  
  // Add time for quantity
  const quantityDays = Math.ceil(quantity / 10) // 1 day per 10 parts
  
  // Add time for complexity (based on total minutes)
  const complexityDays = Math.ceil(timeMinutes / 60 / 8) // 1 day per 8 hours of machine time
  
  const totalDays = baseDays + quantityDays + complexityDays
  
  return {
    days: totalDays,
    weeks: Math.ceil(totalDays / 5),
  }
}

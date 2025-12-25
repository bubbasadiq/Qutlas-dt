// lib/pricing/machines.ts
// Machine hourly rates database in Nigerian Naira

export interface MachineRate {
  id: string
  name: string
  process: string
  hourlyRate: number
  setupFee: number
  minimumFee: number
  capabilities: string[]
}

export const MACHINE_RATES: MachineRate[] = [
  // CNC Milling
  {
    id: 'cnc-3axis',
    name: '3-Axis CNC Mill',
    process: 'cnc-milling',
    hourlyRate: 15000,
    setupFee: 2000,
    minimumFee: 1500,
    capabilities: ['3-axis', '3+2-axis', 'pocketing', 'contouring'],
  },
  {
    id: 'cnc-4axis',
    name: '4-Axis CNC Mill',
    process: 'cnc-milling',
    hourlyRate: 22000,
    setupFee: 3000,
    minimumFee: 2500,
    capabilities: ['4-axis', 'undercutting', 'complex geometries'],
  },
  {
    id: 'cnc-5axis',
    name: '5-Axis CNC Mill',
    process: 'cnc-milling',
    hourlyRate: 35000,
    setupFee: 5000,
    minimumFee: 4000,
    capabilities: ['5-axis', 'simultaneous', 'complex aerospace parts'],
  },
  // CNC Turning
  {
    id: 'turning-cnc',
    name: 'CNC Turning Center',
    process: 'cnc-turning',
    hourlyRate: 12000,
    setupFee: 1500,
    minimumFee: 1200,
    capabilities: ['turning', 'facing', 'drilling', 'threading'],
  },
  {
    id: 'turning-milling',
    name: 'Turn-Mill Center',
    process: 'cnc-turning',
    hourlyRate: 25000,
    setupFee: 4000,
    minimumFee: 3000,
    capabilities: ['turning', 'milling', 'drilling', 'complex parts'],
  },
  // Laser Cutting
  {
    id: 'laser-co2',
    name: 'CO2 Laser Cutter (100W)',
    process: 'laser-cutting',
    hourlyRate: 8000,
    setupFee: 1000,
    minimumFee: 800,
    capabilities: ['acrylic', 'wood', 'leather', 'fabric', 'paper'],
  },
  {
    id: 'laser-co2-150',
    name: 'CO2 Laser Cutter (150W)',
    process: 'laser-cutting',
    hourlyRate: 10000,
    setupFee: 1200,
    minimumFee: 1000,
    capabilities: ['acrylic', 'wood', 'leather', 'fabric', 'paper', 'thin metal'],
  },
  {
    id: 'laser-fiber',
    name: 'Fiber Laser Cutter',
    process: 'laser-cutting',
    hourlyRate: 12000,
    setupFee: 1500,
    minimumFee: 1200,
    capabilities: ['metal', 'acrylic', 'wood', 'precision cutting'],
  },
  // 3D Printing
  {
    id: '3d-fdm',
    name: 'FDM 3D Printer',
    process: '3d-printing',
    hourlyRate: 6000,
    setupFee: 500,
    minimumFee: 500,
    capabilities: ['pla', 'abs', 'petg', 'engineering plastics'],
  },
  {
    id: '3d-sla',
    name: 'SLA 3D Printer',
    process: '3d-printing',
    hourlyRate: 10000,
    setupFee: 800,
    minimumFee: 800,
    capabilities: ['resin', 'high-detail', 'smooth surface'],
  },
  {
    id: '3d-sls',
    name: 'SLS 3D Printer',
    process: '3d-printing',
    hourlyRate: 15000,
    setupFee: 1500,
    minimumFee: 1200,
    capabilities: ['nylon', 'functional parts', 'no supports needed'],
  },
  {
    id: '3d-metal',
    name: 'Metal 3D Printer (DMLS)',
    process: '3d-printing',
    hourlyRate: 80000,
    setupFee: 15000,
    minimumFee: 10000,
    capabilities: ['metal', 'aerospace', 'medical implants'],
  },
  // Sheet Metal
  {
    id: 'sheet-laser',
    name: 'Sheet Laser Cutter',
    process: 'sheet-metal',
    hourlyRate: 12000,
    setupFee: 1500,
    minimumFee: 1000,
    capabilities: ['laser cutting', 'sheet metal', 'precision'],
  },
  {
    id: 'sheet-plasma',
    name: 'Plasma Cutter',
    process: 'sheet-metal',
    hourlyRate: 8000,
    setupFee: 1000,
    minimumFee: 800,
    capabilities: ['plasma cutting', 'thick metal', 'fast'],
  },
  {
    id: 'sheet-brake',
    name: 'Press Brake',
    process: 'sheet-metal',
    hourlyRate: 10000,
    setupFee: 1200,
    minimumFee: 1000,
    capabilities: ['bending', 'folding', 'forming'],
  },
  {
    id: 'sheet-punch',
    name: 'Turret Punch Press',
    process: 'sheet-metal',
    hourlyRate: 12000,
    setupFee: 1500,
    minimumFee: 1200,
    capabilities: ['punching', 'forming', 'fast production'],
  },
]

export function getMachineRate(machineId: string): MachineRate | null {
  return MACHINE_RATES.find(m => m.id === machineId) || null
}

export function getMachineRatesForProcess(process: string): MachineRate[] {
  return MACHINE_RATES.filter(m => 
    m.process.toLowerCase().includes(process.toLowerCase())
  )
}

export function getDefaultMachineForProcess(process: string): MachineRate | null {
  const processRates = getMachineRatesForProcess(process)
  if (processRates.length === 0) return null
  // Return the first (usually most common) machine for the process
  return processRates[0]
}

export function calculateMachineTimeCost(
  minutes: number,
  machineId: string
): number {
  const machine = getMachineRate(machineId)
  if (!machine) {
    // Default rate if machine not found
    return (minutes / 60) * 10000
  }

  const hours = minutes / 60
  const timeCost = hours * machine.hourlyRate

  // Apply minimum fee if cost is below minimum
  return Math.max(timeCost, machine.minimumFee)
}

export function estimateProcessingTime(
  volumeMm3: number,
  process: string,
  materialId: string
): number {
  // Estimate based on volume and process type
  // These are rough estimates for planning purposes
  
  const volumeCm3 = volumeMm3 / 1000
  
  switch (process.toLowerCase()) {
    case 'cnc-milling':
      // Rough estimate: 0.5 min per cm³ for simple parts
      // More complex geometries take longer
      return Math.max(15, Math.round(volumeCm3 * 0.5))
    
    case 'cnc-turning':
      // Turning is typically faster for cylindrical parts
      return Math.max(10, Math.round(volumeCm3 * 0.3))
    
    case 'laser-cutting':
      // Laser cutting is very fast for 2D profiles
      // Estimate based on perimeter rather than volume
      const perimeterFactor = Math.pow(volumeCm3, 0.5) * 2
      return Math.max(5, Math.round(perimeterFactor * 0.2))
    
    case '3d-printing':
      // Slower but can do complex geometries
      // Layer height and infill affect time
      return Math.max(30, Math.round(volumeCm3 * 2))
    
    case 'sheet-metal':
      // Fast for sheet-based processes
      return Math.max(10, Math.round(volumeCm3 * 0.4))
    
    default:
      return Math.max(15, Math.round(volumeCm3 * 0.5))
  }
}

export function calculateSetupFee(machineId: string): number {
  const machine = getMachineRate(machineId)
  return machine?.setupFee || 1500
}

// lib/pricing/tools.ts
// Tooling costs database in Nigerian Naira

export interface ToolCost {
  id: string
  name: string
  category: string
  costPerUse: number
  lifespan: number // number of uses or parts
  applicableProcesses: string[]
  applicableMaterials: string[]
}

export const TOOL_COSTS: ToolCost[] = [
  // CNC Milling Tools
  {
    id: 'endmill-flat-3mm',
    name: '3mm Flat End Mill',
    category: 'endmill',
    costPerUse: 500,
    lifespan: 50,
    applicableProcesses: ['cnc-milling'],
    applicableMaterials: ['aluminum-6061', 'aluminum-7075', 'plastic', 'abs', 'nylon-6'],
  },
  {
    id: 'endmill-flat-6mm',
    name: '6mm Flat End Mill',
    category: 'endmill',
    costPerUse: 600,
    lifespan: 50,
    applicableProcesses: ['cnc-milling'],
    applicableMaterials: ['aluminum-6061', 'aluminum-7075', 'steel-4140', 'plastic'],
  },
  {
    id: 'endmill-flat-12mm',
    name: '12mm Flat End Mill',
    category: 'endmill',
    costPerUse: 800,
    lifespan: 40,
    applicableProcesses: ['cnc-milling'],
    applicableMaterials: ['steel-4140', 'stainless-steel-304', 'aluminum'],
  },
  {
    id: 'endmill-ball-3mm',
    name: '3mm Ball End Mill',
    category: 'endmill',
    costPerUse: 600,
    lifespan: 40,
    applicableProcesses: ['cnc-milling'],
    applicableMaterials: ['all'],
  },
  {
    id: 'endmill-ball-6mm',
    name: '6mm Ball End Mill',
    category: 'endmill',
    costPerUse: 700,
    lifespan: 40,
    applicableProcesses: ['cnc-milling'],
    applicableMaterials: ['all'],
  },
  {
    id: 'endmill- carbide-tialn',
    name: 'Carbide End Mill (TiAlN)',
    category: 'endmill',
    costPerUse: 1200,
    lifespan: 100,
    applicableProcesses: ['cnc-milling'],
    applicableMaterials: ['steel-4140', 'stainless-steel-304', 'titanium-ti6al4v'],
  },
  {
    id: 'drill-bit-hss-3mm',
    name: '3mm HSS Drill Bit',
    category: 'drill',
    costPerUse: 300,
    lifespan: 20,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['aluminum', 'steel', 'plastic'],
  },
  {
    id: 'drill-bit-hss-6mm',
    name: '6mm HSS Drill Bit',
    category: 'drill',
    costPerUse: 350,
    lifespan: 20,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['aluminum', 'steel', 'plastic'],
  },
  {
    id: 'drill-bit-carbide',
    name: 'Carbide Drill Bit',
    category: 'drill',
    costPerUse: 800,
    lifespan: 50,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['steel-4140', 'stainless-steel-304', 'titanium'],
  },
  {
    id: 'tap-m6',
    name: 'M6 Tap',
    category: 'tap',
    costPerUse: 400,
    lifespan: 30,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['aluminum', 'steel', 'brass'],
  },
  {
    id: 'tap-m8',
    name: 'M8 Tap',
    category: 'tap',
    costPerUse: 450,
    lifespan: 30,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['aluminum', 'steel', 'brass'],
  },
  // Turning Tools
  {
    id: 'turning-insert-cnmg',
    name: 'CNMG Turning Insert',
    category: 'insert',
    costPerUse: 800,
    lifespan: 20,
    applicableProcesses: ['cnc-turning'],
    applicableMaterials: ['steel', 'stainless'],
  },
  {
    id: 'turning-insert-dcgt',
    name: 'DCGT Turning Insert',
    category: 'insert',
    costPerUse: 600,
    lifespan: 25,
    applicableProcesses: ['cnc-turning'],
    applicableMaterials: ['aluminum', 'brass'],
  },
  {
    id: 'turning-toolholder',
    name: 'Turning Tool Holder',
    category: 'holder',
    costPerUse: 200,
    lifespan: 100,
    applicableProcesses: ['cnc-turning'],
    applicableMaterials: ['all'],
  },
  // Laser Cutting Tools
  {
    id: 'laser-lens-focus',
    name: 'Focus Lens (2")',
    category: 'lens',
    costPerUse: 1500,
    lifespan: 500,
    applicableProcesses: ['laser-cutting'],
    applicableMaterials: ['acrylic', 'wood', 'plastic'],
  },
  {
    id: 'laser-mirror',
    name: 'Laser Mirror Set',
    category: 'mirror',
    costPerUse: 1000,
    lifespan: 1000,
    applicableProcesses: ['laser-cutting'],
    applicableMaterials: ['all'],
  },
  {
    id: 'laser-nozzle',
    name: 'Laser Nozzle',
    category: 'nozzle',
    costPerUse: 500,
    lifespan: 200,
    applicableProcesses: ['laser-cutting'],
    applicableMaterials: ['metal'],
  },
  {
    id: 'laser-assist-gas',
    name: 'Assist Gas (O2)',
    category: 'gas',
    costPerUse: 300,
    lifespan: 1,
    applicableProcesses: ['laser-cutting'],
    applicableMaterials: ['steel', 'stainless'],
  },
  // 3D Printing Tools
  {
    id: '3d-nozzle-brass',
    name: 'Brass Nozzle (0.4mm)',
    category: 'nozzle',
    costPerUse: 300,
    lifespan: 500,
    applicableProcesses: ['3d-printing'],
    applicableMaterials: ['pla', 'abs', 'petg'],
  },
  {
    id: '3d-nozzle-hardened',
    name: 'Hardened Steel Nozzle',
    category: 'nozzle',
    costPerUse: 800,
    lifespan: 1000,
    applicableProcesses: ['3d-printing'],
    applicableMaterials: ['carbon-fiber', 'metal-filled', 'abrasive'],
  },
  {
    id: '3d-bed-surface',
    name: 'Build Plate Surface',
    category: 'bed',
    costPerUse: 200,
    lifespan: 100,
    applicableProcesses: ['3d-printing'],
    applicableMaterials: ['all'],
  },
  {
    id: '3d-resin-tank',
    name: 'Resin Tank (SLA)',
    category: 'tank',
    costPerUse: 1500,
    lifespan: 2000,
    applicableProcesses: ['3d-printing'],
    applicableMaterials: ['resin'],
  },
  {
    id: '3d-fep-film',
    name: 'FEP Film (SLA)',
    category: 'film',
    costPerUse: 500,
    lifespan: 50,
    applicableProcesses: ['3d-printing'],
    applicableMaterials: ['resin'],
  },
  {
    id: '3d-uv-led',
    name: 'UV LED Array',
    category: 'led',
    costPerUse: 2000,
    lifespan: 10000,
    applicableProcesses: ['3d-printing'],
    applicableMaterials: ['resin'],
  },
  // Sheet Metal Tools
  {
    id: 'sheet-punch-die',
    name: 'Punch & Die Set',
    category: 'die',
    costPerUse: 1000,
    lifespan: 10000,
    applicableProcesses: ['sheet-metal'],
    applicableMaterials: ['steel', 'aluminum', 'stainless'],
  },
  {
    id: 'sheet-bend-die',
    name: 'Bending Die Set',
    category: 'die',
    costPerUse: 800,
    lifespan: 5000,
    applicableProcesses: ['sheet-metal'],
    applicableMaterials: ['steel', 'aluminum', 'stainless'],
  },
  {
    id: 'sheet-shear-blade',
    name: 'Shear Blade',
    category: 'blade',
    costPerUse: 2500,
    lifespan: 5000,
    applicableProcesses: ['sheet-metal'],
    applicableMaterials: ['steel', 'aluminum'],
  },
  // Abrasives
  {
    id: 'sandpaper-80',
    name: 'Sandpaper 80 grit',
    category: 'abrasive',
    costPerUse: 100,
    lifespan: 1,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['all'],
  },
  {
    id: 'sandpaper-120',
    name: 'Sandpaper 120 grit',
    category: 'abrasive',
    costPerUse: 80,
    lifespan: 1,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['all'],
  },
  {
    id: 'sanding-belt',
    name: 'Sanding Belt',
    category: 'abrasive',
    costPerUse: 200,
    lifespan: 10,
    applicableProcesses: ['cnc-milling', 'cnc-turning'],
    applicableMaterials: ['wood', 'plastic', 'metal'],
  },
]

export function getToolCost(toolId: string): ToolCost | null {
  return TOOL_COSTS.find(t => t.id === toolId) || null
}

export function getApplicableTools(
  process: string,
  materialId?: string
): ToolCost[] {
  let tools = TOOL_COSTS.filter(t => 
    t.applicableProcesses.some(p => p.toLowerCase() === process.toLowerCase())
  )

  if (materialId) {
    tools = tools.filter(t => 
      t.applicableMaterials.includes('all') ||
      t.applicableMaterials.includes(materialId)
    )
  }

  return tools
}

export function estimateToolCosts(
  process: string,
  materialId: string,
  featureCount: number = 0,
  volumeMm3: number = 0
): number {
  const tools = getApplicableTools(process, materialId)
  
  // Calculate base tool costs based on process and complexity
  let totalCost = 0

  switch (process.toLowerCase()) {
    case 'cnc-milling':
      // Base endmill costs
      totalCost += 500 // 3mm flat endmill
      if (volumeMm3 > 50000) {
        totalCost += 600 // 6mm flat endmill
      }
      if (volumeMm3 > 100000) {
        totalCost += 800 // 12mm flat endmill
      }
      // Ball endmills for complex features
      if (featureCount > 0) {
        totalCost += 600
      }
      // Drill bits for holes
      const holeCount = Math.min(featureCount, 10)
      totalCost += holeCount * 300
      break

    case 'cnc-turning':
      totalCost += 800 // Turning insert
      totalCost += 200 // Tool holder
      if (featureCount > 0) {
        totalCost += 400 // Additional taps/drills
      }
      break

    case 'laser-cutting':
      totalCost += 1500 // Lens wear
      totalCost += 500 // Nozzle
      if (materialId.includes('steel') || materialId.includes('stainless')) {
        totalCost += 300 // Assist gas
      }
      break

    case '3d-printing':
      totalCost += 300 // Nozzle
      totalCost += 200 // Build plate
      if (volumeMm3 > 50000) {
        totalCost += 500 // Additional material usage
      }
      break

    case 'sheet-metal':
      totalCost += 1000 // Punch/die wear
      if (featureCount > 0) {
        totalCost += 800 // Bending die
      }
      break

    default:
      totalCost += 500 // Default tool allowance
  }

  return totalCost
}

export function calculateToolLifeUsage(
  toolId: string,
  usage: number
): { usesRemaining: number; needsReplacement: boolean } {
  const tool = getToolCost(toolId)
  if (!tool) {
    return { usesRemaining: 0, needsReplacement: true }
  }

  const usesRemaining = tool.lifespan - usage
  return {
    usesRemaining: Math.max(0, usesRemaining),
    needsReplacement: usesRemaining <= 0,
  }
}

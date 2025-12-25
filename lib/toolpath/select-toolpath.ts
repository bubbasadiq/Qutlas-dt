// lib/toolpath/select-toolpath.ts
// Enhanced toolpath selection with full manufacturing strategies

export interface ToolpathSelection {
  id: string
  name: string
  strategy: string
  description: string
  estimatedTime: number
  machine: string
  notes?: string
  cuttingParameters?: {
    spindleSpeed?: number
    feedRate?: number
    coolant?: boolean
    layerHeight?: number
    infill?: string
  }
}

export interface ToolpathInfo {
  id: string
  name: string
  process: string
  description: string
  suitableFor: string[]
  strategies: ToolpathSelection[]
}

export const TOOLPATH_INFO: ToolpathInfo[] = [
  {
    id: 'cnc-milling',
    name: 'CNC Milling',
    process: 'CNC Milling',
    description: 'Precision 3-axis and 5-axis milling for complex prismatic parts',
    suitableFor: ['boxes', 'brackets', 'enclosures', 'gears', 'complex 3D parts'],
    strategies: [
      {
        id: 'cnc-2p5-pocket',
        name: '2.5D Pocket + Contour',
        strategy: 'Pocketing (2.5D) + contour finishing',
        description: 'Standard strategy for prismatic parts with simple features',
        estimatedTime: 30,
        machine: '3-Axis CNC Mill',
        notes: 'Best for boxes, plates, and simple brackets',
        cuttingParameters: {
          spindleSpeed: 12000,
          feedRate: 800,
          coolant: true,
        },
      },
      {
        id: 'cnc-3d-adaptive',
        name: '3D Adaptive + Finishing',
        strategy: 'Adaptive clearing (3D) + rest machining + finish passes',
        description: 'Optimized for complex 3D geometries with varying heights',
        estimatedTime: 50,
        machine: '5-Axis CNC Mill',
        notes: 'Best for torus, cone, sphere, and organic shapes',
        cuttingParameters: {
          spindleSpeed: 15000,
          feedRate: 600,
          coolant: true,
        },
      },
      {
        id: 'cnc-high-speed',
        name: 'High-Speed Machining',
        strategy: 'Trochoidal milling + light passes',
        description: 'Optimized for difficult materials and minimal tool stress',
        estimatedTime: 75,
        machine: '5-Axis CNC Mill',
        notes: 'For titanium, hardened steel, and thin walls',
        cuttingParameters: {
          spindleSpeed: 18000,
          feedRate: 400,
          coolant: true,
        },
      },
    ],
  },
  {
    id: 'cnc-turning',
    name: 'CNC Turning',
    process: 'CNC Turning',
    description: 'Precision lathe operations for cylindrical parts',
    suitableFor: ['shafts', 'pins', 'bushings', 'couplings', 'axisymmetric parts'],
    strategies: [
      {
        id: 'turn-simple',
        name: 'Turning + Finish',
        strategy: 'Rough turning + finish turning + part-off',
        description: 'Standard turning operation for simple cylinders',
        estimatedTime: 20,
        machine: 'CNC Turning Center',
        notes: 'For simple cylindrical parts',
      },
      {
        id: 'turn-complex',
        name: 'Turn-Mill Complex',
        strategy: 'Turning + milling + drilling operations',
        description: 'Multi-axis turning with milling capabilities',
        estimatedTime: 45,
        machine: 'Turn-Mill Center',
        notes: 'For parts requiring drilling or milling features',
      },
    ],
  },
  {
    id: 'laser-cutting',
    name: 'Laser Cutting',
    process: 'Laser Cutting',
    description: 'Precision laser cutting for flat sheet materials',
    suitableFor: ['flat profiles', 'gaskets', 'panels', 'acrylic parts', 'decorative'],
    strategies: [
      {
        id: 'laser-contour',
        name: '2D Contour Cut',
        strategy: 'Lead-in + Contour (1 pass) + Lead-out',
        description: 'Standard single-pass contour cutting',
        estimatedTime: 10,
        machine: 'CO2 Laser Cutter (100W)',
        notes: 'Best for thin materials up to 6mm',
        cuttingParameters: {
          feedRate: 15,
        },
      },
      {
        id: 'laser-multi-pass',
        name: 'Multi-Pass Cut',
        strategy: 'Multiple passes with decreasing power',
        description: 'For thick materials requiring multiple passes',
        estimatedTime: 28,
        machine: 'CO2 Laser Cutter (150W)',
        notes: 'For materials over 6mm thickness',
        cuttingParameters: {
          feedRate: 8,
        },
      },
      {
        id: 'laser-edge',
        name: 'Edge Finish Cut',
        strategy: 'Two-pass with different power levels',
        description: 'Optimized for clean edge finish with minimal charring',
        estimatedTime: 20,
        machine: 'Fiber Laser Cutter',
        notes: 'For acrylic and visible-edge parts',
      },
    ],
  },
  {
    id: '3d-printing',
    name: '3D Printing',
    process: '3D Printing',
    description: 'Additive manufacturing for complex geometries',
    suitableFor: ['prototypes', 'complex internal features', 'low-volume production', 'organic shapes'],
    strategies: [
      {
        id: 'print-standard',
        name: 'Standard Quality',
        strategy: 'Auto-orient + Slice (0.2mm layers, 20% infill)',
        description: 'Balanced quality and speed for general use',
        estimatedTime: 135,
        machine: 'FDM 3D Printer',
        notes: 'Good balance of quality and speed',
        cuttingParameters: {
          layerHeight: 0.2,
          infill: '20%',
        },
      },
      {
        id: 'print-high-quality',
        name: 'High Quality',
        strategy: 'Fine layers + higher perimeters + smooth surfaces',
        description: 'Fine layer height for detailed prints',
        estimatedTime: 260,
        machine: 'SLA 3D Printer',
        notes: 'Best surface finish for detailed models',
        cuttingParameters: {
          layerHeight: 0.1,
          infill: '30%',
        },
      },
      {
        id: 'print-fast',
        name: 'Fast Print',
        strategy: 'Thicker layers + higher infill + fewer perimeters',
        description: 'Optimized for speed with acceptable quality',
        estimatedTime: 70,
        machine: 'FDM 3D Printer',
        notes: 'Fastest option for quick prototypes',
        cuttingParameters: {
          layerHeight: 0.3,
          infill: '15%',
        },
      },
      {
        id: 'print-functional',
        name: 'Functional Part',
        strategy: 'High infill + more perimeters + solid layers',
        description: 'Optimized for strength and durability',
        estimatedTime: 220,
        machine: 'SLS 3D Printer',
        notes: 'Maximum strength for end-use parts',
        cuttingParameters: {
          layerHeight: 0.2,
          infill: '60%',
        },
      },
    ],
  },
  {
    id: 'sheet-metal',
    name: 'Sheet Metal',
    process: 'Sheet Metal',
    description: 'Laser cutting and press brake forming for sheet metal parts',
    suitableFor: ['enclosures', 'brackets', 'panels', 'folding', ' assemblies'],
    strategies: [
      {
        id: 'sheet-simple',
        name: 'Simple Flat',
        strategy: 'Laser cut flat pattern',
        description: 'Single part with basic cut profile',
        estimatedTime: 25,
        machine: 'Sheet Laser Cutter',
        notes: 'No bending required',
      },
      {
        id: 'sheet-bend',
        name: 'Cut + Bend',
        strategy: 'Laser cut flat pattern + press brake bends',
        description: 'Cut profile with bending operations',
        estimatedTime: 48,
        machine: 'Press Brake',
        notes: 'Includes bend sequence planning',
      },
      {
        id: 'sheet-complex',
        name: 'Complex Assembly',
        strategy: 'Multi-stage cut + multiple bends + assembly tabs',
        description: 'Multi-bend part with many features',
        estimatedTime: 95,
        machine: 'Multi-Stage Press Brake',
        notes: 'Multiple bending operations required',
      },
    ],
  },
]

function normalize(s: string | undefined) {
  return (s || "").trim().toLowerCase()
}

export function getToolpathInfo(process: string): ToolpathInfo | null {
  const normalized = normalize(process)
  
  for (const info of TOOLPATH_INFO) {
    if (normalized.includes(info.id) || normalized.includes(info.name.toLowerCase())) {
      return info
    }
  }
  
  return null
}

export function selectToolpath(params: {
  process?: string
  material?: string
  objectType?: string
  geometryParams?: Record<string, any>
  featureCount?: number
}): ToolpathSelection {
  const process = normalize(params.process)
  const material = normalize(params.material)
  const objectType = normalize(params.objectType)
  const featureCount = params.featureCount ?? 0
  
  const toolpathInfo = getToolpathInfo(process)
  
  if (toolpathInfo && toolpathInfo.strategies.length > 0) {
    // Select appropriate strategy based on object type and features
    const suitableStrategy = toolpathInfo.strategies[0] // Default to first strategy
    
    // Check for complex geometry
    if (objectType === 'torus' || objectType === 'cone' || objectType === 'sphere' || featureCount > 5) {
      const complexStrategy = toolpathInfo.strategies.find(s => s.id.includes('3d') || s.id.includes('complex') || s.id.includes('high'))
      if (complexStrategy) {
        return {
          ...complexStrategy,
          notes: material.includes('titan') ? 
            `${complexStrategy.notes}. Titanium requires special tooling.` : 
            complexStrategy.notes,
        }
      }
    }
    
    return {
      ...suitableStrategy,
      notes: material.includes('titan') ? 
        `${suitableStrategy.notes}. Titanium requires special tooling.` : 
        suitableStrategy.notes,
    }
  }
  
  // Default fallback
  return {
    id: "default",
    name: "Standard",
    strategy: "Automatic toolpath generation",
    description: "Default manufacturing strategy",
    estimatedTime: 30,
    machine: "Standard Machine",
    notes: "Select a manufacturing process to get a specific toolpath strategy",
  }
}

export function getAllProcesses(): Array<{ id: string; name: string }> {
  return TOOLPATH_INFO.map(info => ({
    id: info.id,
    name: info.name,
  }))
}

export function getStrategiesForProcess(process: string): ToolpathSelection[] {
  const info = getToolpathInfo(process)
  return info?.strategies || []
}

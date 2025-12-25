// lib/pricing/materials.ts
// Material pricing database in Nigerian Naira (per kg)

export interface MaterialPrice {
  id: string
  name: string
  pricePerKg: number
  density: number // g/cm³
  category: 'metal' | 'plastic' | 'composite' | 'other'
}

export const MATERIAL_PRICES: MaterialPrice[] = [
  // Metals
  {
    id: 'aluminum-6061',
    name: 'Aluminum 6061-T6',
    pricePerKg: 2500,
    density: 2.7,
    category: 'metal',
  },
  {
    id: 'aluminum-7075',
    name: 'Aluminum 7075-T6',
    pricePerKg: 4200,
    density: 2.81,
    category: 'metal',
  },
  {
    id: 'steel-4140',
    name: 'Alloy Steel 4140',
    pricePerKg: 1800,
    density: 7.85,
    category: 'metal',
  },
  {
    id: 'stainless-steel-304',
    name: 'Stainless Steel 304',
    pricePerKg: 3500,
    density: 8.0,
    category: 'metal',
  },
  {
    id: 'stainless-steel-316',
    name: 'Stainless Steel 316',
    pricePerKg: 4500,
    density: 8.0,
    category: 'metal',
  },
  {
    id: 'brass-360',
    name: 'Brass 360',
    pricePerKg: 4000,
    density: 8.5,
    category: 'metal',
  },
  {
    id: 'copper-101',
    name: 'Copper 101',
    pricePerKg: 5500,
    density: 8.94,
    category: 'metal',
  },
  {
    id: 'titanium-ti6al4v',
    name: 'Titanium Ti-6Al-4V',
    pricePerKg: 18000,
    density: 4.43,
    category: 'metal',
  },
  // Plastics
  {
    id: 'abs',
    name: 'ABS Plastic',
    pricePerKg: 1200,
    density: 1.05,
    category: 'plastic',
  },
  {
    id: 'nylon-6',
    name: 'Nylon 6',
    pricePerKg: 1500,
    density: 1.14,
    category: 'plastic',
  },
  {
    id: 'delrin',
    name: 'Delrin (Acetal)',
    pricePerKg: 2000,
    density: 1.41,
    category: 'plastic',
  },
  {
    id: 'peek',
    name: 'PEEK',
    pricePerKg: 35000,
    density: 1.32,
    category: 'plastic',
  },
  {
    id: 'pc',
    name: 'Polycarbonate',
    pricePerKg: 2500,
    density: 1.2,
    category: 'plastic',
  },
  {
    id: 'uhmwpe',
    name: 'UHMWPE',
    pricePerKg: 3000,
    density: 0.93,
    category: 'plastic',
  },
  // 3D Printing Materials
  {
    id: 'pla',
    name: 'PLA Filament',
    pricePerKg: 800,
    density: 1.24,
    category: 'other',
  },
  {
    id: 'abs-3dprint',
    name: 'ABS Filament',
    pricePerKg: 1200,
    density: 1.04,
    category: 'other',
  },
  {
    id: 'petg',
    name: 'PETG Filament',
    pricePerKg: 1500,
    density: 1.27,
    category: 'other',
  },
  {
    id: 'resin-standard',
    name: 'Standard Resin',
    pricePerKg: 2800,
    density: 1.15,
    category: 'other',
  },
  {
    id: 'resin-tough',
    name: 'Tough Resin',
    pricePerKg: 4500,
    density: 1.2,
    category: 'other',
  },
  {
    id: 'resin-clear',
    name: 'Clear Resin',
    pricePerKg: 5500,
    density: 1.18,
    category: 'other',
  },
  // Composites
  {
    id: 'carbon-fiber',
    name: 'Carbon Fiber Composite',
    pricePerKg: 25000,
    density: 1.6,
    category: 'composite',
  },
  {
    id: 'g10',
    name: 'G-10 Fiberglass',
    pricePerKg: 8000,
    density: 1.8,
    category: 'composite',
  },
]

export function getMaterialPrice(materialId: string): MaterialPrice | null {
  return MATERIAL_PRICES.find(m => m.id === materialId) || null
}

export function calculateMaterialCost(
  volumeMm3: number,
  materialId: string,
  wasteFactor: number = 1.15
): number {
  const material = getMaterialPrice(materialId)
  if (!material) {
    // Default cost if material not found
    return (volumeMm3 / 1000000) * 2000 * wasteFactor
  }

  // Volume in mm³ to cm³ (1 cm³ = 1000 mm³)
  const volumeCm3 = volumeMm3 / 1000
  
  // Mass in grams = volume × density
  const massG = volumeCm3 * material.density
  
  // Mass in kg = mass in grams / 1000
  const massKg = massG / 1000
  
  // Cost = mass × price per kg × waste factor
  return massKg * material.pricePerKg * wasteFactor
}

export function getMaterialCategory(materialId: string): string {
  const material = getMaterialPrice(materialId)
  return material?.category || 'other'
}

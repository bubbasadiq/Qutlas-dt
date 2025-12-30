/**
 * Finish-Material Compatibility Matrix
 * Engineering-accurate compatibility rules for manufacturing finishes
 */

// All materials in the catalog
export type Material =
  | 'Steel'
  | 'Aluminum'
  | 'Stainless Steel'
  | 'Brass'
  | 'Bronze'
  | 'Copper'
  | 'Cast Iron'
  | 'Basalt'
  | 'Ceramic'
  | 'Polymer';

// All finishes in the catalog
export type Finish =
  | 'Raw/Unfinished'
  | 'Powder Coat'
  | 'Anodize'
  | 'Hard Anodize'
  | 'Paint'
  | 'Electroplate'
  | 'Polished'
  | 'Brushed'
  | 'Nickel Plated'
  | 'Chrome Plated';

// Cost multipliers for each finish (as percentage of material cost)
export const FINISH_COST_MULTIPLIERS: Record<Finish, number> = {
  'Raw/Unfinished': 0,
  'Powder Coat': 15,
  'Anodize': 12,
  'Hard Anodize': 18,
  'Paint': 10,
  'Electroplate': 20,
  'Polished': 25,
  'Brushed': 20,
  'Nickel Plated': 22,
  'Chrome Plated': 30,
};

// Compatibility matrix: which finishes work with which materials
const FINISH_MATERIAL_COMPATIBILITY: Record<Finish, Material[]> = {
  'Raw/Unfinished': [
    'Steel',
    'Aluminum',
    'Stainless Steel',
    'Brass',
    'Bronze',
    'Copper',
    'Cast Iron',
    'Basalt',
    'Ceramic',
    'Polymer',
  ],
  'Powder Coat': ['Steel', 'Aluminum'],
  'Anodize': ['Aluminum'],
  'Hard Anodize': ['Aluminum'],
  'Paint': ['Steel', 'Aluminum'],
  'Electroplate': ['Steel', 'Copper', 'Brass', 'Bronze', 'Cast Iron'],
  'Polished': ['Stainless Steel', 'Aluminum', 'Brass', 'Copper'],
  'Brushed': ['Stainless Steel', 'Aluminum', 'Brass', 'Copper'],
  'Nickel Plated': ['Steel', 'Copper', 'Brass', 'Bronze', 'Cast Iron'],
  'Chrome Plated': ['Steel', 'Copper', 'Brass', 'Bronze', 'Cast Iron'],
};

/**
 * Check if a finish is compatible with a material
 */
export function isFinishCompatibleWithMaterial(
  finish: Finish,
  material: Material,
): boolean {
  const compatibleMaterials = FINISH_MATERIAL_COMPATIBILITY[finish];
  return compatibleMaterials?.includes(material) ?? false;
}

/**
 * Get all finishes compatible with a specific material
 */
export function getFinishesForMaterial(material: Material): Finish[] {
  const compatibleFinishes: Finish[] = [];
  for (const [finish, materials] of Object.entries(FINISH_MATERIAL_COMPATIBILITY)) {
    if (materials.includes(material)) {
      compatibleFinishes.push(finish as Finish);
    }
  }
  return compatibleFinishes;
}

/**
 * Get all available finishes for a list of selected materials
 * Returns finishes that are compatible with ALL selected materials
 * If no materials selected, returns all finishes
 */
export function getAvailableFinishesForMaterials(
  selectedMaterials: Material[],
): Finish[] {
  if (selectedMaterials.length === 0) {
    return Object.keys(FINISH_MATERIAL_COMPATIBILITY) as Finish[];
  }

  // Find finishes compatible with ALL selected materials
  const availableFinishes = (Object.entries(
    FINISH_MATERIAL_COMPATIBILITY,
  ) as [Finish, Material[]][]).filter(([finish, materials]) => {
    return selectedMaterials.every((mat) => materials.includes(mat));
  });

  return availableFinishes.map(([finish]) => finish);
}

/**
 * Get finishes that would be disabled for a specific material
 */
export function getDisabledFinishesForMaterial(
  material: Material,
): Finish[] {
  const allFinishes = Object.keys(FINISH_MATERIAL_COMPATIBILITY) as Finish[];
  return allFinishes.filter((finish) => !isFinishCompatibleWithMaterial(finish, material));
}

/**
 * Check if a part's finish is compatible with its material
 */
export function isPartFinishCompatible(part: {
  material: Material;
  finish?: string | null;
}): boolean {
  if (!part.finish) return true;
  return isFinishCompatibleWithMaterial(part.finish as Finish, part.material);
}

/**
 * Get the compatibility status for display
 */
export function getFinishCompatibilityStatus(
  finish: Finish,
  selectedMaterials: Material[],
): {
  compatible: boolean;
  reason?: string;
} {
  if (selectedMaterials.length === 0) {
    return { compatible: true };
  }

  // Check if finish is compatible with all selected materials
  const compatibleWithAll = selectedMaterials.every((mat) =>
    isFinishCompatibleWithMaterial(finish, mat),
  );

  if (compatibleWithAll) {
    return { compatible: true };
  }

  // Find materials that are NOT compatible
  const incompatibleMaterials = selectedMaterials.filter(
    (mat) => !isFinishCompatibleWithMaterial(finish, mat),
  );

  return {
    compatible: false,
    reason: `Not compatible with ${incompatibleMaterials.join(', ')}`,
  };
}

/**
 * All available materials in the catalog
 */
export const ALL_MATERIALS: Material[] = [
  'Steel',
  'Aluminum',
  'Stainless Steel',
  'Brass',
  'Bronze',
  'Copper',
  'Cast Iron',
  'Basalt',
  'Ceramic',
  'Polymer',
];

/**
 * All available finishes in the catalog
 */
export const ALL_FINISHES: Finish[] = [
  'Raw/Unfinished',
  'Powder Coat',
  'Anodize',
  'Hard Anodize',
  'Paint',
  'Electroplate',
  'Polished',
  'Brushed',
  'Nickel Plated',
  'Chrome Plated',
];

/**
 * Map catalog data finish names to standardized finish types
 */
export const FINISH_NAME_MAPPING: Record<string, Finish> = {
  'Raw': 'Raw/Unfinished',
  'raw': 'Raw/Unfinished',
  'Unfinished': 'Raw/Unfinished',
  'Powder Coat': 'Powder Coat',
  'powder-coat': 'Powder Coat',
  'Anodize': 'Anodize',
  'anodize': 'Anodize',
  'Hard Anodize': 'Hard Anodize',
  'hard-anodize': 'Hard Anodize',
  'Paint': 'Paint',
  'paint': 'Paint',
  'Electroplate': 'Electroplate',
  'electroplate': 'Electroplate',
  'Polished': 'Polished',
  'polished': 'Polished',
  'Brushed': 'Brushed',
  'brushed': 'Brushed',
  'Nickel Plated': 'Nickel Plated',
  'nickel-plated': 'Nickel Plated',
  'Chrome Plated': 'Chrome Plated',
  'chrome-plated': 'Chrome Plated',
  'Galvanized': 'Electroplate', // Galvanized is a type of electroplate
  'galvanized': 'Electroplate',
  'Zinc Plated': 'Electroplate', // Zinc plated is a type of electroplate
  'zinc-plated': 'Electroplate',
  'Stainless': 'Raw/Unfinished', // Stainless is a material, not a finish
  'stainless': 'Raw/Unfinished',
};

/**
 * Standardize a finish name to the canonical Finish type
 */
export function standardizeFinishName(finishName: string): Finish {
  return FINISH_NAME_MAPPING[finishName] || 'Raw/Unfinished';
}

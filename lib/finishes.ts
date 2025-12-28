// lib/finishes.ts
// Finish types and pricing configuration for platform-wide finishes

export type FinishType =
  | 'powder-coat'
  | 'anodize'
  | 'hard-anodize'
  | 'electroplate'
  | 'paint'
  | 'polished'
  | 'brushed'
  | 'raw-unfinished'
  | 'nickel-plated'
  | 'chrome-plated';

export interface FinishOption {
  id: FinishType;
  name: string;
  description: string;
  multiplier: number;
  basePriceNgn: number;
  availableProcesses: string[];
  colorOptions?: string[];
  leadTimeDays?: number;
}

export interface SelectedFinish {
  finishId: FinishType;
  color?: string;
  areaMm2?: number;
}

export const FINISHES: FinishOption[] = [
  {
    id: 'powder-coat',
    name: 'Powder Coat',
    description:
      'Durable electrostatic paint coating, available in various colors',
    multiplier: 1.15,
    basePriceNgn: 2500,
    availableProcesses: ['cnc-milling', 'cnc-turning', 'sheet-metal'],
    colorOptions: ['black', 'white', 'gray', 'blue', 'red', 'green', 'yellow'],
    leadTimeDays: 2,
  },
  {
    id: 'anodize',
    name: 'Anodize',
    description:
      'Electrochemical oxidation for corrosion resistance, natural or dyed',
    multiplier: 1.2,
    basePriceNgn: 3000,
    availableProcesses: ['cnc-milling', 'cnc-turning'],
    colorOptions: ['clear', 'black', 'gold', 'blue', 'red', 'purple'],
    leadTimeDays: 2,
  },
  {
    id: 'hard-anodize',
    name: 'Hard Anodize',
    description:
      'Thicker, wear-resistant anodized coating for harsh environments',
    multiplier: 1.35,
    basePriceNgn: 4500,
    availableProcesses: ['cnc-milling', 'cnc-turning'],
    colorOptions: ['clear', 'black', 'gray'],
    leadTimeDays: 3,
  },
  {
    id: 'electroplate',
    name: 'Electroplate',
    description: 'Electrolytic deposition of metal coating',
    multiplier: 1.25,
    basePriceNgn: 3500,
    availableProcesses: ['cnc-milling', 'cnc-turning'],
    colorOptions: ['nickel', 'chrome', 'copper', 'zinc'],
    leadTimeDays: 3,
  },
  {
    id: 'paint',
    name: 'Paint',
    description: 'Wet paint application, primer + topcoat system',
    multiplier: 1.1,
    basePriceNgn: 2000,
    availableProcesses: ['cnc-milling', 'cnc-turning', 'sheet-metal'],
    colorOptions: ['custom'],
    leadTimeDays: 2,
  },
  {
    id: 'polished',
    name: 'Polished',
    description: 'Mechanical polishing for mirror-like finish',
    multiplier: 1.3,
    basePriceNgn: 4000,
    availableProcesses: ['cnc-milling', 'cnc-turning'],
    leadTimeDays: 1,
  },
  {
    id: 'brushed',
    name: 'Brushed',
    description: 'Linear brush finish for aesthetic appearance',
    multiplier: 1.15,
    basePriceNgn: 2500,
    availableProcesses: ['cnc-milling', 'cnc-turning', 'sheet-metal'],
    leadTimeDays: 1,
  },
  {
    id: 'raw-unfinished',
    name: 'Raw/Unfinished',
    description: 'As-machined finish, no additional processing',
    multiplier: 1.0,
    basePriceNgn: 0,
    availableProcesses: [
      'cnc-milling',
      'cnc-turning',
      'laser-cutting',
      '3d-printing',
      'sheet-metal',
    ],
    leadTimeDays: 0,
  },
  {
    id: 'nickel-plated',
    name: 'Nickel Plated',
    description:
      'Electroless nickel plating for hardness and corrosion resistance',
    multiplier: 1.4,
    basePriceNgn: 5000,
    availableProcesses: ['cnc-milling', 'cnc-turning'],
    colorOptions: ['matte-nickel', 'bright-nickel'],
    leadTimeDays: 3,
  },
  {
    id: 'chrome-plated',
    name: 'Chrome Plated',
    description: 'Decorative chrome plating for high-gloss finish',
    multiplier: 1.6,
    basePriceNgn: 7000,
    availableProcesses: ['cnc-milling', 'cnc-turning'],
    colorOptions: ['bright-chrome', 'hard-chrome'],
    leadTimeDays: 4,
  },
];

export const FINISHES_MAP: Record<FinishType, FinishOption> = FINISHES.reduce(
  (acc, finish) => {
    acc[finish.id] = finish;
    return acc;
  },
  {} as Record<FinishType, FinishOption>,
);

export function getFinishById(id: FinishType): FinishOption | undefined {
  return FINISHES_MAP[id];
}

export function getAvailableFinishesForProcess(
  process: string,
): FinishOption[] {
  return FINISHES.filter((finish) =>
    finish.availableProcesses.some((p) =>
      process.toLowerCase().includes(p.replace('cnc-', '')),
    ),
  );
}

export function calculateFinishCost(
  finishId: FinishType,
  basePrice: number,
  areaMm2?: number,
): number {
  const finish = getFinishById(finishId);
  if (!finish) return 0;

  if (areaMm2 && areaMm2 > 0) {
    // Area-based pricing: base price per 10000mm² (100cm²)
    const areaUnits = areaMm2 / 10000;
    return finish.basePriceNgn * areaUnits;
  }

  // Percentage-based on base price
  return basePrice * (finish.multiplier - 1);
}

export function getFinishLeadTime(
  finishId: FinishType,
  baseLeadTime: number,
): number {
  const finish = getFinishById(finishId);
  if (!finish || !finish.leadTimeDays) return baseLeadTime;
  return baseLeadTime + finish.leadTimeDays;
}

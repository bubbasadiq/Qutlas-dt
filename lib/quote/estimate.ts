// lib/quote/estimate.ts
// Complete quote calculation engine with full NGN pricing

import { getMaterialPrice, calculateMaterialCost } from '../pricing/materials';
import {
  getDefaultMachineForProcess,
  calculateMachineTimeCost,
  estimateProcessingTime,
} from '../pricing/machines';
import { estimateToolCosts } from '../pricing/tools';
import {
  calculateToolpath,
  type ToolpathCalculatorInput,
} from '../toolpath/calculator';
import { assessManufacturability } from '../manufacturability/assess';
import {
  calculateFinishCost,
  getFinishById,
  type FinishType,
} from '../finishes';

export interface QuoteInput {
  geometryParams: Record<string, unknown>;
  objectType?: string;
  material: string;
  process: string;
  quantity: number;
  finish?: FinishType;
  features?: Array<{ type: string; parameters: Record<string, unknown> }>;
}

export interface QuoteBreakdown {
  materialCost: number;
  materialWaste: number;
  machineTimeMinutes: number;
  machineCost: number;
  setupCost: number;
  toolCost: number;
  laborCost: number;
  finishCost: number;
  finishName: string;
  subtotal: number;
  platformFee: number;
  platformFeePercent: number;
  totalPrice: number;
  leadTimeDays: number;
  unitPrice: number;
}

export interface QuoteResult {
  success: boolean;
  jobId?: string;
  timestamp: string;
  geometry: {
    type: string;
    volumeMm3: number;
    volumeCm3: number;
  };
  material: {
    type: string;
    name: string;
    density: number;
    massKg: number;
    pricePerKg: number;
    volumeCm3: number;
  };
  process: string;
  finish?: {
    type: string;
    name: string;
  };
  manufacturability: {
    score: number;
    compatible: boolean;
    issuesCount: number;
  };
  toolpath: {
    strategy: string;
    machine: string;
    timeMinutes: number;
  };
  breakdown: QuoteBreakdown;
  currency: string;
  pricingValidMinutes: number;
}

export interface DetailedQuoteResult extends QuoteResult {
  details: {
    materialDetails: string;
    machineDetails: string;
    toolDetails: string;
    notes: string[];
  };
}

// Calculate volume in mm³ from geometry parameters
function calculateVolume(params: Record<string, unknown>): number {
  const width = (params.width || params.length || params.x || 50) as number;
  const height = (params.height || params.depth || params.y || 50) as number;
  const depth = (params.depth || params.width || params.z || 50) as number;
  const radius = (params.radius ||
    ((params.diameter as number)
      ? (params.diameter as number) / 2
      : 25)) as number;

  // Detect object type from dimensions
  if (params.type === 'cylinder') {
    return Math.PI * radius * radius * height;
  } else if (params.type === 'sphere') {
    return (4 / 3) * Math.PI * Math.pow(radius, 3);
  } else if (params.type === 'cone') {
    return (1 / 3) * Math.PI * radius * radius * height;
  } else if (params.type === 'torus') {
    const majorRadius = (params.majorRadius || params.radius || 50) as number;
    const minorRadius = (params.minorRadius || params.tube || 15) as number;
    return Math.PI * minorRadius * minorRadius * 2 * Math.PI * majorRadius;
  }

  // Default to box volume
  return width * height * depth;
}

// Get lead time in days based on process and quantity
function getLeadTimeDays(
  process: string,
  quantity: number,
  timeMinutes: number,
): number {
  const baseDays: Record<string, number> = {
    'cnc-milling': 3,
    'cnc-turning': 2,
    'laser-cutting': 2,
    '3d-printing': 3,
    'sheet-metal': 4,
  };

  const processKey = Object.keys(baseDays).find((k) =>
    process.toLowerCase().includes(k.replace('cnc-', '')),
  );

  const base = baseDays[processKey || 'cnc-milling'];

  // Add days for quantity
  const quantityDays = Math.ceil(quantity / 5);

  // Add days for complexity (based on machine time)
  const complexityDays = Math.ceil(timeMinutes / 60 / 4); // 1 day per 4 hours

  return base + quantityDays + complexityDays;
}

export function generateQuote(input: QuoteInput): DetailedQuoteResult {
  const {
    geometryParams,
    objectType,
    material,
    process,
    quantity,
    finish,
    features = [],
  } = input;

  // Generate job ID
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate volume
  const volumeMm3 = calculateVolume(geometryParams);
  const volumeCm3 = volumeMm3 / 1000;

  // Get material pricing
  const materialData = getMaterialPrice(material);

  // Calculate material cost
  const materialCost = calculateMaterialCost(volumeMm3, material);

  // Get machine rate and calculate time
  const machine = getDefaultMachineForProcess(process);

  // Estimate processing time
  const estimatedMinutes = estimateProcessingTime(volumeMm3, process, material);

  // Calculate machine time cost
  const machineTimeMinutes = estimatedMinutes * Math.ceil(quantity / 10); // Batch processing
  const machineCost = calculateMachineTimeCost(
    machineTimeMinutes,
    machine?.id || 'cnc-3axis',
  );

  // Calculate tool costs
  const toolCost =
    estimateToolCosts(process, material, features.length, volumeMm3) *
    Math.ceil(quantity / 10);

  // Calculate setup cost
  const setupCost = machine?.setupFee || 1500;

  // Calculate labor cost (setup time + inspection)
  const laborMinutes = 30 + features.length * 5; // Base 30 min + 5 min per feature
  const laborRate = 500; // NGN per minute
  const laborCost = laborMinutes * laborRate;

  // Calculate material waste (typically 15-30% depending on process)
  const wasteFactor = process.includes('cnc')
    ? 0.25
    : process.includes('print')
      ? 0.15
      : 0.2;
  const materialWaste = materialCost * wasteFactor;

  // Calculate finish cost
  const finishData = finish ? getFinishById(finish) : undefined;
  const finishCost =
    finish && finishData
      ? calculateFinishCost(finish, materialCost, volumeMm3)
      : 0;
  const finishName = finishData?.name || 'None';

  // Calculate subtotal (includes finish cost)
  const subtotal =
    materialCost +
    machineCost +
    toolCost +
    setupCost +
    laborCost +
    materialWaste +
    finishCost;

  // Platform fee (5%)
  const platformFeePercent = 0.05;
  const platformFee = subtotal * platformFeePercent;

  // Total price
  const totalPrice = subtotal + platformFee;
  const unitPrice = totalPrice / quantity;

  // Get lead time
  const leadTimeDays = getLeadTimeDays(process, quantity, machineTimeMinutes);

  // Assess manufacturability
  const manufactResult = assessManufacturability({
    dimensions: geometryParams as Record<string, number>,
    features,
    material,
    process,
    quantity,
  });

  // Calculate toolpath
  const toolpathInput: ToolpathCalculatorInput = {
    objectType: objectType || (geometryParams.type as string) || 'box',
    dimensions: geometryParams as Record<string, number>,
    features,
    material,
    process,
    quantity,
    volumeMm3,
  };
  const toolpathResult = calculateToolpath(toolpathInput);

  return {
    success: true,
    jobId,
    timestamp: new Date().toISOString(),
    geometry: {
      type: objectType || (geometryParams.type as string) || 'box',
      volumeMm3,
      volumeCm3: Math.round(volumeCm3 * 1000) / 1000,
    },
    material: {
      type: material,
      name: materialData?.name || material,
      density: materialData?.density || 2.7,
      massKg:
        Math.round(
          ((volumeCm3 * (materialData?.density || 2.7)) / 1000) * 1000,
        ) / 1000,
      pricePerKg: materialData?.pricePerKg || 2500,
      volumeCm3: Math.round(volumeCm3 * 1000) / 1000,
    },
    process,
    finish: finish ? { type: finish, name: finishName } : undefined,
    manufacturability: {
      score: manufactResult.score,
      compatible: manufactResult.compatible,
      issuesCount: manufactResult.issues.length,
    },
    toolpath: {
      strategy: toolpathResult.strategy,
      machine: toolpathResult.machine,
      timeMinutes: toolpathResult.timeMinutes,
    },
    breakdown: {
      materialCost: Math.round(materialCost * 100) / 100,
      materialWaste: Math.round(materialWaste * 100) / 100,
      machineTimeMinutes,
      machineCost: Math.round(machineCost * 100) / 100,
      setupCost,
      toolCost: Math.round(toolCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      finishCost: Math.round(finishCost * 100) / 100,
      finishName,
      subtotal: Math.round(subtotal * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      platformFeePercent,
      totalPrice: Math.round(totalPrice * 100) / 100,
      leadTimeDays,
      unitPrice: Math.round(unitPrice * 100) / 100,
    },
    currency: 'NGN',
    pricingValidMinutes: 60,
    details: {
      materialDetails: `Volume: ${volumeCm3.toFixed(2)}cm³, Density: ${materialData?.density || 2.7}g/cm³`,
      machineDetails: `${toolpathResult.machine}, ${machineTimeMinutes} minutes`,
      toolDetails: `Tools: ${toolpathResult.notes.join(', ')}`,
      notes: [
        ...toolpathResult.notes,
        ...manufactResult.warnings,
        quantity > 10 ? 'Quantity discount applied' : '',
        finish ? `Finish: ${finishName}` : '',
      ].filter(Boolean),
    },
  };
}

// Simple quote estimate function for quick calculations
export function estimateQuote(input: QuoteInput): QuoteBreakdown {
  const result = generateQuote(input);
  return result.breakdown;
}

// Format price in Nigerian Naira
export function formatPriceNGN(amount: number): string {
  return `₦ ${new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

// Get price breakdown summary
export function getPriceSummary(breakdown: QuoteBreakdown): string {
  return `
Material: ${formatPriceNGN(breakdown.materialCost)}
Finish: ${formatPriceNGN(breakdown.finishCost)} ${breakdown.finishName !== 'None' ? `(${breakdown.finishName})` : ''}
Machine: ${formatPriceNGN(breakdown.machineCost)}
Labor: ${formatPriceNGN(breakdown.laborCost)}
Tools: ${formatPriceNGN(breakdown.toolCost)}
Setup: ${formatPriceNGN(breakdown.setupCost)}
Subtotal: ${formatPriceNGN(breakdown.subtotal)}
Platform Fee (${(breakdown.platformFeePercent * 100).toFixed(0)}%): ${formatPriceNGN(breakdown.platformFee)}
Total: ${formatPriceNGN(breakdown.totalPrice)}
  `.trim();
}

// Export quote as JSON
export function exportQuoteAsJSON(result: DetailedQuoteResult): string {
  return JSON.stringify(
    {
      jobId: result.jobId,
      timestamp: result.timestamp,
      geometry: result.geometry,
      material: result.material,
      process: result.process,
      manufacturability: result.manufacturability,
      toolpath: result.toolpath,
      breakdown: result.breakdown,
      currency: result.currency,
    },
    null,
    2,
  );
}

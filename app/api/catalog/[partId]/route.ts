// app/api/catalog/[partId]/route.ts
// Part detail API with database-backed queries

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { CATALOG_PARTS } from '@/lib/catalog-data';

// Create a map of parts by ID for fast lookup
const catalogPartsMap = new Map(CATALOG_PARTS.map((part) => [part.id, part]));

// Legacy sample parts for backwards compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacySampleParts: Record<string, any> = {
  'part-001': {
    id: 'part-001',
    name: 'Precision Bracket',
    description:
      'High-precision aluminum bracket suitable for mounting electronics, sensors, and mechanical assemblies. Features precise hole placement and excellent surface finish.',
    category: 'brackets',
    material: 'Aluminum 6061-T6',
    process: 'CNC Milling',
    basePrice: 32,
    leadTime: '3-5 days',
    leadTimeDays: 5,
    manufacturability: 96,
    thumbnail: '/placeholder.svg?height=400&width=400',
    cadFilePath: '/cad/bracket.stp',
    parameters: [
      { name: 'Length', value: 100, unit: 'mm', min: 50, max: 200 },
      { name: 'Width', value: 50, unit: 'mm', min: 25, max: 100 },
      { name: 'Height', value: 25, unit: 'mm', min: 10, max: 50 },
      { name: 'Hole Diameter', value: 6, unit: 'mm', min: 3, max: 12 },
    ],
    materials: [
      { name: 'Aluminum 6061-T6', priceMultiplier: 1.0 },
      { name: 'Aluminum 7075', priceMultiplier: 1.3 },
      { name: 'Steel 1018', priceMultiplier: 0.9 },
      { name: 'Stainless 304', priceMultiplier: 1.5 },
    ],
    specifications: [
      { label: 'Tolerance', value: '±0.1mm' },
      { label: 'Surface Finish', value: 'Ra 1.6μm' },
      { label: 'Max Temp', value: '150°C' },
      { label: 'Weight', value: '45g' },
    ],
  },
  'part-002': {
    id: 'part-002',
    name: 'Hex Socket Bolt M8',
    description:
      'Standard hex socket bolt for mechanical assemblies. Precision threaded for reliable fastening.',
    category: 'fasteners',
    material: 'Steel',
    process: 'CNC',
    basePrice: 4,
    leadTime: '2 days',
    leadTimeDays: 3,
    manufacturability: 99,
    thumbnail: '/placeholder.svg?height=400&width=400',
    cadFilePath: '/cad/bolt-m8.stp',
    parameters: [
      { name: 'Diameter', value: 8, unit: 'mm', min: 4, max: 16 },
      { name: 'Length', value: 30, unit: 'mm', min: 10, max: 100 },
    ],
    materials: [
      { name: 'Steel', priceMultiplier: 1.0 },
      { name: 'Stainless 304', priceMultiplier: 1.5 },
      { name: 'Brass', priceMultiplier: 2.0 },
    ],
    specifications: [
      { label: 'Thread', value: 'M8 x 1.25' },
      { label: 'Tolerance', value: 'ISO 4762' },
      { label: 'Surface Finish', value: 'Ra 3.2μm' },
      { label: 'Grade', value: '12.9' },
    ],
  },
  'part-003': {
    id: 'part-003',
    name: 'Electronics Enclosure',
    description:
      'Protective enclosure for electronics with mounting points and cable management features.',
    category: 'enclosures',
    material: 'ABS',
    process: '3D Printing',
    basePrice: 28,
    leadTime: '4 days',
    leadTimeDays: 4,
    manufacturability: 94,
    thumbnail: '/placeholder.svg?height=400&width=400',
    cadFilePath: '/cad/enclosure.stp',
    parameters: [
      { name: 'Length', value: 150, unit: 'mm', min: 50, max: 300 },
      { name: 'Width', value: 100, unit: 'mm', min: 50, max: 200 },
      { name: 'Height', value: 50, unit: 'mm', min: 20, max: 100 },
    ],
    materials: [
      { name: 'ABS', priceMultiplier: 1.0 },
      { name: 'Aluminum 6061-T6', priceMultiplier: 1.2 },
      { name: 'Nylon', priceMultiplier: 0.9 },
    ],
    specifications: [
      { label: 'Tolerance', value: '±0.3mm' },
      { label: 'Wall Thickness', value: '2mm' },
      { label: 'IP Rating', value: 'IP54' },
      { label: 'Weight', value: '120g' },
    ],
  },
  'part-004': {
    id: 'part-004',
    name: 'Drive Shaft 20mm',
    description:
      'Precision drive shaft for mechanical assemblies with keyway and thread.',
    category: 'shafts',
    material: 'Steel 1045',
    process: 'CNC Turning',
    basePrice: 45,
    leadTime: '5 days',
    leadTimeDays: 5,
    manufacturability: 98,
    thumbnail: '/placeholder.svg?height=400&width=400',
    cadFilePath: '/cad/shaft.stp',
    parameters: [
      { name: 'Diameter', value: 20, unit: 'mm', min: 10, max: 50 },
      { name: 'Length', value: 100, unit: 'mm', min: 50, max: 300 },
      { name: 'Keyway Width', value: 6, unit: 'mm', min: 4, max: 10 },
    ],
    materials: [
      { name: 'Steel 1045', priceMultiplier: 1.0 },
      { name: 'Stainless 316', priceMultiplier: 1.8 },
      { name: 'Aluminum 7075', priceMultiplier: 1.1 },
    ],
    specifications: [
      { label: 'Tolerance', value: '±0.02mm' },
      { label: 'Surface Finish', value: 'Ra 0.8μm' },
      { label: 'Hardness', value: '55-60 HRC' },
      { label: 'Runout', value: '<0.05mm' },
    ],
  },
  'part-005': {
    id: 'part-005',
    name: 'Spur Gear 24T',
    description:
      'Precision machined spur gear with 24 teeth for power transmission applications.',
    category: 'gears',
    material: 'Brass',
    process: 'CNC Milling',
    basePrice: 56,
    leadTime: '6 days',
    leadTimeDays: 6,
    manufacturability: 91,
    thumbnail: '/placeholder.svg?height=400&width=400',
    cadFilePath: '/cad/gear.stp',
    parameters: [
      { name: 'Module', value: 2, unit: 'mm', min: 1, max: 4 },
      { name: 'Teeth', value: 24, unit: 'count', min: 12, max: 48 },
      { name: 'Face Width', value: 20, unit: 'mm', min: 10, max: 40 },
      { name: 'Bore Diameter', value: 12, unit: 'mm', min: 8, max: 20 },
    ],
    materials: [
      { name: 'Brass', priceMultiplier: 1.0 },
      { name: 'Delrin', priceMultiplier: 0.85 },
      { name: 'Steel 1018', priceMultiplier: 1.2 },
    ],
    specifications: [
      { label: 'Pressure Angle', value: '20°' },
      { label: 'Tolerance', value: 'AGMA Q9' },
      { label: 'Surface Finish', value: 'Ra 1.6μm' },
      { label: 'Pitch Diameter', value: '48mm' },
    ],
  },
  'part-006': {
    id: 'part-006',
    name: 'L-Bracket Heavy',
    description:
      'Heavy-duty L-bracket for structural applications with mounting holes.',
    category: 'brackets',
    material: 'Steel',
    process: 'Sheet Metal',
    basePrice: 18,
    leadTime: '2 days',
    leadTimeDays: 2,
    manufacturability: 97,
    thumbnail: '/placeholder.svg?height=400&width=400',
    cadFilePath: '/cad/l-bracket.stp',
    parameters: [
      { name: 'Length', value: 100, unit: 'mm', min: 50, max: 200 },
      { name: 'Width', value: 50, unit: 'mm', min: 25, max: 100 },
      { name: 'Thickness', value: 3, unit: 'mm', min: 1, max: 6 },
    ],
    materials: [
      { name: 'Steel', priceMultiplier: 1.0 },
      { name: 'Aluminum 5052', priceMultiplier: 1.1 },
      { name: 'Stainless 304', priceMultiplier: 1.6 },
    ],
    specifications: [
      { label: 'Tolerance', value: '±0.2mm' },
      { label: 'Bend Radius', value: '1x thickness' },
      { label: 'Surface Finish', value: 'Mill finish' },
      { label: 'Weight', value: '180g' },
    ],
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ partId: string }> },
) {
  const { partId } = await params;
  let part = null;
  let dbSource = false;

  try {
    const { data, error } = await supabase
      .from('catalog_parts')
      .select('*')
      .eq('id', partId)
      .single();

    if (!error && data) {
      part = data;
      dbSource = true;
    }
  } catch (dbError) {
    console.warn('Database not available, using sample data:', dbError);
  }

  // Try catalog parts map first
  if (!part) {
    const catalogPart = catalogPartsMap.get(partId);
    if (catalogPart) {
      // Transform catalog part to include expected fields for detail view
      part = {
        ...catalogPart,
        parameters: catalogPart.specs
          ? Object.entries(catalogPart.specs).map(([name, value]) => ({
              name: name.replace(/([A-Z])/g, ' $1').trim(),
              value: typeof value === 'number' ? value : 0,
              unit: typeof value === 'number' ? 'mm' : '',
              min: typeof value === 'number' ? Math.floor(value * 0.5) : 0,
              max: typeof value === 'number' ? Math.ceil(value * 2) : 100,
            }))
          : [],
        specifications: [
          { label: 'Material', value: catalogPart.material },
          { label: 'Process', value: catalogPart.process || 'Standard' },
          { label: 'Finish', value: catalogPart.finish || 'Raw' },
          { label: 'Lead Time', value: catalogPart.leadTime || '3-5 days' },
        ],
      };
    }
  }

  // Fall back to legacy sample parts
  if (!part) {
    part = legacySampleParts[partId] || null;
  }

  if (!part) {
    return NextResponse.json({ error: 'Part not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...part,
    source: dbSource ? 'database' : 'catalog',
  });
}

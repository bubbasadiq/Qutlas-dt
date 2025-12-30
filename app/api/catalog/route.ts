// app/api/catalog/route.ts
// Catalog API with database-backed queries

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { CATALOG_PARTS, type CategoryId } from '@/lib/catalog-data';

const sampleCatalogItems = CATALOG_PARTS;

// Legacy sample data for backwards compatibility (kept for reference)
const _legacySampleItems = [
  {
    id: 'part-001',
    name: 'Precision Bracket',
    description: 'High-precision aluminum bracket for mounting',
    category: 'brackets',
    material: 'Aluminum 6061-T6',
    process: 'CNC Milling',
    basePrice: 32,
    leadTime: '3-5 days',
    leadTimeDays: 5,
    manufacturability: 96,
    thumbnail: '/placeholder.svg?height=200&width=200',
    materials: [
      { name: 'Aluminum 6061-T6', priceMultiplier: 1.0 },
      { name: 'Aluminum 7075', priceMultiplier: 1.3 },
      { name: 'Steel 1018', priceMultiplier: 0.9 },
      { name: 'Stainless 304', priceMultiplier: 1.5 },
    ],
  },
  {
    id: 'part-002',
    name: 'Hex Socket Bolt M8',
    description: 'Standard hex socket bolt',
    category: 'fasteners',
    material: 'Steel',
    process: 'CNC',
    basePrice: 4,
    leadTime: '2 days',
    leadTimeDays: 3,
    manufacturability: 99,
    thumbnail: '/placeholder.svg?height=200&width=200',
    materials: [
      { name: 'Steel', priceMultiplier: 1.0 },
      { name: 'Stainless 304', priceMultiplier: 1.5 },
      { name: 'Brass', priceMultiplier: 2.0 },
    ],
  },
  {
    id: 'part-003',
    name: 'Electronics Enclosure',
    description: 'Protective enclosure for electronics',
    category: 'enclosures',
    material: 'ABS',
    process: '3D Printing',
    basePrice: 28,
    leadTime: '4 days',
    leadTimeDays: 4,
    manufacturability: 94,
    thumbnail: '/placeholder.svg?height=200&width=200',
    materials: [
      { name: 'ABS', priceMultiplier: 1.0 },
      { name: 'Aluminum 6061-T6', priceMultiplier: 1.2 },
      { name: 'Nylon', priceMultiplier: 0.9 },
    ],
  },
  {
    id: 'part-004',
    name: 'Drive Shaft 20mm',
    description: 'Precision drive shaft for mechanical assemblies',
    category: 'shafts',
    material: 'Steel 1045',
    process: 'CNC Turning',
    basePrice: 45,
    leadTime: '5 days',
    leadTimeDays: 5,
    manufacturability: 98,
    thumbnail: '/placeholder.svg?height=200&width=200',
    materials: [
      { name: 'Steel 1045', priceMultiplier: 1.0 },
      { name: 'Stainless 316', priceMultiplier: 1.8 },
      { name: 'Aluminum 7075', priceMultiplier: 1.1 },
    ],
  },
  {
    id: 'part-005',
    name: 'Spur Gear 24T',
    description: 'Precision machined spur gear',
    category: 'gears',
    material: 'Brass',
    process: 'CNC Milling',
    basePrice: 56,
    leadTime: '6 days',
    leadTimeDays: 6,
    manufacturability: 91,
    thumbnail: '/placeholder.svg?height=200&width=200',
    materials: [
      { name: 'Brass', priceMultiplier: 1.0 },
      { name: 'Delrin', priceMultiplier: 0.85 },
      { name: 'Steel 1018', priceMultiplier: 1.2 },
    ],
  },
  {
    id: 'part-006',
    name: 'L-Bracket Heavy',
    description: 'Heavy-duty L-bracket for structural applications',
    category: 'brackets',
    material: 'Steel',
    process: 'Sheet Metal',
    basePrice: 18,
    leadTime: '2 days',
    leadTimeDays: 2,
    manufacturability: 97,
    thumbnail: '/placeholder.svg?height=200&width=200',
    materials: [
      { name: 'Steel', priceMultiplier: 1.0 },
      { name: 'Aluminum 5052', priceMultiplier: 1.1 },
      { name: 'Stainless 304', priceMultiplier: 1.6 },
    ],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const useDatabase = searchParams.get('db') !== 'false';

  let items: typeof CATALOG_PARTS = [];
  let total = 0;
  let dbSource = false;

  if (useDatabase) {
    try {
      let query = supabase
        .from('catalog_parts')
        .select('*', { count: 'exact' });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      // Handle material filtering
      const materialsParam = searchParams.get('materials');
      if (materialsParam) {
        const materials = materialsParam.split(',');
        query = query.in('material', materials);
      }

      // Handle process filtering
      const processesParam = searchParams.get('processes');
      if (processesParam) {
        const processes = processesParam.split(',');
        query = query.in('process', processes);
      }

      // Handle price range filtering
      const minPrice = parseFloat(searchParams.get('minPrice') || '0');
      const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000');
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        query = query.gte('basePrice', minPrice).lte('basePrice', maxPrice);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', {
          ascending: false,
        });

      if (!error && data && data.length > 0) {
        items = data;
        total = count || data.length;
        dbSource = true;
      }
    } catch (dbError) {
      console.warn('Database not available, using sample data:', dbError);
    }
  }

  if (!dbSource) {
    let filtered = [...sampleCatalogItems];

    // Handle search query
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          (item.description &&
            item.description.toLowerCase().includes(searchLower)) ||
          (item.unlocksText &&
            item.unlocksText.toLowerCase().includes(searchLower)),
      );
    }

    // Handle category filtering (both activeCategory and selectedCategories)
    if (category && category !== 'all') {
      filtered = filtered.filter((item) => item.category === category);
    }

    const categoriesParam = searchParams.get('categories');
    if (categoriesParam) {
      const categories = categoriesParam.split(',') as CategoryId[];
      filtered = filtered.filter((item) => categories.includes(item.category));
    }

    // Handle material filtering for sample data
    const materialsParam = searchParams.get('materials');
    if (materialsParam) {
      const materials = materialsParam.split(',');
      filtered = filtered.filter(
        (item) =>
          materials.includes(item.material) ||
          (item.materials &&
            item.materials.some((m) => materials.includes(m.name))),
      );
    }

    // Handle process filtering for sample data
    const processesParam = searchParams.get('processes');
    if (processesParam) {
      const processes = processesParam.split(',');
      filtered = filtered.filter(
        (item) => item.process && processes.includes(item.process),
      );
    }

    // Handle finish filtering for sample data
    const finishesParam = searchParams.get('finishes');
    if (finishesParam) {
      const finishes = finishesParam.split(',');
      filtered = filtered.filter(
        (item) =>
          (item.finish &&
            finishes.some((f) =>
              item.finish?.toLowerCase().includes(f.toLowerCase()),
            )) ||
          (item.finishes &&
            item.finishes.some((f) =>
              finishes.some((sf) => f.toLowerCase().includes(sf.toLowerCase())),
            )),
      );
    }

    // Handle price range filtering for sample data
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '20000');
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      filtered = filtered.filter(
        (item) => item.basePrice >= minPrice && item.basePrice <= maxPrice,
      );
    }

    total = filtered.length;
    items = filtered.slice(offset, offset + limit);
  }

  return NextResponse.json({
    items,
    total,
    limit,
    offset,
    source: dbSource ? 'database' : 'sample',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const required = ['name', 'category', 'material', 'process', 'basePrice'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    const newItem = {
      id: `part-${Date.now()}`,
      ...body,
      manufacturability: body.manufacturability || 95,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newItem, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }
}

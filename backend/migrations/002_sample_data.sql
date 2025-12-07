-- Sample data for development and testing

INSERT INTO hubs (name, company_name, location_city, location_country, latitude, longitude, certification_level, machines, status, insurance_verified)
VALUES
  (
    'TechHub Los Angeles',
    'TechHub Manufacturing LLC',
    'Los Angeles',
    'USA',
    34.0522,
    -118.2437,
    'premium',
    '[
      {"type": "cnc_mill", "model": "Haas VM3", "year": 2020, "capabilities": ["3-axis", "tapping"]},
      {"type": "laser_cutter", "model": "Trumpf TruLaser 3030", "year": 2019},
      {"type": "3d_printer", "model": "Stratasys F900", "year": 2021}
    ]'::jsonb,
    'approved',
    true
  ),
  (
    'MechPrecision Toronto',
    'Precision Machining Corp',
    'Toronto',
    'Canada',
    43.6532,
    -79.3832,
    'verified',
    '[
      {"type": "cnc_mill", "model": "Fanuc Robodrill", "year": 2018},
      {"type": "cnc_lathe", "model": "Okuma LU200", "year": 2017}
    ]'::jsonb,
    'approved',
    true
  );

INSERT INTO catalog_items (title, description, category, qdf_ref, supplier_name, visibility, created_by, ai_metrics)
VALUES
  (
    'M12 Stainless Steel Bolt',
    'Grade 8.8, zinc-plated industrial fastener',
    'fasteners',
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'McMaster-Carr',
    'public',
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '{"manufacturability": 0.95, "complexity_index": 1}'::jsonb
  ),
  (
    '10mm Aluminum Shaft',
    '6061-T6 aluminum alloy precision shaft',
    'shafts',
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'Stock Drive Products',
    'public',
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '{"manufacturability": 0.88, "complexity_index": 3}'::jsonb
  );

INSERT INTO catalog_variants (catalog_item_id, variant_id, name, parameters, material, price_base, price_currency, lead_time_days, manufacturing_methods, hub_tags, in_stock)
SELECT id, 'var-001', 'M12x60', '{"length": 60, "diameter": 12}'::jsonb, 'Stainless Steel 316L', 2.45, 'USD', 3, '{cnc_milling, stamping}', '{fast, precision}', true
FROM catalog_items WHERE title = 'M12 Stainless Steel Bolt'
UNION ALL
SELECT id, 'var-002', 'M12x80', '{"length": 80, "diameter": 12}'::jsonb, 'Stainless Steel 316L', 2.75, 'USD', 3, '{cnc_milling, stamping}', '{fast, precision}', true
FROM catalog_items WHERE title = 'M12 Stainless Steel Bolt'
UNION ALL
SELECT id, 'var-001', 'Ø10x100', '{"diameter": 10, "length": 100}'::jsonb, '6061-T6 Aluminum', 8.50, 'USD', 5, '{cnc_turning, laser_cutting}', '{precision, fast}', true
FROM catalog_items WHERE title = '10mm Aluminum Shaft';

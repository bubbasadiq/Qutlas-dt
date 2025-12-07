-- Seed data for Qutlas platform

-- Sample users
INSERT INTO users (id, email, name, hashed_password, role, company) VALUES
    ('11111111-1111-1111-1111-111111111111', 'demo@qutlas.com', 'Demo User', '$2b$10$placeholder', 'user', 'Acme Corp'),
    ('22222222-2222-2222-2222-222222222222', 'hub@techhub.com', 'Hub Admin', '$2b$10$placeholder', 'hub', 'TechHub LA'),
    ('33333333-3333-3333-3333-333333333333', 'admin@qutlas.com', 'Admin User', '$2b$10$placeholder', 'admin', 'Qutlas');

-- Sample hubs
INSERT INTO hubs (id, owner_id, name, location, capabilities, materials, rating, completed_jobs, avg_lead_time, status) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TechHub LA', '{"city": "Los Angeles", "country": "USA", "lat": 34.0522, "lng": -118.2437}', ARRAY['CNC Milling', 'Laser Cutting', '3D Printing'], ARRAY['Aluminum', 'Steel', 'ABS', 'Nylon'], 4.9, 1234, 3, 'active'),
    ('bbbb2222-2222-2222-2222-222222222222', NULL, 'MechPrecision Toronto', '{"city": "Toronto", "country": "Canada", "lat": 43.6532, "lng": -79.3832}', ARRAY['CNC Milling', 'CNC Turning', 'Sheet Metal'], ARRAY['Aluminum', 'Steel', 'Brass', 'Titanium'], 4.7, 892, 5, 'active'),
    ('cccc3333-3333-3333-3333-333333333333', NULL, 'FastCut NYC', '{"city": "New York", "country": "USA", "lat": 40.7128, "lng": -74.0060}', ARRAY['Laser Cutting', 'Waterjet', 'Sheet Metal'], ARRAY['Steel', 'Aluminum', 'Stainless'], 4.8, 2156, 2, 'active');

-- Sample catalog items
INSERT INTO catalog_items (id, name, description, category, material, process, base_price, lead_time_days, manufacturability, param_schema, published_by) VALUES
    ('dddd1111-1111-1111-1111-111111111111', 'Precision Bracket', 'High-precision aluminum bracket for mounting electronics and mechanical assemblies', 'brackets', 'Aluminum 6061-T6', 'CNC Milling', 32.00, 3, 96, '[{"name": "length", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "width", "value": 50, "unit": "mm", "min": 25, "max": 100}, {"name": "height", "value": 25, "unit": "mm", "min": 10, "max": 50}]', '33333333-3333-3333-3333-333333333333'),
    ('eeee2222-2222-2222-2222-222222222222', 'Hex Socket Bolt M8', 'Standard hex socket bolt', 'fasteners', 'Steel', 'CNC', 4.00, 2, 99, '[{"name": "diameter", "value": 8, "unit": "mm", "min": 4, "max": 16}, {"name": "length", "value": 30, "unit": "mm", "min": 10, "max": 100}]', '33333333-3333-3333-3333-333333333333'),
    ('ffff3333-3333-3333-3333-333333333333', 'Electronics Enclosure', 'Protective enclosure for electronics', 'enclosures', 'ABS', '3D Printing', 28.00, 4, 94, '[{"name": "length", "value": 150, "unit": "mm", "min": 50, "max": 300}, {"name": "width", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "height", "value": 50, "unit": "mm", "min": 20, "max": 100}]', '33333333-3333-3333-3333-333333333333');

-- Sample catalog variants
INSERT INTO catalog_variants (catalog_item_id, name, material, price_multiplier, parameters) VALUES
    ('dddd1111-1111-1111-1111-111111111111', 'Aluminum 6061-T6', 'Aluminum 6061-T6', 1.00, '{}'),
    ('dddd1111-1111-1111-1111-111111111111', 'Aluminum 7075', 'Aluminum 7075', 1.30, '{}'),
    ('dddd1111-1111-1111-1111-111111111111', 'Steel 1018', 'Steel 1018', 0.90, '{}'),
    ('dddd1111-1111-1111-1111-111111111111', 'Stainless 304', 'Stainless 304', 1.50, '{}');

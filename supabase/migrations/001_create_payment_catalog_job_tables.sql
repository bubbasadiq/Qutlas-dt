-- supabase/migrations/001_create_payment_catalog_job_tables.sql
-- Database schema for Qutlas payment, catalog, and job system

-- Catalog Parts Table
CREATE TABLE IF NOT EXISTS catalog_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  material TEXT,
  process TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  lead_time TEXT,
  lead_time_days INT DEFAULT 5,
  manufacturability INT DEFAULT 95,
  thumbnail TEXT,
  cad_file_path TEXT,
  materials JSONB DEFAULT '[]'::jsonb,
  parameters JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hubs Table
CREATE TABLE IF NOT EXISTS hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location JSONB DEFAULT '{"city": "", "country": "", "lat": 0, "lng": 0}'::jsonb,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  materials TEXT[] NOT NULL DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 4.5,
  completed_jobs INT DEFAULT 0,
  avg_lead_time INT DEFAULT 5,
  current_load DECIMAL(3,2) DEFAULT 0.5,
  base_price DECIMAL(10,2) DEFAULT 30,
  certified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES catalog_parts(id),
  user_id UUID,
  quantity INT NOT NULL DEFAULT 1,
  material TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  material_multiplier DECIMAL(4,2) DEFAULT 1.0,
  volume_discount DECIMAL(4,2) DEFAULT 1.0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  lead_time_days INT DEFAULT 5,
  manufacturability INT DEFAULT 95,
  status TEXT DEFAULT 'pending',
  job_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  part_id UUID REFERENCES catalog_parts(id),
  hub_id UUID REFERENCES hubs(id),
  quantity INT NOT NULL DEFAULT 1,
  material TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  total_price DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_ref TEXT UNIQUE NOT NULL,
  job_id UUID REFERENCES jobs(id),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending',
  customer_email TEXT,
  customer_name TEXT,
  transaction_id TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_catalog_parts_category ON catalog_parts(category);
CREATE INDEX IF NOT EXISTS idx_catalog_parts_name ON catalog_parts(name);
CREATE INDEX IF NOT EXISTS idx_hubs_capabilities ON hubs USING GIN(capabilities);
CREATE INDEX IF NOT EXISTS idx_hubs_materials ON hubs USING GIN(materials);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_part_id ON quotes(part_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(tx_ref);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);

-- Insert sample catalog parts
INSERT INTO catalog_parts (id, name, description, category, material, process, base_price, lead_time, lead_time_days, manufacturability, thumbnail, materials, parameters, specifications) VALUES
('part-001', 'Precision Bracket', 'High-precision aluminum bracket for mounting electronics, sensors, and mechanical assemblies.', 'brackets', 'Aluminum 6061-T6', 'CNC Milling', 32, '3-5 days', 5, 96, '/placeholder.svg?height=200&width=200', '[{"name": "Aluminum 6061-T6", "priceMultiplier": 1.0}, {"name": "Aluminum 7075", "priceMultiplier": 1.3}, {"name": "Steel 1018", "priceMultiplier": 0.9}, {"name": "Stainless 304", "priceMultiplier": 1.5}]', '[{"name": "Length", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "Width", "value": 50, "unit": "mm", "min": 25, "max": 100}, {"name": "Height", "value": 25, "unit": "mm", "min": 10, "max": 50}, {"name": "Hole Diameter", "value": 6, "unit": "mm", "min": 3, "max": 12}]', '[{"label": "Tolerance", "value": "±0.1mm"}, {"label": "Surface Finish", "value": "Ra 1.6μm"}, {"label": "Max Temp", "value": "150°C"}, {"label": "Weight", "value": "45g"}]'),
('part-002', 'Hex Socket Bolt M8', 'Standard hex socket bolt for mechanical assemblies.', 'fasteners', 'Steel', 'CNC', 4, '2 days', 3, 99, '/placeholder.svg?height=200&width=200', '[{"name": "Steel", "priceMultiplier": 1.0}, {"name": "Stainless 304", "priceMultiplier": 1.5}, {"name": "Brass", "priceMultiplier": 2.0}]', '[{"name": "Diameter", "value": 8, "unit": "mm", "min": 4, "max": 16}, {"name": "Length", "value": 30, "unit": "mm", "min": 10, "max": 100}]', '[{"label": "Thread", "value": "M8 x 1.25"}, {"label": "Tolerance", "value": "ISO 4762"}, {"label": "Surface Finish", "value": "Ra 3.2μm"}, {"label": "Grade", "value": "12.9"}]'),
('part-003', 'Electronics Enclosure', 'Protective enclosure for electronics with mounting points.', 'enclosures', 'ABS', '3D Printing', 28, '4 days', 4, 94, '/placeholder.svg?height=200&width=200', '[{"name": "ABS", "priceMultiplier": 1.0}, {"name": "Aluminum 6061-T6", "priceMultiplier": 1.2}, {"name": "Nylon", "priceMultiplier": 0.9}]', '[{"name": "Length", "value": 150, "unit": "mm", "min": 50, "max": 300}, {"name": "Width", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "Height", "value": 50, "unit": "mm", "min": 20, "max": 100}]', '[{"label": "Tolerance", "value": "±0.3mm"}, {"label": "Wall Thickness", "value": "2mm"}, {"label": "IP Rating", "value": "IP54"}, {"label": "Weight", "value": "120g"}]'),
('part-004', 'Drive Shaft 20mm', 'Precision drive shaft for mechanical assemblies.', 'shafts', 'Steel 1045', 'CNC Turning', 45, '5 days', 5, 98, '/placeholder.svg?height=200&width=200', '[{"name": "Steel 1045", "priceMultiplier": 1.0}, {"name": "Stainless 316", "priceMultiplier": 1.8}, {"name": "Aluminum 7075", "priceMultiplier": 1.1}]', '[{"name": "Diameter", "value": 20, "unit": "mm", "min": 10, "max": 50}, {"name": "Length", "value": 100, "unit": "mm", "min": 50, "max": 300}, {"name": "Keyway Width", "value": 6, "unit": "mm", "min": 4, "max": 10}]', '[{"label": "Tolerance", "value": "±0.02mm"}, {"label": "Surface Finish", "value": "Ra 0.8μm"}, {"label": "Hardness", "value": "55-60 HRC"}, {"label": "Runout", "value": "<0.05mm"}]'),
('part-005', 'Spur Gear 24T', 'Precision machined spur gear for power transmission.', 'gears', 'Brass', 'CNC Milling', 56, '6 days', 6, 91, '/placeholder.svg?height=200&width=200', '[{"name": "Brass", "priceMultiplier": 1.0}, {"name": "Delrin", "priceMultiplier": 0.85}, {"name": "Steel 1018", "priceMultiplier": 1.2}]', '[{"name": "Module", "value": 2, "unit": "mm", "min": 1, "max": 4}, {"name": "Teeth", "value": 24, "unit": "count", "min": 12, "max": 48}, {"name": "Face Width", "value": 20, "unit": "mm", "min": 10, "max": 40}, {"name": "Bore Diameter", "value": 12, "unit": "mm", "min": 8, "max": 20}]', '[{"label": "Pressure Angle", "value": "20°"}, {"label": "Tolerance", "value": "AGMA Q9"}, {"label": "Surface Finish", "value": "Ra 1.6μm"}, {"label": "Pitch Diameter", "value": "48mm"}]'),
('part-006', 'L-Bracket Heavy', 'Heavy-duty L-bracket for structural applications.', 'brackets', 'Steel', 'Sheet Metal', 18, '2 days', 2, 97, '/placeholder.svg?height=200&width=200', '[{"name": "Steel", "priceMultiplier": 1.0}, {"name": "Aluminum 5052", "priceMultiplier": 1.1}, {"name": "Stainless 304", "priceMultiplier": 1.6}]', '[{"name": "Length", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "Width", "value": 50, "unit": "mm", "min": 25, "max": 100}, {"name": "Thickness", "value": 3, "unit": "mm", "min": 1, "max": 6}]', '[{"label": "Tolerance", "value": "±0.2mm"}, {"label": "Bend Radius", "value": "1x thickness"}, {"label": "Surface Finish", "value": "Mill finish"}, {"label": "Weight", "value": "180g"}]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  material = EXCLUDED.material,
  process = EXCLUDED.process,
  base_price = EXCLUDED.base_price,
  lead_time = EXCLUDED.lead_time,
  lead_time_days = EXCLUDED.lead_time_days,
  manufacturability = EXCLUDED.manufacturability,
  materials = EXCLUDED.materials,
  parameters = EXCLUDED.parameters,
  specifications = EXCLUDED.specifications,
  updated_at = NOW();

-- Insert sample hubs
INSERT INTO hubs (id, name, location, capabilities, materials, rating, completed_jobs, avg_lead_time, current_load, base_price, certified) VALUES
('hub-001', 'TechHub LA', '{"city": "Los Angeles", "country": "USA", "lat": 34.0522, "lng": -118.2437}'::jsonb, '["CNC Milling", "Laser Cutting", "3D Printing"]'::text[], '["Aluminum", "Steel", "ABS"]'::text[], 4.9, 1234, 3, 0.6, 30, TRUE),
('hub-002', 'MechPrecision Toronto', '{"city": "Toronto", "country": "Canada", "lat": 43.6532, "lng": -79.3832}'::jsonb, '["CNC Milling", "CNC Turning"]'::text[], '["Aluminum", "Steel", "Brass"]'::text[], 4.7, 892, 5, 0.4, 25, TRUE),
('hub-003', 'FastCut NYC', '{"city": "New York", "country": "USA", "lat": 40.7128, "lng": -74.006}'::jsonb, '["Laser Cutting", "Waterjet"]'::text[], '["Steel", "Aluminum"]'::text[], 4.8, 2156, 2, 0.7, 35, TRUE),
('hub-004', 'EuroTech Berlin', '{"city": "Berlin", "country": "Germany", "lat": 52.52, "lng": 13.405}'::jsonb, '["CNC Milling", "Sheet Metal", "3D Printing"]'::text[], '["Aluminum", "Steel", "Stainless", "Brass"]'::text[], 4.8, 1567, 4, 0.5, 28, TRUE),
('hub-005', 'AsiaFab Shenzhen', '{"city": "Shenzhen", "country": "China", "lat": 22.5431, "lng": 114.0579}'::jsonb, '["CNC Milling", "CNC Turning", "Injection Molding"]'::text[], '["Aluminum", "Steel", "Plastic", "Titanium"]'::text[], 4.6, 3421, 5, 0.55, 20, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  capabilities = EXCLUDED.capabilities,
  materials = EXCLUDED.materials,
  rating = EXCLUDED.rating,
  completed_jobs = EXCLUDED.completed_jobs,
  avg_lead_time = EXCLUDED.avg_lead_time,
  current_load = EXCLUDED.current_load,
  base_price = EXCLUDED.base_price,
  certified = EXCLUDED.certified,
  updated_at = NOW();

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_catalog_parts_updated_at BEFORE UPDATE ON catalog_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hubs_updated_at BEFORE UPDATE ON hubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

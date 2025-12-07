-- Qutlas Database Schema v1
-- Core catalog, variant, asset, hub, and job tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "jsonb";

-- ============ CATALOG TABLES ============

CREATE TABLE catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    qdf_ref UUID NOT NULL, -- Reference to uploaded asset in S3
    supplier_name VARCHAR(255),
    supplier_url VARCHAR(512),
    ai_metrics JSONB, -- { "manufacturability": 0.92, "complexity_index": 5 }
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hub-only')),
    created_by UUID NOT NULL, -- user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_catalog_category ON catalog_items(category);
CREATE INDEX idx_catalog_created_by ON catalog_items(created_by);
CREATE INDEX idx_catalog_qdf_ref ON catalog_items(qdf_ref);

CREATE TABLE catalog_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
    variant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    parameters JSONB NOT NULL, -- { "length": 100, "width": 50, "material": "steel" }
    material VARCHAR(255),
    price_base NUMERIC(10, 2),
    price_currency VARCHAR(3) DEFAULT 'USD' CHECK (price_currency IN ('USD', 'CAD', 'EUR')),
    lead_time_days INTEGER,
    manufacturing_methods TEXT[], -- ARRAY of methods: ['cnc_milling', 'waterjet', ...]
    tolerances JSONB, -- { "dimension": "±0.05mm", "surface_finish": "Ra 1.6µm" }
    hub_tags TEXT[], -- Tags for hub matching: ['fast', 'precision', 'large_parts']
    in_stock BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(catalog_item_id, variant_id)
);

CREATE INDEX idx_variants_item ON catalog_variants(catalog_item_id);
CREATE INDEX idx_variants_methods ON catalog_variants USING GIN(manufacturing_methods);

CREATE TABLE catalog_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('thumbnail', 'rendering', 'cad_file', 'datasheet', 'drawing')),
    s3_key VARCHAR(512) NOT NULL UNIQUE, -- S3 path
    url VARCHAR(512) NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_item ON catalog_assets(catalog_item_id);

-- ============ HUB TABLES ============

CREATE TABLE hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    certification_level VARCHAR(20) DEFAULT 'basic' CHECK (certification_level IN ('basic', 'verified', 'premium')),
    average_rating NUMERIC(3, 2) DEFAULT 0.0,
    current_load NUMERIC(3, 2) DEFAULT 0.0, -- 0.0 to 1.0 queue utilization
    machines JSONB NOT NULL, -- [{ "type": "cnc_mill", "model": "Haas VM3", "year": 2020 }, ...]
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
    insurance_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hubs_status ON hubs(status);
CREATE INDEX idx_hubs_location ON hubs(location_city, location_country);

-- ============ JOB TABLES ============

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_item_id UUID NOT NULL REFERENCES catalog_items(id),
    variant_id UUID NOT NULL REFERENCES catalog_variants(id),
    hub_id UUID NOT NULL REFERENCES hubs(id),
    customer_id UUID NOT NULL, -- user_id
    status VARCHAR(30) DEFAULT 'created' CHECK (status IN ('created', 'hub_accepted', 'in_progress', 'completed', 'failed', 'cancelled')),
    parameters JSONB, -- Runtime parameter overrides
    cost_estimate NUMERIC(12, 2),
    cost_currency VARCHAR(3),
    cost_final NUMERIC(12, 2),
    estimated_completion TIMESTAMP,
    completed_at TIMESTAMP,
    first_pass_yield NUMERIC(3, 2), -- 0.0 to 1.0
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_hub ON jobs(hub_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at);

-- ============ TELEMETRY TABLES ============

CREATE TABLE job_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES hubs(id),
    machine_id VARCHAR(100),
    start_ts BIGINT,
    end_ts BIGINT,
    tool_changes INTEGER DEFAULT 0,
    cycle_time NUMERIC(8, 2),
    rejects INTEGER DEFAULT 0,
    metadata JSONB, -- Flexible: feed rates, spindle RPM, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_job ON job_telemetry(job_id);
CREATE INDEX idx_telemetry_hub ON job_telemetry(hub_id);

-- ============ AUDIT TABLES ============

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50), -- 'catalog_item', 'job', 'hub', etc.
    entity_id UUID,
    action VARCHAR(50), -- 'created', 'updated', 'deleted'
    actor_id UUID,
    changes JSONB, -- Diff of old vs new
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);

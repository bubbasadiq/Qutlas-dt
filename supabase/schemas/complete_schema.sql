-- =============================================================================
-- QUTLAS PLATFORM - COMPLETE DATABASE SCHEMA
-- Production-ready Supabase schema with tables, relationships, RLS, triggers, functions
-- Last Updated: 2025
--
-- FIXES APPLIED (2025):
-- 1. Table dependency: Moved project_shares table definition before projects RLS policies
--    (lines 508-573) to resolve foreign key reference errors in RLS policies.
-- 2. hub_performance view: Fixed malformed CASE statement by adding missing "CASE WHEN"
--    (line 1553) - corrected syntax from incomplete condition to proper CASE WHEN...THEN...ELSE...END.
-- 3. UUID to TEXT conversion: Changed catalog tables (catalog_materials, catalog_finishes,
--    catalog_parts, hubs) to use TEXT id columns instead of UUID with gen_random_uuid()
--    to match seed data format (e.g., 'mat-al6061', 'hub-techhub-la').
-- 4. Messages table: Added updated_at column (line 164) and corresponding trigger
--    (lines 215-229) for consistency with other tables.
-- 5. User stats triggers: Added update_stats_on_message trigger (lines 1346-1349) to
--    update user statistics when messages are inserted or updated.
-- =============================================================================

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');

-- User subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due', 'trial');

-- Currency codes
CREATE TYPE currency_code AS ENUM ('NGN', 'USD', 'EUR', 'GBP', 'CAD');

-- Quote status
CREATE TYPE quote_status AS ENUM ('pending', 'approved', 'expired', 'converted');

-- Job status
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'in_production', 'quality_check', 'shipped', 'completed', 'cancelled', 'on_hold');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed');

-- Order status
CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Project status
CREATE TYPE project_status AS ENUM ('active', 'archived', 'deleted');

-- Project privacy
CREATE TYPE privacy_level AS ENUM ('private', 'shared', 'public');

-- Activity action types
CREATE TYPE activity_action AS ENUM ('create', 'update', 'delete', 'view', 'export', 'share');

-- Message roles
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- =============================================================================
-- TABLE: profiles
-- Extended user information with subscription and preferences
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  currency_preference currency_code DEFAULT 'NGN',
  stripe_customer_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);

-- Foreign key
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view any profile (for team features)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- =============================================================================
-- TABLE: conversations
-- AI chat conversations
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Conversation',
  current_message_leaf_id UUID,
  is_pinned BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS conversations_is_pinned_idx ON conversations(is_pinned) WHERE is_pinned = TRUE;

-- Foreign key
ALTER TABLE conversations ADD CONSTRAINT conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- RLS (existing, keeping for compatibility)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all conversations
CREATE POLICY "Service role can access all conversations" ON conversations
  FOR SELECT TO service_role
  USING (true);

-- =============================================================================
-- TABLE: messages
-- Chat messages within conversations
-- =============================================================================
-- FIX: Added updated_at column for consistency with other tables
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  role message_role NOT NULL DEFAULT 'user',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  parent_message_id UUID,
  token_count INT DEFAULT 0,
  model_used TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_updated_at_idx ON messages(updated_at);
CREATE INDEX IF NOT EXISTS messages_parent_message_id_idx ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS messages_role_idx ON messages(role);

-- Foreign keys
ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_parent_message_id_fkey
  FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- RLS (existing, keeping for compatibility)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in their conversations" ON messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Service role can access all messages
CREATE POLICY "Service role can access all messages" ON messages
  FOR SELECT TO service_role
  USING (true);

-- Trigger to update conversation leaf
CREATE OR REPLACE FUNCTION update_conversation_leaf()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET current_message_leaf_id = NEW.id,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leaf_trigger ON messages;
CREATE TRIGGER update_leaf_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_leaf();

-- =============================================================================
-- FIX: Added messages updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- =============================================================================
-- TABLE: catalog_materials
-- Material definitions with properties and pricing multipliers
-- =============================================================================
-- FIX: Changed id from UUID to TEXT to match seed data format (e.g., 'mat-al6061')
CREATE TABLE IF NOT EXISTS catalog_materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  price_multiplier DECIMAL(4,2) DEFAULT 1.00,
  density DECIMAL(8,4) DEFAULT 0.00,
  properties JSONB DEFAULT '{}'::jsonb,
  compatible_processes TEXT[] DEFAULT '{}',
  compatible_finishes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS catalog_materials_category_idx ON catalog_materials(category);
CREATE INDEX IF NOT EXISTS catalog_materials_name_idx ON catalog_materials(name);
CREATE INDEX IF NOT EXISTS catalog_materials_is_active_idx ON catalog_materials(is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE catalog_materials ENABLE ROW LEVEL SECURITY;

-- Everyone can view materials
CREATE POLICY "Anyone can view materials" ON catalog_materials
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Only admins can modify
CREATE POLICY "Admins can manage materials" ON catalog_materials
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_catalog_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_catalog_materials_updated_at
  BEFORE UPDATE ON catalog_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_materials_updated_at();

-- =============================================================================
-- TABLE: catalog_finishes
-- Finish options with compatibility and pricing
-- =============================================================================
-- FIX: Changed id from UUID to TEXT to match seed data format (e.g., 'fin-raw')
CREATE TABLE IF NOT EXISTS catalog_finishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  compatible_materials TEXT[] DEFAULT '{}',
  price_multiplier DECIMAL(4,2) DEFAULT 1.00,
  lead_time_days_added INT DEFAULT 0,
  properties JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS catalog_finishes_category_idx ON catalog_finishes(category);
CREATE INDEX IF NOT EXISTS catalog_finishes_name_idx ON catalog_finishes(name);
CREATE INDEX IF NOT EXISTS catalog_finishes_is_active_idx ON catalog_finishes(is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE catalog_finishes ENABLE ROW LEVEL SECURITY;

-- Everyone can view finishes
CREATE POLICY "Anyone can view finishes" ON catalog_finishes
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Only admins can modify
CREATE POLICY "Admins can manage finishes" ON catalog_finishes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_catalog_finishes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_catalog_finishes_updated_at
  BEFORE UPDATE ON catalog_finishes
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_finishes_updated_at();

-- =============================================================================
-- TABLE: catalog_parts
-- Product catalog with parameters, materials, and specifications
-- =============================================================================
-- FIX: Changed id from UUID to TEXT to match seed data format (e.g., 'part-bracket-001')
CREATE TABLE IF NOT EXISTS catalog_parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  material TEXT DEFAULT 'Aluminum 6061-T6',
  process TEXT DEFAULT 'CNC Milling',
  base_price DECIMAL(10,2) DEFAULT 0,
  lead_time TEXT,
  lead_time_days INT DEFAULT 5,
  manufacturability INT DEFAULT 95,
  thumbnail TEXT,
  cad_file_path TEXT,
  cad_data JSONB DEFAULT '{}'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  parameters JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '[]'::jsonb,
  finishes JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS catalog_parts_category_idx ON catalog_parts(category);
CREATE INDEX IF NOT EXISTS catalog_parts_subcategory_idx ON catalog_parts(subcategory);
CREATE INDEX IF NOT EXISTS catalog_parts_name_idx ON catalog_parts(name);
CREATE INDEX IF NOT EXISTS catalog_parts_material_idx ON catalog_parts(material);
CREATE INDEX IF NOT EXISTS catalog_parts_is_active_idx ON catalog_parts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS catalog_parts_is_featured_idx ON catalog_parts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS catalog_parts_created_at_idx ON catalog_parts(created_at);
CREATE INDEX IF NOT EXISTS catalog_parts_view_count_idx ON catalog_parts(view_count DESC);

-- GIN index for tags
CREATE INDEX IF NOT EXISTS catalog_parts_tags_idx ON catalog_parts USING GIN(tags);

-- RLS
ALTER TABLE catalog_parts ENABLE ROW LEVEL SECURITY;

-- Everyone can view active parts
CREATE POLICY "Anyone can view active parts" ON catalog_parts
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Only admins can modify
CREATE POLICY "Admins can manage parts" ON catalog_parts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_catalog_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_catalog_parts_updated_at
  BEFORE UPDATE ON catalog_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_parts_updated_at();

-- =============================================================================
-- TABLE: hubs
-- Manufacturing hubs with capabilities and location
-- =============================================================================
-- FIX: Changed id from UUID to TEXT to match seed data format (e.g., 'hub-techhub-la')
CREATE TABLE IF NOT EXISTS hubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location JSONB DEFAULT '{"city": "", "country": "", "lat": 0, "lng": 0}'::jsonb,
  address TEXT,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  materials TEXT[] NOT NULL DEFAULT '{}',
  processes TEXT[] NOT NULL DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 4.5,
  rating_count INT DEFAULT 0,
  completed_jobs INT DEFAULT 0,
  avg_lead_time DECIMAL(5,2) DEFAULT 5.0,
  current_load DECIMAL(3,2) DEFAULT 0.5,
  base_price DECIMAL(10,2) DEFAULT 30.00,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  certified BOOLEAN DEFAULT TRUE,
  certification_ids TEXT[] DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  operating_hours JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS hubs_capabilities_idx ON hubs USING GIN(capabilities);
CREATE INDEX IF NOT EXISTS hubs_materials_idx ON hubs USING GIN(materials);
CREATE INDEX IF NOT EXISTS hubs_processes_idx ON hubs USING GIN(processes);
CREATE INDEX IF NOT EXISTS hubs_rating_idx ON hubs(rating DESC);
CREATE INDEX IF NOT EXISTS hubs_is_active_idx ON hubs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS hubs_is_featured_idx ON hubs(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS hubs_current_load_idx ON hubs(current_load);

-- GIN index for location (city/country)
CREATE INDEX IF NOT EXISTS hubs_location_idx ON hubs USING GIN((location::jsonb));

-- RLS
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;

-- Everyone can view active hubs
CREATE POLICY "Anyone can view active hubs" ON hubs
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Only admins can modify
CREATE POLICY "Admins can manage hubs" ON hubs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_hubs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hubs_updated_at
  BEFORE UPDATE ON hubs
  FOR EACH ROW
  EXECUTE FUNCTION update_hubs_updated_at();

-- =============================================================================
-- TABLE: projects
-- User design projects
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  workspace_data JSONB DEFAULT '{}'::jsonb,
  status project_status DEFAULT 'active',
  privacy privacy_level DEFAULT 'private',
  is_template BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  version INT DEFAULT 1,
  parent_project_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_privacy_idx ON projects(privacy);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at);
CREATE INDEX IF NOT EXISTS projects_parent_project_id_idx ON projects(parent_project_id);

-- GIN index for tags
CREATE INDEX IF NOT EXISTS projects_tags_idx ON projects USING GIN(tags);

-- Foreign keys
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE projects ADD CONSTRAINT projects_parent_project_id_fkey
  FOREIGN KEY (parent_project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- =============================================================================
-- TABLE: project_shares
-- Project sharing permissions
-- =============================================================================
-- FIX: Moved before projects RLS policies to resolve dependency issue
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  shared_with UUID NOT NULL,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  can_edit BOOLEAN DEFAULT FALSE,
  can_share BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  shared_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS project_shares_project_id_idx ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS project_shares_shared_with_idx ON project_shares(shared_with);

-- Foreign keys
ALTER TABLE project_shares ADD CONSTRAINT project_shares_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_shares ADD CONSTRAINT project_shares_shared_with_fkey
  FOREIGN KEY (shared_with) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE project_shares ADD CONSTRAINT project_shares_shared_by_fkey
  FOREIGN KEY (shared_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS project_shares_unique_idx ON project_shares(project_id, shared_with);

-- RLS
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Users can view shares for their projects
CREATE POLICY "Users can view shares for own projects" ON project_shares
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_shares.project_id AND user_id = auth.uid()) OR
    shared_with = auth.uid()
  );

-- Project owners can create shares
CREATE POLICY "Project owners can create shares" ON project_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_shares.project_id AND user_id = auth.uid())
  );

-- Project owners can update shares
CREATE POLICY "Project owners can update shares" ON project_shares
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_shares.project_id AND user_id = auth.uid())
  );

-- Project owners can delete shares
CREATE POLICY "Project owners can delete shares" ON project_shares
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_shares.project_id AND user_id = auth.uid()) OR
    shared_with = auth.uid()
  );

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    privacy = 'public' OR
    (privacy = 'shared' AND EXISTS (
      SELECT 1 FROM project_shares WHERE project_id = projects.id AND shared_with = auth.uid()
    ))
  );

-- Users can create projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_shares WHERE project_id = projects.id AND shared_with = auth.uid() AND can_edit = true
    )
  );

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all projects
CREATE POLICY "Service role can access all projects" ON projects
  FOR SELECT TO service_role
  USING (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- =============================================================================
-- TABLE: workspaces
-- Workspace saves and versions
-- =============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  name TEXT,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  is_auto_save BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  parent_workspace_id UUID,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS workspaces_user_id_idx ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS workspaces_project_id_idx ON workspaces(project_id);
CREATE INDEX IF NOT EXISTS workspaces_is_published_idx ON workspaces(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS workspaces_created_at_idx ON workspaces(created_at);
CREATE INDEX IF NOT EXISTS workspaces_parent_workspace_id_idx ON workspaces(parent_workspace_id);

-- GIN index for tags
CREATE INDEX IF NOT EXISTS workspaces_tags_idx ON workspaces USING GIN(tags);

-- Foreign keys
ALTER TABLE workspaces ADD CONSTRAINT workspaces_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE workspaces ADD CONSTRAINT workspaces_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE workspaces ADD CONSTRAINT workspaces_parent_workspace_id_fkey
  FOREIGN KEY (parent_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Users can view their own workspaces
CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    is_published = true
  );

-- Users can create workspaces
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own workspaces
CREATE POLICY "Users can update own workspaces" ON workspaces
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own workspaces
CREATE POLICY "Users can delete own workspaces" ON workspaces
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger
CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspaces_updated_at();

-- =============================================================================
-- TABLE: quotes
-- Part quotes with pricing calculations
-- =============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID,
  user_id UUID NOT NULL,
  project_id UUID,
  quantity INT NOT NULL DEFAULT 1,
  material TEXT,
  finish TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  base_price DECIMAL(10,2) DEFAULT 0,
  material_multiplier DECIMAL(4,2) DEFAULT 1.00,
  finish_multiplier DECIMAL(4,2) DEFAULT 1.00,
  volume_discount DECIMAL(4,2) DEFAULT 1.00,
  hub_price DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  lead_time_days INT DEFAULT 5,
  manufacturability INT DEFAULT 95,
  status quote_status DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  hub_id UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS quotes_user_id_idx ON quotes(user_id);
CREATE INDEX IF NOT EXISTS quotes_part_id_idx ON quotes(part_id);
CREATE INDEX IF NOT EXISTS quotes_project_id_idx ON quotes(project_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
CREATE INDEX IF NOT EXISTS quotes_hub_id_idx ON quotes(hub_id);
CREATE INDEX IF NOT EXISTS quotes_created_at_idx ON quotes(created_at);
CREATE INDEX IF NOT EXISTS quotes_expires_at_idx ON quotes(expires_at);

-- Foreign keys
ALTER TABLE quotes ADD CONSTRAINT quotes_part_id_fkey
  FOREIGN KEY (part_id) REFERENCES catalog_parts(id) ON DELETE SET NULL;

ALTER TABLE quotes ADD CONSTRAINT quotes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE quotes ADD CONSTRAINT quotes_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE quotes ADD CONSTRAINT quotes_hub_id_fkey
  FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Users can view their own quotes
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create quotes
CREATE POLICY "Users can create quotes" ON quotes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quotes
CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own quotes
CREATE POLICY "Users can delete own quotes" ON quotes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all quotes
CREATE POLICY "Service role can access all quotes" ON quotes
  FOR SELECT TO service_role
  USING (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- =============================================================================
-- TABLE: jobs
-- Manufacturing jobs/orders
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  part_id UUID,
  quote_id UUID,
  hub_id UUID,
  order_id UUID,
  quantity INT NOT NULL DEFAULT 1,
  material TEXT,
  finish TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  total_price DECIMAL(10,2) DEFAULT 0,
  status job_status DEFAULT 'pending',
  priority INT DEFAULT 0,
  timeline JSONB DEFAULT '[]'::jsonb,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  shipped_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_part_id_idx ON jobs(part_id);
CREATE INDEX IF NOT EXISTS jobs_quote_id_idx ON jobs(quote_id);
CREATE INDEX IF NOT EXISTS jobs_hub_id_idx ON jobs(hub_id);
CREATE INDEX IF NOT EXISTS jobs_order_id_idx ON jobs(order_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs(created_at);
CREATE INDEX IF NOT EXISTS jobs_estimated_completion_idx ON jobs(estimated_completion);

-- Foreign keys
ALTER TABLE jobs ADD CONSTRAINT jobs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE jobs ADD CONSTRAINT jobs_part_id_fkey
  FOREIGN KEY (part_id) REFERENCES catalog_parts(id) ON DELETE SET NULL;

ALTER TABLE jobs ADD CONSTRAINT jobs_quote_id_fkey
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

ALTER TABLE jobs ADD CONSTRAINT jobs_hub_id_fkey
  FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE SET NULL;

ALTER TABLE jobs ADD CONSTRAINT jobs_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create jobs
CREATE POLICY "Users can create jobs" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs (limited)
CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id AND
    status IN ('pending', 'on_hold')
  );

-- Admins and hubs can manage all jobs
CREATE POLICY "Admins can manage all jobs" ON jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise') OR
    EXISTS (SELECT 1 FROM hubs WHERE id = hub_id AND id IN (SELECT id FROM hubs))
  );

-- Service role can access all jobs
CREATE POLICY "Service role can access all jobs" ON jobs
  FOR SELECT TO service_role
  USING (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- =============================================================================
-- TABLE: orders
-- Customer orders (aggregates jobs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  status order_status DEFAULT 'draft',
  total_amount DECIMAL(10,2) DEFAULT 0,
  currency currency_code DEFAULT 'NGN',
  shipping_address JSONB DEFAULT '{}'::jsonb,
  billing_address JSONB DEFAULT '{}'::jsonb,
  shipping_method TEXT,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS orders_confirmed_at_idx ON orders(confirmed_at);

-- Foreign keys
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (limited)
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id AND
    status IN ('draft', 'pending')
  );

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Service role can access all orders
CREATE POLICY "Service role can access all orders" ON orders
  FOR SELECT TO service_role
  USING (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- =============================================================================
-- TABLE: payments
-- Payment records for jobs and orders
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  order_id UUID,
  user_id UUID NOT NULL,
  tx_ref TEXT UNIQUE NOT NULL,
  flutterwave_id TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency currency_code DEFAULT 'NGN',
  status payment_status DEFAULT 'pending',
  payment_method TEXT,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  transaction_id TEXT,
  transaction_data JSONB DEFAULT '{}'::jsonb,
  verification_data JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_job_id_idx ON payments(job_id);
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments(order_id);
CREATE INDEX IF NOT EXISTS payments_tx_ref_idx ON payments(tx_ref);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at);
CREATE INDEX IF NOT EXISTS payments_transaction_id_idx ON payments(transaction_id);

-- Foreign keys
ALTER TABLE payments ADD CONSTRAINT payments_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

ALTER TABLE payments ADD CONSTRAINT payments_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create payments
CREATE POLICY "Users can create payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Service role can access all payments
CREATE POLICY "Service role can access all payments" ON payments
  FOR SELECT TO service_role
  USING (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- =============================================================================
-- TABLE: user_stats
-- User activity statistics
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY,
  total_projects INT DEFAULT 0,
  total_conversations INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  total_jobs INT DEFAULT 0,
  total_completed_jobs INT DEFAULT 0,
  total_quotes INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  total_spent_currencies JSONB DEFAULT '{}'::jsonb,
  average_job_value DECIMAL(10,2) DEFAULT 0,
  favorite_material TEXT,
  favorite_finish TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_stats_total_spent_idx ON user_stats(total_spent DESC);
CREATE INDEX IF NOT EXISTS user_stats_last_activity_idx ON user_stats(last_activity);

-- Foreign key
ALTER TABLE user_stats ADD CONSTRAINT user_stats_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role can update stats
CREATE POLICY "Service role can update stats" ON user_stats
  FOR UPDATE TO service_role
  USING (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_updated_at();

-- =============================================================================
-- TABLE: activity_logs
-- Audit trail for all user actions
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action activity_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  changes JSONB DEFAULT '{}'::jsonb,
  old_data JSONB DEFAULT '{}'::jsonb,
  new_data JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON activity_logs(action);
CREATE INDEX IF NOT EXISTS activity_logs_entity_type_idx ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS activity_logs_entity_id_idx ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_composite_idx ON activity_logs(user_id, entity_type, created_at DESC);

-- Foreign key
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity" ON activity_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity" ON activity_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'enterprise')
  );

-- Service role can insert activity logs
CREATE POLICY "Service role can create activity logs" ON activity_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTION: Log activity
-- =============================================================================
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action activity_action,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT '{}'::jsonb,
  p_old_data JSONB DEFAULT '{}'::jsonb,
  p_new_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    old_data,
    new_data
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_changes,
    p_old_data,
    p_new_data
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Update user stats
-- =============================================================================
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- Get or create stats record
  SELECT * INTO v_stats FROM user_stats WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id) VALUES (COALESCE(NEW.user_id, OLD.user_id))
    RETURNING * INTO v_stats;
  END IF;

  -- Update stats based on entity type
  IF TG_TABLE_NAME = 'projects' THEN
    UPDATE user_stats SET
      total_projects = (SELECT COUNT(*) FROM projects WHERE user_id = v_stats.user_id),
      last_activity = NOW()
    WHERE user_id = v_stats.user_id;

  ELSIF TG_TABLE_NAME = 'conversations' THEN
    UPDATE user_stats SET
      total_conversations = (SELECT COUNT(*) FROM conversations WHERE user_id = v_stats.user_id),
      last_activity = NOW()
    WHERE user_id = v_stats.user_id;

  ELSIF TG_TABLE_NAME = 'messages' THEN
    UPDATE user_stats SET
      total_messages = (SELECT COUNT(*) FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE c.user_id = v_stats.user_id),
      last_activity = NOW()
    WHERE user_id = v_stats.user_id;

  ELSIF TG_TABLE_NAME = 'jobs' THEN
    UPDATE user_stats SET
      total_jobs = (SELECT COUNT(*) FROM jobs WHERE user_id = v_stats.user_id),
      total_completed_jobs = (SELECT COUNT(*) FROM jobs WHERE user_id = v_stats.user_id AND status = 'completed'),
      last_activity = NOW()
    WHERE user_id = v_stats.user_id;

  ELSIF TG_TABLE_NAME = 'quotes' THEN
    UPDATE user_stats SET
      total_quotes = (SELECT COUNT(*) FROM quotes WHERE user_id = v_stats.user_id),
      last_activity = NOW()
    WHERE user_id = v_stats.user_id;

  ELSIF TG_TABLE_NAME = 'orders' THEN
    UPDATE user_stats SET
      total_orders = (SELECT COUNT(*) FROM orders WHERE user_id = v_stats.user_id),
      last_activity = NOW()
    WHERE user_id = v_stats.user_id;

  ELSIF TG_TABLE_NAME = 'payments' AND NEW.status = 'completed' THEN
    UPDATE user_stats SET
      total_spent = total_spent + NEW.amount,
      average_job_value = CASE
        WHEN total_completed_jobs > 0 THEN (total_spent + NEW.amount) / total_completed_jobs
        ELSE NEW.amount
      END,
      last_activity = NOW(),
      total_spent_currencies = total_spent_currencies || jsonb_build_object(NEW.currency, COALESCE(total_spent_currencies->>NEW.currency::text, '0')::decimal + NEW.amount)
    WHERE user_id = v_stats.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for user stats updates
CREATE TRIGGER update_stats_on_project
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_stats_on_conversation
  AFTER INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_stats_on_message
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_stats_on_job
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_stats_on_quote
  AFTER INSERT OR UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_stats_on_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_stats_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- =============================================================================
-- AUTO-CREATE PROFILE TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();

-- =============================================================================
-- AUTO-CREATE USER STATS TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION create_user_stats_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats_on_profile();

-- =============================================================================
-- STORED PROCEDURES
-- =============================================================================

-- Calculate quote price
CREATE OR REPLACE FUNCTION calculate_quote_price(
  p_base_price DECIMAL,
  p_quantity INT,
  p_material_multiplier DECIMAL DEFAULT 1.00,
  p_finish_multiplier DECIMAL DEFAULT 1.00,
  p_hub_base_price DECIMAL DEFAULT 30.00
)
RETURNS JSONB AS $$
DECLARE
  v_subtotal DECIMAL;
  v_volume_discount DECIMAL;
  v_unit_price DECIMAL;
  v_platform_fee DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Calculate subtotal
  v_subtotal := p_base_price * p_quantity * p_material_multiplier * p_finish_multiplier;

  -- Apply volume discount
  v_volume_discount := CASE
    WHEN p_quantity >= 100 THEN 0.80
    WHEN p_quantity >= 50 THEN 0.85
    WHEN p_quantity >= 25 THEN 0.90
    WHEN p_quantity >= 10 THEN 0.95
    ELSE 1.00
  END;

  v_subtotal := v_subtotal * v_volume_discount;

  -- Calculate unit price
  v_unit_price := v_subtotal / p_quantity;

  -- Calculate platform fee (15%)
  v_platform_fee := ROUND(v_subtotal * 0.15, 2);

  -- Calculate total
  v_total := v_subtotal + v_platform_fee + p_hub_base_price;

  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'volume_discount', v_volume_discount,
    'unit_price', v_unit_price,
    'platform_fee', v_platform_fee,
    'hub_base_price', p_hub_base_price,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql;

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_order_number TEXT;
  v_count INT;
BEGIN
  LOOP
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT COUNT(*) INTO v_count FROM orders WHERE order_number = v_order_number;
    IF v_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- Generate transaction reference
CREATE OR REPLACE FUNCTION generate_tx_ref()
RETURNS TEXT AS $$
DECLARE
  v_tx_ref TEXT;
BEGIN
  LOOP
    v_tx_ref := 'QT' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    SELECT COUNT(*) INTO v_tx_ref FROM payments WHERE tx_ref = v_tx_ref;
    IF NOT FOUND THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN v_tx_ref;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View: User dashboard stats
CREATE OR REPLACE VIEW user_dashboard AS
SELECT
  p.id as user_id,
  p.full_name,
  p.subscription_tier,
  COALESCE(us.total_projects, 0) as total_projects,
  COALESCE(us.total_conversations, 0) as total_conversations,
  COALESCE(us.total_jobs, 0) as total_jobs,
  COALESCE(us.total_completed_jobs, 0) as total_completed_jobs,
  COALESCE(us.total_spent, 0) as total_spent,
  us.last_activity,
  p.created_at as member_since
FROM profiles p
LEFT JOIN user_stats us ON p.user_id = us.user_id;

-- View: Active jobs with details
CREATE OR REPLACE VIEW active_jobs AS
SELECT
  j.id,
  j.user_id,
  j.status,
  j.quantity,
  j.material,
  j.total_price,
  j.created_at,
  j.estimated_completion,
  h.name as hub_name,
  h.location->>'city' as hub_city,
  cp.name as part_name,
  cp.category as part_category
FROM jobs j
LEFT JOIN hubs h ON j.hub_id = h.id
LEFT JOIN catalog_parts cp ON j.part_id = cp.id
WHERE j.status NOT IN ('completed', 'cancelled')
ORDER BY j.created_at DESC;

-- View: Hub performance
-- FIX: Corrected malformed CASE statement - added missing "CASE WHEN"
CREATE OR REPLACE VIEW hub_performance AS
SELECT
  h.id,
  h.name,
  h.rating,
  h.completed_jobs,
  h.avg_lead_time,
  h.current_load,
  h.certified,
  COUNT(j.id) as active_jobs,
  COALESCE(AVG(j.total_price), 0) as avg_job_value,
  CASE
    WHEN EXTRACT(YEAR FROM AGE(NOW(), MIN(j.created_at))) > 0
    THEN EXTRACT(YEAR FROM AGE(NOW(), MIN(j.created_at)))
    ELSE 0
  END as years_active
FROM hubs h
LEFT JOIN jobs j ON h.id = j.hub_id AND j.status NOT IN ('completed', 'cancelled')
GROUP BY h.id;

-- View: Popular parts
CREATE OR REPLACE VIEW popular_parts AS
SELECT
  cp.id,
  cp.name,
  cp.category,
  cp.base_price,
  cp.lead_time_days,
  cp.manufacturability,
  cp.view_count,
  COUNT(j.id) as order_count
FROM catalog_parts cp
LEFT JOIN jobs j ON cp.id = j.part_id
WHERE cp.is_active = true
GROUP BY cp.id
ORDER BY order_count DESC, cp.view_count DESC
LIMIT 20;

-- =============================================================================
-- SEED DATA: Materials
-- =============================================================================
INSERT INTO catalog_materials (id, name, category, description, price_multiplier, density, compatible_processes, compatible_finishes, sort_order) VALUES
('mat-al6061', 'Aluminum 6061-T6', 'Metals', 'General purpose aluminum alloy with good mechanical properties and corrosion resistance', 1.00, 2.70, ARRAY['CNC Milling', 'CNC Turning', 'Sheet Metal'], ARRAY['Powder Coat', 'Anodize', 'Hard Anodize', 'Paint', 'Polished', 'Brushed'], 1),
('mat-al7075', 'Aluminum 7075-T6', 'Metals', 'High-strength aluminum alloy for aerospace applications', 1.30, 2.81, ARRAY['CNC Milling', 'CNC Turning'], ARRAY['Powder Coat', 'Anodize', 'Hard Anodize', 'Paint', 'Polished'], 2),
('mat-steel1018', 'Steel 1018', 'Metals', 'Low carbon steel for general purpose machining', 0.90, 7.87, ARRAY['CNC Milling', 'CNC Turning', 'Sheet Metal'], ARRAY['Powder Coat', 'Paint', 'Electroplate', 'Nickel Plated', 'Chrome Plated'], 3),
('mat-ss304', 'Stainless Steel 304', 'Metals', 'Corrosion resistant stainless steel', 1.50, 8.00, ARRAY['CNC Milling', 'CNC Turning', 'Sheet Metal'], ARRAY['Polished', 'Brushed', 'Electroplate'], 4),
('mat-ss316', 'Stainless Steel 316', 'Metals', 'Marine grade stainless steel with excellent corrosion resistance', 1.80, 8.00, ARRAY['CNC Milling', 'CNC Turning'], ARRAY['Polished', 'Brushed'], 5),
('mat-brass', 'Brass C360', 'Metals', 'Free-machining brass with excellent finish properties', 1.60, 8.50, ARRAY['CNC Milling', 'CNC Turning'], ARRAY['Polished', 'Brushed', 'Nickel Plated', 'Chrome Plated'], 6),
('mat-copper', 'Copper C110', 'Metals', 'Pure copper with excellent thermal and electrical conductivity', 1.70, 8.96, ARRAY['CNC Milling', 'CNC Turning'], ARRAY['Polished', 'Brushed', 'Nickel Plated'], 7),
('mat-ti', 'Titanium Ti-6Al-4V', 'Metals', ' aerospace grade titanium alloy', 4.00, 4.43, ARRAY['CNC Milling', 'CNC Turning'], ARRAY['Anodize', 'Polished'], 8),
('mat-abs', 'ABS', 'Plastics', 'General purpose thermoplastic with good impact strength', 0.50, 1.04, ARRAY['3D Printing', 'Injection Molding'], ARRAY['None', 'Sanding'], 9),
('mat-nylon', 'Nylon PA12', 'Plastics', 'Strong and flexible nylon for functional parts', 0.70, 1.01, ARRAY['3D Printing', 'Injection Molding'], ARRAY['None', 'Sanding'], 10),
('mat-delrin', 'Delrin (Acetal)', 'Plastics', 'High strength engineering plastic with low friction', 0.85, 1.41, ARRAY['CNC Milling', 'CNC Turning'], ARRAY['None'], 11),
('mat-petg', 'PETG', 'Plastics', 'Easy to print transparent plastic', 0.55, 1.27, ARRAY['3D Printing'], ARRAY['None'], 12),
('mat-carbon', 'Carbon Fiber', 'Composites', 'Carbon fiber reinforced polymer', 2.50, 1.55, ARRAY['3D Printing', 'CNC Milling'], ARRAY['None'], 13),
('mat-wood', 'Birch Plywood', 'Wood', 'High quality birch plywood', 0.40, 0.68, ARRAY['Laser Cutting', 'CNC Milling'], ARRAY['Varnish', 'Lacquer'], 14)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED DATA: Finishes
-- =============================================================================
INSERT INTO catalog_finishes (id, name, category, description, compatible_materials, price_multiplier, lead_time_days_added, sort_order) VALUES
('fin-raw', 'Raw/Unfinished', 'None', 'As machined finish, no additional processing', ARRAY['Steel', 'Aluminum', 'Stainless', 'Brass', 'Copper', 'Titanium', 'Plastics', 'Wood', 'Carbon Fiber'], 1.00, 0, 1),
('fin-powder', 'Powder Coat', 'Coating', 'Durable powder coating in various colors', ARRAY['Steel', 'Aluminum'], 1.15, 2, 2),
('fin-anodize', 'Anodize (Type II)', 'Coating', 'Standard anodizing for corrosion resistance and color', ARRAY['Aluminum'], 1.12, 3, 3),
('fin-harde', 'Hard Anodize (Type III)', 'Coating', 'Hard anodizing for wear resistance', ARRAY['Aluminum'], 1.18, 4, 4),
('fin-paint', 'Paint', 'Coating', 'Wet paint finish in various colors', ARRAY['Steel', 'Aluminum'], 1.10, 3, 5),
('fin-electro', 'Electroplate', 'Plating', 'Electroplating for corrosion resistance', ARRAY['Steel', 'Copper', 'Brass', 'Bronze', 'Cast Iron'], 1.20, 4, 6),
('fin-polish', 'Polished', 'Surface', 'Mirror-like polished finish', ARRAY['Stainless Steel', 'Aluminum', 'Brass', 'Copper'], 1.25, 3, 7),
('fin-brush', 'Brushed', 'Surface', 'Linear brushed finish', ARRAY['Stainless Steel', 'Aluminum', 'Brass', 'Copper'], 1.20, 2, 8),
('fin-nickel', 'Nickel Plated', 'Plating', 'Bright nickel plating', ARRAY['Steel', 'Copper', 'Brass', 'Bronze', 'Cast Iron'], 1.22, 4, 9),
('fin-chrome', 'Chrome Plated', 'Plating', 'Decorative chrome plating', ARRAY['Steel', 'Copper', 'Brass', 'Bronze', 'Cast Iron'], 1.30, 5, 10),
('fin-bead', 'Bead Blasted', 'Surface', 'Uniform matte finish from bead blasting', ARRAY['Aluminum', 'Steel', 'Stainless', 'Titanium'], 1.05, 1, 11),
('fin-pass', 'Passivate', 'Surface', 'Acid treatment to remove free iron and enhance corrosion resistance', ARRAY['Stainless Steel'], 1.03, 1, 12)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED DATA: Hubs
-- =============================================================================
INSERT INTO hubs (id, name, location, address, capabilities, materials, processes, rating, rating_count, completed_jobs, avg_lead_time, current_load, base_price, certified, contact_email, is_active, is_featured) VALUES
('hub-techhub-la', 'TechHub LA', '{"city": "Los Angeles", "country": "USA", "lat": 34.0522, "lng": -118.2437}', '123 Industrial Blvd, Los Angeles, CA 90001', ARRAY['CNC Milling', 'CNC Turning', 'Laser Cutting', '3D Printing'], ARRAY['Aluminum 6061-T6', 'Aluminum 7075-T6', 'Steel 1018', 'Stainless Steel 304', 'ABS', 'Nylon'], ARRAY['CNC Milling', 'CNC Turning', 'Laser Cutting', '3D Printing'], 4.9, 456, 1234, 3.5, 0.45, 30.00, TRUE, 'orders@techhubla.com', TRUE, TRUE),
('hub-mech-precision', 'MechPrecision Toronto', '{"city": "Toronto", "country": "Canada", "lat": 43.6532, "lng": -79.3832}', '456 Manufacturing Way, Toronto, ON M3C 1H2', ARRAY['CNC Milling', 'CNC Turning', '5-Axis'], ARRAY['Aluminum 6061-T6', 'Steel 1018', 'Brass C360', 'Delrin'], ARRAY['CNC Milling', 'CNC Turning', '5-Axis'], 4.7, 234, 892, 4.2, 0.60, 25.00, TRUE, 'info@mechprecision.ca', TRUE, FALSE),
('hub-fastcut-nyc', 'FastCut NYC', '{"city": "New York", "country": "USA", "lat": 40.7128, "lng": -74.006}', '789 Factory Lane, Brooklyn, NY 11201', ARRAY['Laser Cutting', 'Waterjet', 'Sheet Metal'], ARRAY['Steel 1018', 'Aluminum 5052', 'Stainless Steel 304'], ARRAY['Laser Cutting', 'Waterjet', 'Sheet Metal'], 4.8, 567, 2156, 2.8, 0.70, 35.00, TRUE, 'orders@fastcutnyc.com', TRUE, TRUE),
('hub-eurotech-berlin', 'EuroTech Berlin', '{"city": "Berlin", "country": "Germany", "lat": 52.52, "lng": 13.405}', '321 Industrie Strasse, Berlin 10115', ARRAY['CNC Milling', 'Sheet Metal', '3D Printing', 'Injection Molding'], ARRAY['Aluminum 6061-T6', 'Steel 1018', 'Stainless Steel 304', 'Brass C360', 'ABS', 'Nylon'], ARRAY['CNC Milling', 'Sheet Metal', '3D Printing', 'Injection Molding'], 4.8, 345, 1567, 4.5, 0.50, 28.00, TRUE, 'sales@eurotech-berlin.de', TRUE, FALSE),
('hub-asiafab-shenzhen', 'AsiaFab Shenzhen', '{"city": "Shenzhen", "country": "China", "lat": 22.5431, "lng": 114.0579}', '999 Tech Park Road, Shenzhen, Guangdong 518000', ARRAY['CNC Milling', 'CNC Turning', 'Injection Molding', 'Die Casting'], ARRAY['Aluminum 6061-T6', 'Steel 1018', 'ABS', 'Nylon', 'Titanium Ti-6Al-4V', 'Zinc'], ARRAY['CNC Milling', 'CNC Turning', 'Injection Molding', 'Die Casting'], 4.6, 789, 3421, 7.0, 0.55, 20.00, TRUE, 'orders@asiafab.cn', TRUE, TRUE),
('hub-precision-pro', 'PrecisionPro Munich', '{"city": "Munich", "country": "Germany", "lat": 48.1351, "lng": 11.5820}', '555 Bayerstrasse, Munich 80331', ARRAY['CNC Milling', '5-Axis', 'Wire EDM'], ARRAY['Aluminum 6061-T6', 'Aluminum 7075-T6', 'Stainless Steel 304', 'Stainless Steel 316', 'Titanium Ti-6Al-4V'], ARRAY['CNC Milling', '5-Axis', 'Wire EDM'], 4.9, 189, 756, 3.8, 0.40, 32.00, TRUE, 'info@precisionpro-munich.de', TRUE, FALSE),
('hub-quickcut-dallas', 'QuickCut Dallas', '{"city": "Dallas", "country": "USA", "lat": 32.7767, "lng": -96.7970}', '222 Industrial Dr, Dallas, TX 75201', ARRAY['Laser Cutting', 'CNC Punching', 'Sheet Metal'], ARRAY['Steel 1018', 'Aluminum 5052', 'Stainless Steel 304'], ARRAY['Laser Cutting', 'CNC Punching', 'Sheet Metal'], 4.6, 312, 1890, 2.5, 0.65, 22.00, TRUE, 'sales@quickcutdallas.com', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED DATA: Catalog Parts (expanded)
-- =============================================================================
INSERT INTO catalog_parts (id, name, description, category, subcategory, material, process, base_price, lead_time, lead_time_days, manufacturability, thumbnail, materials, parameters, specifications, finishes, tags, sort_order) VALUES
-- Brackets
('part-bracket-001', 'Precision Bracket', 'High-precision aluminum bracket for mounting electronics, sensors, and mechanical assemblies', 'Brackets', 'Mounting Brackets', 'Aluminum 6061-T6', 'CNC Milling', 32.00, '3-5 days', 5, 96, '/placeholder.svg?height=200&width=200', '[{"name": "Aluminum 6061-T6", "multiplier": 1.0}, {"name": "Aluminum 7075-T6", "multiplier": 1.3}, {"name": "Steel 1018", "multiplier": 0.9}, {"name": "Stainless Steel 304", "multiplier": 1.5}]', '[{"name": "Length", "displayName": "Length", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "Width", "displayName": "Width", "value": 50, "unit": "mm", "min": 25, "max": 100}, {"name": "Height", "displayName": "Height", "value": 25, "unit": "mm", "min": 10, "max": 50}, {"name": "Hole Diameter", "displayName": "Hole Diameter", "value": 6, "unit": "mm", "min": 3, "max": 12}]', '[{"label": "Tolerance", "value": "±0.1mm"}, {"label": "Surface Finish", "value": "Ra 1.6μm"}, {"label": "Max Temp", "value": "150°C"}, {"label": "Weight", "value": "45g"}]', '["Raw/Unfinished", "Powder Coat", "Anodize", "Hard Anodize", "Paint", "Polished", "Brushed"]', ARRAY['bracket', 'mounting', 'precision', 'aluminum'], 1),
('part-bracket-002', 'L-Bracket Heavy', 'Heavy-duty L-bracket for structural applications and heavy loads', 'Brackets', 'Structural Brackets', 'Steel 1018', 'Sheet Metal', 18.00, '2-3 days', 3, 97, '/placeholder.svg?height=200&width=200', '[{"name": "Steel 1018", "multiplier": 1.0}, {"name": "Aluminum 5052", "multiplier": 1.1}, {"name": "Stainless Steel 304", "multiplier": 1.6}]', '[{"name": "Length", "displayName": "Length", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "Width", "displayName": "Width", "value": 50, "unit": "mm", "min": 25, "max": 100}, {"name": "Thickness", "displayName": "Thickness", "value": 3, "unit": "mm", "min": 1, "max": 6}]', '[{"label": "Tolerance", "value": "±0.2mm"}, {"label": "Bend Radius", "value": "1x thickness"}, {"label": "Surface Finish", "value": "Mill finish"}, {"label": "Weight", "value": "180g"}]', '["Raw/Unfinished", "Powder Coat", "Paint", "Zinc Plated"]', ARRAY['bracket', 'l-bracket', 'structural', 'heavy duty'], 2),
('part-bracket-003', 'Corner Bracket 90deg', '90-degree corner bracket for box frames and enclosures', 'Brackets', 'Corner Brackets', 'Aluminum 6061-T6', 'CNC Milling', 28.00, '3-4 days', 4, 95, '/placeholder.svg?height=200&width=200', '[{"name": "Aluminum 6061-T6", "multiplier": 1.0}, {"name": "Aluminum 7075-T6", "multiplier": 1.3}, {"name": "Steel 1018", "multiplier": 0.85}]', '[{"name": "Width", "displayName": "Width", "value": 60, "unit": "mm", "min": 30, "max": 120}, {"name": "Height", "displayName": "Height", "value": 60, "unit": "mm", "min": 30, "max": 120}, {"name": "Thickness", "displayName": "Thickness", "value": 5, "unit": "mm", "min": 2, "max": 10}]', '[{"label": "Tolerance", "value": "±0.1mm"}, {"label": "Angle", "value": "90°"}, {"label": "Holes", "value": "4x M6"}]', '["Raw/Unfinished", "Anodize", "Powder Coat", "Brushed"]', ARRAY['bracket', 'corner', '90-degree', 'frame'], 3),

-- Fasteners
('part-fastener-001', 'Hex Socket Bolt M8', 'Standard hex socket head cap screw for mechanical assemblies', 'Fasteners', 'Bolts', 'Steel 12.9', 'CNC', 4.00, '2 days', 2, 99, '/placeholder.svg?height=200&width=200', '[{"name": "Steel 12.9", "multiplier": 1.0}, {"name": "Stainless Steel 304", "multiplier": 1.5}, {"name": "Brass C360", "multiplier": 2.0}, {"name": "Aluminum 7075-T6", "multiplier": 1.2}]', '[{"name": "Diameter", "displayName": "Thread Diameter", "value": 8, "unit": "mm", "min": 4, "max": 16}, {"name": "Length", "displayName": "Length", "value": 30, "unit": "mm", "min": 10, "max": 100}]', '[{"label": "Thread", "value": "M8 x 1.25"}, {"label": "Standard", "value": "ISO 4762"}, {"label": "Grade", "value": "12.9"}]', '["Raw/Unfinished", "Zinc Plated", "Black Oxide", "Nickel Plated"]', ARRAY['fastener', 'bolt', 'screw', 'M8'], 1),
('part-fastener-002', 'Hex Nut M8', 'Standard hex nut for M8 fasteners', 'Fasteners', 'Nuts', 'Steel 10', 'CNC', 1.50, '1-2 days', 2, 99, '/placeholder.svg?height=200&width=200', '[{"name": "Steel 10", "multiplier": 1.0}, {"name": "Stainless Steel 304", "multiplier": 1.6}, {"name": "Brass C360", "multiplier": 2.2}]', '[{"name": "Diameter", "displayName": "Thread Size", "value": 8, "unit": "mm", "min": 4, "max": 16}]', '[{"label": "Thread", "value": "M8 x 1.25"}, {"label": "Height", "value": "6.5mm"}]', '["Raw/Unfinished", "Zinc Plated", "Black Oxide"]', ARRAY['fastener', 'nut', 'hex nut'], 2),

-- Enclosures
('part-enclosure-001', 'Electronics Enclosure', 'Protective enclosure for electronics with mounting points and IP rating', 'Enclosures', 'Electronics Boxes', 'ABS', '3D Printing', 28.00, '4 days', 4, 94, '/placeholder.svg?height=200&width=200', '[{"name": "ABS", "multiplier": 1.0}, {"name": "Aluminum 6061-T6", "multiplier": 1.2}, {"name": "Nylon PA12", "multiplier": 0.9}]', '[{"name": "Length", "displayName": "Length", "value": 150, "unit": "mm", "min": 50, "max": 300}, {"name": "Width", "displayName": "Width", "value": 100, "unit": "mm", "min": 50, "max": 200}, {"name": "Height", "displayName": "Height", "value": 50, "unit": "mm", "min": 20, "max": 100}]', '[{"label": "Tolerance", "value": "±0.3mm"}, {"label": "Wall Thickness", "value": "2mm"}, {"label": "IP Rating", "value": "IP54"}]', '["Raw/Unfinished", "Sanding"]', ARRAY['enclosure', 'electronics', 'box', 'IP54'], 1),
('part-enclosure-002', 'Arduino Case', 'Snap-fit enclosure for Arduino Uno boards', 'Enclosures', 'Device Cases', 'ABS', '3D Printing', 15.00, '3 days', 3, 96, '/placeholder.svg?height=200&width=200', '[{"name": "ABS", "multiplier": 1.0}, {"name": "PETG", "multiplier": 1.1}, {"name": "Nylon PA12", "multiplier": 0.95}]', '[{"name": "Length", "displayName": "Length", "value": 75, "unit": "mm", "min": 60, "max": 100}, {"name": "Width", "displayName": "Width", "value": 55, "unit": "mm", "min": 40, "max": 80}]', '[{"label": "Compatibility", "value": "Arduino Uno"}, {"label": "Features", "value": "Snap-fit"}]', '["Raw/Unfinished"]', ARRAY['enclosure', 'arduino', 'case', 'snap-fit'], 2),

-- Shafts
('part-shaft-001', 'Drive Shaft 20mm', 'Precision ground drive shaft for mechanical power transmission', 'Shafts', 'Drive Shafts', 'Steel 1045', 'CNC Turning', 45.00, '5-7 days', 6, 98, '/placeholder.svg?height=200&width=200', '[{"name": "Steel 1045", "multiplier": 1.0}, {"name": "Stainless Steel 316", "multiplier": 1.8}, {"name": "Aluminum 7075-T6", "multiplier": 1.1}]', '[{"name": "Diameter", "displayName": "Diameter", "value": 20, "unit": "mm", "min": 10, "max": 50}, {"name": "Length", "displayName": "Length", "value": 100, "unit": "mm", "min": 50, "max": 300}]', '[{"label": "Tolerance", "value": "±0.02mm"}, {"label": "Surface Finish", "value": "Ra 0.8μm"}, {"label": "Hardness", "value": "55-60 HRC"}]', '["Raw/Unfinished", "Polished", "Chrome Plated"]', ARRAY['shaft', 'drive shaft', 'precision', 'turned'], 1),
('part-shaft-002', 'Stepper Motor Shaft', 'D-shaft for stepper motor coupling', 'Shafts', 'Motor Shafts', 'Steel 1212', 'CNC Turning', 12.00, '3-4 days', 4, 99, '/placeholder.svg?height=200&width=200', '[{"name": "Steel 1212", "multiplier": 1.0}, {"name": "Stainless Steel 303", "multiplier": 1.6}]', '[{"name": "Diameter", "displayName": "Diameter", "value": 5, "unit": "mm", "min": 3, "max": 10}, {"name": "Length", "displayName": "Length", "value": 24, "unit": "mm", "min": 10, "max": 50}]', '[{"label": "Tolerance", "value": "±0.02mm"}, {"label": "Flat Length", "value": "15mm"}]', '["Raw/Uninished", "Polished"]', ARRAY['shaft', 'motor shaft', 'd-shaft', 'stepper'], 2),

-- Gears
('part-gear-001', 'Spur Gear 24T', 'Precision machined spur gear for power transmission applications', 'Gears', 'Spur Gears', 'Brass C360', 'CNC Milling', 56.00, '6-8 days', 7, 91, '/placeholder.svg?height=200&width=200', '[{"name": "Brass C360", "multiplier": 1.0}, {"name": "Delrin", "multiplier": 0.85}, {"name": "Steel 1018", "multiplier": 1.2}, {"name": "Nylon PA12", "multiplier": 0.9}]', '[{"name": "Module", "displayName": "Module", "value": 2, "unit": "mm", "min": 1, "max": 4}, {"name": "Teeth", "displayName": "Number of Teeth", "value": 24, "unit": "count", "min": 12, "max": 48}]', '[{"label": "Pressure Angle", "value": "20°"}, {"label": "Tolerance", "value": "AGMA Q9"}]', '["Raw/Unfinished", "Polished"]', ARRAY['gear', 'spur gear', 'brass', 'power transmission'], 1),
('part-gear-002', 'Helical Gear 36T', 'Helical gear for smoother and quieter operation', 'Gears', 'Helical Gears', 'Nylon PA12', '3D Printing', 48.00, '5-7 days', 6, 88, '/placeholder.svg?height=200&width=200', '[{"name": "Nylon PA12", "multiplier": 1.0}, {"name": "ABS", "multiplier": 0.8}, {"name": "Delrin", "multiplier": 1.1}]', '[{"name": "Module", "displayName": "Module", "value": 2, "unit": "mm", "min": 1, "max": 3}, {"name": "Teeth", "displayName": "Number of Teeth", "value": 36, "unit": "count", "min": 18, "max": 60}, {"name": "Helix Angle", "displayName": "Helix Angle", "value": 15, "unit": "deg", "min": 10, "max": 30}]', '[{"label": "Pressure Angle", "value": "20°"}, {"label": "Helix Angle", "value": "15°"}]', '["Raw/Unfinished"]', ARRAY['gear', 'helical gear', 'nylon', 'quiet operation'], 2),

-- Connectors
('part-connector-001', 'PCB Stand-off', 'Hexagonal stand-off for PCB mounting', 'Connectors', 'Stand-offs', 'Brass C360', 'CNC Turning', 2.50, '2 days', 2, 98, '/placeholder.svg?height=200&width=200', '[{"name": "Brass C360", "multiplier": 1.0}, {"name": "Aluminum 6061-T6", "multiplier": 0.9}, {"name": "Nylon PA12", "multiplier": 0.7}]', '[{"name": "Thread", "displayName": "Thread Size", "value": 4, "unit": "mm", "min": 3, "max": 6}, {"name": "Height", "displayName": "Height", "value": 10, "unit": "mm", "min": 5, "max": 25}]', '[{"label": "Thread", "value": "M4"}, {"label": "Hex Width", "value": "7mm"}]', '["Raw/Unfinished", "Nickel Plated", "Gold Plated"]', ARRAY['connector', 'stand-off', 'PCB', 'mounting'], 1),
('part-connector-002', 'Cable Gland M12', 'Waterproof cable gland for enclosure access', 'Connectors', 'Cable Management', 'Brass C360', 'CNC Turning', 5.00, '2-3 days', 3, 97, '/placeholder.svg?height=200&width=200', '[{"name": "Brass C360", "multiplier": 1.0}, {"name": "Stainless Steel 304", "multiplier": 1.4}]', '[{"name": "Thread", "displayName": "Thread Size", "value": 12, "unit": "mm", "min": 8, "max": 20}, {"name": "Cable Range", "displayName": "Cable Diameter", "value": 8, "unit": "mm", "min": 4, "max": 14}]', '[{"label": "Thread", "value": "M12 x 1.5"}, {"label": "IP Rating", "value": "IP68"}]', '["Raw/Unfinished", "Nickel Plated"]', ARRAY['connector', 'cable gland', 'waterproof', 'IP68'], 2),

-- Spacers
('part-spacer-001', 'Hex Spacer M3', 'Female-female hex spacer for PCB stacking', 'Spacers', 'Board Spacers', 'Aluminum 6061-T6', 'CNC Turning', 1.20, '1-2 days', 2, 99, '/placeholder.svg?height=200&width=200', '[{"name": "Aluminum 6061-T6", "multiplier": 1.0}, {"name": "Brass C360", "multiplier": 1.5}, {"name": "Nylon PA12", "multiplier": 0.7}]', '[{"name": "Thread", "displayName": "Thread Size", "value": 3, "unit": "mm", "min": 2, "max": 5}, {"name": "Length", "displayName": "Length", "value": 10, "unit": "mm", "min": 3, "max": 30}]', '[{"label": "Thread", "value": "M3"}, {"label": "Hex Width", "value": "5.5mm"}]', '["Raw/Unfinished", "Anodize", "Nickel Plated"]', ARRAY['spacer', 'hex spacer', 'PCB', 'standoff'], 1),

-- Gussets and Plates
('part-plate-001', 'Base Plate 150x150', 'Heavy duty base plate for machinery mounting', 'Plates', 'Base Plates', 'Steel 1018', 'CNC Milling', 85.00, '5-7 days', 6, 95, '/placeholder.svg?height=200&width=200', '[{"name": "Steel 1018", "multiplier": 1.0}, {"name": "Aluminum 6061-T6", "multiplier": 1.1}, {"name": "Stainless Steel 304", "multiplier": 1.6}]', '[{"name": "Length", "displayName": "Length", "value": 150, "unit": "mm", "min": 100, "max": 300}, {"name": "Width", "displayName": "Width", "value": 150, "unit": "mm", "min": 100, "max": 300}, {"name": "Thickness", "displayName": "Thickness", "value": 10, "unit": "mm", "min": 5, "max": 25}]', '[{"label": "Tolerance", "value": "±0.1mm"}, {"label": "Hole Pattern", "value": "Standard metric"}]', '["Raw/Unfinished", "Powder Coat", "Zinc Plated"]', ARRAY['plate', 'base plate', 'mounting', 'heavy duty'], 1)
ON CONFLICT (id) DO NOTHING;

-- Update timestamp for seed data
UPDATE catalog_parts SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE hubs SET updated_at = NOW() WHERE updated_at IS NULL;

-- =============================================================================
-- QUTLAS PLATFORM - SCHEMA VERIFICATION SCRIPT
-- Execute this in Supabase SQL Editor to verify deployment
-- =============================================================================

-- =============================================================================
-- PART 1: VERIFY ALL TABLES EXIST
-- =============================================================================
SELECT 
  '📋 CHECKING TABLES' as status,
  COUNT(*) as table_count,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Expected: 16 tables
-- profiles, conversations, messages, catalog_materials, catalog_finishes, 
-- catalog_parts, hubs, projects, project_shares, workspaces, quotes, jobs, 
-- orders, payments, user_stats, activity_logs

-- =============================================================================
-- PART 2: VERIFY ENUM TYPES
-- =============================================================================
SELECT 
  '🏷️  CHECKING ENUMS' as status,
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN (
  'subscription_tier',
  'subscription_status', 
  'currency_code',
  'quote_status',
  'job_status',
  'payment_status',
  'order_status',
  'project_status',
  'privacy_level',
  'activity_action',
  'message_role'
)
GROUP BY typname
ORDER BY typname;

-- Expected: 11 enum types with correct values

-- =============================================================================
-- PART 3: VERIFY SEED DATA - MATERIALS
-- =============================================================================
SELECT 
  '🔩 CHECKING MATERIALS' as status,
  COUNT(*) as total_materials,
  COUNT(*) FILTER (WHERE is_active = true) as active_materials,
  COUNT(DISTINCT category) as categories
FROM catalog_materials;

-- Expected: 15 materials, 15 active, 4 categories (Metals, Plastics, Wood, Composites)

SELECT 
  category,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY name) as materials
FROM catalog_materials
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- =============================================================================
-- PART 4: VERIFY SEED DATA - FINISHES
-- =============================================================================
SELECT 
  '🎨 CHECKING FINISHES' as status,
  COUNT(*) as total_finishes,
  COUNT(*) FILTER (WHERE is_active = true) as active_finishes,
  COUNT(DISTINCT category) as categories
FROM catalog_finishes;

-- Expected: 12 finishes, 12 active, 4 categories

SELECT 
  category,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY name) as finishes
FROM catalog_finishes
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- =============================================================================
-- PART 5: VERIFY SEED DATA - HUBS
-- =============================================================================
SELECT 
  '🏭 CHECKING HUBS' as status,
  COUNT(*) as total_hubs,
  COUNT(*) FILTER (WHERE is_active = true) as active_hubs,
  COUNT(*) FILTER (WHERE certified = true) as certified_hubs
FROM hubs;

-- Expected: 7 hubs, 7 active, 7 certified

SELECT 
  name,
  location->>'city' as city,
  location->>'country' as country,
  array_length(capabilities, 1) as capability_count,
  rating,
  certified
FROM hubs
WHERE is_active = true
ORDER BY name;

-- =============================================================================
-- PART 6: VERIFY SEED DATA - CATALOG PARTS
-- =============================================================================
SELECT 
  '🔧 CHECKING CATALOG PARTS' as status,
  COUNT(*) as total_parts,
  COUNT(*) FILTER (WHERE is_active = true) as active_parts,
  COUNT(DISTINCT category) as categories,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_parts
FROM catalog_parts;

-- Expected: 20+ parts, 20+ active, multiple categories, some featured

SELECT 
  category,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY name LIMIT 5) as example_parts
FROM catalog_parts
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- =============================================================================
-- PART 7: VERIFY RLS POLICIES
-- =============================================================================
SELECT 
  '🔒 CHECKING RLS POLICIES' as status,
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Expected: Multiple policies across all tables

SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- PART 8: VERIFY INDEXES
-- =============================================================================
SELECT 
  '📇 CHECKING INDEXES' as status,
  COUNT(*) as total_indexes,
  COUNT(*) FILTER (WHERE indexdef LIKE '%GIN%') as gin_indexes,
  COUNT(*) FILTER (WHERE indexdef LIKE '%UNIQUE%') as unique_indexes
FROM pg_indexes 
WHERE schemaname = 'public';

-- Expected: Multiple indexes for performance

-- =============================================================================
-- PART 9: VERIFY TRIGGERS
-- =============================================================================
SELECT 
  '⚡ CHECKING TRIGGERS' as status,
  COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Expected: Triggers for updated_at, auto-profile, auto-stats, etc.

SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- PART 10: VERIFY FUNCTIONS
-- =============================================================================
SELECT 
  '🔧 CHECKING FUNCTIONS' as status,
  COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Expected: Multiple functions for pricing, order numbers, etc.

SELECT 
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =============================================================================
-- PART 11: VERIFY VIEWS
-- =============================================================================
SELECT 
  '👁️  CHECKING VIEWS' as status,
  COUNT(*) as total_views
FROM information_schema.views 
WHERE table_schema = 'public';

-- Expected: Views like user_dashboard, active_jobs, hub_performance, popular_parts

SELECT 
  table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =============================================================================
-- PART 12: TEST DATA INTEGRITY
-- =============================================================================

-- Check material-finish compatibility
SELECT 
  '🔗 CHECKING MATERIAL-FINISH COMPATIBILITY' as status,
  COUNT(*) as total_materials,
  COUNT(*) FILTER (WHERE array_length(compatible_finishes, 1) > 0) as materials_with_finishes
FROM catalog_materials;

-- Check hub capabilities
SELECT 
  '🔗 CHECKING HUB CAPABILITIES' as status,
  COUNT(*) as total_hubs,
  COUNT(*) FILTER (WHERE array_length(capabilities, 1) > 0) as hubs_with_capabilities,
  COUNT(*) FILTER (WHERE array_length(materials, 1) > 0) as hubs_with_materials
FROM hubs;

-- =============================================================================
-- PART 13: SAMPLE QUERIES (TEST SELECTS)
-- =============================================================================

-- Test: Get all active materials
SELECT 
  '✅ TEST: Active Materials' as test_name,
  COUNT(*) as count
FROM catalog_materials 
WHERE is_active = true;

-- Test: Get all active finishes
SELECT 
  '✅ TEST: Active Finishes' as test_name,
  COUNT(*) as count
FROM catalog_finishes 
WHERE is_active = true;

-- Test: Get all active hubs
SELECT 
  '✅ TEST: Active Hubs' as test_name,
  COUNT(*) as count
FROM hubs 
WHERE is_active = true;

-- Test: Get all active parts
SELECT 
  '✅ TEST: Active Parts' as test_name,
  COUNT(*) as count
FROM catalog_parts 
WHERE is_active = true;

-- =============================================================================
-- PART 14: FINAL VERIFICATION SUMMARY
-- =============================================================================
SELECT 
  '🎉 DEPLOYMENT STATUS' as status,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') >= 16
      AND (SELECT COUNT(*) FROM catalog_materials) >= 15
      AND (SELECT COUNT(*) FROM catalog_finishes) >= 12
      AND (SELECT COUNT(*) FROM hubs) >= 7
      AND (SELECT COUNT(*) FROM catalog_parts) >= 20
    THEN '✅ ALL CHECKS PASSED - DEPLOYMENT SUCCESSFUL'
    ELSE '❌ SOME CHECKS FAILED - REVIEW RESULTS ABOVE'
  END as result;

-- =============================================================================
-- EXPECTED OUTPUT SUMMARY
-- =============================================================================
-- 
-- Tables: 16 (profiles, conversations, messages, catalog_materials, 
--             catalog_finishes, catalog_parts, hubs, projects, 
--             project_shares, workspaces, quotes, jobs, orders, 
--             payments, user_stats, activity_logs)
-- 
-- Enums: 11 (subscription_tier, subscription_status, currency_code,
--            quote_status, job_status, payment_status, order_status,
--            project_status, privacy_level, activity_action, message_role)
-- 
-- Materials: 15 (Aluminum 6061-T6, Aluminum 7075-T6, Stainless Steel 304,
--                Stainless Steel 316, Mild Steel, Titanium Grade 5, Brass,
--                Copper, ABS, PLA, PETG, Nylon (PA12), Polycarbonate,
--                Plywood, MDF)
-- 
-- Finishes: 12 (Raw/As-Machined, Bead Blasted, Anodized - Clear,
--               Anodized - Black, Powder Coat - Standard Colors,
--               Powder Coat - Custom Colors, Zinc Plating, Chrome Plating,
--               Nickel Plating, Electropolishing, Painting - Standard,
--               Painting - Custom)
-- 
-- Hubs: 7 (TechHub Lagos, MakerSpace Los Angeles, ProtoLab NYC,
--          DigitalForge London, PrecisionWorks Mumbai,
--          InnovateLab Toronto, FabLab Singapore)
-- 
-- Parts: 20+ (various categories: brackets, gears, enclosures, adapters, etc.)
-- 
-- RLS Policies: Multiple policies for all user-facing tables
-- Indexes: Multiple indexes for performance optimization
-- Triggers: Updated_at, auto-profile, auto-stats, conversation-leaf
-- Functions: Pricing calculation, order number generation, etc.
-- Views: user_dashboard, active_jobs, hub_performance, popular_parts
-- 
-- =============================================================================

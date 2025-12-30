# Qutlas Platform Database Schema

This document describes the complete database schema for the Qutlas platform, including all tables, relationships, RLS policies, triggers, functions, and seed data.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Enum Types](#enum-types)
3. [Core Tables](#core-tables)
4. [Catalog Tables](#catalog-tables)
5. [Business Tables](#business-tables)
6. [Utility Tables](#utility-tables)
7. [Relationships](#relationships)
8. [Row Level Security](#row-level-security)
9. [Triggers and Functions](#triggers-and-functions)
10. [Stored Procedures](#stored-procedures)
11. [Views](#views)
12. [Seed Data](#seed-data)
13. [Deployment](#deployment)

---

## Architecture Overview

The schema is organized into logical groups:

- **Core Tables**: User profiles, authentication, and basic entities
- **Catalog Tables**: Materials, finishes, parts, and manufacturing hubs
- **Business Tables**: Quotes, jobs, orders, and payments
- **Utility Tables**: Activity logs, user stats, and workspace data

---

## Enum Types

| Enum | Values |
|------|--------|
| `subscription_tier` | `free`, `pro`, `enterprise` |
| `subscription_status` | `active`, `inactive`, `cancelled`, `past_due`, `trial` |
| `currency_code` | `NGN`, `USD`, `EUR`, `GBP`, `CAD` |
| `quote_status` | `pending`, `approved`, `expired`, `converted` |
| `job_status` | `pending`, `processing`, `in_production`, `quality_check`, `shipped`, `completed`, `cancelled`, `on_hold` |
| `payment_status` | `pending`, `processing`, `completed`, `failed`, `refunded`, `disputed` |
| `order_status` | `draft`, `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded` |
| `project_status` | `active`, `archived`, `deleted` |
| `privacy_level` | `private`, `shared`, `public` |
| `activity_action` | `create`, `update`, `delete`, `view`, `export`, `share` |
| `message_role` | `user`, `assistant`, `system` |

---

## Core Tables

### `profiles`

Extended user information with subscription and preferences.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, FK to auth.users |
| `user_id` | UUID | FK to auth.users (unique) |
| `full_name` | TEXT | User's full name |
| `company` | TEXT | Company name |
| `phone` | TEXT | Phone number |
| `avatar_url` | TEXT | Profile picture URL |
| `subscription_tier` | subscription_tier | Subscription level |
| `subscription_status` | subscription_status | Subscription status |
| `currency_preference` | currency_code | Preferred currency |
| `stripe_customer_id` | TEXT | Stripe customer ID |
| `metadata` | JSONB | Additional metadata |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `conversations`

AI chat conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `title` | TEXT | Conversation title |
| `current_message_leaf_id` | UUID | Last message ID |
| `is_pinned` | BOOLEAN | Pinned status |
| `tags` | TEXT[] | Conversation tags |
| `metadata` | JSONB | Additional metadata |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `messages`

Chat messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `conversation_id` | UUID | FK to conversations |
| `role` | message_role | Message author role |
| `content` | JSONB | Message content (structured) |
| `parent_message_id` | UUID | FK to messages (threading) |
| `token_count` | INT | Token usage |
| `model_used` | TEXT | AI model used |
| `metadata` | JSONB | Additional metadata |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

## Catalog Tables

### `catalog_materials`

Material definitions with properties and pricing multipliers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Material name (unique) |
| `category` | TEXT | Material category |
| `description` | TEXT | Description |
| `price_multiplier` | DECIMAL | Price multiplier |
| `density` | DECIMAL | Material density (g/cm³) |
| `properties` | JSONB | Material properties |
| `compatible_processes` | TEXT[] | Supported processes |
| `compatible_finishes` | TEXT[] | Compatible finishes |
| `is_active` | BOOLEAN | Active status |
| `sort_order` | INT | Display sort order |

**Seed Materials**: Aluminum 6061-T6, Aluminum 7075-T6, Steel 1018, Stainless Steel 304, Brass C360, ABS, Nylon PA12, Delrin, Titanium Ti-6Al-4V

### `catalog_finishes`

Finish options with compatibility and pricing.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Finish name (unique) |
| `category` | TEXT | Finish category |
| `description` | TEXT | Description |
| `compatible_materials` | TEXT[] | Compatible materials |
| `price_multiplier` | DECIMAL | Price multiplier |
| `lead_time_days_added` | INT | Additional lead time |
| `properties` | JSONB | Finish properties |
| `is_active` | BOOLEAN | Active status |
| `sort_order` | INT | Display sort order |

**Seed Finishes**: Raw/Unfinished, Powder Coat, Anodize, Hard Anodize, Paint, Electroplate, Polished, Brushed, Nickel Plated, Chrome Plated, Bead Blasted, Passivate

### `catalog_parts`

Product catalog with parameters, materials, and specifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Part name |
| `description` | TEXT | Description |
| `category` | TEXT | Part category |
| `subcategory` | TEXT | Part subcategory |
| `material` | TEXT | Default material |
| `process` | TEXT | Manufacturing process |
| `base_price` | DECIMAL | Base unit price |
| `lead_time` | TEXT | Lead time string |
| `lead_time_days` | INT | Lead time in days |
| `manufacturability` | INT | Manufacturability score |
| `thumbnail` | TEXT | Thumbnail URL |
| `cad_file_path` | TEXT | CAD file path |
| `cad_data` | JSONB | CAD metadata |
| `materials` | JSONB | Available materials with multipliers |
| `parameters` | JSONB | Configurable parameters |
| `specifications` | JSONB | Technical specs |
| `finishes` | JSONB | Available finishes |
| `tags` | TEXT[] | Search tags |
| `is_active` | BOOLEAN | Active status |
| `is_featured` | BOOLEAN | Featured status |
| `view_count` | INT | View counter |
| `sort_order` | INT | Display sort order |

**Categories**: Brackets, Fasteners, Enclosures, Shafts, Gears, Connectors, Spacers, Plates

### `hubs`

Manufacturing hubs with capabilities and location.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Hub name |
| `location` | JSONB | Location (city, country, lat, lng) |
| `address` | TEXT | Physical address |
| `capabilities` | TEXT[] | Manufacturing capabilities |
| `materials` | TEXT[] | Available materials |
| `processes` | TEXT[] | Manufacturing processes |
| `rating` | DECIMAL | Average rating (0-5) |
| `rating_count` | INT | Number of ratings |
| `completed_jobs` | INT | Completed jobs count |
| `avg_lead_time` | DECIMAL | Average lead time |
| `current_load` | DECIMAL | Current capacity usage |
| `base_price` | DECIMAL | Base processing price |
| `minimum_order` | DECIMAL | Minimum order value |
| `certified` | BOOLEAN | Certification status |
| `certification_ids` | TEXT[] | Certification IDs |
| `contact_email` | TEXT | Contact email |
| `contact_phone` | TEXT | Contact phone |
| `operating_hours` | JSONB | Operating hours |
| `is_active` | BOOLEAN | Active status |
| `is_featured` | BOOLEAN | Featured status |
| `metadata` | JSONB | Additional metadata |

**Seed Hubs**: TechHub LA, MechPrecision Toronto, FastCut NYC, EuroTech Berlin, AsiaFab Shenzhen, PrecisionPro Munich, QuickCut Dallas

---

## Business Tables

### `quotes`

Part quotes with pricing calculations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `part_id` | UUID | FK to catalog_parts |
| `user_id` | UUID | FK to auth.users |
| `project_id` | UUID | FK to projects |
| `quantity` | INT | Order quantity |
| `material` | TEXT | Selected material |
| `finish` | TEXT | Selected finish |
| `parameters` | JSONB | Configured parameters |
| `base_price` | DECIMAL | Part base price |
| `material_multiplier` | DECIMAL | Material multiplier |
| `finish_multiplier` | DECIMAL | Finish multiplier |
| `volume_discount` | DECIMAL | Volume discount |
| `hub_price` | DECIMAL | Hub processing fee |
| `platform_fee` | DECIMAL | Platform fee (15%) |
| `unit_price` | DECIMAL | Calculated unit price |
| `subtotal` | DECIMAL | Subtotal |
| `total_price` | DECIMAL | Total price |
| `lead_time_days` | INT | Estimated lead time |
| `manufacturability` | INT | Manufacturability score |
| `status` | quote_status | Quote status |
| `expires_at` | TIMESTAMPTZ | Expiration timestamp |
| `hub_id` | UUID | FK to hubs |
| `notes` | TEXT | Customer notes |
| `metadata` | JSONB | Additional metadata |

### `jobs`

Manufacturing jobs/orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `part_id` | UUID | FK to catalog_parts |
| `quote_id` | UUID | FK to quotes |
| `hub_id` | UUID | FK to hubs |
| `order_id` | UUID | FK to orders |
| `quantity` | INT | Order quantity |
| `material` | TEXT | Selected material |
| `finish` | TEXT | Selected finish |
| `parameters` | JSONB | Configured parameters |
| `total_price` | DECIMAL | Total job price |
| `status` | job_status | Job status |
| `priority` | INT | Priority (0=normal) |
| `timeline` | JSONB | Status timeline events |
| `tracking_number` | TEXT | Shipping tracking |
| `tracking_url` | TEXT | Tracking URL |
| `estimated_completion` | TIMESTAMPTZ | Estimated completion |
| `actual_start_date` | TIMESTAMPTZ | Production start |
| `payment_date` | TIMESTAMPTZ | Payment timestamp |
| `completed_date` | TIMESTAMPTZ | Completion timestamp |
| `shipped_date` | TIMESTAMPTZ | Shipping timestamp |
| `notes` | TEXT | Customer notes |
| `internal_notes` | TEXT | Internal notes |
| `metadata` | JSONB | Additional metadata |

### `orders`

Customer orders (aggregates jobs).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `order_number` | TEXT | Unique order number |
| `status` | order_status | Order status |
| `total_amount` | DECIMAL | Order total |
| `currency` | currency_code | Currency code |
| `shipping_address` | JSONB | Shipping address |
| `billing_address` | JSONB | Billing address |
| `shipping_method` | TEXT | Shipping method |
| `shipping_cost` | DECIMAL | Shipping cost |
| `tax_amount` | DECIMAL | Tax amount |
| `discount_amount` | DECIMAL | Discount amount |
| `notes` | TEXT | Order notes |
| `metadata` | JSONB | Additional metadata |
| `confirmed_at` | TIMESTAMPTZ | Confirmation timestamp |
| `shipped_at` | TIMESTAMPTZ | Shipping timestamp |
| `delivered_at` | TIMESTAMPTZ | Delivery timestamp |
| `cancelled_at` | TIMESTAMPTZ | Cancellation timestamp |

### `payments`

Payment records for jobs and orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `job_id` | UUID | FK to jobs |
| `order_id` | UUID | FK to orders |
| `user_id` | UUID | FK to auth.users |
| `tx_ref` | TEXT | Unique transaction ref |
| `flutterwave_id` | TEXT | Flutterwave ID |
| `amount` | DECIMAL | Payment amount |
| `currency` | currency_code | Currency |
| `status` | payment_status | Payment status |
| `payment_method` | TEXT | Payment method |
| `customer_email` | TEXT | Customer email |
| `customer_name` | TEXT | Customer name |
| `customer_phone` | TEXT | Customer phone |
| `transaction_id` | TEXT | Transaction ID |
| `transaction_data` | JSONB | Transaction details |
| `verification_data` | JSONB | Verification data |
| `verified_at` | TIMESTAMPTZ | Verification timestamp |
| `refunded_at` | TIMESTAMPTZ | Refund timestamp |
| `refund_reason` | TEXT | Refund reason |
| `failure_reason` | TEXT | Failure reason |

---

## Utility Tables

### `projects`

User design projects.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `name` | TEXT | Project name |
| `description` | TEXT | Description |
| `thumbnail` | TEXT | Thumbnail URL |
| `workspace_data` | JSONB | Canvas state data |
| `status` | project_status | Project status |
| `privacy` | privacy_level | Privacy level |
| `is_template` | BOOLEAN | Template flag |
| `tags` | TEXT[] | Project tags |
| `version` | INT | Version number |
| `parent_project_id` | UUID | FK to projects |
| `metadata` | JSONB | Additional metadata |

### `project_shares`

Project sharing permissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `shared_with` | UUID | FK to auth.users |
| `permission` | TEXT | Permission level |
| `can_edit` | BOOLEAN | Edit permission |
| `can_share` | BOOLEAN | Share permission |
| `expires_at` | TIMESTAMPTZ | Expiration |
| `shared_by` | UUID | FK to auth.users |

### `workspaces`

Workspace saves and versions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `project_id` | UUID | FK to projects |
| `name` | TEXT | Workspace name |
| `description` | TEXT | Description |
| `data` | JSONB | Full workspace state |
| `is_published` | BOOLEAN | Published status |
| `published_at` | TIMESTAMPTZ | Publish timestamp |
| `is_auto_save` | BOOLEAN | Auto-save flag |
| `version` | INT | Version number |
| `parent_workspace_id` | UUID | FK to workspaces |
| `tags` | TEXT[] | Workspace tags |
| `metadata` | JSONB | Additional metadata |

### `user_stats`

User activity statistics.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | PK, FK to auth.users |
| `total_projects` | INT | Total projects |
| `total_conversations` | INT | Total conversations |
| `total_messages` | INT | Total messages |
| `total_jobs` | INT | Total jobs |
| `total_completed_jobs` | INT | Completed jobs |
| `total_quotes` | INT | Total quotes |
| `total_orders` | INT | Total orders |
| `total_spent` | DECIMAL | Total spending |
| `total_spent_currencies` | JSONB | Spending by currency |
| `average_job_value` | DECIMAL | Average job value |
| `favorite_material` | TEXT | Most used material |
| `favorite_finish` | TEXT | Most used finish |
| `last_activity` | TIMESTAMPTZ | Last activity |

### `activity_logs`

Audit trail for all user actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `action` | activity_action | Action type |
| `entity_type` | TEXT | Entity type |
| `entity_id` | UUID | Entity ID |
| `entity_name` | TEXT | Entity name |
| `changes` | JSONB | Changed fields |
| `old_data` | JSONB | Old values |
| `new_data` | JSONB | New values |
| `ip_address` | INET | IP address |
| `user_agent` | TEXT | User agent |
| `metadata` | JSONB | Additional metadata |

---

## Relationships

```
auth.users
  └── profiles (1:1)
  └── conversations (1:N)
      └── messages (1:N)
  └── projects (1:N)
      └── project_shares (1:N)
      └── workspaces (1:N)
  └── quotes (1:N)
  └── jobs (1:N)
  └── orders (1:N)
  └── payments (1:N)
  └── user_stats (1:1)

catalog_parts (1:N)
  └── quotes (1:N)
  └── jobs (1:N)

hubs (1:N)
  └── quotes (1:N)
  └── jobs (1:N)

catalog_materials (1:N)
  └── catalog_finishes (1:N)
```

---

## Row Level Security

All tables have RLS enabled with appropriate policies:

### Profile Policies
- Users can view all profiles (for team features)
- Users can insert/update their own profile
- Enterprise users can manage all profiles

### Conversation/Message Policies
- Users can manage their own conversations/messages
- Service role can access all

### Catalog Policies
- Anyone can view active materials, finishes, parts, hubs
- Only admins can modify catalog items

### Business Policies
- Users can view/create/manage their own quotes, jobs, orders, payments
- Admins can access all business data

### Project Policies
- Users can view own projects (including shared/public)
- Users can create/update/delete their own projects
- Shared project collaborators have appropriate permissions

---

## Triggers and Functions

### Automatic Timestamp Updates
All tables with `updated_at` have triggers that auto-update the timestamp.

### Auto-Profile Creation
Trigger creates profile when user signs up via auth.users.

### Auto-User Stats Creation
Trigger creates user_stats when profile is created.

### Conversation Leaf Update
Trigger updates `current_message_leaf_id` when new message is inserted.

### User Stats Updates
Triggers auto-update user_stats when projects, conversations, jobs, quotes, orders, or payments are modified.

---

## Stored Procedures

### `calculate_quote_price()`
Calculates quote pricing with material/finish multipliers and volume discounts.

```sql
SELECT calculate_quote_price(
  p_base_price := 32.00,
  p_quantity := 10,
  p_material_multiplier := 1.0,
  p_finish_multiplier := 1.15,
  p_hub_base_price := 30.00
);
-- Returns: {subtotal, volume_discount, unit_price, platform_fee, hub_base_price, total}
```

### `generate_order_number()`
Generates unique order number (format: ORD-YYYYMMDD-XXXXX).

### `generate_tx_ref()`
Generates unique transaction reference for payments.

### `log_activity()`
Logs user activity for audit trail.

---

## Views

### `user_dashboard`
Aggregated user statistics for dashboard.

### `active_jobs`
Jobs currently in progress with hub and part details.

### `hub_performance`
Hub performance metrics including active jobs and avg values.

### `popular_parts`
Most ordered and viewed catalog parts.

---

## Seed Data

### Materials (15 types)
Metals: Aluminum 6061-T6, Aluminum 7075-T6, Steel 1018, Stainless Steel 304/316, Brass C360, Copper C110, Titanium Ti-6Al-4V

Plastics: ABS, Nylon PA12, Delrin, PETG, Carbon Fiber

Wood: Birch Plywood

### Finishes (12 types)
Raw, Powder Coat, Anodize, Hard Anodize, Paint, Electroplate, Polished, Brushed, Nickel Plated, Chrome Plated, Bead Blasted, Passivate

### Hubs (7 hubs)
TechHub LA, MechPrecision Toronto, FastCut NYC, EuroTech Berlin, AsiaFab Shenzhen, PrecisionPro Munich, QuickCut Dallas

### Catalog Parts (20+ parts)
Brackets, Fasteners, Enclosures, Shafts, Gears, Connectors, Spacers, Plates

---

## Deployment

### Apply Schema
```bash
# Stop Supabase
supabase stop

# Generate migration (first time only)
supabase db diff -f complete_schema

# Apply migration
supabase start && supabase migration up

# Update TypeScript types
supabase gen types typescript --local > shared/database.ts
```

### Production Deployment
```bash
# Generate production migration
supabase db diff -f complete_schema --schema public

# Review migration file
# Apply via Supabase CLI or dashboard
```

---

## Testing Checklist

- [ ] All tables created with correct column types
- [ ] Primary keys and foreign keys validated
- [ ] RLS policies allow/deny correctly
- [ ] Indexes created on all filter/sort columns
- [ ] Triggers fire on insert/update
- [ ] Seed data loaded successfully
- [ ] Relationships work correctly
- [ ] Statistics tables update properly
- [ ] Audit logs capture all changes
- [ ] Views return expected data
- [ ] Stored procedures execute without errors

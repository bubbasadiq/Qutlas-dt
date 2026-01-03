# ✅ QUTLAS Platform - Deployment Checklist

**Use this checklist to track your deployment progress.**

---

## 📦 Pre-Deployment Preparation

### Files & Documentation
- [x] `complete_schema.sql` ready (1,683 lines)
- [x] `DEPLOYMENT_GUIDE.md` created
- [x] `DEPLOYMENT_REPORT.md` created
- [x] `VERIFY_SCHEMA.sql` created
- [x] `QUICK_START.md` created
- [x] `.env.example` created
- [x] `test-wasm-load.mjs` created
- [x] README.md updated

### Code Verification
- [x] Dependencies installed (`pnpm install`)
- [x] Production build succeeds (`pnpm build`)
- [x] Dev server starts (`pnpm dev`)
- [x] WASM files present and verified
- [x] No critical errors in build

---

## 🗄️ Part 1: Supabase Database Deployment

### Schema Deployment
- [ ] Opened Supabase Console (https://supabase.com/dashboard)
- [ ] Selected correct project: `cqnbahdlbnajggllptzu`
- [ ] Opened SQL Editor
- [ ] Copied `supabase/schemas/complete_schema.sql` (all 1,683 lines)
- [ ] Pasted into SQL Editor
- [ ] Executed successfully
- [ ] No errors in execution

### Verification Queries
Run these in SQL Editor to verify:

```sql
-- Should return 16
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Should return 15
SELECT COUNT(*) FROM catalog_materials WHERE is_active = true;

-- Should return 12
SELECT COUNT(*) FROM catalog_finishes WHERE is_active = true;

-- Should return 7
SELECT COUNT(*) FROM hubs WHERE is_active = true;

-- Should return 20+
SELECT COUNT(*) FROM catalog_parts WHERE is_active = true;
```

- [ ] 16 tables exist
- [ ] 15 materials loaded
- [ ] 12 finishes loaded
- [ ] 7 hubs loaded
- [ ] 20+ parts loaded

### Optional: Full Verification
- [ ] Ran all queries in `VERIFY_SCHEMA.sql`
- [ ] All checks passed

---

## 🔧 Part 2: Environment Configuration

### Environment File
- [ ] `.env.local` exists in project root
- [ ] File is in `.gitignore` (not committed)

### Required Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set to your Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set to your anon key
- [ ] `SUPABASE_S3_ENDPOINT` - Storage endpoint configured
- [ ] `SUPABASE_S3_REGION` - Region set
- [ ] `SUPABASE_S3_ACCESS_KEY_ID` - S3 access key set
- [ ] `SUPABASE_S3_SECRET_ACCESS_KEY` - S3 secret set
- [ ] `NEXT_PUBLIC_APP_URL` - Set to deployment URL

### Optional Variables (Update if using features)
- [ ] `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` - For payments
- [ ] `FLUTTERWAVE_SECRET_KEY` - For payment processing
- [ ] `DEEPSEEK_API_KEY` - For AI geometry generation

**Note:** System works without optional keys, but features will be limited.

---

## 🔨 Part 3: WASM Verification

### Files Check
- [ ] `wasm/cadmium-core/pkg/cadmium_core_bg.wasm` exists (79.54 KB)
- [ ] `wasm/cadmium-core/pkg/cadmium_core.js` exists
- [ ] `wasm/cadmium-core/pkg/index.ts` exists

### Configuration Check
- [ ] `next.config.mjs` has WASM loader configured
- [ ] `workers/cadmium-worker.ts` imports WASM correctly

### Test Script
- [ ] Ran `node test-wasm-load.mjs`
- [ ] All 4 tests passed

---

## 🏗️ Part 4: Build & Deploy

### Build Process
- [ ] Ran `pnpm install` - no errors
- [ ] Ran `pnpm build` - build succeeded
- [ ] Build output shows 34 routes
- [ ] No critical errors (warnings OK)

### Local Testing
- [ ] Ran `pnpm dev`
- [ ] Server started successfully
- [ ] No startup errors
- [ ] Can access http://localhost:3000

---

## 🧪 Part 5: Functional Testing

### Test 1: Authentication
- [ ] Opened http://localhost:3000
- [ ] Clicked "Sign Up"
- [ ] Created test account
- [ ] Verified user in Supabase → Authentication → Users
- [ ] Checked profile auto-created:
  ```sql
  SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Checked user_stats auto-created:
  ```sql
  SELECT * FROM user_stats ORDER BY created_at DESC LIMIT 1;
  ```

**Result:** ✅ / ❌

---

### Test 2: WASM Geometry Generation
- [ ] Opened http://localhost:3000/studio
- [ ] Opened browser console (F12)
- [ ] Typed: "create a cube 100mm on each side"
- [ ] Saw console message: "✅ Cadmium WASM module loaded"
- [ ] Saw console message: "✅ Cadmium Worker ready"
- [ ] Geometry appeared on canvas
- [ ] Can rotate/zoom the view
- [ ] Object appears in scene tree

**Result:** ✅ / ❌

**If WASM failed:** Check if fallback loaded (console shows JavaScript fallback message)

---

### Test 3: Catalog Display
- [ ] Opened http://localhost:3000/catalog
- [ ] Materials display (15 total)
- [ ] Finishes display (12 total)
- [ ] Parts display (20+ total)
- [ ] Can filter by category
- [ ] Can search parts
- [ ] Prices display correctly

**Result:** ✅ / ❌

---

### Test 4: Quote Creation
- [ ] Selected a part from catalog
- [ ] Clicked "Get Quote"
- [ ] Selected material
- [ ] Selected finish
- [ ] Entered quantity: 10
- [ ] Selected manufacturing hub
- [ ] Price calculated correctly
- [ ] Clicked "Save Quote"
- [ ] Quote saved to database:
  ```sql
  SELECT * FROM quotes ORDER BY created_at DESC LIMIT 1;
  ```

**Result:** ✅ / ❌

---

### Test 5: Manufacturing Hubs
- [ ] Viewed available hubs in quote page
- [ ] 7 hubs displayed
- [ ] Each shows: location, rating, capabilities
- [ ] Lead time estimates shown
- [ ] Can select different hubs
- [ ] Pricing updates by hub

**Result:** ✅ / ❌

---

### Test 6: Order Creation
- [ ] Created quote (from Test 4)
- [ ] Clicked "Proceed to Order"
- [ ] Reviewed order details
- [ ] Clicked "Create Order"
- [ ] Order number generated (ORD-20250203-XXXXX)
- [ ] Order saved:
  ```sql
  SELECT order_number, status, total_amount FROM orders ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Job created:
  ```sql
  SELECT id, status, hub_id FROM jobs ORDER BY created_at DESC LIMIT 1;
  ```

**Result:** ✅ / ❌

---

### Test 7: Payment Flow (Optional - Requires API Keys)
- [ ] Flutterwave keys configured in `.env.local`
- [ ] Clicked "Proceed to Payment" from order
- [ ] Payment page loaded
- [ ] Transaction reference generated (TXN-20250203-XXXXX)
- [ ] Payment record created:
  ```sql
  SELECT transaction_reference, payment_status, amount FROM payments ORDER BY created_at DESC LIMIT 1;
  ```

**Result:** ✅ / ❌ / ⏸️ Skipped (no API keys)

---

### Test 8: Workspace Persistence
- [ ] In studio, created multiple shapes
- [ ] Applied materials/colors
- [ ] Clicked "Save"
- [ ] Entered workspace name
- [ ] Workspace saved
- [ ] Refreshed browser
- [ ] Clicked "Load Workspace"
- [ ] Selected saved workspace
- [ ] All geometry restored
- [ ] Materials/colors preserved

**Result:** ✅ / ❌

---

## 🎯 Part 6: Production Deployment (Optional)

### Pre-Production
- [ ] All functional tests passed
- [ ] API keys updated to production values
- [ ] `.env.local` has production URLs
- [ ] Database backed up
- [ ] Schema applied to production Supabase

### Build for Production
- [ ] Set `NODE_ENV=production`
- [ ] Ran `pnpm build`
- [ ] No errors in production build
- [ ] Assets optimized

### Deploy to Hosting
- [ ] Deployed to Vercel/Netlify/other
- [ ] Environment variables configured in hosting platform
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Post-Deployment
- [ ] Production URL accessible
- [ ] Ran smoke tests on production
- [ ] Authentication works
- [ ] WASM loads correctly
- [ ] No console errors
- [ ] Performance acceptable

---

## 📊 Final Status

### Overall Deployment Status
- [ ] ✅ All critical tests passed
- [ ] ✅ Ready for production use

### Components Status
- Database: ✅ / ❌
- Environment: ✅ / ❌
- WASM: ✅ / ❌
- Build: ✅ / ❌
- Auth: ✅ / ❌
- Geometry: ✅ / ❌
- Catalog: ✅ / ❌
- Quotes: ✅ / ❌
- Orders: ✅ / ❌
- Payments: ✅ / ❌ / ⏸️
- Persistence: ✅ / ❌

---

## 🐛 Issues Encountered

### Issue 1:
**Description:**
**Resolution:**
**Status:**

### Issue 2:
**Description:**
**Resolution:**
**Status:**

### Issue 3:
**Description:**
**Resolution:**
**Status:**

---

## 📝 Notes

**Deployment Date:**

**Deployed By:**

**Environment:**
- [ ] Local Development
- [ ] Staging
- [ ] Production

**Database:**
- Project ID: `cqnbahdlbnajggllptzu`
- Region: `eu-west-2`

**Additional Notes:**

---

## 📞 Support & Resources

### Documentation
- Quick Start: `QUICK_START.md`
- Full Guide: `DEPLOYMENT_GUIDE.md`
- Status Report: `DEPLOYMENT_REPORT.md`
- Verification: `VERIFY_SCHEMA.sql`

### Commands Reference
```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# WASM test
node test-wasm-load.mjs
```

### URLs
- Local: http://localhost:3000
- Supabase Console: https://supabase.com/dashboard
- Project: https://supabase.com/dashboard/project/cqnbahdlbnajggllptzu

---

**Checklist Version:** 1.0.0  
**Last Updated:** 2025-02-03

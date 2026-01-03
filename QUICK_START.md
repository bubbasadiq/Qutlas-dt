# 🚀 QUTLAS Platform - Quick Start

## ⚡ 60-Second Deploy

### Step 1: Deploy Database (2 minutes)
1. Go to https://supabase.com/dashboard
2. Select project: `cqnbahdlbnajggllptzu`
3. Click **SQL Editor** → **New query**
4. Open `supabase/schemas/complete_schema.sql`
5. Copy all 1,683 lines
6. Paste and click **Run**

**Verify:**
```sql
SELECT COUNT(*) FROM catalog_materials; -- Should return 15
SELECT COUNT(*) FROM catalog_finishes;  -- Should return 12
SELECT COUNT(*) FROM hubs;              -- Should return 7
SELECT COUNT(*) FROM catalog_parts;     -- Should return 20+
```

---

### Step 2: Start Application (1 minute)
```bash
cd /home/engine/project
pnpm dev
```

**Open:** http://localhost:3000

---

### Step 3: Test (2 minutes)

**Test Auth:**
1. Click "Sign Up"
2. Email: `test@example.com`
3. Password: `TestPassword123!`

**Test WASM:**
1. Go to http://localhost:3000/studio
2. Open browser console (F12)
3. Type: "create a cube 100mm"
4. See: ✅ Geometry appears on canvas

**Test Catalog:**
1. Go to http://localhost:3000/catalog
2. Verify materials, finishes, parts display

---

## 🔑 Optional: Update API Keys

**Edit `.env.local`:**
```bash
# For payments (optional for testing)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your-key-here
FLUTTERWAVE_SECRET_KEY=your-secret-here

# For AI geometry (optional, has fallback)
DEEPSEEK_API_KEY=your-key-here
```

**Restart after changes:**
```bash
# Press Ctrl+C in terminal
pnpm dev
```

---

## ✅ Success Checklist

- [ ] Database schema deployed (16 tables)
- [ ] Seed data loaded (materials, finishes, hubs, parts)
- [ ] Dev server running at http://localhost:3000
- [ ] User can sign up
- [ ] Studio loads and shows canvas
- [ ] Catalog displays materials/parts
- [ ] WASM loads (check console for "✅ Cadmium WASM module loaded")

---

## 🐛 Common Issues

### "Module not found" errors
```bash
pnpm install
pnpm build
```

### Database connection errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Check Supabase project is running at dashboard

### WASM doesn't load
- Check browser console for errors
- WASM will auto-fallback to JavaScript (slower but works)
- Ensure `wasm/cadmium-core/pkg/cadmium_core_bg.wasm` exists

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
pnpm dev
```

---

## 📚 Full Documentation

- **Complete Guide:** `DEPLOYMENT_GUIDE.md`
- **Status Report:** `DEPLOYMENT_REPORT.md`
- **Verification:** `VERIFY_SCHEMA.sql`
- **WASM Test:** `test-wasm-load.mjs`

---

## 🎯 What Works Out of the Box

✅ User authentication (Supabase Auth)  
✅ WASM geometry generation  
✅ Three.js 3D canvas  
✅ Catalog with materials/finishes/parts  
✅ Quote calculation with pricing  
✅ Manufacturing hub selection  
✅ Job/order creation  
✅ Workspace save/load  
✅ API routes for all features  

---

## 🔧 Development Commands

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

# Build WASM (if needed)
pnpm build:wasm
```

---

## 🌐 URLs

- **Local Dev:** http://localhost:3000
- **Studio:** http://localhost:3000/studio
- **Catalog:** http://localhost:3000/catalog
- **Dashboard:** http://localhost:3000/dashboard
- **Supabase Console:** https://supabase.com/dashboard

---

## 🎉 You're Ready!

If all steps passed, your QUTLAS platform is fully deployed and running.

**Next:** Explore the studio, create some geometry, and build your first CAD model!

---

**Questions?** Check `DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

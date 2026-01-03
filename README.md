# Qutlas

Browser-first CAD/CAM studio for designing, validating, and ordering parts from micro-manufacturing hubs.

## What this repo contains

- **Next.js (App Router)** frontend (React 19 + TypeScript)
- **Studio**: Figma-like 3-column workspace with a WebGL 3D canvas
- **Auth & Storage**: Supabase
- **Payments**: Flutterwave (**NGN-only**)
- **Geometry**: Three.js rendering + Cadmium worker execution engine
- **Intent Bridge**: Deterministic geometry kernel (Rust/WASM) - NEW! 🎉

## 🚀 Quick Start

**New to the project?** See **[QUICK_START.md](QUICK_START.md)** for 60-second deployment.

**Full deployment?** See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for comprehensive instructions.

### Prerequisites

1. **Node.js 18+** and **pnpm**
2. **Supabase account** (free tier works)
3. **API Keys** (optional for testing):
   - Flutterwave (for payments)
   - DeepSeek (for AI geometry)

### Install

```bash
pnpm install
```

### Deploy Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Execute `supabase/schemas/complete_schema.sql`

See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Part 1 for details.

### Configure Environment

Copy `.env.example` to `.env.local` and update with your credentials:

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL, keys, etc.
```

### Run the app

```bash
pnpm dev
```

Open http://localhost:3000

### Typecheck / lint

```bash
pnpm typecheck
pnpm lint
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[QUICK_START.md](QUICK_START.md)** | 60-second deployment guide |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Complete deployment walkthrough |
| **[DEPLOYMENT_REPORT.md](DEPLOYMENT_REPORT.md)** | Current deployment status |
| **[VERIFY_SCHEMA.sql](VERIFY_SCHEMA.sql)** | Database verification queries |
| **.env.example** | Environment variables template |

## Supabase Setup

### Option 1: Remote (Production)

Execute the schema in Supabase Console:

1. Go to https://supabase.com/dashboard
2. Select your project
3. SQL Editor → New query
4. Paste contents of `supabase/schemas/complete_schema.sql`
5. Run

**Verify:** Run queries in `VERIFY_SCHEMA.sql`

### Option 2: Local (Development)

```bash
npx supabase start
```

This starts a local Supabase instance with PostgreSQL, Auth, Storage, etc.

## Building WASM Modules (Required for Geometry Features)

The geometry features require WASM modules to be built from Rust source.

### Prerequisites
1. Install Rust: https://rustup.rs/
2. Install wasm-pack: `cargo install wasm-pack`
3. Add WASM target: `rustup target add wasm32-unknown-unknown`

### Build Commands

```bash
# Build all WASM modules
npm run build:wasm

# Or build individually
npm run build:wasm:cadmium    # Cadmium Core (geometry primitives)
npm run build:wasm:kernel     # Geometry Kernel (intent compiler)
```

**Note**: `cadmium-core` is already built. `geometry-kernel` needs to be built.

See `wasm/BUILD.md` for detailed instructions.

## License

See `LICENSE`.

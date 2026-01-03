# Qutlas

Browser-first CAD/CAM studio for designing, validating, and ordering parts from micro-manufacturing hubs.

## What this repo contains

- **Next.js (App Router)** frontend (React 19 + TypeScript)
- **Studio**: Figma-like 3-column workspace with a WebGL 3D canvas
- **Auth & Storage**: Supabase
- **Payments**: Flutterwave (**NGN-only**)
- **Geometry**: Three.js rendering + Cadmium worker execution engine
- **Intent Bridge**: Deterministic geometry kernel (Rust/WASM) - NEW! 🎉

## Local development

### Install

```bash
pnpm install
```

### Run the app

```bash
pnpm dev
```

### Typecheck / lint

```bash
pnpm typecheck
pnpm lint
```

## Supabase (optional for full functionality)

This repo includes a local Supabase setup under `supabase/`.

```bash
npx supabase start
```

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

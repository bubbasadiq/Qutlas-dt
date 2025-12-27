# Qutlas

Browser-first CAD/CAM studio for designing, validating, and ordering parts from micro-manufacturing hubs.

## What this repo contains

- **Next.js (App Router)** frontend (React 19 + TypeScript)
- **Studio**: Figma-like 3-column workspace with a WebGL 3D canvas
- **Auth & Storage**: Supabase
- **Payments**: Flutterwave (**NGN-only**)
- **Geometry**: Three.js rendering + Cadmium worker execution engine

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

## Key docs

- `AI_GEOMETRY_SYSTEM.md`
- `PRODUCTION_HARDENING.md`
- `docs/CSG_IMPLEMENTATION.md`
- `docs/TOOLPATH_FEATURE.md`

## License

See `LICENSE`.

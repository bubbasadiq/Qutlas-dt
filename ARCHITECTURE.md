# Qutlas Architecture

## Frontend

- **Framework**: Next.js (App Router)
- **UI**: Tailwind CSS + shadcn/ui (Radix)
- **3D**: Three.js

### Route structure

- `app/(marketing)/*`: marketing pages (no workspace provider)
- `app/(app)/*`: authenticated application pages
  - `app/(app)/studio`: CAD/CAM studio

### Providers (critical)

- Global providers live in `app/layout.tsx`.
- The **WorkspaceProvider** is mounted only in the app layout (`app/(app)/layout.tsx`).

## Geometry

- `lib/geometry/execution-engine.ts`: orchestrates the Cadmium worker.
- `workers/cadmium-worker.ts`: WebWorker entry for mesh execution.

## Storage

- Supabase is used for auth + storage utilities.

## Payments

- Flutterwave integration.
- **NGN-only** pricing and payment flows.

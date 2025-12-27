# Development

## Requirements

- Node.js 20+
- pnpm
- (Optional) Supabase CLI for local backend

## Install

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

## Quality checks

```bash
pnpm typecheck
pnpm lint
```

## Supabase (optional)

```bash
npx supabase start
```

## Performance profiling (Studio)

- Use Chrome DevTools Performance panel.
- Watch for:
  - long tasks during selection
  - increased GPU activity while idle
  - memory growth while selecting/deselecting objects repeatedly

CanvasViewer uses idle rendering; if you see constant GPU activity at rest, check `requestRender()` call sites.

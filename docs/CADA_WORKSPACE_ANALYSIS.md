# CADA Workspace Analysis (Extractable Insights)

> Note: The merged CADA/Vite workspace layer has been removed from this repo as part of the
> “single Next.js build system” cleanup. This document captures the *actionable* patterns
> observed during audit (primarily around rendering quality and responsiveness).

## Observed rendering approach

- **React Three Fiber** (`@react-three/fiber`) with Drei helpers.
- Canvas automatically handles:
  - device pixel ratio (DPR)
  - resize-to-container
  - render scheduling

## Key patterns worth extracting into Qutlas

### Performance (High impact)

1. **Automatic resize-to-container**
   - R3F’s `<Canvas />` uses a `ResizeObserver` internally.
   - Qutlas can replicate this to avoid reliance on `window.resize`.

2. **Render scheduling / demand rendering**
   - R3F supports `frameloop="demand"` and invalidation.
   - In raw Three.js, this translates to:
     - render only on camera movement, object changes, or interaction
     - stop the loop when idle

3. **DPR clamping**
   - R3F commonly clamps DPR for mobile to reduce GPU cost.
   - Qutlas can implement adaptive DPR limits.

### UX & Visual feedback (Medium impact)

4. **Camera mode toggles (ortho/perspective)**
   - CADA provides an orthographic/perspective toggle.
   - Qutlas can adopt this later without changing workflow (optional).

5. **Consistent lighting/environment defaults**
   - CADA uses curated lights and an environment to improve perceived quality.
   - Qutlas can improve output color management (sRGB + tone mapping) while keeping
     its brand look.

### Code quality (Medium/Low impact)

6. **Scene composition as isolated components**
   - CADA’s viewer logic is modular.
   - Qutlas can mimic the separation internally (render loop, interaction handling,
     visual feedback helpers) while preserving existing public component APIs.

## Feasibility assessment

| Insight | Impact | Risk | Qutlas implementation site |
|--------|--------|------|----------------------------|
| ResizeObserver-based resizing | High | Low | `canvas-viewer.tsx` |
| Idle / demand rendering | High | Medium | `canvas-viewer.tsx` |
| DPR clamping (mobile) | High | Low | `canvas-viewer.tsx` |
| Ortho/perspective toggle | Medium | Medium | future enhancement |
| sRGB/tone mapping defaults | Medium | Low | `canvas-viewer.tsx` |
| Modularization | Medium | Low | internal refactor |

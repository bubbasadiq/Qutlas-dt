# Workspace Integration Plan (Qutlas + CADA Insights)

## Goals

- Preserve Qutlas product direction, UI, and workflows.
- Integrate only the workspace-level improvements that increase:
  - rendering performance and smoothness
  - selection/picking responsiveness
  - visual clarity (subtle, on-brand)
  - memory stability

## Prioritized improvements

### High-impact improvements (implemented first)

1. **Idle / demand rendering (loop stops when idle)**
   - **What**: Render only on interaction, camera movement, or scene mutations.
   - **Why**: Removes constant GPU work and improves battery + thermals.
   - **Where**: `app/studio/components/canvas-viewer.tsx`.
   - **Gain**: Significant idle power reduction; smoother interaction under load.
   - **Risk**: Medium (must ensure controls + selection still invalidate correctly).

2. **ResizeObserver-based canvas resizing**
   - **What**: Track the mount container size, not the window.
   - **Why**: Fixes incorrect aspect ratio and pixel ratio issues in responsive layouts.
   - **Where**: `canvas-viewer.tsx`.
   - **Gain**: Correct rendering on panel toggles, better perceived quality.
   - **Risk**: Low.

3. **Raycast optimization + robust ID resolution**
   - **What**: Raycast only against pickable meshes; walk parents to resolve `userData.id`.
   - **Why**: Consistent selection, lower interaction latency.
   - **Where**: `canvas-viewer.tsx`.
   - **Gain**: Faster picking in larger scenes.
   - **Risk**: Low.

### Medium-impact improvements

4. **Hover feedback (subtle outline/emissive)**
   - **What**: Add lightweight hover highlight to clarify what will be selected.
   - **Where**: `canvas-viewer.tsx`.
   - **Risk**: Low.

5. **Undo/redo snapshot reliability**
   - **What**: Replace JSON cloning with `structuredClone` to preserve typed arrays.
   - **Where**: `hooks/use-workspace.tsx`.
   - **Risk**: Low.

### Low-impact / Nice-to-have

6. **Primitive geometry caching / material pooling**
   - **What**: Shared geometries for identical primitives.
   - **Where**: `lib/mesh-generator.ts`.
   - **Risk**: Medium (shared disposal needs reference counting).

## Success criteria

- No UI regressions (layout and design tokens unchanged).
- Selection feels instant for typical scenes.
- Canvas stays correctly sized when panels open/close.
- No geometry preview duplicates after AI generation completes.

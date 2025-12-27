# Qutlas Workspace Current State (Audit)

## Scope

Audited core workspace implementation files:

- `app/studio/components/canvas-viewer.tsx`
- `hooks/use-workspace.tsx`
- `lib/mesh-generator.ts`

## 1) Rendering approach (`canvas-viewer.tsx`)

### Current stack

- Raw **Three.js** scene setup (no React Three Fiber)
- `OrbitControls` for camera manipulation
- Continuous `requestAnimationFrame` loop (always renders)

### Scene composition

- `THREE.Scene` + `PerspectiveCamera`
- Directional + ambient lighting
- GridHelper (disabled by default on mobile)

### Mesh lifecycle

- Workspace objects are mapped to `THREE.Mesh` instances via `generateMesh()`.
- Mesh rebuild decision is based on `JSON.stringify(mesh.userData.dimensions)` comparison.
- Selection/feedback is applied via material changes and an `EdgesGeometry` outline.

### Bottlenecks / limitations

1. **Always-on render loop**
   - Renderer runs every frame even when the scene is idle.
   - This wastes GPU/CPU and reduces battery life (especially on laptops/mobile).

2. **Resize handling limited to `window.resize`**
   - The canvas does not respond reliably to container resizes (sidebars/panels).
   - Leads to blurry or stretched rendering in responsive layouts.

3. **Picking raycasts against `scene.children`**
   - Raycaster tests all scene children (lights, grid, helper meshes, etc.).
   - Scales poorly as the scene grows and can introduce interaction latency.

4. **Selection outline memory leaks on mesh removal**
   - The `edgesMesh` child’s geometry/material are not disposed when a mesh is removed.

5. **Duplicate click handling**
   - Both React `onClick` on the mount div and a native `pointerdown` listener on the canvas
     can fire, causing redundant selection work.

## 2) Workspace state management (`use-workspace.tsx`)

### Current approach

- React Context provider with local `useState()` for:
  - `objects` map
  - selection (`selectedObjectId`, `selectedObjectIds`)
  - history (`history`, `historyIndex`) for undo/redo

### Bottlenecks / limitations

1. **Undo/redo snapshot uses JSON deep clone**
   - `JSON.parse(JSON.stringify(objects))` loses typed arrays (e.g., `Float32Array`), which
     breaks mesh fidelity for generated geometry.

2. **History indexing bug on trim**
   - When history exceeds the cap, `historyIndex` is not updated correctly.

3. **Selection updates iterate all objects**
   - `selectObject()` rewrites every object to flip `selected` flags.
   - This is O(N) per click; large scenes feel sluggish.

## 3) Mesh generation (`lib/mesh-generator.ts`)

### Current approach

- Builds a new `BufferGeometry` from `meshData` if present.
- Falls back to Three primitives for basic shapes.
- Material is `MeshStandardMaterial` with fixed roughness/metalness.

### Bottlenecks / limitations

- No geometry caching for primitives (not critical yet, but impacts large scenes).
- Selection styling mixes color changes and emissive changes; the studio’s selection
  language is better expressed as an outline + emissive only.

## Top 3 issues to fix first (High impact)

1. **Idle rendering** (continuous RAF render) → implement demand/idle rendering.
2. **Container resize correctness** → implement `ResizeObserver`-based resizing.
3. **Undo/redo + selection scalability** → preserve typed arrays in history + reduce O(N)
   selection updates.

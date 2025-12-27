# Studio Workspace Architecture

## Key files

- `app/(app)/studio/page.tsx`: studio shell (3-column layout, mobile sheets)
- `hooks/use-workspace.tsx`: workspace state (objects, selection, undo/redo)
- `app/studio/components/canvas-viewer.tsx`: Three.js viewport + interaction
- `lib/mesh-generator.ts`: mesh creation from workspace object metadata

## Rendering pipeline (CanvasViewer)

### Initialization

- Creates a Three.js `Scene`, `PerspectiveCamera`, and `WebGLRenderer`.
- Registers the scene via `setCanvasScene(scene)` so worker-driven previews can render.

### Performance model (CADA insight applied)

- **Idle rendering**: the render loop runs only while the camera is moving or the scene is “dirty”.
  - Camera movement is detected by comparing position/quaternion/zoom.
  - Scene changes call `requestRender()` to invalidate and render.

- **Resize-to-container**: a `ResizeObserver` updates camera aspect + renderer size.

### Object lifecycle

- Workspace objects map to `THREE.Mesh` instances stored in `meshRefs`.
- A per-object `geometryKey` determines whether a mesh must be rebuilt.
- Selection + hover feedback is applied without rebuilding geometry.

## Interaction model

- **Picking** uses a raycaster against only pickable meshes (`pickableMeshesRef`).
- Click is detected on `pointerup` with a small movement threshold to avoid selecting while orbiting.
- **Hover feedback** uses lightweight emissive + optional outline.

## Visual feedback

- Selected / hovered meshes use an emissive tint (`#2a2a72`) and an `EdgesGeometry` outline.

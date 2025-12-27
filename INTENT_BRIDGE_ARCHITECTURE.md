# Intent Bridge Architecture

## Overview

The Intent Bridge is a non-breaking architecture layer that sits between the React UI and a deterministic geometry kernel. It captures user actions as "intents" and compiles them into canonical geometry through a Rust/WASM kernel.

**KEY PRINCIPLE**: Intent → Kernel → Preview

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         EXISTING REACT/NEXT.JS UI LAYER                    │
│  (Tools, Properties Panel, Tree View, Shapes - UNCHANGED) │
│                                                             │
│  User Actions: Create Box, Edit Dimension, Boolean Op      │
│                ↓                                            │
│         Captured as Intent Events                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
         ┌─────────────────────────────────┐
         │   Intent Bridge (TypeScript)    │
         │                                 │
         │ • IntentCompiler                │
         │ • IntentHistory                 │
         │ • KernelBridge                  │
         │                                 │
         │ Maintains Intent History        │
         │ (Undo/Redo)                     │
         │                                 │
         │ Serializable & Hashable         │
         └──────────────┬──────────────────┘
                        │
                        ↓
     ┌──────────────────────────────────────┐
     │  Rust Geometry Kernel (WASM)         │
     │                                      │
     │  • Deterministic Compilation         │
     │  • CSG → B-rep Collapse              │
     │  • Manufacturability Enforcement     │
     │  • Hash-based Caching                │
     │  • Content-addressed IDs             │
     └──────────────────┬───────────────────┘
                        │
            ┌───────────┼───────────┐
            ↓           ↓           ↓
      ┌─────────┐ ┌─────────┐ ┌──────────┐
      │ Preview │ │ STEP/   │ │Canonical │
      │ Mesh    │ │ IGES    │ │ State    │
      │(THREE)  │ │(Mfg)    │ │(VCS)     │
      └────┬────┘ └────┬────┘ └────┬─────┘
           │           │          │
           └───────────┼──────────┘
                       ↓
     ┌──────────────────────────────────────┐
     │   Visualization & Output (THREE.js)  │
     │                                      │
     │   • Reactive mesh updates            │
     │   • Scene graph mirrors topology     │
     │   • No geometry math                 │
     │   • Fast, fluid UI                   │
     └──────────────────────────────────────┘
```

## Components

### 1. Intent AST (`lib/geometry/intent-ast.ts`)

Defines the canonical intent data structures:

```typescript
type Intent = PrimitiveIntent | OperationIntent

interface PrimitiveIntent {
  id: string
  type: 'box' | 'cylinder' | 'sphere' | ...
  parameters: Record<string, number>
  timestamp: number
}

interface OperationIntent {
  id: string
  type: 'union' | 'subtract' | 'intersect' | ...
  target: string
  operand?: string
  parameters: Record<string, any>
  timestamp: number
}

interface GeometryIR {
  part: string
  operations: Intent[]
  constraints: ManufacturingConstraint[]
  hash: string  // Content-addressed
}
```

### 2. Intent Compiler (`lib/geometry/intent-compiler.ts`)

Converts workspace objects to Intent IR:

```typescript
class IntentCompiler {
  compileWorkspace(objects: Record<string, WorkspaceObject>): GeometryIR
  compileBooleanOp(op: string, targetId: string, toolId: string): OperationIntent
  compileFeatureOp(op: string, targetId: string, params: any): OperationIntent
}
```

### 3. Intent History (`lib/geometry/intent-history.ts`)

Manages undo/redo at the intent level:

```typescript
class IntentHistory {
  push(ir: GeometryIR): void
  undo(): GeometryIR | null
  redo(): GeometryIR | null
  current(): GeometryIR | null
}
```

### 4. Kernel Bridge (`lib/geometry/kernel-bridge.ts`)

Communicates with the Rust/WASM kernel:

```typescript
class KernelBridge {
  async initialize(): Promise<void>
  async compileIntent(ir: GeometryIR): Promise<KernelResult>
  isKernelReady(): boolean
}

interface KernelResult {
  status: 'compiled' | 'cached' | 'fallback' | 'error'
  intentHash: string
  mesh: { vertices: Float32Array; indices: Uint32Array; normals: Float32Array } | null
  topology?: any
  step?: any
  error?: string
}
```

### 5. Geometry Kernel (`wasm/geometry-kernel/`)

Rust/WASM kernel that compiles intents deterministically:

```rust
pub struct GeometryKernel {
    intent_hash: String,
    topology: Option<CanonicalSolid>,
}

impl GeometryKernel {
    pub fn compile_intent(&mut self, intent_json: &str) -> String
}
```

## Integration Points

### Workspace Hook (`hooks/use-workspace.tsx`)

The workspace hook now:
1. Creates intent compiler, history, and kernel bridge instances
2. Compiles workspace to intent whenever objects change
3. Sends intent to kernel for compilation
4. Exposes `kernelResult` in workspace context

```typescript
export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  // ... existing state ...
  
  // NEW: Intent layer
  const intentCompilerRef = useRef(new IntentCompiler())
  const intentHistoryRef = useRef(new IntentHistory())
  const kernelBridgeRef = useRef(new KernelBridge())
  const [kernelResult, setKernelResult] = useState<KernelResult | null>(null)

  // Compile intent whenever objects change
  useEffect(() => {
    const ir = intentCompilerRef.current.compileWorkspace(objects)
    const result = await kernelBridgeRef.current.compileIntent(ir)
    setKernelResult(result)
  }, [objects])
  
  // ... rest of workspace logic ...
}
```

### Canvas Viewer (`app/studio/components/canvas-viewer.tsx`)

The canvas viewer now:
1. Accesses kernel result via `useWorkspaceKernelResult()` hook
2. Optionally uses kernel mesh when available
3. Falls back to legacy mesh generation if kernel not ready

```typescript
export const CanvasViewer = ({ ... }) => {
  const kernelResult = useWorkspaceKernelResult()
  
  // Effect that can use kernel mesh (future implementation)
  useEffect(() => {
    if (kernelResult?.mesh && kernelResult.status === 'compiled') {
      // Use kernel-generated mesh
      // TODO: Replace scene meshes with kernel mesh
    }
  }, [kernelResult])
  
  // ... existing canvas logic continues to work ...
}
```

## Data Flow

### Creating a Box

```
1. User clicks "Create Box" in UI
   ↓
2. sidebar-tools.tsx: addObject(id, { type: 'box', dimensions: {...} })
   ↓
3. use-workspace.tsx: objects state updated
   ↓
4. useEffect triggers: IntentCompiler.compileWorkspace(objects)
   ↓
5. Intent IR created: { operations: [{ type: 'box', parameters: {...} }], hash: 'abc123' }
   ↓
6. KernelBridge.compileIntent(ir) called
   ↓
7. Rust kernel processes intent → outputs { mesh, topology, hash }
   ↓
8. kernelResult state updated
   ↓
9. canvas-viewer.tsx re-renders (currently uses legacy mesh, kernel mesh ready for future)
   ↓
10. User sees box in viewport
```

### Boolean Operation

```
1. User selects 2 objects, clicks "Union"
   ↓
2. toolbar.tsx: performBoolean('union', targetId, toolId)
   ↓
3. use-workspace.tsx: objects updated (compound type with meshData)
   ↓
4. useEffect triggers: IntentCompiler.compileWorkspace(objects)
   ↓
5. Intent IR includes operation: { type: 'union', target: 'obj1', operand: 'obj2' }
   ↓
6. Kernel compiles entire intent history → new mesh
   ↓
7. kernelResult updated with unified mesh
   ↓
8. UI shows result (using existing execution engine for now)
```

## Benefits

### Deterministic Compilation
- Same intent → same hash → same output
- Reproducible builds
- Content-addressed caching

### Manufacturability
- Constraints enforced during compilation
- Design validated before export
- Manufacturing-ready geometry

### Version Control
- Intent hash becomes version ID
- Diff intents instead of meshes
- Git-friendly design history

### Collaboration
- Sync intents instead of large meshes
- Operational transforms on intent AST
- Conflict resolution at intent level

### Caching
- Hash-based mesh cache
- Instant reload for same intent
- No recomputation needed

## Current Status

### ✅ Implemented
- [x] Intent AST definitions
- [x] Intent Compiler
- [x] Intent History (undo/redo)
- [x] Kernel Bridge (TypeScript)
- [x] Rust kernel scaffolding
- [x] Workspace integration
- [x] Canvas viewer integration (stub)
- [x] Deterministic hashing

### 🚧 In Progress
- [ ] Full Rust kernel implementation
  - [ ] CSG tree compilation
  - [ ] Manufacturability validation
  - [ ] CSG → B-rep collapse
  - [ ] Mesh generation
  - [ ] STEP export
- [ ] Kernel mesh rendering in canvas
- [ ] Intent-based undo/redo
- [ ] Manufacturing constraint enforcement

### 📋 Future
- [ ] Collaborative editing via intent sync
- [ ] Version control integration
- [ ] Automatic routing to manufacturers
- [ ] Deterministic toolpath generation
- [ ] Cost/lead time calculation from intent

## Building the Kernel

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack
```

### Build

```bash
cd wasm/geometry-kernel
./build.sh
```

This compiles the Rust kernel to WebAssembly and outputs to `wasm/geometry-kernel/pkg/`.

## Testing

### TypeScript Tests

```bash
npm run test
```

### Rust Tests

```bash
cd wasm/geometry-kernel
cargo test
```

### Integration Tests

```bash
# Start dev server
npm run dev

# Create a box in the studio
# Check console for intent compilation logs:
# 🔧 Intent compiled: { hash: 'intent_...', status: 'fallback', operations: 1 }
```

## Migration Path

This is a **non-breaking change**. The system works in three modes:

1. **Legacy Mode** (current): Existing execution engine + THREE.js
2. **Hybrid Mode** (transition): Intent layer active, kernel in fallback mode
3. **Kernel Mode** (future): Full kernel compilation with deterministic meshes

Users see no difference during migration. The UI continues to work exactly as before.

## FAQ

### Q: Does this replace the existing execution engine?
A: No, it layers on top. The execution engine continues to work for legacy operations.

### Q: What happens if the kernel isn't ready?
A: The system falls back to legacy mesh generation. Everything works as before.

### Q: How does this affect performance?
A: Intent compilation is fast (~1ms). Kernel compilation will be cached by hash.

### Q: Can I disable the intent layer?
A: The workspace always compiles to intent, but kernel compilation only happens if available.

### Q: How do I know if the kernel is being used?
A: Check console logs. Look for "✅ Geometry Kernel ready" and "🔧 Intent compiled".

## References

- [Rust Geometry Kernel README](./wasm/geometry-kernel/README.md)
- [Intent AST Source](./lib/geometry/intent-ast.ts)
- [Kernel Bridge Source](./lib/geometry/kernel-bridge.ts)
- [Workspace Integration](./hooks/use-workspace.tsx)

# OCCT WASM Integration

This directory contains the OpenCascade Technology (OCCT) WebAssembly bindings for Qutlas CAD system.

## Architecture

```
occt-wrapper/
├── compile-wasm.sh           # Build script for compiling C++ to WASM
├── src/
│   ├── occt_bindings.cpp     # C++ bindings using Emscripten
│   ├── occt-worker.ts        # Web Worker for geometry operations
│   └── occt-loader.ts        # OCCT class wrapper (legacy)
└── build/
    ├── occt.wasm             # Compiled WASM binary
    ├── occt.js               # JavaScript glue code
    └── occt.d.ts             # TypeScript definitions
```

## Prerequisites

To compile the WASM bindings, you need:

1. **Emscripten SDK** (latest version)
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **OpenCascade Technology** (OCCT 7.6+)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libocct-*-dev

   # macOS
   brew install opencascade

   # Or build from source: https://dev.opencascade.org
   ```

## Building

### Compile WASM Module

```bash
cd occt-wrapper
bash compile-wasm.sh
```

This will:
1. Compile `occt_bindings.cpp` to WASM
2. Generate `occt.js` and `occt.wasm` in `build/`
3. Copy files to `/public/occt/` for Next.js serving

### Development Mode

For development, mock OCCT modules are provided in `/public/occt/`:
- `occt.js` - Mock implementation that logs operations
- `occt.wasm` - Placeholder file

These allow development without a full OCCT build.

## Integration Points

### 1. Module Loader (`/lib/occt-loader.ts`)

Unified WASM module loader with singleton pattern:

```typescript
import { initializeOCCTModule } from '@/lib/occt-loader'

const occtModule = await initializeOCCTModule()
const box = occtModule.createBox(100, 100, 100)
```

### 2. OCCT Client (`/lib/occt-client.ts`)

High-level API for geometry operations:

```typescript
import { initializeOCCT } from '@/lib/occt-client'

const client = await initializeOCCT()
const box = client.createBox(100, 50, 25)
const meshData = client.getMeshData(box)
```

### 3. OCCT Worker (`/occt-wrapper/src/occt-worker.ts`)

Web Worker for offloading heavy geometry operations:

```typescript
// Automatically initialized in useOCCTWorker hook
const { createBox, getMesh, isReady } = useOCCTWorker()

if (isReady) {
  const geometry = await createBox(100, 100, 100)
  const mesh = await getMesh(geometry)
}
```

### 4. React Hook (`/hooks/use-occt-worker.ts`)

React hook for using OCCT operations:

```typescript
import { useOCCTWorker } from '@/hooks/use-occt-worker'

function MyComponent() {
  const { createBox, isReady } = useOCCTWorker()
  
  const handleCreate = async () => {
    if (!isReady) return
    const box = await createBox(100, 100, 100)
  }
}
```

## Available Operations

### Basic Shapes
- `createBox(width, height, depth)`
- `createCylinder(radius, height)`
- `createSphere(radius)`
- `createCone(radius, height)`
- `createTorus(majorRadius, minorRadius)`

### Boolean Operations
- `unionShapes(shape1, shape2)`
- `cutShapes(shape1, shape2)`
- `intersectShapes(shape1, shape2)`

### Features
- `addHole(geometry, position, diameter, depth)`
- `addFillet(geometry, edgeIndex, radius)`
- `addChamfer(geometry, edgeIndex, distance)`
- `extrude(profile, distance)`
- `revolve(profile, axis, angle)`

### Mesh Generation
- `getMeshData(geometry)` - Returns vertices, indices, normals

### Export
- `exportToSTEP(geometry, filename)`
- `exportToIGES(geometry, filename)`
- `exportToSTL(geometry, filename)`

### Analysis
- `getBoundingBox(geometry)`
- `analyzeManufacturability(geometry)`

## Mesh Generation

The mesh generator (`/lib/mesh-generator.ts`) converts OCCT geometry to THREE.js:

```typescript
import { generateMesh } from '@/lib/mesh-generator'

const mesh = await generateMesh({
  type: 'box',
  dimensions: { width: 100, height: 50, depth: 25 },
  features: [
    { type: 'hole', parameters: { position: { x: 0, y: 0, z: 0 }, diameter: 10, depth: 20 } },
    { type: 'fillet', parameters: { edgeIndex: 0, radius: 5 } }
  ]
})

scene.add(mesh)
```

## Worker Communication Protocol

Messages sent to worker:

```typescript
{
  id: string,              // Unique request ID
  operation: MessageType,  // Operation to perform
  payload: any            // Operation parameters
}
```

Responses from worker:

```typescript
{
  id: string,                    // Request ID
  type: 'SUCCESS' | 'ERROR' | 'READY',
  result?: any,                 // Operation result
  error?: string                // Error message if failed
}
```

## Error Handling

All operations include comprehensive error handling:

1. **Initialization errors** - Clear messages if WASM fails to load
2. **Operation timeouts** - 30s default timeout for geometry operations
3. **Graceful fallbacks** - THREE.js primitives if OCCT fails
4. **Worker recovery** - Automatic worker restart on fatal errors

## Performance Optimization

- **Geometry caching** - Worker maintains cache of created geometries
- **Mesh caching** - Avoid recomputing identical meshes
- **Memory management** - Proper cleanup of WASM objects
- **Worker pooling** - Reuse workers instead of creating new ones

## Deployment

### Vercel Configuration

The `next.config.mjs` is configured to:
1. Handle `.wasm` files as assets
2. Properly serve from `/public/occt/`
3. Set correct MIME types for WASM

### Build Process

```bash
npm run build:occt  # Compile WASM (optional)
npm run build       # Build Next.js app with WASM assets
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install Emscripten (optional)
  run: |
    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk && ./emsdk install latest && ./emsdk activate latest

- name: Build WASM
  run: npm run build:occt || echo "Using mock WASM"

- name: Build Next.js
  run: npm run build
```

## Troubleshooting

### WASM Module Not Loading

1. Check browser console for loading errors
2. Verify `/public/occt/occt.wasm` exists and is accessible
3. Check `locateFile` callback in occt-loader.ts
4. Ensure proper MIME types: `application/wasm`

### Worker Initialization Timeout

1. Check worker import path in `use-occt-worker.ts`
2. Verify worker file is properly bundled
3. Check browser supports Web Workers and WASM
4. Look for errors in worker console (Chrome DevTools > Sources > Workers)

### Mesh Generation Fails

1. Enable fallback to THREE.js primitives (already implemented)
2. Check geometry is not null before meshing
3. Verify mesh data format matches THREE.js expectations
4. Use smaller deflection value for more detailed meshes

### Build Errors

1. Ensure Emscripten is in PATH
2. Verify OCCT libraries are installed
3. Check include/library paths in `compile-wasm.sh`
4. Build can be skipped - mock module will be used

## Future Enhancements

- [ ] Real CAD file import (STEP, IGES, STL parsing)
- [ ] Advanced DFM analysis with real metrics
- [ ] Geometry serialization for persistence
- [ ] Multi-threaded mesh generation
- [ ] Progressive mesh loading for large models
- [ ] GPU-accelerated rendering integration

## References

- [OpenCascade Documentation](https://dev.opencascade.org)
- [Emscripten Documentation](https://emscripten.org/docs)
- [THREE.js Documentation](https://threejs.org/docs)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

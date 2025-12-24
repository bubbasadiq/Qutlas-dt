# OCCT WASM Integration - Quick Start Guide

## 🚀 For Developers

### Using OCCT in Your Components

#### 1. Basic Shape Creation

```typescript
import { useOCCTWorker } from '@/hooks/use-occt-worker'

function MyComponent() {
  const { createBox, getMesh, isReady } = useOCCTWorker()
  
  const handleCreateBox = async () => {
    if (!isReady) {
      console.log('OCCT worker not ready yet')
      return
    }
    
    try {
      // Create a box geometry
      const geometry = await createBox(100, 50, 25)
      
      // Get mesh data for rendering
      const meshData = await getMesh(geometry)
      
      // Use meshData.vertices and meshData.indices
      console.log('Vertices:', meshData.vertices)
      console.log('Indices:', meshData.indices)
    } catch (error) {
      console.error('Failed to create box:', error)
    }
  }
  
  return (
    <button onClick={handleCreateBox} disabled={!isReady}>
      Create Box
    </button>
  )
}
```

#### 2. Boolean Operations

```typescript
const { createBox, createCylinder, unionShapes, getMesh } = useOCCTWorker()

// Create two shapes
const box = await createBox(100, 100, 100)
const cylinder = await createCylinder(30, 120)

// Combine them
const combined = await unionShapes(box, cylinder)

// Get mesh for rendering
const meshData = await getMesh(combined)
```

#### 3. Adding Features

```typescript
const { createBox, addHole, addFillet } = useOCCTWorker()

// Create base geometry
let geometry = await createBox(100, 100, 50)

// Add a hole
geometry = await addHole(geometry, { x: 0, y: 0, z: 0 }, 10, 25)

// Add a fillet
geometry = await addFillet(geometry, 0, 5)
```

#### 4. Exporting CAD Files

```typescript
// From API route (server-side)
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { objects, format } = await req.json()
  
  // Generate STEP/IGES/STL file
  const response = await fetch('/api/workspace/export-step', {
    method: 'POST',
    body: JSON.stringify({ objects, format: 'step' })
  })
  
  return response
}
```

### Available Operations

#### Shape Creation
```typescript
createBox(width: number, height: number, depth: number)
createCylinder(radius: number, height: number)
createSphere(radius: number)
createCone(radius: number, height: number)
createTorus(majorRadius: number, minorRadius: number)
```

#### Boolean Operations
```typescript
unionShapes(shape1, shape2)      // Combine shapes
cutShapes(shape1, shape2)        // Subtract shape2 from shape1
```

#### Features
```typescript
addHole(geometry, position: {x, y, z}, diameter: number, depth: number)
addFillet(geometry, edgeIndex: number, radius: number)
addChamfer(geometry, edgeIndex: number, distance: number)
```

#### Mesh & Export
```typescript
getMesh(geometry)                        // Returns {vertices, indices, normals}
exportSTEP(geometry, filename: string)   // Export to STEP format
```

### Integrating with THREE.js

```typescript
import * as THREE from 'three'
import { useOCCTWorker } from '@/hooks/use-occt-worker'

function ThreeScene() {
  const { createBox, getMesh } = useOCCTWorker()
  
  const addBoxToScene = async (scene: THREE.Scene) => {
    // Create OCCT geometry
    const geometry = await createBox(100, 100, 100)
    const meshData = await getMesh(geometry)
    
    // Convert to THREE.js
    const threeGeometry = new THREE.BufferGeometry()
    threeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(meshData.vertices, 3)
    )
    threeGeometry.setIndex(
      new THREE.BufferAttribute(new Uint32Array(meshData.indices), 1)
    )
    threeGeometry.computeVertexNormals()
    
    // Create mesh
    const material = new THREE.MeshStandardMaterial({ color: 0x0077ff })
    const mesh = new THREE.Mesh(threeGeometry, material)
    
    scene.add(mesh)
  }
}
```

### Error Handling

```typescript
const { createBox } = useOCCTWorker()

try {
  const geometry = await createBox(100, 100, 100)
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Operation took too long')
  } else if (error.message.includes('not initialized')) {
    console.error('Worker not ready')
  } else {
    console.error('Geometry operation failed:', error)
  }
}
```

### Checking Worker Status

```typescript
const { isReady } = useOCCTWorker()

useEffect(() => {
  if (isReady) {
    console.log('OCCT worker is ready!')
  }
}, [isReady])
```

## 🛠️ For Build Engineers

### Building WASM Module

#### Prerequisites
```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Install OpenCascade (Ubuntu/Debian)
sudo apt-get install libocct-*-dev

# Install OpenCascade (macOS)
brew install opencascade
```

#### Compile WASM
```bash
cd occt-wrapper
bash compile-wasm.sh
```

This will:
1. Compile C++ bindings to WASM
2. Generate `occt.wasm` and `occt.js` in `build/`
3. Copy files to `/public/occt/`

#### Verify Compilation
```bash
bash ../scripts/validate-wasm-deployment.sh
```

### Build Commands

```bash
# Development (with mock WASM)
npm run dev

# Build with mock WASM
npm run build

# Build with real WASM (requires Emscripten)
npm run build:occt
npm run build

# Just compile WASM
npm run build:occt
```

## 🧪 For QA / Testing

### Manual Testing Steps

1. **Start Application**
   ```bash
   npm run dev
   ```

2. **Open Browser Console**
   - Navigate to Studio page
   - Check for "✅ OCCT worker initialized" message
   - No errors should appear

3. **Test Basic Shape Creation**
   - Create a box, cylinder, or sphere
   - Verify it appears in the 3D viewer
   - Check mesh renders correctly

4. **Test Export**
   - Create some geometry
   - Export as STEP/IGES/STL
   - Verify file downloads
   - Open in CAD software to validate

5. **Test Error Handling**
   - Try operations before worker is ready
   - Verify error messages are helpful
   - Check graceful fallbacks work

### Validation Script

```bash
bash scripts/validate-wasm-deployment.sh
```

Expected output:
- ✓ All core files exist
- ⚠ 2 warnings (mock WASM) - **This is OK for development**

## 🐛 Troubleshooting

### Worker Not Initializing

**Symptom**: No "OCCT worker initialized" message  
**Check**:
1. Open DevTools > Console
2. Look for error messages
3. Check DevTools > Sources > Workers tab

**Fix**:
- Verify `/public/occt/occt.js` exists
- Check browser supports Web Workers
- Clear cache and reload

### Mesh Not Rendering

**Symptom**: Geometry created but not visible  
**Check**:
1. Verify `meshData` has vertices and indices
2. Check THREE.js scene contains mesh
3. Verify camera position

**Fix**:
- Use `generateMesh()` from `lib/mesh-generator.ts`
- Check `CanvasViewer.tsx` for examples
- Verify `computeVertexNormals()` is called

### TypeScript Errors

**Symptom**: Build fails with type errors  
**Fix**:
```bash
npm install --legacy-peer-deps
npx tsc --noEmit  # Check errors
```

Common issues:
- Missing `@types/three` → `npm install --save-dev @types/three --legacy-peer-deps`
- Import path errors → Use `@/` alias
- Worker types → Already fixed in integration

## 📚 Additional Resources

- **Full Documentation**: `/OCCT_INTEGRATION_NOTES.md`
- **Architecture**: `/occt-wrapper/README.md`
- **Deployment**: `/DEPLOYMENT_CHECKLIST.md`
- **OCCT Docs**: https://dev.opencascade.org
- **Emscripten**: https://emscripten.org/docs
- **THREE.js**: https://threejs.org/docs

## 💡 Tips & Best Practices

1. **Always check `isReady`** before calling OCCT operations
2. **Use try-catch** around all geometry operations
3. **Cache geometry** by storing geometry IDs
4. **Clean up** workers on component unmount
5. **Profile performance** for complex operations
6. **Test with mock first** before compiling real WASM
7. **Monitor memory** when creating many shapes

## ⚡ Performance Tips

- Batch operations when possible
- Use mesh caching for repeated geometry
- Adjust deflection for mesh quality vs speed
- Consider worker pools for heavy workloads
- Profile operations with Chrome DevTools

---

**Need Help?** Check the full docs in `/OCCT_INTEGRATION_NOTES.md`

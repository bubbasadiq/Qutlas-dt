# OCCT WASM Build Guide

## Current Status

This project currently uses an **enhanced mock OCCT module** for development. The mock provides:

- ✅ Full API compatibility with real OCCT
- ✅ Realistic mesh generation for basic shapes (box, cylinder, sphere)
- ✅ Bounding box calculations
- ✅ Manufacturability analysis
- ✅ State tracking and debugging
- ✅ All required functions for UI development

## Production OCCT WASM Build

For production deployment, you need to build OCCT from source using Emscripten. This is a complex process that requires:

### Prerequisites

1. **Emscripten SDK** (already installed)
   - Version 3.1.6+
   - Includes `emcc`, `em++`, and WASM toolchain

2. **OCCT Source Code**
   - Version 7.6+ (recommended 7.7+)
   - Download from [https://dev.opencascade.org/](https://dev.opencascade.org/)
   - Requires ~1GB disk space

3. **Build Tools**
   - CMake 3.10+
   - C++ compiler (clang recommended)
   - Make/Ninja
   - 10GB+ free disk space
   - 4+ hours build time

### Build Process

#### Step 1: Download OCCT Source

```bash
# Download OCCT source (example for version 7.7.0)
wget https://git.dev.opencascade.org/repos/occt.git/snapshot/occt-7.7.0.tar.gz
tar -xzf occt-7.7.0.tar.gz
cd occt-7.7.0
```

#### Step 2: Configure CMake for Emscripten

```bash
# Create build directory
mkdir build-wasm
cd build-wasm

# Configure with Emscripten toolchain
emcmake cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_MODULE_Draw=OFF \
  -DBUILD_MODULE_Visualization=OFF \
  -DBUILD_MODULE_ApplicationFramework=OFF \
  -DBUILD_LIBRARY_TYPE=STATIC \
  -DCMAKE_CXX_FLAGS="-s WASM=1 -s ALLOW_MEMORY_GROWTH=1" \
  ..
```

#### Step 3: Build OCCT Libraries

```bash
# Build (this will take several hours)
cmake --build . -j$(nproc)

# Install to Emscripten sysroot
cmake --install . --prefix=/usr/share/emscripten/cache/sysroot
```

#### Step 4: Build OCCT WASM Bindings

```bash
# Navigate to occt-wrapper
cd /path/to/project/occt-wrapper

# Run the build script
./build-occt-wasm.sh
```

### Expected Output

When successfully built, you should have:

```
public/occt/
├── occt.js        (500KB - 2MB, real WASM module)
├── occt.wasm      (1MB - 5MB, WebAssembly binary)
└── occt.d.ts      (TypeScript definitions)
```

## Development vs Production

### Development Mode (Current)

```bash
# Uses enhanced mock module
npm run build:occt

# Features:
# ✅ Fast build (<1 second)
# ✅ Full API compatibility
# ✅ Realistic mock data
# ✅ Debugging capabilities
# ❌ No real CAD operations
```

### Production Mode (Future)

```bash
# Requires OCCT built with Emscripten
npm run build:occt:full

# Features:
# ✅ Real OCCT CAD kernel
# ✅ Precise geometry operations
# ✅ Full CAD functionality
# ✅ Production-ready performance
# ❌ Complex build process
# ❌ Long build time
```

## Available Functions

Both mock and real OCCT provide these functions:

### Shape Creation
- `createBox(width, height, depth)`
- `createCylinder(radius, height)`
- `createSphere(radius)`
- `createCone(radius, height)`
- `createTorus(majorRadius, minorRadius)`

### Boolean Operations
- `unionShapes(shape1, shape2)`
- `cutShapes(shape1, shape2)`
- `intersectShapes(shape1, shape2)`

### Feature Operations
- `addHole(geometry, position, diameter, depth)`
- `addFillet(geometry, edgeIndex, radius)`
- `addChamfer(geometry, edgeIndex, distance)`

### Advanced Operations
- `extrude(profile, distance)`
- `revolve(profile, axis, angle)`

### Data Extraction
- `getMeshData(geometry)` - Returns vertices, indices, normals
- `getBoundingBox(geometry)` - Returns {x, y, z, width, height, depth}

### Analysis
- `analyzeManufacturability(geometry)` - Returns DFM scores and warnings

### Export
- `exportToSTEP(geometry, filename)`
- `exportToIGES(geometry, filename)`
- `exportToSTL(geometry, filename)`

## Testing the Mock Module

You can test the mock module in a browser console:

```javascript
// Load the module
const OCCTModule = await import('/occt/occt.js');
const occt = await OCCTModule.default();

// Create shapes
const box = occt.createBox(100, 50, 30);
const cylinder = occt.createCylinder(25, 100);

// Get mesh data
const mesh = occt.getMeshData(box);
console.log('Vertices:', mesh.vertices.length / 3);
console.log('Triangles:', mesh.indices.length / 3);

// Boolean operations
const unionShape = occt.unionShapes(box, cylinder);

// Get bounding box
const bbox = occt.getBoundingBox(unionShape);
console.log('Bounding box:', bbox);

// Analyze manufacturability
const dfm = occt.analyzeManufacturability(unionShape);
console.log('DFM scores:', dfm.scores);
```

## Troubleshooting

### Common Issues

1. **Missing Emscripten**: Install with `sudo apt install emscripten`

2. **Missing OCCT headers**: Install with `sudo apt install libocct-*-dev`

3. **Linking errors**: Ensure you're using WASM-compatible libraries, not native .so files

4. **Memory issues**: Increase memory with `-s INITIAL_MEMORY=536870912`

### Debugging

```bash
# Check Emscripten version
emcc --version

# Check OCCT headers
ls /usr/include/opencascade

# Check OCCT libraries (for native build)
ls /usr/lib/x86_64-linux-gnu/libTK*.so
```

## Migration Path

To migrate from mock to real OCCT:

1. **Build OCCT with Emscripten** (as described above)
2. **Update build script** to use real libraries
3. **Test thoroughly** - real OCCT may have different behavior
4. **Update documentation** to reflect production status
5. **Deploy** with confidence

## Resources

- [Emscripten Documentation](https://emscripten.org/docs/getting_started/index.html)
- [OCCT Documentation](https://dev.opencascade.org/doc/overview/html/)
- [OCCT Git Repository](https://git.dev.opencascade.org/)
- [WebAssembly Official Site](https://webassembly.org/)

## Support

For issues with the mock module or build process:

1. Check this documentation
2. Review the build scripts in `occt-wrapper/`
3. Examine the mock implementation in `public/occt/occt.js`
4. Consult the OCCT and Emscripten documentation

The mock module is designed to be API-compatible, so switching to real OCCT should be seamless for your application code.
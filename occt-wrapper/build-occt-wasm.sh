#!/bin/bash

set -e

echo "🔨 Building OCCT WASM - Advanced Build Script"
echo ""

# Check if we're in a production environment with proper OCCT WASM setup
echo "🔍 Checking for production OCCT WASM environment..."

# Check for Emscripten
if ! command -v emcc &> /dev/null; then
  echo "❌ Emscripten not found. Installing..."
  sudo apt update && sudo apt install -y emscripten
fi

# Check for OCCT development libraries
if [ ! -d "/usr/include/opencascade" ]; then
  echo "❌ OCCT development headers not found. Installing..."
  sudo apt install -y libocct-foundation-dev libocct-modeling-data-dev libocct-modeling-algorithms-dev libocct-data-exchange-dev
fi

echo "✅ Prerequisites check complete"
echo ""

# Check if we have pre-built OCCT WASM libraries
if [ -f "/usr/lib/wasm32-emscripten/libTKernel.a" ]; then
  echo "✅ Found pre-built OCCT WASM libraries"
  USE_PREBUILT=true
else
  echo "⚠️  No pre-built OCCT WASM libraries found"
  echo ""
  echo "📋 For production OCCT WASM build, you need to:"
  echo "   1. Download OCCT source code (version 7.6+)"
  echo "   2. Build OCCT with Emscripten toolchain"
  echo "   3. Install WASM libraries to /usr/lib/wasm32-emscripten/"
  echo ""
  echo "🔧 This is a complex process that requires:"
  echo "   - OCCT source code (1GB+)"
  echo "   - Several hours of build time"
  echo "   - Significant disk space (10GB+)"
  echo ""
  echo "💡 For development, we'll use the mock OCCT module"
  echo "   For production, use: npm run build:occt:full"
  echo ""
  USE_PREBUILT=false
fi

# Create build directory
mkdir -p build
cd build

echo "📁 Working in: $(pwd)"
echo ""

if [ "$USE_PREBUILT" = true ]; then
  echo "🏗️  Building with pre-built OCCT WASM libraries..."
  
  # Compile with pre-built WASM libraries
  emcc \
    -o occt.js \
    ../src/occt_bindings.cpp \
    -I/usr/include/opencascade \
    -L/usr/lib/wasm32-emscripten \
    -lTKernel \
    -lTKMath \
    -lTKG3d \
    -lTKG2d \
    -lTKBRep \
    -lTKGeomBase \
    -lTKGeomAlgo \
    -lTKTopAlgo \
    -lTKPrim \
    -lTKBO \
    -lTKMesh \
    -lTKFillet \
    -lTKOffset \
    -lTKXSBase \
    -lTKSTEP \
    -lTKSTEPBase \
    -lTKSTEPAttr \
    -lTKSTEP209 \
    -lTKIGES \
    -lTKSTL \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=536870912 \
    -s MAXIMUM_MEMORY=2147483648 \
    -s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall","getValue","setValue"]' \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='OCCTModule' \
    -lembind \
    -O3 \
    -std=c++17 \
    -fexceptions
  
  echo "✅ Production OCCT WASM build complete"
  
else
  echo "🛠️  Creating development build with mock functionality..."
  echo ""
  
  # Create a comprehensive mock implementation
  cat > occt.js << 'EOF'
// Enhanced OCCT Mock Module for Development
// This provides functional mocks that can be used for UI development
// while awaiting the full OCCT WASM build

var OCCTModule = (function() {
  return function(moduleOptions) {
    return new Promise((resolve) => {
      console.log('🔧 Using enhanced OCCT mock module for development');
      console.log('📋 For production: npm run build:occt:full');
      
      // Call locateFile if provided
      if (moduleOptions && moduleOptions.locateFile) {
        moduleOptions.locateFile('occt.wasm');
      }
      
      // Enhanced Geometry class with state tracking
      class EnhancedMockGeometry {
        constructor() {
          this._isNull = false;
          this._type = 'unknown';
          this._dimensions = {};
          this._id = 'geom_' + Math.random().toString(36).substr(2, 9);
        }
        
        isNull() {
          return this._isNull;
        }
        
        setType(type, dimensions) {
          this._type = type;
          this._dimensions = dimensions;
        }
        
        getDebugInfo() {
          return {
            id: this._id,
            type: this._type,
            dimensions: this._dimensions,
            isNull: this._isNull
          };
        }
      }
      
      // Helper function to create mesh data for different shapes
      function createMeshData(type, dimensions) {
        const meshData = {
          vertices: new Float32Array(0),
          indices: new Uint32Array(0),
          normals: new Float32Array(0)
        };
        
        // Create appropriate mesh based on type
        if (type === 'box') {
          const {width, height, depth} = dimensions;
          const w = width || 100;
          const h = height || 100;
          const d = depth || 100;
          
          const hw = w / 2, hh = h / 2, hd = d / 2;
          
          // Vertices for a box (8 corners)
          const vertices = new Float32Array([
            -hw, -hh, -hd,  hw, -hh, -hd,  hw,  hh, -hd, -hw,  hh, -hd,
            -hw, -hh,  hd,  hw, -hh,  hd,  hw,  hh,  hd, -hw,  hh,  hd
          ]);
          
          // Indices for 12 triangles (2 per face)
          const indices = new Uint32Array([
            0,1,2, 0,2,3,    // bottom
            4,5,6, 4,6,7,    // top
            0,1,5, 0,5,4,    // front
            2,3,7, 2,7,6,    // back
            0,3,7, 0,7,4,    // left
            1,2,6, 1,6,5     // right
          ]);
          
          meshData.vertices = vertices;
          meshData.indices = indices;
          
        } else if (type === 'cylinder') {
          const {radius, height} = dimensions;
          const r = radius || 50;
          const h = height || 100;
          const hh = h / 2;
          const segments = 32;
          
          // Create cylinder vertices
          const vertices = [];
          const indices = [];
          
          // Bottom and top circles
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            
            // Bottom
            vertices.push(x, -hh, z);
            // Top
            vertices.push(x, hh, z);
          }
          
          // Side triangles
          for (let i = 0; i < segments; i++) {
            const next = i + 1;
            const bottom1 = i * 2;
            const bottom2 = next * 2;
            const top1 = i * 2 + 1;
            const top2 = next * 2 + 1;
            
            indices.push(bottom1, bottom2, top2);
            indices.push(bottom1, top2, top1);
          }
          
          meshData.vertices = new Float32Array(vertices);
          meshData.indices = new Uint32Array(indices);
          
        } else if (type === 'sphere') {
          const {radius} = dimensions;
          const r = radius || 50;
          const segments = 16;
          
          const vertices = [];
          const indices = [];
          
          // Create sphere using parametric equations
          for (let lat = 0; lat <= segments; lat++) {
            const theta = lat * Math.PI / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let lon = 0; lon <= segments; lon++) {
              const phi = lon * 2 * Math.PI / segments;
              const sinPhi = Math.sin(phi);
              const cosPhi = Math.cos(phi);
              
              const x = cosPhi * sinTheta;
              const y = cosTheta;
              const z = sinPhi * sinTheta;
              
              vertices.push(x * r, y * r, z * r);
            }
          }
          
          // Create indices
          for (let lat = 0; lat < segments; lat++) {
            for (let lon = 0; lon < segments; lon++) {
              const first = lat * (segments + 1) + lon;
              const second = first + segments + 1;
              
              indices.push(first, second, first + 1);
              indices.push(second, second + 1, first + 1);
            }
          }
          
          meshData.vertices = new Float32Array(vertices);
          meshData.indices = new Uint32Array(indices);
          
        } else {
          // Default: simple box
          meshData.vertices = new Float32Array([
            -50, -50, -50,  50, -50, -50,  50,  50, -50, -50,  50, -50,
            -50, -50,  50,  50, -50,  50,  50,  50,  50, -50,  50,  50
          ]);
          meshData.indices = new Uint32Array([
            0,1,2, 0,2,3, 4,5,6, 4,6,7,
            0,1,5, 0,5,4, 2,3,7, 2,7,6,
            0,3,7, 0,7,4, 1,2,6, 1,6,5
          ]);
        }
        
        return meshData;
      }
      
      const mockModule = {
        Geometry: EnhancedMockGeometry,
        
        createBox: (width, height, depth) => {
          const geom = new EnhancedMockGeometry();
          geom.setType('box', {width, height, depth});
          console.log(`📦 createBox(${width}, ${height}, ${depth})`);
          return geom;
        },
        
        createCylinder: (radius, height) => {
          const geom = new EnhancedMockGeometry();
          geom.setType('cylinder', {radius, height});
          console.log(`🟢 createCylinder(${radius}, ${height})`);
          return geom;
        },
        
        createSphere: (radius) => {
          const geom = new EnhancedMockGeometry();
          geom.setType('sphere', {radius});
          console.log(`🔵 createSphere(${radius})`);
          return geom;
        },
        
        createCone: (radius, height) => {
          const geom = new EnhancedMockGeometry();
          geom.setType('cone', {radius, height});
          console.log(`🎯 createCone(${radius}, ${height})`);
          return geom;
        },
        
        createTorus: (majorRadius, minorRadius) => {
          const geom = new EnhancedMockGeometry();
          geom.setType('torus', {majorRadius, minorRadius});
          console.log(`🍩 createTorus(${majorRadius}, ${minorRadius})`);
          return geom;
        },
        
        unionShapes: (shape1, shape2) => {
          console.log('➕ unionShapes');
          const result = new EnhancedMockGeometry();
          result.setType('union', {
            shape1: shape1.getDebugInfo(),
            shape2: shape2.getDebugInfo()
          });
          return result;
        },
        
        cutShapes: (shape1, shape2) => {
          console.log('➖ cutShapes');
          const result = new EnhancedMockGeometry();
          result.setType('cut', {
            shape1: shape1.getDebugInfo(),
            shape2: shape2.getDebugInfo()
          });
          return result;
        },
        
        intersectShapes: (shape1, shape2) => {
          console.log('⋂ intersectShapes');
          const result = new EnhancedMockGeometry();
          result.setType('intersect', {
            shape1: shape1.getDebugInfo(),
            shape2: shape2.getDebugInfo()
          });
          return result;
        },
        
        addHole: (geometry, position, diameter, depth) => {
          console.log(`⚪ addHole at (${position.x}, ${position.y}, ${position.z}), diam: ${diameter}, depth: ${depth}`);
          const result = new EnhancedMockGeometry();
          result.setType('hole', {
            base: geometry.getDebugInfo(),
            position, diameter, depth
          });
          return result;
        },
        
        addFillet: (geometry, edgeIndex, radius) => {
          console.log(`✭ addFillet edge ${edgeIndex}, radius ${radius}`);
          const result = new EnhancedMockGeometry();
          result.setType('fillet', {
            base: geometry.getDebugInfo(),
            edgeIndex, radius
          });
          return result;
        },
        
        addChamfer: (geometry, edgeIndex, distance) => {
          console.log(`✦ addChamfer edge ${edgeIndex}, distance ${distance}`);
          const result = new EnhancedMockGeometry();
          result.setType('chamfer', {
            base: geometry.getDebugInfo(),
            edgeIndex, distance
          });
          return result;
        },
        
        extrude: (profile, distance) => {
          console.log(`🔺 extrude distance ${distance}`);
          const result = new EnhancedMockGeometry();
          result.setType('extrude', {
            profile: profile.getDebugInfo(),
            distance
          });
          return result;
        },
        
        revolve: (profile, axis, angle) => {
          console.log(`🌀 revolve angle ${angle}° around (${axis.x}, ${axis.y}, ${axis.z})`);
          const result = new EnhancedMockGeometry();
          result.setType('revolve', {
            profile: profile.getDebugInfo(),
            axis, angle
          });
          return result;
        },
        
        getMeshData: (geometry) => {
          if (geometry.isNull()) {
            return {
              vertices: new Float32Array(0),
              indices: new Uint32Array(0),
              normals: new Float32Array(0)
            };
          }
          
          const debugInfo = geometry.getDebugInfo();
          return createMeshData(debugInfo.type, debugInfo.dimensions);
        },
        
        getBoundingBox: (geometry) => {
          if (geometry.isNull()) {
            return {x: 0, y: 0, z: 0, width: 0, height: 0, depth: 0};
          }
          
          const debugInfo = geometry.getDebugInfo();
          const type = debugInfo.type;
          const dims = debugInfo.dimensions;
          
          if (type === 'box') {
            return {
              x: -dims.width/2, y: -dims.height/2, z: -dims.depth/2,
              width: dims.width, height: dims.height, depth: dims.depth
            };
          } else if (type === 'cylinder') {
            return {
              x: -dims.radius, y: -dims.height/2, z: -dims.radius,
              width: dims.radius * 2, height: dims.height, depth: dims.radius * 2
            };
          } else if (type === 'sphere') {
            return {
              x: -dims.radius, y: -dims.radius, z: -dims.radius,
              width: dims.radius * 2, height: dims.radius * 2, depth: dims.radius * 2
            };
          } else {
            // Default bounding box
            return {x: -50, y: -50, z: -50, width: 100, height: 100, depth: 100};
          }
        },
        
        analyzeManufacturability: (geometry) => {
          console.log('🔍 analyzeManufacturability');
          
          if (geometry.isNull()) {
            return {
              warnings: [{type: 'error', severity: 'error', message: 'Null geometry'}],
              scores: {machiningScore: 0, moldingScore: 0, printingScore: 0}
            };
          }
          
          const debugInfo = geometry.getDebugInfo();
          const complexity = debugInfo.type === 'union' || debugInfo.type === 'cut' ? 'high' : 'low';
          
          return {
            warnings: [],
            scores: {
              machiningScore: complexity === 'high' ? 70 : 90,
              moldingScore: complexity === 'high' ? 60 : 85,
              printingScore: complexity === 'high' ? 80 : 95
            }
          };
        },
        
        exportToSTEP: (geometry, filename) => {
          console.log(`💾 exportToSTEP(${filename})`);
          return !geometry.isNull();
        },
        
        exportToIGES: (geometry, filename) => {
          console.log(`💾 exportToIGES(${filename})`);
          return !geometry.isNull();
        },
        
        exportToSTL: (geometry, filename) => {
          console.log(`💾 exportToSTL(${filename})`);
          return !geometry.isNull();
        },
        
        // Debug method to inspect geometry
        debugGeometry: (geometry) => {
          return geometry.getDebugInfo();
        }
      };
      
      // Call onRuntimeInitialized if provided
      if (moduleOptions && moduleOptions.onRuntimeInitialized) {
        setTimeout(() => moduleOptions.onRuntimeInitialized(), 100);
      }
      
      setTimeout(() => resolve(mockModule), 200);
    });
  };
})();

// Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OCCTModule;
}

if (typeof window !== 'undefined') {
  window.OCCTModule = OCCTModule;
}

// ES6 module export
export default OCCTModule;
EOF

  # Create a minimal WASM file for compatibility
  echo "// Mock WASM for development" > occt.wasm
  
  echo "✅ Enhanced development build complete"
  echo "📊 Features:"
  echo "   • Functional mock geometry with state tracking"
  echo "   • Realistic mesh generation for basic shapes"
  echo "   • Bounding box calculations"
  echo "   • Manufacturability analysis"
  echo "   • Full API compatibility"
  echo ""
  echo "🚀 Ready for UI development!"
  echo "📋 For production OCCT: npm run build:occt:full"
fi

# Copy files to public directory
echo ""
echo "📦 Copying files to public/occt/..."
mkdir -p ../../public/occt
cp occt.js ../../public/occt/
cp occt.wasm ../../public/occt/
cp ../build/occt.d.ts ../../public/occt/
echo "✅ Files copied to public/occt/"

echo ""
echo "🎯 Build Summary:"
if [ "$USE_PREBUILT" = true ]; then
  echo "   • Mode: Production (with real OCCT WASM)"
  echo "   • Status: ✅ Ready for deployment"
else
  echo "   • Mode: Development (enhanced mock)"
  echo "   • Status: ✅ Ready for UI development"
  echo "   • Note: Use 'npm run build:occt:full' for production"
fi

echo ""
echo "📋 Available OCCT functions:"
echo "   • createBox, createCylinder, createSphere, createCone, createTorus"
echo "   • unionShapes, cutShapes, intersectShapes"
echo "   • addHole, addFillet, addChamfer"
echo "   • extrude, revolve"
echo "   • getMeshData, getBoundingBox"
echo "   • analyzeManufacturability"
echo "   • exportToSTEP, exportToIGES, exportToSTL"

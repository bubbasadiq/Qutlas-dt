// Mock OCCT Module for development
// This will be replaced by actual compiled WASM module from occt-wrapper/compile-wasm.sh

var OCCTModule = (function() {
  return function(moduleOptions) {
    return new Promise((resolve) => {
      console.warn('⚠️  Using mock OCCT module - compile actual WASM for production')
      
      // Call locateFile if provided
      if (moduleOptions && moduleOptions.locateFile) {
        moduleOptions.locateFile('occt.wasm')
      }
      
      // Mock Geometry class
      class MockGeometry {
        constructor() {
          this._isNull = false
        }
        isNull() {
          return this._isNull
        }
      }
      
      const mockModule = {
        Geometry: MockGeometry,
        
        createBox: (w, h, d) => {
          console.log(`Mock: createBox(${w}, ${h}, ${d})`)
          return new MockGeometry()
        },
        
        createCylinder: (r, h) => {
          console.log(`Mock: createCylinder(${r}, ${h})`)
          return new MockGeometry()
        },
        
        createSphere: (r) => {
          console.log(`Mock: createSphere(${r})`)
          return new MockGeometry()
        },
        
        createCone: (r, h) => {
          console.log(`Mock: createCone(${r}, ${h})`)
          return new MockGeometry()
        },
        
        createTorus: (major, minor) => {
          console.log(`Mock: createTorus(${major}, ${minor})`)
          return new MockGeometry()
        },
        
        unionShapes: (s1, s2) => {
          console.log('Mock: unionShapes')
          return new MockGeometry()
        },
        
        cutShapes: (s1, s2) => {
          console.log('Mock: cutShapes')
          return new MockGeometry()
        },
        
        intersectShapes: (s1, s2) => {
          console.log('Mock: intersectShapes')
          return new MockGeometry()
        },
        
        addHole: (geom, pos, diam, depth) => {
          console.log(`Mock: addHole at (${pos.x}, ${pos.y}, ${pos.z})`)
          return new MockGeometry()
        },
        
        addFillet: (geom, edge, rad) => {
          console.log(`Mock: addFillet edge ${edge}, radius ${rad}`)
          return new MockGeometry()
        },
        
        addChamfer: (geom, edge, dist) => {
          console.log(`Mock: addChamfer edge ${edge}, distance ${dist}`)
          return new MockGeometry()
        },
        
        extrude: (profile, dist) => {
          console.log(`Mock: extrude distance ${dist}`)
          return new MockGeometry()
        },
        
        revolve: (profile, axis, angle) => {
          console.log(`Mock: revolve angle ${angle}`)
          return new MockGeometry()
        },
        
        getMeshData: (geom) => {
          console.log('Mock: getMeshData')
          // Return mock mesh data for a simple box
          const vertices = {
            size: () => 24,
            get: (i) => {
              const coords = [
                -50, -50, -50, 50, -50, -50, 50, 50, -50, -50, 50, -50,
                -50, -50, 50, 50, -50, 50, 50, 50, 50, -50, 50, 50
              ]
              return coords[i] || 0
            }
          }
          
          const indices = {
            size: () => 36,
            get: (i) => {
              const idx = [
                0,1,2, 0,2,3, 4,5,6, 4,6,7,
                0,1,5, 0,5,4, 2,3,7, 2,7,6,
                0,3,7, 0,7,4, 1,2,6, 1,6,5
              ]
              return idx[i] || 0
            }
          }
          
          return { vertices, indices, normals: { size: () => 0 } }
        },
        
        getBoundingBox: (geom) => {
          console.log('Mock: getBoundingBox')
          return {
            x: -50, y: -50, z: -50,
            width: 100, height: 100, depth: 100
          }
        },
        
        analyzeManufacturability: (geom) => {
          console.log('Mock: analyzeManufacturability')
          return {
            warnings: [],
            scores: {
              machiningScore: 85,
              moldingScore: 75,
              printingScore: 90
            }
          }
        },
        
        exportToSTEP: (geom, filename) => {
          console.log(`Mock: exportToSTEP(${filename})`)
          return true
        },
        
        exportToIGES: (geom, filename) => {
          console.log(`Mock: exportToIGES(${filename})`)
          return true
        },
        
        exportToSTL: (geom, filename) => {
          console.log(`Mock: exportToSTL(${filename})`)
          return true
        }
      }
      
      // Call onRuntimeInitialized if provided
      if (moduleOptions && moduleOptions.onRuntimeInitialized) {
        setTimeout(() => moduleOptions.onRuntimeInitialized(), 100)
      }
      
      setTimeout(() => resolve(mockModule), 200)
    })
  }
})()

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OCCTModule
}

if (typeof window !== 'undefined') {
  window.OCCTModule = OCCTModule
}

export default OCCTModule

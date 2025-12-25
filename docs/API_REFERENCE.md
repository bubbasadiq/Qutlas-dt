# Cadmium-Core API Reference

## WASM Module Functions

### Basic Shape Creation

#### `create_box(width: f64, height: f64, depth: f64) -> Result<Mesh, JsValue>`

Creates a rectangular box centered at origin.

**Parameters:**
- `width`: Width in mm (X-axis), must be > 0.01mm
- `height`: Height in mm (Y-axis), must be > 0.01mm  
- `depth`: Depth in mm (Z-axis), must be > 0.01mm

**Returns:**
- `Result<Mesh, JsValue>`: Success with mesh data, or error with validation message

**Example:**
```javascript
const box = await cadmiumCore.create_box(100, 50, 25);
```

---

#### `create_cylinder(radius: f64, height: f64, segments: Option<u32>) -> Result<Mesh, JsValue>`

Creates a cylinder centered at origin, aligned along Y-axis.

**Parameters:**
- `radius`: Radius in mm, must be > 0.01mm
- `height`: Height in mm, must be > 0.01mm
- `segments`: Optional number of circular segments (default: 32), min 3, max 1000

**Returns:**
- `Result<Mesh, JsValue>`: Success with mesh data, or error

**Example:**
```javascript
const cylinder = await cadmiumCore.create_cylinder(25, 100, 32);
```

---

#### `create_sphere(radius: f64, segments_lat: Option<u32>, segments_lon: Option<u32>) -> Result<Mesh, JsValue>`

Creates a sphere centered at origin.

**Parameters:**
- `radius`: Radius in mm, must be > 0.01mm
- `segments_lat`: Latitude segments (default: 32), min 3, max 1000
- `segments_lon`: Longitude segments (default: 32), min 3, max 1000

**Returns:**
- `Result<Mesh, JsValue>`: Success with mesh data, or error

**Example:**
```javascript
const sphere = await cadmiumCore.create_sphere(50, 32, 32);
```

---

#### `create_cone(radius: f64, height: f64, segments: Option<u32>) -> Result<Mesh, JsValue>`

Creates a cone with base at bottom, apex at top.

**Parameters:**
- `radius`: Base radius in mm, must be > 0.01mm, should not exceed 2× height
- `height`: Height in mm, must be > 0.01mm
- `segments`: Circular segments (default: 32), min 3, max 1000

**Returns:**
- `Result<Mesh, JsValue>`: Success with mesh data, or error

**Example:**
```javascript
const cone = await cadmiumCore.create_cone(25, 75, 32);
```

---

#### `create_torus(major_radius: f64, minor_radius: f64, segments_major: Option<u32>, segments_minor: Option<u32>) -> Result<Mesh, JsValue>`

Creates a torus (donut shape) centered at origin.

**Parameters:**
- `major_radius`: Major (outer) radius in mm, must be > 0.01mm
- `minor_radius`: Minor (tube) radius in mm, must be > 0.01mm and < major_radius
- `segments_major`: Major circle segments (default: 32), min 3, max 1000
- `segments_minor`: Minor circle segments (default: 16), min 3, max 1000

**Returns:**
- `Result<Mesh, JsValue>`: Success with mesh data, or error

**Example:**
```javascript
const torus = await cadmiumCore.create_torus(50, 10, 32, 16);
```

---

### Boolean Operations

#### `boolean_union(mesh_a: &Mesh, mesh_b: &Mesh) -> Result<Mesh, JsValue>`

Combines two meshes using CSG union operation.

**Parameters:**
- `mesh_a`: First mesh
- `mesh_b`: Second mesh

**Returns:**
- `Result<Mesh, JsValue>`: Combined mesh with non-overlapping triangles from both

**Algorithm:**
- Keeps triangles from A outside B
- Keeps triangles from B outside A
- Preserves material from mesh_a

**Example:**
```javascript
const box1 = await cadmiumCore.create_box(100, 50, 25);
const box2 = await cadmiumCore.create_box(50, 100, 25);
const union = await cadmiumCore.boolean_union(box1, box2);
```

---

#### `boolean_subtract(base_mesh: &Mesh, tool_mesh: &Mesh) -> Result<Mesh, JsValue>`

Subtracts tool mesh from base mesh using CSG.

**Parameters:**
- `base_mesh`: Base mesh to subtract from
- `tool_mesh`: Tool mesh to subtract

**Returns:**
- `Result<Mesh, JsValue>`: Base mesh with tool volume removed

**Algorithm:**
- Keeps base triangles outside tool
- Adds inverted tool triangles inside base
- Preserves material from base_mesh

**Example:**
```javascript
const box = await cadmiumCore.create_box(100, 100, 20);
const cylinder = await cadmiumCore.create_cylinder(10, 25, 32);
const result = await cadmiumCore.boolean_subtract(box, cylinder);
```

---

#### `boolean_intersect(mesh_a: &Mesh, mesh_b: &Mesh) -> Result<Mesh, JsValue>`

Returns intersection (overlapping volume) of two meshes.

**Parameters:**
- `mesh_a`: First mesh
- `mesh_b`: Second mesh

**Returns:**
- `Result<Mesh, JsValue>`: Mesh containing only overlapping volume

**Algorithm:**
- Keeps triangles from A inside B
- Keeps triangles from B inside A
- Preserves material from mesh_a

**Example:**
```javascript
const sphere1 = await cadmiumCore.create_sphere(50, 32, 32);
const sphere2 = await cadmiumCore.create_sphere(50, 32, 32);
const lens = await cadmiumCore.boolean_intersect(sphere1, sphere2);
```

---

### Feature Operations

#### `add_hole(geometry_mesh: &Mesh, position_x: f64, position_y: f64, position_z: f64, diameter: f64, depth: f64) -> Result<Mesh, JsValue>`

Adds a cylindrical hole to geometry.

**Parameters:**
- `geometry_mesh`: Mesh to add hole to
- `position_x`: Hole center X coordinate (mm)
- `position_y`: Hole center Y coordinate (mm)
- `position_z`: Hole center Z coordinate (mm)
- `diameter`: Hole diameter (mm), must be > 0.01mm, max 1000mm
- `depth`: Hole depth (mm), must be > 0.01mm

**Returns:**
- `Result<Mesh, JsValue>`: Mesh with hole subtracted

**Implementation:**
- Creates cylinder at specified position
- Uses `boolean_subtract` to cut hole

**Example:**
```javascript
const box = await cadmiumCore.create_box(100, 100, 20);
const withHole = await cadmiumCore.add_hole(box, 0, 0, 0, 10, 15);
```

---

#### `add_fillet(geometry_mesh: &Mesh, edge_index: u32, radius: f64) -> Result<Mesh, JsValue>`

Adds a rounded fillet to an edge.

**Parameters:**
- `geometry_mesh`: Mesh to add fillet to
- `edge_index`: Edge index to fillet
- `radius`: Fillet radius (mm), must be > 0.01mm, max 100mm

**Returns:**
- `Result<Mesh, JsValue>`: Currently returns original mesh (implementation pending)

**Status:**
- 🚧 Validation implemented
- ⏳ Full edge detection and fillet generation pending

---

#### `add_chamfer(geometry_mesh: &Mesh, edge_index: u32, distance: f64) -> Result<Mesh, JsValue>`

Adds a beveled chamfer to an edge.

**Parameters:**
- `geometry_mesh`: Mesh to add chamfer to
- `edge_index`: Edge index to chamfer
- `distance`: Chamfer distance (mm), must be > 0.01mm, max 100mm

**Returns:**
- `Result<Mesh, JsValue>`: Currently returns original mesh (implementation pending)

**Status:**
- 🚧 Validation implemented
- ⏳ Full edge detection and chamfer generation pending

---

### Export Functions

#### `export_stl(mesh: &Mesh, filename: &str) -> Result<String, JsValue>`

Exports mesh to ASCII STL format.

**Parameters:**
- `mesh`: Mesh to export
- `filename`: Name for the STL solid

**Returns:**
- `Result<String, JsValue>`: STL file content as string

**Format:**
```
solid [filename]
  facet normal nx ny nz
    outer loop
      vertex x y z
      vertex x y z
      vertex x y z
    endloop
  endfacet
  ...
endsolid
```

**Example:**
```javascript
const box = await cadmiumCore.create_box(100, 50, 25);
const stl = await cadmiumCore.export_stl(box, "my_part");
// Download or save stl content
```

---

#### `export_obj(mesh: &Mesh, filename: &str) -> Result<String, JsValue>`

Exports mesh to Wavefront OBJ format.

**Parameters:**
- `mesh`: Mesh to export
- `filename`: Filename reference (added as comment)

**Returns:**
- `Result<String, JsValue>`: OBJ file content as string

**Format:**
```
# OBJ file exported from Cadmium-Core
# Filename: [filename]

v x y z
v x y z
...
f v1 v2 v3
f v1 v2 v3
...
```

**Example:**
```javascript
const cylinder = await cadmiumCore.create_cylinder(25, 100, 32);
const obj = await cadmiumCore.export_obj(cylinder, "cylinder.obj");
```

---

### Mesh Utilities

#### `compute_bounding_box(mesh: &Mesh) -> BoundingBox`

Computes axis-aligned bounding box for mesh.

**Parameters:**
- `mesh`: Mesh to analyze

**Returns:**
- `BoundingBox`: Object with min_x, min_y, min_z, max_x, max_y, max_z

**Example:**
```javascript
const box = await cadmiumCore.create_box(100, 50, 25);
const bbox = cadmiumCore.compute_bounding_box(box);
console.log(`Size: ${bbox.max_x - bbox.min_x} × ${bbox.max_y - bbox.min_y} × ${bbox.max_z - bbox.min_z}`);
```

---

#### `compute_mesh_hash(mesh: &Mesh) -> String`

Computes SHA-256 hash of mesh data for comparison.

**Parameters:**
- `mesh`: Mesh to hash

**Returns:**
- `String`: Hexadecimal hash string

**Use Cases:**
- Verify mesh didn't change
- Cache invalidation
- Determinism testing

**Example:**
```javascript
const mesh1 = await cadmiumCore.create_box(100, 50, 25);
const mesh2 = await cadmiumCore.create_box(100, 50, 25);
const hash1 = cadmiumCore.compute_mesh_hash(mesh1);
const hash2 = cadmiumCore.compute_mesh_hash(mesh2);
console.assert(hash1 === hash2, "Meshes should be identical");
```

---

### Material Functions

#### `create_aluminum_material() -> Material`

Creates aluminum 6061-T6 material preset.

**Properties:**
- Name: "Aluminum 6061-T6"
- Color: Light gray (0.75, 0.77, 0.78)
- Metallic: 0.85
- Roughness: 0.3
- Opacity: 1.0

---

#### `create_steel_material() -> Material`

Creates stainless steel 304 material preset.

**Properties:**
- Name: "Stainless Steel 304"
- Color: Gray (0.70, 0.72, 0.73)
- Metallic: 0.95
- Roughness: 0.2
- Opacity: 1.0

---

#### `create_plastic_material() -> Material`

Creates ABS plastic material preset.

**Properties:**
- Name: "ABS Plastic"
- Color: Light blue-gray (0.85, 0.85, 0.90)
- Metallic: 0.0
- Roughness: 0.5
- Opacity: 1.0

---

#### Other Material Presets

- `create_brass_material()`: Golden brass
- `create_copper_material()`: Copper color
- `create_titanium_material()`: Dark gray titanium

---

## Worker API

The Cadmium Worker provides async operations through postMessage.

### Operations

- `CREATE_BOX`: { width, height, depth }
- `CREATE_CYLINDER`: { radius, height, segments }
- `CREATE_SPHERE`: { radius, segmentsLat, segmentsLon }
- `CREATE_CONE`: { radius, height, segments }
- `CREATE_TORUS`: { majorRadius, minorRadius, segmentsMajor, segmentsMinor }
- `BOOLEAN_UNION`: { geometryId1, geometryId2 }
- `BOOLEAN_SUBTRACT`: { geometryId1, geometryId2 }
- `BOOLEAN_INTERSECT`: { geometryId1, geometryId2 }
- `ADD_HOLE`: { geometryId, position: {x, y, z}, diameter, depth }
- `ADD_FILLET`: { geometryId, edgeIndex, radius }
- `ADD_CHAMFER`: { geometryId, edgeIndex, distance }
- `EXPORT_STL`: { geometryId, filename }
- `EXPORT_OBJ`: { geometryId, filename }
- `CLEAR_CACHE`: {}
- `REMOVE_GEOMETRY`: { geometryId }

### React Hook

```typescript
import { useCadmiumWorker } from '@/hooks/use-cadmium-worker';

function MyComponent() {
  const cadmium = useCadmiumWorker();
  
  const createBox = async () => {
    if (!cadmium.isReady) {
      console.warn('Worker not ready');
      return;
    }
    
    try {
      const { geometryId, mesh } = await cadmium.createBox(100, 50, 25);
      console.log('Created box:', geometryId);
    } catch (error) {
      console.error('Failed to create box:', error);
    }
  };
  
  return (
    <button onClick={createBox} disabled={!cadmium.isReady}>
      Create Box
    </button>
  );
}
```

---

## Error Handling

All functions return `Result<T, JsValue>` and may throw validation errors:

### Common Errors

- **"width must be positive (got -10)"**: Negative dimension
- **"radius must be at least 0.01mm (got 0.005mm)"**: Below minimum
- **"Segments must be at least 3 (got 2)"**: Too few segments
- **"Minor radius (60) must be less than major radius (50)"**: Invalid torus
- **"Geometry not found in cache"**: Invalid geometry ID

### Best Practices

```typescript
try {
  const box = await cadmium.createBox(100, 50, 25);
} catch (error) {
  if (error instanceof Error) {
    // Show user-friendly error
    toast.error(`Failed to create box: ${error.message}`);
  }
}
```

---

## Performance Guidelines

### Operation Times (Typical)

- **Basic shapes**: < 50ms
- **Boolean operations**: 100-500ms
- **Hole operations**: 150-300ms
- **Export STL**: < 100ms

### Memory Usage

- **Cache limit**: 100MB (configurable)
- **Cache TTL**: 1 hour (configurable)
- **LRU eviction**: Automatic when limit exceeded

### Optimization Tips

1. **Reuse geometry IDs**: Cache prevents redundant operations
2. **Chain operations**: Minimize intermediate meshes
3. **Use lower segment counts**: For preview/draft mode
4. **Clear cache**: When switching projects

---

## Validation Rules

| Parameter | Min | Max | Default |
|-----------|-----|-----|---------|
| Dimensions (width, height, depth, radius) | 0.01mm | 10000mm | - |
| Segments | 3 | 1000 | 32 |
| Hole diameter | 0.01mm | 1000mm | - |
| Fillet/Chamfer | 0.01mm | 100mm | - |

---

## Version History

- **v0.1.0** (2024-12-25): Initial release with CSG operations, validation, materials, and export

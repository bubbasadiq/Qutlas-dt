# CSG (Constructive Solid Geometry) Implementation

## Overview

This document describes the CSG implementation in Cadmium-Core for boolean operations on 3D geometry.

## Architecture

### Core Components

1. **CSGMesh Structure** (`/wasm/cadmium-core/src/csg.rs`)
   - Represents a mesh as a collection of triangles
   - Includes AABB (Axis-Aligned Bounding Box) for spatial optimization
   - Provides conversion to/from buffer format

2. **Triangle Representation**
   - Each triangle stores 3 vertices and a normal vector
   - Normals computed using cross product for proper face orientation

3. **AABB (Axis-Aligned Bounding Box)**
   - Fast intersection tests before expensive triangle-level operations
   - Reduces computational complexity for disjoint geometries

## Boolean Operations

### Union

Combines two meshes by keeping triangles that are outside the other mesh.

**Algorithm:**
1. Test each triangle from Mesh A: keep if centroid is outside Mesh B
2. Test each triangle from Mesh B: keep if centroid is outside Mesh A
3. Merge results into single mesh

**Use Cases:**
- Combining separate parts into an assembly
- Adding features that don't overlap existing geometry

### Subtract

Removes the tool mesh from the base mesh.

**Algorithm:**
1. Keep triangles from base mesh where centroid is outside tool mesh
2. Add inverted triangles from tool mesh where centroid is inside base mesh
3. Inversion ensures proper inside/outside orientation

**Use Cases:**
- Creating holes and cavities
- Removing material for pockets and cutouts

### Intersect

Returns only the overlapping volume of two meshes.

**Algorithm:**
1. Keep triangles from Mesh A where centroid is inside Mesh B
2. Keep triangles from Mesh B where centroid is inside Mesh A
3. Merge results

**Use Cases:**
- Finding the common volume between parts
- Creating interference fits
- Analyzing overlaps

## Inside/Outside Classification

### Ray Casting Method

**Algorithm:**
1. Cast ray from test point in +X direction
2. Count intersections with mesh triangles
3. Odd count = inside, even count = outside

**Implementation:**
- Uses Möller-Trumbore ray-triangle intersection test
- Handles edge cases with epsilon tolerance (1e-10)

### Möller-Trumbore Algorithm

Fast ray-triangle intersection test:

```
1. Compute edge vectors e1 = v1 - v0, e2 = v2 - v0
2. Calculate determinant: det = dot(ray_dir, cross(e2, e1))
3. If |det| < epsilon: ray parallel to triangle (no intersection)
4. Compute barycentric coordinates u, v
5. If u, v, (1-u-v) all in [0,1]: intersection exists
6. Return intersection distance t
```

## Performance Characteristics

### Time Complexity

- **Union:** O(n + m) where n, m are triangle counts
- **Subtract:** O(n + m)
- **Intersect:** O(n + m)
- Each operation includes O(k) inside/outside tests where k is retained triangle count

### Space Complexity

- Input meshes: O(n + m)
- Result mesh: O(n + m) worst case
- Cache memory: managed with LRU eviction

### Optimization Strategies

1. **AABB Pre-filtering**
   - Quick rejection of non-overlapping regions
   - Reduces unnecessary triangle tests

2. **Centroid Testing**
   - Simplified inside/outside classification
   - Faster than full triangle clipping
   - Sufficient for most CAD operations

3. **Vertex Welding**
   - Deduplicates vertices within tolerance (1e-6)
   - Reduces memory footprint
   - Improves rendering performance

## Limitations & Future Enhancements

### Current Limitations

1. **Centroid-based classification**
   - May miss thin features where triangle extends across boundary
   - Works well for typical CAD parts with reasonable feature sizes

2. **No exact triangle clipping**
   - Simplified approach trades precision for speed
   - Suitable for visualization and manufacturing (0.1mm tolerances)

3. **No mesh repair**
   - Assumes input meshes are manifold and watertight
   - Non-manifold edges or holes may cause artifacts

### Planned Enhancements

1. **BVH (Bounding Volume Hierarchy)**
   - Tree structure for faster spatial queries
   - O(log n) intersection tests vs. O(n) current

2. **Exact Triangle Clipping**
   - Compute exact intersection edges
   - Generate new triangles at boundaries
   - Required for high-precision engineering

3. **Robust Mesh Repair**
   - Detect and fix non-manifold edges
   - Fill holes automatically
   - Ensure watertight results

4. **Parallel Processing**
   - Multi-threaded triangle tests
   - SIMD optimizations for ray casting
   - GPU acceleration for large meshes

## Usage Examples

### Basic Operations

```rust
// Create two boxes
let box1 = create_box(100.0, 50.0, 25.0)?;
let box2 = create_box(50.0, 100.0, 25.0)?;

// Union - combine both boxes
let union_result = boolean_union(&box1, &box2)?;

// Subtract - cut box2 from box1
let subtract_result = boolean_subtract(&box1, &box2)?;

// Intersect - keep only overlap
let intersect_result = boolean_intersect(&box1, &box2)?;
```

### Adding a Hole

```rust
let base = create_box(100.0, 100.0, 20.0)?;
let result = add_hole(&base, 0.0, 0.0, 0.0, 10.0, 15.0)?;
// Creates 10mm diameter hole, 15mm deep at center
```

### Chaining Operations

```rust
let part = create_box(100.0, 100.0, 20.0)?;
let with_hole = add_hole(&part, 0.0, 0.0, 0.0, 10.0, 15.0)?;
let boss = create_cylinder(20.0, 10.0, Some(32))?;
let final_part = boolean_union(&with_hole, &boss)?;
```

## Testing

### Unit Tests

Located in `/wasm/cadmium-core/src/lib.rs`:

```rust
#[test]
fn test_boolean_operations() {
    let box1 = create_box(100.0, 50.0, 25.0).unwrap();
    let box2 = create_box(50.0, 100.0, 25.0).unwrap();
    
    let union = boolean_union(&box1, &box2).unwrap();
    assert!(union.vertex_count() > 0);
    
    let subtract = boolean_subtract(&box1, &box2).unwrap();
    assert!(subtract.vertex_count() > 0);
}
```

### Integration Tests

E2E tests in `/tests/e2e/` verify the complete workflow:
- User creates geometry via AI chat
- Geometry generated client-side
- Boolean operations applied
- Result rendered in viewport

## References

- Möller-Trumbore: "Fast, Minimum Storage Ray-Triangle Intersection" (1997)
- CSG Theory: Requicha & Voelcker, "Constructive Solid Geometry" (1977)
- BVH: "Bounding Volume Hierarchies" - Real-Time Rendering, 4th Edition

## Changelog

- **2024-12-25**: Initial CSG implementation with union, subtract, intersect
- **2024-12-25**: Added ray-casting inside/outside classification
- **2024-12-25**: Implemented AABB optimization
- **2024-12-25**: Added hole operation using CSG subtract

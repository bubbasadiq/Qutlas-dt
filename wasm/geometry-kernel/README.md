# Qutlas Geometry Kernel

A production-grade Rust/WASM geometry compiler for the Adam CAD Platform.

## Overview

This kernel compiles Intent IR (from TypeScript) into deterministic meshes and provides manufacturability validation. It's designed for:

- **Real-time performance**: <300ms compilation for complex parts
- **Deterministic output**: Same intent → identical hash → identical mesh
- **Reliability**: Zero panics, comprehensive error handling
- **Production-ready**: Optimized WASM < 2.5MB, full test coverage

## Architecture

```
src/
├── lib.rs              # WASM entry point & public API
├── types.rs            # Core data structures
├── errors.rs           # Error handling with JSON serialization
├── hashing.rs          # Deterministic Blake3 hashing
├── geometry/           # Primitives and operations
│   ├── mod.rs
│   ├── primitives.rs    # Box, Cylinder, Sphere, Cone, Torus
│   ├── operations.rs   # Union, Subtract, Intersect
│   ├── bounding_box.rs # AABB for optimization
│   └── constraints.rs  # Manufacturability validation
└── compiler/           # Compilation pipeline
    ├── mod.rs
    ├── csg_tree.rs     # CSG tree representation
    ├── intent_parser.rs # Parse Intent IR to CSG
    ├── csg_evaluator.rs # Evaluate CSG to mesh
    └── csg_compiler.rs # High-level orchestration
```

## Building

### Prerequisites

- Rust 1.70+ with WASM target
- wasm-pack: `cargo install wasm-pack`

### Build

```bash
./build.sh
```

Or manually:

```bash
wasm-pack build --target bundler --release
```

Output:

- `pkg/geometry_kernel.wasm` - WASM binary (~500KB)
- `pkg/geometry_kernel.js` - JavaScript glue code
- `pkg/geometry_kernel.d.ts` - TypeScript definitions
- `pkg/package.json` - NPM package metadata

### Test

```bash
# Unit tests
cargo test

# WASM tests
wasm-pack test --node

# All tests together
cargo test && wasm-pack test --node
```

## Usage

### TypeScript Integration

```typescript
import { GeometryKernel } from './geometry-kernel/pkg';

// Initialize kernel
const kernel = new GeometryKernel();

// Define intent
const intent = {
  part: 'test_part',
  operations: [
    {
      id: 'box1',
      type: 'box',
      parameters: { width: 10, height: 10, depth: 10 },
      timestamp: 0,
    },
  ],
  constraints: [],
};

// Compile to mesh
const result = kernel.compile_intent(JSON.stringify(intent));
const data = JSON.parse(result);

if (data.status === 'compiled') {
  const mesh = data.mesh;

  // Render in Three.js
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(mesh.vertices, 3),
  );
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(mesh.normals, 3),
  );
  geometry.setIndex(mesh.indices);
}
```

### Advanced Features

```typescript
// Set mesh subdivision level (4-64, default: 16)
kernel.set_subdivisions(32);

// Pre-flight validation
const validation = kernel.validate_csg(JSON.stringify(intent));
const isValid = JSON.parse(validation).valid;

// Cache management
kernel.clear_cache();
const stats = kernel.get_cache_stats();

// Get kernel version
const version = kernel.get_kernel_version();
```

## API Reference

### GeometryKernel

#### Constructor

```typescript
new GeometryKernel();
```

#### Methods

##### `compile_intent(intent_json: string): string`

Compile Intent IR to geometry.

**Parameters:**

- `intent_json` - JSON string of `GeometryIR`

**Returns:**

- JSON string of `CompileResult`

**Result Structure:**

```typescript
{
  status: "compiled" | "cached" | "fallback" | "error",
  intent_hash: string,  // Blake3 content hash
  mesh?: {
    vertices: Float32Array,    // [x, y, z, x, y, z, ...]
    indices: Uint32Array,      // [i0, i1, i2, ...]
    normals: Float32Array,     // [nx, ny, nz, ...]
  },
  mfg_report?: {
    valid: boolean,
    violations: ConstraintViolation[],
    warnings: ConstraintViolation[]
  },
  error?: {
    code: string,
    message: string,
    hint?: string
  }
}
```

##### `validate_csg(intent_json: string): string`

Validate intent without full compilation.

**Returns:**

```typescript
{
  valid: boolean,
  error?: KernelError
}
```

##### `get_kernel_version(): string`

Get kernel version information.

**Returns:**

```typescript
{
  name: string,
  version: string,
  rustc: string
}
```

##### `clear_cache(): void`

Clear compilation cache.

##### `get_cache_stats(): string`

Get cache statistics.

**Returns:**

```typescript
{
  size: number; // Number of cached items
}
```

##### `set_subdivisions(subdivisions: number): void`

Set mesh subdivision level for curved primitives.

**Parameters:**

- `subdivisions` - 4 to 64 (default: 16)

## Data Structures

### GeometryIR

```typescript
interface GeometryIR {
  part: string;
  operations: Intent[];
  constraints: ManufacturingConstraint[];
}
```

### Intent

```typescript
type Intent = PrimitiveIntent | OperationIntent;

interface PrimitiveIntent {
  id: string;
  type: 'box' | 'cylinder' | 'sphere' | 'cone' | 'torus';
  parameters: Record<string, number>;
  transform?: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  timestamp: number;
}

interface OperationIntent {
  id: string;
  type: 'union' | 'subtract' | 'intersect' | 'fillet' | 'hole' | 'chamfer';
  target: string;
  operand?: string;
  parameters: Record<string, any>;
  timestamp: number;
}
```

### ManufacturingConstraint

```typescript
interface ManufacturingConstraint {
  type:
    | 'min_wall_thickness'
    | 'tool_diameter'
    | 'max_overhang'
    | 'process'
    | 'material';
  value: any;
}
```

## Supported Primitives

### Box

```typescript
{
  type: "box",
  parameters: {
    width: number,   // X dimension
    height: number,  // Y dimension
    depth: number    // Z dimension
  }
}
```

### Cylinder

```typescript
{
  type: "cylinder",
  parameters: {
    radius: number,  // Base radius
    height: number  // Cylinder height
  }
}
```

### Sphere

```typescript
{
  type: "sphere",
  parameters: {
    radius: number  // Sphere radius
  }
}
```

### Cone

```typescript
{
  type: "cone",
  parameters: {
    radius: number,  // Base radius
    height: number  // Cone height
  }
}
```

### Torus

```typescript
{
  type: "torus",
  parameters: {
    major_radius: number,  // Distance from center to tube center
    minor_radius: number  // Tube radius
  }
}
```

## Supported Operations

### Union

```typescript
{
  type: "union",
  target: "shape1_id",
  operand: "shape2_id"
}
```

### Subtract

```typescript
{
  type: "subtract",
  target: "target_id",
  operand: "tool_id"
}
```

### Intersect

```typescript
{
  type: "intersect",
  target: "shape1_id",
  operand: "shape2_id"
}
```

## Error Codes

| Code                    | Description                       |
| ----------------------- | --------------------------------- |
| `INVALID_JSON`          | Invalid JSON input                |
| `INVALID_INTENT`        | Invalid intent structure          |
| `UNKNOWN_PRIMITIVE`     | Unknown primitive type            |
| `UNKNOWN_OPERATION`     | Unknown operation type            |
| `MISSING_PARAMETER`     | Missing required parameter        |
| `INVALID_PARAMETER`     | Invalid parameter value           |
| `CIRCULAR_REFERENCE`    | Circular reference in CSG tree    |
| `CSG_ERROR`             | CSG operation failed              |
| `MESH_GENERATION_ERROR` | Mesh generation failed            |
| `CONSTRAINT_VIOLATION`  | Manufacturing constraint violated |
| `INTERNAL_ERROR`        | Internal kernel error             |

## Performance

### Benchmarks (Development Builds)

- Box generation: <1ms
- Cylinder generation: <2ms
- Sphere generation: <3ms
- Union operation: <5ms
- Full compilation (simple part): <10ms
- Full compilation (complex part): <50ms

### Optimization Goals (Release Builds)

- Primitive generation: <5ms each
- CSG compilation: <100ms for deep trees
- Mesh generation: <50ms
- Total end-to-end: <300ms for complex parts

## Testing

### Unit Tests

Run all unit tests:

```bash
cargo test
```

Run specific module tests:

```bash
cargo test geometry::primitives
cargo test compiler::csg_evaluator
```

### WASM Tests

```bash
wasm-pack test --node
```

### Coverage

Target: >80% code coverage

## Troubleshooting

### Build Issues

**Issue**: `cargo: command not found`

- **Solution**: Install Rust from https://rustup.rs/

**Issue**: `wasm-pack: command not found`

- **Solution**: `cargo install wasm-pack`

**Issue**: WASM binary too large

- **Solution**: Ensure release profile is enabled: `wasm-pack build --release`

### Runtime Issues

**Issue**: Kernel returns "error" status

- **Solution**: Check the `error` field in the result for details

**Issue**: Mesh has incorrect normals

- **Solution**: Increase subdivision level with `set_subdivisions()`

**Issue**: Slow compilation

- **Solution**: Reduce subdivision level or clear cache

## Development

### Adding a New Primitive

1. Add variant to `PrimitiveType` in `types.rs`
2. Implement struct in `geometry/primitives.rs`
3. Implement `Primitive` trait
4. Add test case in `geometry/primitives.rs`

### Adding a New Operation

1. Add variant to `OperationType` in `types.rs`
2. Implement in `geometry/operations.rs`
3. Update parser in `compiler/intent_parser.rs`
4. Add test coverage

## License

MIT

## Contributors

Qutlas Platform Team

## Future Work

### Phase 2.5: Enhanced CSG

- Full boolean operations with truck-modeling
- Mesh boolean operations (CSG on meshes)
- Volume-preserving operations

### Phase 3: STEP Export

- B-rep extraction from meshes
- STEP file generation (ISO 10303-21)
- Manufacturing system integration

### Phase 4: Advanced Features

- GPU-accelerated mesh generation
- Streaming mesh generation
- Advanced manufacturability analysis
- Cost estimation
- DFM recommendations

# Qutlas Geometry Kernel

Rust-based deterministic geometry kernel compiled to WebAssembly.

## Overview

This kernel provides:
- **Deterministic compilation**: Same intent → same hash → same output
- **CSG → B-rep collapse**: Converts constructive solid geometry to boundary representation
- **Manufacturability enforcement**: Validates design constraints during compilation
- **Content-addressed caching**: Hash-based caching for instant recompilation

## Architecture

```
Intent AST (JSON) → Rust Kernel → {
  - Preview Mesh (Float32Array)
  - Canonical Topology (B-rep)
  - STEP Export (manufacturing)
  - Intent Hash (caching)
}
```

## Building

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack
```

### Build

```bash
./build.sh
```

This compiles the kernel to `pkg/` directory.

## Development Status

### ✅ Implemented
- [x] Intent AST parsing
- [x] Deterministic hashing (blake3)
- [x] WASM scaffolding
- [x] Error handling
- [x] JSON serialization

### 🚧 In Progress (Stubs)
- [ ] CSG tree compilation
- [ ] Manufacturability validation
- [ ] CSG → B-rep collapse
- [ ] Mesh generation
- [ ] STEP export

## Usage

```typescript
import { GeometryKernel } from '@/wasm/geometry-kernel/pkg'

const kernel = new GeometryKernel()
const result = kernel.compile_intent(JSON.stringify(intentIR))
```

## Testing

```bash
cargo test
wasm-pack test --node
```

## Dependencies

- `wasm-bindgen`: Rust-WASM bridge
- `serde`: JSON serialization
- `blake3`: Deterministic hashing

Future:
- `nalgebra`: Linear algebra
- `truck-*`: CAD geometry libraries
- `parry3d`: Collision detection / CSG operations

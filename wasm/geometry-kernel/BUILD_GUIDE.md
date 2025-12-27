# Geometry Kernel - Quick Start Guide

## Prerequisites

You'll need Rust and wasm-pack to build the kernel:

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install wasm-pack
cargo install wasm-pack

# Add WASM target
rustup target add wasm32-unknown-unknown
```

## Quick Start

### 1. Build the Kernel

```bash
cd wasm/geometry-kernel
./build.sh
```

This will:

- Compile Rust code to WASM
- Generate JavaScript bindings
- Create TypeScript type definitions
- Output to `pkg/` directory

**Expected output**: ~500KB WASM binary in `pkg/geometry_kernel.wasm`

### 2. Run Tests

```bash
# Unit tests (Rust)
cargo test

# WASM tests (Node.js)
wasm-pack test --node

# All tests together
cargo test && wasm-pack test --node
```

### 3. Verify Build

Check that the following files exist in `pkg/`:

```
pkg/
├── geometry_kernel.wasm      # WASM binary
├── geometry_kernel.js        # JavaScript bindings
├── geometry_kernel.d.ts     # TypeScript definitions
├── package.json             # NPM package metadata
└── geometry_kernel_bg.wasm  # WASM (backup)
```

## Integration with TypeScript

The kernel is already integrated with the intent bridge. Just build it:

```bash
cd wasm/geometry-kernel
./build.sh
cd ../..
```

The TypeScript code in `lib/geometry/kernel-bridge.ts` will automatically detect and use the kernel.

### Usage Example

```typescript
import { GeometryKernel } from '../../wasm/geometry-kernel/pkg';

const kernel = new GeometryKernel();

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

const result = kernel.compile_intent(JSON.stringify(intent));
const data = JSON.parse(result);

if (data.status === 'compiled') {
  console.log('Mesh generated!');
  console.log('Vertices:', data.mesh.vertices.length / 3);
  console.log('Triangles:', data.mesh.indices.length / 3);
}
```

## Troubleshooting

### Build Issues

**Issue: `cargo: command not found`**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Issue: `wasm-pack: command not found`**

```bash
cargo install wasm-pack
```

**Issue: "error: linking with cc failed"**

```bash
# Install C compiler (Linux)
sudo apt-get install build-essential

# On macOS with Xcode Command Line Tools
xcode-select --install
```

**Issue: WASM binary too large (> 2.5MB)**

- Make sure you're using release builds: `wasm-pack build --release`
- The release profile is already configured for size optimization

### Test Issues

**Issue: Tests fail with "error: linking with cc"**

- Install C compiler (see above)

**Issue: WASM tests fail with "wasm-bindgen-test: not found"**

```bash
cargo install wasm-bindgen-cli
```

## Performance Verification

After building, verify performance:

```typescript
const kernel = new GeometryKernel();
const start = performance.now();

const result = kernel.compile_intent(JSON.stringify(intent));

const end = performance.now();
console.log(`Compilation took ${end - start}ms`);
```

**Expected times** (development builds):

- Simple primitive: <10ms
- Union of 2 primitives: <15ms
- Complex part (10+ operations): <50ms

**Release builds** (with `./build.sh`):

- Should be 2-5x faster

## Cleanup

Remove build artifacts:

```bash
cargo clean
rm -rf pkg/
```

## Next Steps

1. Build the kernel: `./build.sh`
2. Run tests: `cargo test && wasm-pack test --node`
3. Integrate with TypeScript bridge (already done in `lib/geometry/kernel-bridge.ts`)
4. Test in studio UI: Start development server and create geometry

## Documentation

- `README.md` - Full API documentation
- `IMPLEMENTATION.md` - Technical implementation details
- `PHASE2_KERNEL_DEVELOPMENT_COMPLETE.md` - Phase 2 completion report

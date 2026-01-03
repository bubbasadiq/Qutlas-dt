# WASM Build Instructions

## Prerequisites

1. **Rust** (latest stable version)
   ```bash
   # Install from https://rustup.rs/
   # Or: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **wasm-pack**
   ```bash
   cargo install wasm-pack
   ```

## Building WASM Modules

### 1. Cadmium Core

```bash
cd wasm/cadmium-core
./build.sh
# Or manually:
wasm-pack build --release --target bundler
```

**Output**: `wasm/cadmium-core/pkg/`

### 2. Geometry Kernel

```bash
cd wasm/geometry-kernel
./build.sh
# Or manually:
wasm-pack build --target bundler --out-dir pkg --release
```

**Output**: `wasm/geometry-kernel/pkg/`

## Build All

From project root:

```bash
# Build cadmium-core
cd wasm/cadmium-core && wasm-pack build --release --target bundler && cd ../..

# Build geometry-kernel
cd wasm/geometry-kernel && wasm-pack build --target bundler --out-dir pkg --release && cd ../..
```

## Verification

After building, verify the output:

- `wasm/cadmium-core/pkg/cadmium_core.js` exists
- `wasm/cadmium-core/pkg/cadmium_core_bg.wasm` exists
- `wasm/geometry-kernel/pkg/qutlas_geometry_kernel.js` exists
- `wasm/geometry-kernel/pkg/qutlas_geometry_kernel_bg.wasm` exists

## Usage in Code

The built modules are imported in:
- `workers/cadmium-worker.ts` → `wasm/cadmium-core/pkg/cadmium_core`
- `lib/geometry/kernel-bridge.ts` → `wasm/geometry-kernel/pkg`

## Troubleshooting

### Build fails with "target not found"
```bash
rustup target add wasm32-unknown-unknown
```

### wasm-pack not found
```bash
cargo install wasm-pack
```

### Permission denied on build.sh
```bash
chmod +x wasm/*/build.sh
```


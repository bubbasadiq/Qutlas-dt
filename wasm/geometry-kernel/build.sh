#!/bin/bash

# Build Rust kernel to WASM
# This script compiles the Rust geometry kernel to WebAssembly

set -e

echo "🔨 Building Rust Geometry Kernel to WASM..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Please install it:"
    echo "   cargo install wasm-pack"
    exit 1
fi

# Build with wasm-pack
wasm-pack build \
  --target bundler \
  --out-dir pkg \
  --release

# Move the output to a location accessible by the frontend
if [ -d "pkg" ]; then
    echo "✅ Kernel built successfully"
    echo "📦 Output location: wasm/geometry-kernel/pkg"
    echo ""
    echo "To use in your app, import from: @/wasm/geometry-kernel/pkg"
else
    echo "❌ Build failed - no output directory found"
    exit 1
fi

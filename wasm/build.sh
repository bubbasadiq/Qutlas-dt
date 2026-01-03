#!/bin/bash
# Build all WASM modules
# Requires: Rust and wasm-pack installed

set -e

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust not found. Please install from https://rustup.rs/"
    echo "   Or run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Add wasm32 target if not present
echo "🔧 Ensuring wasm32-unknown-unknown target is installed..."
rustup target add wasm32-unknown-unknown

# Build Cadmium Core
echo ""
echo "🔨 Building Cadmium Core..."
cd wasm/cadmium-core
wasm-pack build --release --target bundler
cd ../..

# Build Geometry Kernel
echo ""
echo "🔨 Building Geometry Kernel..."
cd wasm/geometry-kernel
wasm-pack build --target bundler --out-dir pkg --release
cd ../..

echo ""
echo "✅ All WASM modules built successfully!"
echo ""
echo "📦 Output locations:"
echo "   - wasm/cadmium-core/pkg/"
echo "   - wasm/geometry-kernel/pkg/"


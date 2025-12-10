#!/bin/bash
# Build WASM module using wasm-pack

set -e

echo "Building cadmium-core WASM module..."

# Install wasm-pack if not present
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh
fi

# Build release bundle
wasm-pack build --release --target bundler

echo "✓ WASM build complete: pkg/cadmium_core.js"
echo "✓ Module ready for import in frontend workers"

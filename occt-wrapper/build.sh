#!/bin/bash

set -e

echo "🔨 Building OCCT for WASM..."

# Ensure Emscripten is available
if ! command -v emcc &> /dev/null; then
  echo "❌ Emscripten not found. Please install it first."
  echo "Visit https://emscripten.org/docs/getting_started/downloads.html"
  exit 1
fi

# Create build directory
mkdir -p build_wasm
cd build_wasm

# Clean previous build
rm -rf *

# Configure OCCT
echo "Configuring OCCT build..."
cmake .. \
  -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE=$(pwd)/../emscripten/emscripten.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=OFF \
  -DBUILD_TESTING=OFF \
  -DBUILD_DOC=OFF \
  -DBUILD_SAMPLES=OFF

# Build
echo "Building OCCT libraries..."
ninja

echo "✅ OCCT built successfully"
echo "Libraries are in: $(pwd)"

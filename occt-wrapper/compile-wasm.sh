#!/bin/bash

set -e

echo "🔨 Compiling OCCT WASM bindings..."

# Ensure Emscripten is available
if ! command -v emcc &> /dev/null; then
  echo "❌ Emscripten not found. Please install it first."
  echo "Visit https://emscripten.org/docs/getting_started/downloads.html"
  exit 1
fi

# Create build directory
mkdir -p build
cd build

# Compile C++ bindings to WASM
echo "Compiling bindings..."
emcc \
  -o occt.js \
  ../src/occt_bindings.cpp \
  -I/usr/include/opencascade \
  -I/usr/local/include/opencascade \
  -I/opt/opencascade/inc \
  -L/usr/lib \
  -L/usr/local/lib \
  -L/opt/opencascade/lib \
  -lTKernel \
  -lTKMath \
  -lTKG3d \
  -lTKG2d \
  -lTKBRep \
  -lTKGeomBase \
  -lTKGeomAlgo \
  -lTKTopAlgo \
  -lTKPrim \
  -lTKBO \
  -lTKMesh \
  -lTKFillet \
  -lTKOffset \
  -lTKXSBase \
  -lTKSTEP \
  -lTKSTEPBase \
  -lTKSTEPAttr \
  -lTKSTEP209 \
  -lTKIGES \
  -lTKSTL \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s TOTAL_MEMORY=536870912 \
  -s EXPORTED_FUNCTIONS='["_malloc","_free"]" \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall","getValue","setValue"]" \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='OCCTModule' \
  -lembind \
  -O3 \
  -std=c++17 \
  -fexceptions

echo "✅ Wasm compilation complete"
echo "Output files:"
echo "  - occt.wasm"
echo "  - occt.js"
echo "  - occt.d.ts (automatically generated)"
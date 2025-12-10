#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$ROOT_DIR/build"
INSTALL_LIB_DIR="$ROOT_DIR/../go-server/libs"

mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# If OCCT is in a non-standard location, pass -DCMAKE_PREFIX_PATH=/path/to/opencascade to cmake
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . -- -j$(nproc)

# Copy produced .so to go-server/libs for easy linking by Go build (adjust paths if needed)
mkdir -p "$INSTALL_LIB_DIR"
if [ -f libocct_wrapper.so ]; then
  cp libocct_wrapper.so "$INSTALL_LIB_DIR/"
else
  # Try output under CMake build dir naming
  cp *.so "$INSTALL_LIB_DIR/" || true
fi

echo "Built occt_wrapper and copied .so to $INSTALL_LIB_DIR"

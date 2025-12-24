#!/bin/bash

# OCCT WASM Deployment Validation Script
# Checks that all required WASM files are present and properly configured

set -e

echo "🔍 Validating OCCT WASM deployment..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if public/occt directory exists
if [ -d "public/occt" ]; then
  echo -e "${GREEN}✓${NC} public/occt directory exists"
else
  echo -e "${RED}✗${NC} public/occt directory not found"
  ERRORS=$((ERRORS + 1))
fi

# Check for WASM files
if [ -f "public/occt/occt.wasm" ]; then
  FILE_SIZE=$(wc -c < "public/occt/occt.wasm")
  if [ $FILE_SIZE -lt 100 ]; then
    echo -e "${YELLOW}⚠${NC} public/occt/occt.wasm exists but appears to be mock/placeholder (${FILE_SIZE} bytes)"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✓${NC} public/occt/occt.wasm exists (${FILE_SIZE} bytes)"
  fi
else
  echo -e "${RED}✗${NC} public/occt/occt.wasm not found"
  ERRORS=$((ERRORS + 1))
fi

# Check for JS glue code
if [ -f "public/occt/occt.js" ]; then
  if grep -q "Mock OCCT Module" "public/occt/occt.js"; then
    echo -e "${YELLOW}⚠${NC} public/occt/occt.js is using mock implementation"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✓${NC} public/occt/occt.js exists"
  fi
else
  echo -e "${RED}✗${NC} public/occt/occt.js not found"
  ERRORS=$((ERRORS + 1))
fi

# Check loader implementation
if [ -f "lib/occt-loader.ts" ]; then
  echo -e "${GREEN}✓${NC} lib/occt-loader.ts exists"
else
  echo -e "${RED}✗${NC} lib/occt-loader.ts not found"
  ERRORS=$((ERRORS + 1))
fi

# Check worker implementation
if [ -f "occt-wrapper/src/occt-worker.ts" ]; then
  echo -e "${GREEN}✓${NC} occt-wrapper/src/occt-worker.ts exists"
else
  echo -e "${RED}✗${NC} occt-wrapper/src/occt-worker.ts not found"
  ERRORS=$((ERRORS + 1))
fi

# Check hook implementation
if [ -f "hooks/use-occt-worker.ts" ]; then
  echo -e "${GREEN}✓${NC} hooks/use-occt-worker.ts exists"
else
  echo -e "${RED}✗${NC} hooks/use-occt-worker.ts not found"
  ERRORS=$((ERRORS + 1))
fi

# Check next.config.mjs for WASM handling
if [ -f "next.config.mjs" ]; then
  if grep -q "\.wasm" "next.config.mjs"; then
    echo -e "${GREEN}✓${NC} next.config.mjs includes WASM handling"
  else
    echo -e "${YELLOW}⚠${NC} next.config.mjs may not handle WASM files correctly"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}✗${NC} next.config.mjs not found"
  ERRORS=$((ERRORS + 1))
fi

# Check TypeScript types
if [ -f "lib/occt-client.ts" ]; then
  echo -e "${GREEN}✓${NC} lib/occt-client.ts exists"
else
  echo -e "${RED}✗${NC} lib/occt-client.ts not found"
  ERRORS=$((ERRORS + 1))
fi

# Check mesh generator
if [ -f "lib/mesh-generator.ts" ]; then
  echo -e "${GREEN}✓${NC} lib/mesh-generator.ts exists"
else
  echo -e "${RED}✗${NC} lib/mesh-generator.ts not found"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "─────────────────────────────────────"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo "OCCT WASM integration is ready for deployment."
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
  echo "Deployment may work but consider addressing warnings."
  echo ""
  echo "If using mock WASM files, run: npm run build:occt"
  echo "to compile real OCCT bindings (requires Emscripten)."
  exit 0
else
  echo -e "${RED}✗ ${ERRORS} error(s) and ${WARNINGS} warning(s) found${NC}"
  echo "Please fix errors before deploying."
  exit 1
fi

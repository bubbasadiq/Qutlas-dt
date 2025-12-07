#!/bin/bash
# Qutlas Development Setup Script

set -e

echo "🚀 Setting up Qutlas development environment..."

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Terraform required"; exit 1; }

# Install WASM toolchain if needed
if ! command -v wasm-pack &> /dev/null; then
  echo "Installing wasm-pack..."
  curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh
fi

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend
npm install
npm run build:wasm
cd ..

# Backend setup
echo "📦 Setting up backend..."
cd backend
npm install
cd ..

# Database setup
echo "🗄️  Initializing database..."
export DATABASE_URL="postgresql://localhost/qutlas_dev"
npx migrate-cli up

echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  Development: npm run dev (in frontend and backend dirs)"
echo "  Production: terraform apply (in infra dir)"

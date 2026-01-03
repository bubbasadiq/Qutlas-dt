# PowerShell build script for WASM modules
# Requires: Rust and wasm-pack installed

param(
    [switch]$Cadmium,
    [switch]$Kernel,
    [switch]$All
)

$ErrorActionPreference = "Stop"

# Check if Rust is installed
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Rust not found. Please install from https://rustup.rs/" -ForegroundColor Red
    Write-Host "   Or run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh" -ForegroundColor Yellow
    exit 1
}

# Check if wasm-pack is installed
if (-not (Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
    Write-Host "❌ wasm-pack not found. Installing..." -ForegroundColor Yellow
    cargo install wasm-pack
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install wasm-pack" -ForegroundColor Red
        exit 1
    }
}

# Add wasm32 target if not present
Write-Host "🔧 Ensuring wasm32-unknown-unknown target is installed..." -ForegroundColor Cyan
rustup target add wasm32-unknown-unknown 2>&1 | Out-Null

# Build Cadmium Core
if ($Cadmium -or $All) {
    Write-Host "`n🔨 Building Cadmium Core..." -ForegroundColor Cyan
    Push-Location "wasm/cadmium-core"
    try {
        wasm-pack build --release --target bundler
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Cadmium Core built successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Cadmium Core build failed" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# Build Geometry Kernel
if ($Kernel -or $All) {
    Write-Host "`n🔨 Building Geometry Kernel..." -ForegroundColor Cyan
    Push-Location "wasm/geometry-kernel"
    try {
        wasm-pack build --target bundler --out-dir pkg --release
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Geometry Kernel built successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Geometry Kernel build failed" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# Default: build all if no flags specified
if (-not $Cadmium -and -not $Kernel -and -not $All) {
    Write-Host "`n🔨 Building all WASM modules..." -ForegroundColor Cyan
    
    # Build Cadmium Core
    Push-Location "wasm/cadmium-core"
    try {
        wasm-pack build --release --target bundler
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Cadmium Core build failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Cadmium Core built successfully" -ForegroundColor Green
    } finally {
        Pop-Location
    }
    
    # Build Geometry Kernel
    Push-Location "wasm/geometry-kernel"
    try {
        wasm-pack build --target bundler --out-dir pkg --release
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Geometry Kernel build failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Geometry Kernel built successfully" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host "`n✅ All WASM modules built successfully!" -ForegroundColor Green
Write-Host "`n📦 Output locations:" -ForegroundColor Cyan
Write-Host "   - wasm/cadmium-core/pkg/" -ForegroundColor White
Write-Host "   - wasm/geometry-kernel/pkg/" -ForegroundColor White


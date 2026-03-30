#!/bin/bash
set -e

echo "Building application for production..."

# Route npm cache to /tmp which is always writable in container environments
export NPM_CONFIG_CACHE=/tmp/.npm-cache

# Generate BUILD_ID
BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")
BUILD_ID="${BUILD_TIMESTAMP}_${GIT_HASH}"
echo "BUILD_ID: ${BUILD_ID}"

echo "{\"buildId\": \"${BUILD_ID}\", \"timestamp\": \"$(date -Iseconds)\", \"env\": \"production\"}" > build-info.json
echo "build-info.json created"

# Step 1: Install ALL dependencies (devDeps needed for build step: vite, esbuild, tsc)
echo "Installing dependencies..."
npm install --no-audit --no-fund

# Verify critical production package is installed
if [ ! -d "node_modules/drizzle-orm" ]; then
  echo "ERROR: drizzle-orm not found after npm install!"
  exit 1
fi
echo "node_modules verified OK (drizzle-orm present)"

# Step 2: Build frontend (Vite) and backend (esbuild)
echo "Building frontend and backend..."
npm run build

# Step 3: Set up server/public directory
echo "Setting up server/public..."
mkdir -p server/public
rm -rf server/public/*

# Step 4: Copy fresh Vite build to server/public
echo "Copying frontend to server/public..."
if [ -d "dist/public" ]; then
  cp -r dist/public/* server/public/
  echo "Frontend files copied"
else
  echo "ERROR: dist/public not found!"
  exit 1
fi

# Step 5: Copy data files to dist/
echo "Copying data files..."
[ -f "build-info.json" ]              && cp build-info.json dist/
[ -f "server/strong-data.json" ]      && cp server/strong-data.json dist/      && echo "strong-data.json copied"
[ -f "server/study-modules-data.json" ] && cp server/study-modules-data.json dist/ && echo "study-modules-data.json copied"

# Step 6: Verify final build output
if [ ! -f "server/public/index.html" ]; then
  echo "ERROR: index.html not found in server/public"
  exit 1
fi

if [ ! -f "dist/index.js" ]; then
  echo "ERROR: dist/index.js not found"
  exit 1
fi

echo ""
echo "Build complete!"
echo "  Frontend : server/public/"
echo "  Backend  : dist/index.js"
echo "  Packages : node_modules/ (all deps — no prune needed, image < 3GB)"
echo "  Ready    : npm run start"

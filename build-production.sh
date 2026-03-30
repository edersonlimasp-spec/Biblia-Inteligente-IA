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

# Step 1: Install ALL dependencies (devDeps needed to compile frontend + bundle server)
echo "Installing dependencies..."
npm install --no-audit --no-fund

if [ ! -d "node_modules/drizzle-orm" ]; then
  echo "ERROR: drizzle-orm not found after npm install!"
  exit 1
fi
echo "Dependencies installed OK"

# Step 2: Build frontend with Vite (uses real vite.config.ts with all plugins)
echo "Building frontend (Vite)..."
node_modules/.bin/vite build

if [ ! -d "dist/public" ]; then
  echo "ERROR: Vite build did not produce dist/public/"
  exit 1
fi
echo "Frontend built OK"

# Step 3: Build a SELF-CONTAINED server bundle
# All npm packages are bundled INLINE into dist/index.js — no node_modules needed at runtime.
# This is critical for Replit autoscale (Cloud Run) where the build environment's
# node_modules is NOT persisted to the runtime container.
#
# Technique:
#   - Temporarily swap vite.config.ts with a production shim so esbuild can bundle
#     server/vite.ts without pulling in @vitejs/plugin-react, lightningcss, etc.
#   - Use --alias:vite=./server/shims/vite-shim.js to stub out the vite package
#     (server/vite.ts imports vite at module level for setupVite — dev only, never called in prod)
#   - Add createRequire banner so CJS packages (express, depd, etc.) work inside ESM bundle
echo "Building self-contained server bundle..."

cp vite.config.ts vite.config.ts.bak
cp server/shims/vite-config-shim.ts vite.config.ts

node_modules/.bin/esbuild server/index.ts \
  --platform=node \
  --bundle \
  --format=esm \
  --outdir=dist \
  --external:*.node \
  --alias:vite=./server/shims/vite-shim.js \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
  --log-level=warning

cp vite.config.ts.bak vite.config.ts
rm vite.config.ts.bak

echo "Server bundle OK: $(du -sh dist/index.js | cut -f1) (fully self-contained)"

# Step 4: Set up server/public directory
echo "Setting up server/public..."
mkdir -p server/public
rm -rf server/public/*
cp -r dist/public/* server/public/
echo "Frontend files copied to server/public/"

# Step 5: Copy data files to dist/
echo "Copying data files..."
[ -f "build-info.json" ]                && cp build-info.json dist/
[ -f "server/strong-data.json" ]        && cp server/strong-data.json dist/        && echo "  strong-data.json copied"
[ -f "server/study-modules-data.json" ] && cp server/study-modules-data.json dist/ && echo "  study-modules-data.json copied"

# Step 6: Final verification
if [ ! -f "server/public/index.html" ]; then
  echo "ERROR: index.html not found in server/public"
  exit 1
fi
if [ ! -f "dist/index.js" ]; then
  echo "ERROR: dist/index.js not found"
  exit 1
fi

echo ""
echo "========================================"
echo "Build complete!"
echo "  Frontend : server/public/"
echo "  Backend  : dist/index.js ($(du -sh dist/index.js | cut -f1), self-contained)"
echo "  Runtime  : No node_modules required"
echo "  Command  : npm run start"
echo "========================================"

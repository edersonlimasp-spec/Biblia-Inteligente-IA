#!/bin/bash
set -e

echo "🔨 Building application for production..."

# Generate BUILD_ID (timestamp + short git hash if available)
BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")
BUILD_ID="${BUILD_TIMESTAMP}_${GIT_HASH}"
echo "📌 BUILD_ID: ${BUILD_ID}"

# Write BUILD_ID to a file that will be bundled
echo "{\"buildId\": \"${BUILD_ID}\", \"timestamp\": \"$(date -Iseconds)\", \"env\": \"production\"}" > build-info.json
echo "✅ build-info.json created"

# Step 0: Configure npm for network resilience
echo "⚙️  Configuring npm for better network stability..."
npm config set registry https://registry.npmjs.org/
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# Step 1: Install dependencies with resilient options
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund

# Step 2: Build frontend and backend
echo "🏗️  Building frontend and backend..."
npm run build

# Step 3: Ensure server/public directory exists
echo "📁 Ensuring server/public directory exists..."
mkdir -p server/public

# Step 4: Clear old files from server/public
echo "🗑️  Clearing old build files..."
rm -rf server/public/*

# Step 5: Copy fresh build from dist/public to server/public
# This is critical for production - the server looks for files in server/public
echo "📦 Copying frontend to server/public..."
if [ -d "dist/public" ]; then
  cp -r dist/public/* server/public/
  echo "✅ Frontend files copied to server/public"
else
  echo "⚠️  Warning: dist/public not found!"
  exit 1
fi

# Step 6: Also keep backup in dist/public for safety
echo "💾 Maintaining backup in dist/public..."
mkdir -p dist/public || true

# Step 6.5: Copy build-info.json to dist for production
echo "📌 Copying build-info.json to dist..."
if [ -f "build-info.json" ]; then
  cp build-info.json dist/
  echo "✅ build-info.json copied to dist/"
else
  echo "⚠️  Warning: build-info.json not found!"
fi

# Step 6.6: Copy Strong's dictionary data to dist for production
echo "📚 Copying Strong's dictionary data..."
if [ -f "server/strong-data.json" ]; then
  cp server/strong-data.json dist/
  echo "✅ strong-data.json copied to dist/"
else
  echo "⚠️  Warning: server/strong-data.json not found!"
fi

# Step 6.6: Copy Study Modules data to dist for production
echo "📖 Copying Study Modules data..."
if [ -f "server/study-modules-data.json" ]; then
  cp server/study-modules-data.json dist/
  echo "✅ study-modules-data.json copied to dist/"
else
  echo "⚠️  Warning: server/study-modules-data.json not found!"
fi

# Step 7: Verify files exist
if [ ! -f "server/public/index.html" ]; then
  echo "❌ ERROR: index.html not found in server/public"
  exit 1
fi

echo ""
echo "✅ Build complete!"
echo "   Frontend: server/public/"
echo "   Backend: dist/index.js"
echo "   Ready to run: npm run start"

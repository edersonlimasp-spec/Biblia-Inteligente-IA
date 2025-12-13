#!/bin/bash
set -e

echo "🔨 Building application for production..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm ci

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

# Step 6.5: Copy Strong's dictionary data to dist for production
echo "📚 Copying Strong's dictionary data..."
if [ -f "server/strong-data.json" ]; then
  cp server/strong-data.json dist/
  echo "✅ strong-data.json copied to dist/"
else
  echo "⚠️  Warning: server/strong-data.json not found!"
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

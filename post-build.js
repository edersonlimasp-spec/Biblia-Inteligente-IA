#!/usr/bin/env node
/**
 * Post-build script to ensure frontend files are available for production serving
 * This synchronizes dist/public/ with what the server will look for in production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source: where Vite outputs the frontend
const sourceDir = path.join(__dirname, 'dist', 'public');

// Destinations: where server looks for files in production
const destinations = [
  path.join(__dirname, 'server', 'public'),
];

console.log('🔄 Post-build sync starting...');
console.log(`   Source: ${sourceDir}`);

if (!fs.existsSync(sourceDir)) {
  console.warn(`⚠️  Source directory not found: ${sourceDir}`);
  process.exit(1);
}

// Copy data files to dist/ for production seeding
const dataFiles = [
  { src: 'server/strong-data.json', dest: 'dist/strong-data.json' },
  { src: 'server/study-modules-data.json', dest: 'dist/study-modules-data.json' },
];

console.log('📦 Copying data files for production seeding...');
for (const { src, dest } of dataFiles) {
  const srcPath = path.join(__dirname, src);
  const destPath = path.join(__dirname, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`   ✓ Copied: ${src} -> ${dest}`);
  } else {
    console.warn(`   ⚠️ Source not found: ${src}`);
  }
}

for (const destDir of destinations) {
  try {
    // Ensure destination exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`   ✓ Created: ${destDir}`);
    }

    // Clear destination
    const files = fs.readdirSync(destDir);
    for (const file of files) {
      const filePath = path.join(destDir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }

    // Copy files
    fs.cpSync(sourceDir, destDir, { recursive: true, force: true });
    console.log(`   ✓ Synced to: ${destDir}`);
  } catch (error) {
    console.error(`   ❌ Error syncing to ${destDir}:`, error.message);
    process.exit(1);
  }
}

console.log('✅ Post-build sync complete!');

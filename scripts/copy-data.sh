#!/bin/bash
# Copy data files to dist folder after build
cp server/strong-data.json dist/ 2>/dev/null || echo "strong-data.json not found"
cp server/study-modules-data.json dist/ 2>/dev/null || echo "study-modules-data.json not found"
echo "Data files copied to dist/"

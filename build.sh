#!/bin/bash
set -e

echo "📦 Instalando dependências..."
npm install --frozen-lockfile

echo "🔨 Compilando..."
npm run build

echo "✅ Build completo!"

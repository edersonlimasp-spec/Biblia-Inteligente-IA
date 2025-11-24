#!/bin/bash
# Script para copiar strong-data.json para dist/ após build
# Uso: bash copy-strong-data.sh

echo "📦 Copiando strong-data.json para dist/..."

if [ ! -f "server/strong-data.json" ]; then
  echo "❌ Erro: server/strong-data.json não encontrado"
  exit 1
fi

if [ ! -d "dist" ]; then
  echo "⚠️ Diretório dist/ não existe. Execute 'npm run build' primeiro."
  exit 1
fi

cp server/strong-data.json dist/strong-data.json

if [ $? -eq 0 ]; then
  echo "✅ strong-data.json copiado com sucesso para dist/"
  ls -lh dist/strong-data.json
else
  echo "❌ Erro ao copiar arquivo"
  exit 1
fi

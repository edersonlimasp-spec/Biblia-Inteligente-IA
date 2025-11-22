#!/bin/bash

echo "================================================"
echo "  VALIDAÇÃO - Bíblia Inteligente em Produção"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark() {
  echo -e "${GREEN}✅${NC} $1"
}

fail_mark() {
  echo -e "${RED}❌${NC} $1"
}

warning_mark() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

echo "CHECKLIST PRÉ-DEPLOYMENT:"
echo ""

# 1. Check .replit file
echo "1️⃣  Verificando .replit..."
if grep -q 'build = \["npm", "ci", "&&", "npm", "run", "build"\]' .replit; then
  check_mark ".replit está configurado corretamente com npm ci"
else
  fail_mark ".replit NÃO tem 'npm ci' no build command!"
  echo "   Você DEVE editar .replit conforme PRODUCTION_DEPLOYMENT_GUIDE.md"
  exit 1
fi
echo ""

# 2. Check package-lock.json
echo "2️⃣  Verificando package-lock.json..."
if [ -f "package-lock.json" ]; then
  check_mark "package-lock.json existe (necessário para npm ci)"
else
  fail_mark "package-lock.json NÃO encontrado!"
  exit 1
fi
echo ""

# 3. Check build directory
echo "3️⃣  Verificando build..."
if [ -d "dist" ] && [ -d "dist/public" ]; then
  check_mark "dist/public existe (build frontend compilado)"
  if [ -f "dist/index.js" ]; then
    SIZE=$(du -sh dist/index.js | cut -f1)
    check_mark "dist/index.js existe (tamanho: $SIZE)"
  else
    fail_mark "dist/index.js não encontrado!"
  fi
else
  warning_mark "dist/public não encontrado - rode: npm run build"
fi
echo ""

# 4. Check database
echo "4️⃣  Verificando Database..."
if [ -n "$DATABASE_URL" ]; then
  check_mark "DATABASE_URL configurado em environment"
else
  warning_mark "DATABASE_URL não está configurado!"
  echo "   Você precisa configurar isso em: Settings > Environment variables"
fi
echo ""

# 5. Check dependencies
echo "5️⃣  Verificando dependências críticas..."
DEPS=("vite" "esbuild" "tsx" "express" "drizzle-orm")
for dep in "${DEPS[@]}"; do
  if [ -d "node_modules/$dep" ]; then
    check_mark "$dep está instalado"
  else
    fail_mark "$dep NÃO está instalado!"
  fi
done
echo ""

# 6. Summary
echo "================================================"
echo "  RESUMO"
echo "================================================"
echo ""
echo "✅ Se TUDO passou:"
echo "   1. Clique em 'Publish' no Replit"
echo "   2. Aguarde 3-5 minutos"
echo "   3. Teste em: https://bibliainteligente.replit.app"
echo ""
echo "❌ Se algo falhou:"
echo "   Siga os passos em PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""

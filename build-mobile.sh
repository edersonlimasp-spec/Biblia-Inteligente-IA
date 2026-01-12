#!/bin/bash

# ============================================
# Script de Build para Apps Móveis
# Bíblia Inteligente - Capacitor Build
# ============================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        Bíblia Inteligente - Mobile Build Script           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto."
    exit 1
fi

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist/

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Build de produção
echo "🔨 Gerando build de produção..."
npm run build

# Verificar se o build foi bem sucedido
if [ ! -d "dist/public" ]; then
    echo "❌ Build falhou. Verifique os erros acima."
    exit 1
fi

echo "✅ Build de produção concluído!"
echo ""

# Sincronizar com Capacitor
echo "📱 Sincronizando com plataformas nativas..."
npx cap sync

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    BUILD CONCLUÍDO!                       ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  Próximos passos:                                         ║"
echo "║                                                           ║"
echo "║  ANDROID:                                                 ║"
echo "║  1. Execute: npx cap open android                         ║"
echo "║  2. No Android Studio: Build > Generate Signed Bundle     ║"
echo "║  3. Upload no Google Play Console                         ║"
echo "║                                                           ║"
echo "║  iOS (requer macOS):                                      ║"
echo "║  1. Execute: npx cap open ios                             ║"
echo "║  2. No Xcode: Product > Archive                           ║"
echo "║  3. Distribute App > App Store Connect                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📖 Consulte PUBLICACAO_LOJAS_COMPLETO.md para instruções detalhadas."

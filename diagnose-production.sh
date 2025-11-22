#!/bin/bash

echo "🔍 Diagnóstico de Publicação - Bíblia Hebraico & Grego"
echo "======================================================"
echo ""

# 1. Verificar DATABASE_URL
echo "1️⃣ Verificando DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não está configurado!"
  echo "   Solução: Vá em Secrets e configure DATABASE_URL"
else
  echo "✅ DATABASE_URL encontrado"
  # Tentar conectar (sem mostrar credenciais)
  if psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    echo "✅ Conexão com banco de dados funcionando"
  else
    echo "❌ Erro ao conectar no banco de dados"
  fi
fi

echo ""

# 2. Verificar tabelas principais
echo "2️⃣ Verificando tabelas do banco..."
TABLES="users subscriptions strong_entries password_reset_tokens"
for table in $TABLES; do
  if psql $DATABASE_URL -c "\d $table" > /dev/null 2>&1; then
    COUNT=$(psql $DATABASE_URL -c "SELECT COUNT(*) FROM $table;" -t)
    echo "✅ Tabela '$table' existente ($COUNT registros)"
  else
    echo "❌ Tabela '$table' NÃO encontrada"
  fi
done

echo ""

# 3. Verificar se Strong foi importado
echo "3️⃣ Verificando dados do Strong..."
STRONG_COUNT=$(psql $DATABASE_URL -c "SELECT COUNT(*) FROM strong_entries;" -t 2>/dev/null || echo "0")
if [ "$STRONG_COUNT" -gt 10000 ]; then
  echo "✅ Strong importado ($STRONG_COUNT entradas)"
elif [ "$STRONG_COUNT" -gt 0 ]; then
  echo "⚠️ Strong parcialmente importado ($STRONG_COUNT entradas)"
  echo "   Solução: Executar: tsx scripts/import-full-strongs.ts"
else
  echo "❌ Strong NÃO foi importado (0 entradas)"
  echo "   Solução: Executar: tsx scripts/import-full-strongs.ts"
fi

echo ""
echo "======================================================"
echo "✅ Diagnóstico concluído!"

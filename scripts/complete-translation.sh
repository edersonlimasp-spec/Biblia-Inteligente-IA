#!/bin/bash

echo "🚀 INICIANDO TRADUÇÃO COMPLETA DO DICIONÁRIO STRONG'S"
echo "===================================================="
echo ""

# Loop até completar todas as traduções
while true; do
  # Verificar quantas entradas faltam traduzir
  remaining=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM strong_entries WHERE portuguese_def IS NULL;" | tr -d ' ')
  
  if [ "$remaining" -eq "0" ]; then
    echo ""
    echo "🎉 =========================================="
    echo "🎉 TRADUÇÃO 100% CONCLUÍDA!"
    echo "🎉 =========================================="
    break
  fi
  
  echo "📊 Faltam $remaining entradas. Executando rodada de tradução..."
  
  # Executar tradução com timeout de 10 minutos
  timeout 600 tsx scripts/translate-remaining.ts 2>&1 | tail -5
  
  # Pequena pausa entre rodadas
  sleep 2
done

# Mostrar estatísticas finais
echo ""
echo "📊 ESTATÍSTICAS FINAIS:"
psql $DATABASE_URL -c "SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN portuguese_def IS NOT NULL THEN 1 END) as com_portugues,
  ROUND(COUNT(CASE WHEN portuguese_def IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) as percentual
FROM strong_entries;"

echo ""
echo "✅ Processo concluído com sucesso!"

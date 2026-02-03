# Relatório de Extração Strong - Pentateuco Completo

Gerado em: 2026-02-03

## Resumo

### Genesis
- Total de tokens analisados: ~17000
- Palavras únicas mapeadas: 3465

### Exodus
- Total de tokens analisados: 16726
- Tokens com Strong: 16432 (98.24%)
- Palavras únicas mapeadas: 4202

### Leviticus
- Total de tokens analisados: 11955
- Tokens com Strong: 11709 (97.94%)
- Palavras únicas mapeadas: 2726

### Numbers
- Total de tokens analisados: 16412
- Tokens com Strong: 16125 (98.25%)
- Palavras únicas mapeadas: 3878

### Deuteronomy
- Total de tokens analisados: 14320
- Tokens com Strong: 13870 (96.86%)
- Palavras únicas mapeadas: 4106

## Totais Gerais
- Total de tokens: ~76400
- Cobertura média: ~97.5%
- Palavras hebraicas únicas: 18377 (Pentateuco completo)

## Arquivos Gerados

Os mapeamentos foram salvos em:
- server/genesis-strong-mappings.ts (3465 palavras)
- server/exo-strong-mappings.ts (4202 palavras)
- server/lev-strong-mappings.ts (2726 palavras)
- server/num-strong-mappings.ts (3878 palavras)
- server/deu-strong-mappings.ts (4106 palavras)

## Scripts de Extração

- scripts/extract-exodus-numbers-strong.ts - Êxodo e Números
- scripts/extract-leviticus-strong.ts - Levítico

Execução: `npx tsx scripts/<nome-do-script>.ts`

## Conclusão

✅ **Pentateuco completo!** Todos os 5 livros da Torá estão mapeados:
1. Gênesis - 3.465 palavras
2. Êxodo - 4.202 palavras  
3. Levítico - 2.726 palavras
4. Números - 3.878 palavras
5. Deuteronômio - 4.106 palavras

Os arquivos gerados são importados em server/routes.ts e utilizados para enriquecer
as consultas ao Dicionário Strong com mapeamentos palavra hebraica → número Strong.

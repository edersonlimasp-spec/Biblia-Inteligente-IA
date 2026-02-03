# Relatório de Extração Strong - Pentateuco

Gerado em: 2026-02-03

## Resumo

### Genesis
- Total de tokens analisados: ~17000
- Palavras únicas mapeadas: 3465

### Exodus
- Total de tokens analisados: 16726
- Tokens com Strong: 16432 (98.24%)
- Tokens sem Strong: 294
- Palavras únicas mapeadas: 4202

### Leviticus
- Total de tokens analisados: 11955
- Tokens com Strong: 11709 (97.94%)
- Tokens sem Strong: 246
- Palavras únicas mapeadas: 2726

### Numbers
- Total de tokens analisados: 16412
- Tokens com Strong: 16125 (98.25%)
- Tokens sem Strong: 287
- Palavras únicas mapeadas: 3878

## Totais Gerais
- Total de tokens: ~62000
- Cobertura média: ~98%
- Palavras hebraicas únicas: 14271 (Gênesis + Êxodo + Levítico + Números)

## Arquivos Gerados

Os mapeamentos foram salvos em:
- server/genesis-strong-mappings.ts (3465 palavras)
- server/exo-strong-mappings.ts (4202 palavras)
- server/lev-strong-mappings.ts (2726 palavras)
- server/num-strong-mappings.ts (3878 palavras)

## Scripts de Extração

- scripts/extract-exodus-numbers-strong.ts - Êxodo e Números
- scripts/extract-leviticus-strong.ts - Levítico

Execução: `npx tsx scripts/<nome-do-script>.ts`

## Conclusão

A extração foi realizada com sucesso para os 4 primeiros livros do Pentateuco.
O único livro pendente é Deuteronômio.

Os arquivos gerados são importados em server/routes.ts e utilizados para enriquecer
as consultas ao Dicionário Strong com mapeamentos palavra hebraica → número Strong.

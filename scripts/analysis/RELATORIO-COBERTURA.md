# Relatório de Cobertura — App vs PDF SBB Almeida-Strong

## Metodologia

- PDF da SBB: 9.9MB, 178.529 linhas, 66 livros detectados (todos)
- Filtros aplicados: códigos de morfologia hebraica (8675-8829) excluídos; dicionário Strong (lin 72216-122555) excluído
- Comparação: SET de números Strong únicos (4-5 dígitos zero-padded)

## Resumo Geral

| Testamento | Strongs únicos PDF | Strongs únicos DB | DB ≥ PDF? | Lacunas (PDF não em DB) |
|---|---:|---:|---|---:|
| Antigo Testamento (39 livros) | 36.795 | 38.196 | parcial | 228 |
| Novo Testamento (27 livros) | 17.786 | 20.228 | parcial | 1.344 |
| **TOTAL** | **54.581** | **58.424** | — | **1.572** |

## Achados por testamento

### Antigo Testamento — 99,4% cobertura média

A maioria dos livros está com **99-100% de cobertura**. As lacunas são pequenas (1-14 Strongs únicos por livro). Casos repetidos:

- **H582** (enosh = "homem mortal") — aparece em vários livros onde OSHB usa sinônimos H120 (adam) ou H376 (ish). Nossa base TEM H582 (42 entradas), só não nas mesmas posições do SBB.
- **H3415** (ya'ar = "ser ruim") — variante de tagueamento OSHB
- **H1928** (Hadar) — nome próprio
- **H7125** (qiruth = "ao encontro") — preposição composta

Ester, Ageu, Malaquias: **100% cobertura**.

### Novo Testamento — 91,6% cobertura média

Lacuna grande mas **explicável**: SBB usa Strong's Exhaustive (número por **forma flexionada**), enquanto UGNT usa apenas o **lema** (raiz).

Caso real — João 1:1 ("era o Verbo"):

| Token | Nossa base (lema) | SBB PDF (flexionado) |
|---|---|---|
| ἦν (era) | **G1510** εἰμί | **G2258** ἦν (impf 3sg) |
| ἐστιν (é) | **G1510** εἰμί | **G2076** ἐστιν (pres 3sg) |
| ἔσται (será) | **G1510** εἰμί | **G2071** ἔσται (fut 3sg) |
| εἶπεν (disse) | **G3004** λέγω | **G2036** εἶπον (aor de λέγω) |
| σου (teu) | **G4771** σύ | **G4675** σου (gen sg) |
| μου (meu) | **G1473** ἐγώ | **G3450** μου (gen sg) |

Os 1.344 Strongs "faltantes" do NT são quase todos formas flexionadas de **εἰμί, λέγω, ἐγώ, σύ, οὗτος** (cerca de 30 lemas geram milhares de tokens). Funcionalmente todo token NT já tem Strong (137.990 = 100% via lema), mas o número exibido difere do PDF SBB.

## Decisão necessária

Para a base atender literalmente "≥ cobertura SBB para todo livro", precisaria:

1. **Tabela de aliases lema→flexionado** (NT): mapear (lema_strong, morfologia) → strong_exhaustive. Cobre ~95% do gap NT com ~50 mapeamentos. Solução limpa, baseada em dados que já temos (campo `morphology`).

2. **Adicionar tags de sinônimos** (OT): para os ~228 strongs OT, ou aceitar que OSHB e SBB divergem em escolhas sinonímicas, ou adicionar uma camada de "alias" para os mais frequentes (H582, H3415).

3. **Status atual já é ótimo na prática**: 100% dos tokens NT têm Strong (lema); 99%+ dos tokens OT também. O modal Strong abre a entrada do dicionário com a definição correta independente da convenção.

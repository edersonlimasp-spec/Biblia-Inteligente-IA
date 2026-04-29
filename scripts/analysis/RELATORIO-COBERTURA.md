# Relatório de Cobertura Strong NT — Bíblia Inteligente

**Data:** Abril 2026
**Escopo:** Novo Testamento (27 livros) — alinhamento com Strongs do PDF SBB exaustivo.

## Estratégia Adotada (Opção C)

Construir **aliases lema → Strong flexionado** apenas no NT (OT já está em 99,4%),
preservando totalmente a base de Strongs original (`bible_words.strong_number`) e
adicionando uma nova coluna `bible_words.pdf_strong` com o Strong SBB exaustivo
quando ele difere do lema.

### Regras implementadas (`scripts/analysis/build-nt-strong-aliases.mjs`)

| Lema (UGNT) | Forma flexionada gerada | Critério |
|-------------|-------------------------|----------|
| εἰμί (G1510) | G2258 (ἦν), G2076 (ἐστί), G2070 (ἐσμέν), G2071 (ἔσται), G2077 (ἔστω), G2468 (ἴσθι) … | Tempo / pessoa / número da morfologia |
| λέγω (G3004) | G2036 (εἶπον/εἶπεν aoristo) | Tempo aoristo |
| ἐγώ (G1473) | μου→G3450, ἐμοῦ→G1700, μοι→G3427, ἐμοί→G1698, με→G3165, ἐμέ→G1691, ἡμεῖς/ἡμῶν/ἡμᾶς/ἡμῖν → G2249/G2257/G2248/G2254 | Caso + pessoa + número + palavra original (enclítica vs tônica) |
| σύ (G4771) | σου→G4675, σοι→G4671, σε→G4571, ὑμεῖς/ὑμῶν/ὑμᾶς/ὑμῖν → G5210/G5216/G5209/G5213 | Caso + pessoa + número |
| οὗτος (G3778) | G5124 (τοῦτο NNS), G5023 (ταῦτα NNP), G5026 (ταύτην AFS) | Caso + gênero + número |
| ἐκεῖνος (G1565) | G1565 | Lema |
| εἷς (G1520) | G3391 (μία formas femininas) | Morfologia gênero F |
| Ἱεροσόλυμα (G2414) | G2419 (Ἰερουσαλήμ indeclinável) | Palavra original |
| ἐσθίω (G2068) | G5315 (φάγω/ἔφαγον raiz aorista) | Palavra original |
| ὁράω (G3708) | G2400 (ἰδού), G2396 (ἴδε), G3700 (ὤφθη/ὀφθήσομαι/ὄψομαι passivo-futuro) | Palavra original |
| μιμνῄσκομαι (G3403) | G3415 (μνάομαι, lema clássico SBB) | Sempre |

Total: **11 869 tokens NT** receberam `pdf_strong` adicional ao lema UGNT.

## Resultado por livro

| Livro | PDF únicos | DB únicos (lema+alias) | Faltam | **Antes** | **Depois** |
|-------|-----------:|-----------------------:|-------:|----------:|-----------:|
| Mateus           | 1458 | 1724 | 50 | 93,3% | **96,6%** |
| Marcos           | 1190 | 1379 | 52 | 91,8% | **95,6%** |
| Lucas            | 1737 | 2079 | 63 | 93,6% | **96,4%** |
| João             |  936 | 1067 | 34 | 91,6% | **96,4%** |
| Atos             | 1738 | 2056 | 53 | 94,2% | **97,0%** |
| Romanos          |  918 | 1102 | 22 | 93,0% | **97,6%** |
| 1 Coríntios      |  843 | 1002 | 33 | 91,0% | **96,1%** |
| 2 Coríntios      |  708 |  823 | 30 | 90,5% | **95,8%** |
| Gálatas          |  473 |  552 | 18 | 89,2% | **96,2%** |
| Efésios          |  468 |  556 | 16 | 90,2% | **96,6%** |
| Filipenses       |  405 |  470 | 10 | 90,9% | **97,5%** |
| Colossenses      |  368 |  450 |  9 | 91,3% | **97,6%** |
| 1 Tessalonicenses|  323 |  382 | 14 | 89,8% | **95,7%** |
| 2 Tessalonicenses|  214 |  262 |  8 | 90,2% | **96,3%** |
| 1 Timóteo        |  457 |  560 | 14 | 92,3% | **96,9%** |
| 2 Timóteo        |  396 |  481 |  7 | 91,9% | **98,2%** |
| Tito             |  265 |  320 |  6 | 90,2% | **97,7%** |
| Filemom          |  127 |  157 |  3 | 87,4% | **97,6%** |
| Hebreus          |  900 | 1070 | 26 | 92,7% | **97,1%** |
| Tiago            |  508 |  580 | 13 | 92,3% | **97,4%** |
| 1 Pedro          |  450 |  561 | 15 | 93,1% | **96,7%** |
| 2 Pedro          |  357 |  421 | 11 | 90,5% | **96,9%** |
| 1 João           |  214 |  256 |  7 | 86,0% | **96,7%** |
| 2 João           |   89 |  107 |  5 | 80,9% | **94,4%** |
| 3 João           |   99 |  118 |  3 | 86,9% | **97,0%** |
| Judas            |  182 |  240 |  3 | 91,2% | **98,4%** |
| Apocalipse       |  837 |  943 | 43 | 90,7% | **94,9%** |

**Cobertura média NT: 91,6% → 96,6%** (lacuna média caiu de ~1 344 para 568 Strongs únicos).
**Mínimo por livro:** 94,4% (2 João), antes era 80,9%.

## Validação dos 4 livros pedidos pelo usuário

Em todos, `era → G2258` (forma SBB de εἰμί) e `deus → G2316` (não G1325):

- **Mateus 1:1** — `livro G976`, `jesus G2424`, `cristo G5547`, `filho G5207`, `geração G1074`
- **João 1:1** — `princípio G746`, `era G2258`, `com G4314`, `deus G2316`, `verbo G3056`
- **Romanos 1:1** — `paulo G3972`, `servo G1401`, `apóstolo G652`, `evangelho G2098`, `deus G2316`
- **Apocalipse 1:1** — `revelação G602`, `jesus G2424`, `deus G2316`, `deu G1325`, `anjo G32`, `enviou G649`

## O que mudou no fluxo

1. **Schema**: nova coluna `bible_words.pdf_strong text` (a coluna `strong_number` permanece intacta — base UGNT preservada).
2. **Endpoint** `GET /api/bible/:bookId/:chapter/strong-words`: agora prefere `pdf_strong` quando definido, mantendo `strongMap` (formato anterior).
3. **Bug colateral corrigido**: a expansão de variantes em PT (ex.: "deu" → "deus") sombreava glosses exatos. Implementado *two-pass*: glosses exatos vencem expansões plurais/singulares.
4. **Modal Strong** (`StrongModal.tsx`): inalterado — exibe palavra-cabeça (`strongData.word`), transliteração e número Strong; agora recebe o Strong SBB diretamente.

## Lacunas residuais (~568)

Quase todas são **expressões de duas palavras** que o PDF SBB tagueia com um único Strong, mas que ocupam dois tokens distintos no UGNT:

| Strong | Forma | Ocorrências |
|--------|-------|-------------|
| G3363 | ἵνα μή | 112× |
| G3364 | οὐ μή | 91× |
| G1508 | εἰ μή | 91× |
| G1536 | εἴ τις | 83× |
| G3362 | ἐὰν μή | 77× |
| G1499 | εἰ καί | 22× |
| G1490 | εἰ δὲ μή γε | 14× |

Mapeá-los exigiria infraestrutura de tagueamento multi-token, fora do escopo desta entrega.
Todos esses Strongs já existem em `strong_entries`, então uma busca direta pelo código continua funcionando.

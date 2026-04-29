#!/usr/bin/env node
/**
 * Parser do PDF SBB "Almeida Revista e Atualizada com números de Strong"
 *
 * Saída: JSON em /tmp/pdf-bible.json no formato
 *   { [book]: { [chapter]: { [verse]: [ {word, strong, codes: [...]}, ... ] } } }
 *
 * Strategy:
 *   - O PDF foi extraído com `pdftotext -layout` (já existe em /tmp/biblia.txt).
 *   - Iteramos linha a linha, mantendo state (book, chapter, verse).
 *   - Detectamos cabeçalhos de livro (linha centralizada com nome em MAIÚSCULAS).
 *   - Capítulo: número solo numa linha (logo após cabeçalho de livro ou após o final do anterior).
 *   - Versículo: número solo numa linha indentada, OU número inline após "<sentença>. N <Letra>".
 *   - Dentro do texto: alternam palavras (letras+acentos+hífen) e Strongs (3-5 dígitos).
 *   - O primeiro número após uma palavra é o Strong; números seguidos são códigos morfológicos.
 */

import fs from 'fs';

const TXT_PATH = '/tmp/biblia.txt';
const OUT_PATH = '/tmp/pdf-bible.json';

// Mapeia o nome de cabeçalho do PDF para nosso bookId, na ORDEM em que aparecem.
// Para livros homônimos (Samuel, Reis, Crônicas, Coríntios, Tessalonicenses, Timóteo, Pedro, João),
// usamos um contador para distinguir 1ª/2ª/3ª ocorrência.
const BOOK_SEQUENCE = [
  // VT (39)
  { name: 'GÊNESIS',        id: 'gen', testament: 'OT' },
  { name: 'ÊXODO',          id: 'exo', testament: 'OT' },
  { name: 'LEVÍTICO',       id: 'lev', testament: 'OT' },
  { name: 'NÚMEROS',        id: 'num', testament: 'OT' },
  { name: 'DEUTERONÔMIO',   id: 'deu', testament: 'OT' },
  { name: 'JOSUÉ',          id: 'jos', testament: 'OT' },
  { name: 'JUÍZES',         id: 'jdg', testament: 'OT' },
  { name: 'RUTE',           id: 'rut', testament: 'OT' },
  { name: 'SAMUEL',         id: '1sa', testament: 'OT' },
  { name: 'SAMUEL',         id: '2sa', testament: 'OT' },
  { name: 'REIS',           id: '1ki', testament: 'OT' },
  { name: 'REIS',           id: '2ki', testament: 'OT' },
  { name: 'CRÔNICAS',       id: '1ch', testament: 'OT' },
  { name: 'CRÔNICAS',       id: '2ch', testament: 'OT' },
  { name: 'ESDRAS',         id: 'ezr', testament: 'OT' },
  { name: 'NEEMIAS',        id: 'neh', testament: 'OT' },
  { name: 'ESTER',          id: 'est', testament: 'OT' },
  { name: 'JÓ',             id: 'job', testament: 'OT' }, // pode aparecer só como "JÓ"
  { name: 'SALMOS',         id: 'psa', testament: 'OT' },
  { name: 'PROVÉRBIOS',     id: 'pro', testament: 'OT' },
  { name: 'ECLESIASTES',    id: 'ecc', testament: 'OT' },
  { name: 'CÂNTICO',        id: 'sng', testament: 'OT' }, // CÂNTICO DOS CÂNTICOS
  { name: 'ISAÍAS',         id: 'isa', testament: 'OT' },
  { name: 'JEREMIAS',       id: 'jer', testament: 'OT' },
  { name: 'LAMENTAÇÕES',    id: 'lam', testament: 'OT' },
  { name: 'EZEQUIEL',       id: 'ezk', testament: 'OT' },
  { name: 'DANIEL',         id: 'dan', testament: 'OT' },
  { name: 'OSÉIAS',         id: 'hos', testament: 'OT' },
  { name: 'JOEL',           id: 'jol', testament: 'OT' },
  { name: 'AMÓS',           id: 'amo', testament: 'OT' },
  { name: 'OBADIAS',        id: 'oba', testament: 'OT' },
  { name: 'JONAS',          id: 'jon', testament: 'OT' },
  { name: 'MIQUÉIAS',       id: 'mic', testament: 'OT' },
  { name: 'NAUM',           id: 'nam', testament: 'OT' },
  { name: 'HABACUQUE',      id: 'hab', testament: 'OT' },
  { name: 'SOFONIAS',       id: 'zep', testament: 'OT' },
  { name: 'AGEU',           id: 'hag', testament: 'OT' },
  { name: 'ZACARIAS',       id: 'zec', testament: 'OT' },
  { name: 'MALAQUIAS',      id: 'mal', testament: 'OT' },
  // NT (27)
  { name: 'MATEUS',         id: 'mat', testament: 'NT' },
  { name: 'MARCOS',         id: 'mrk', testament: 'NT' },
  { name: 'LUCAS',          id: 'luk', testament: 'NT' },
  { name: 'JOÃO',           id: 'jhn', testament: 'NT' },
  { name: 'ATOS',           id: 'act', testament: 'NT' },
  { name: 'ROMANOS',        id: 'rom', testament: 'NT' },
  { name: 'CORÍNTIOS',      id: '1co', testament: 'NT' },
  { name: 'CORÍNTIOS',      id: '2co', testament: 'NT' },
  { name: 'GÁLATAS',        id: 'gal', testament: 'NT' },
  { name: 'EFÉSIOS',        id: 'eph', testament: 'NT' },
  { name: 'FILIPENSES',     id: 'php', testament: 'NT' },
  { name: 'COLOSSENSES',    id: 'col', testament: 'NT' },
  { name: 'TESSALONICENSES',id: '1th', testament: 'NT' },
  { name: 'TESSALONICENSES',id: '2th', testament: 'NT' },
  { name: 'TIMÓTEO',        id: '1ti', testament: 'NT' },
  { name: 'TIMÓTEO',        id: '2ti', testament: 'NT' },
  { name: 'TITO',           id: 'tit', testament: 'NT' },
  { name: 'FILEMOM',        id: 'phm', testament: 'NT' },
  { name: 'HEBREUS',        id: 'heb', testament: 'NT' },
  { name: 'TIAGO',          id: 'jas', testament: 'NT' },
  { name: 'PEDRO',          id: '1pe', testament: 'NT' },
  { name: 'PEDRO',          id: '2pe', testament: 'NT' },
  { name: 'JOÃO',           id: '1jn', testament: 'NT' }, // 1 João (epístola)
  { name: 'JOÃO',           id: '2jn', testament: 'NT' },
  { name: 'JOÃO',           id: '3jn', testament: 'NT' },
  { name: 'JUDAS',          id: 'jud', testament: 'NT' },
  { name: 'APOCALIPSE',     id: 'rev', testament: 'NT' },
];

// Heurística: linha centralizada com SÓ um nome em maiúsculas e poucos espaços iniciais variados.
// Aceita opcionalmente acentos.
function isBookHeader(line, bookName) {
  const trimmed = line.trim();
  // Permite "MATEUS" ou "1 MATEUS" mas o nosso BOOK_SEQUENCE usa só o nome base.
  return trimmed === bookName;
}

// Linha que é apenas um número (capítulo OU verso isolado)
function isLoneNumber(line) {
  const t = line.trim();
  return /^\d{1,3}$/.test(t) ? parseInt(t) : null;
}

// Tokeniza um trecho de texto de um versículo: separa em palavras e Strongs.
// Estratégia: split por whitespace, depois classifica cada token.
//   - Token só dígitos (1-5): Strong number ou código morfológico
//   - Outro: palavra (pode conter pontuação que tiramos depois)
function parseVerseSegment(segment) {
  // Limpa quebras e múltiplos espaços
  const clean = segment.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const tokens = clean.split(' ');
  const out = []; // [{word, strong, codes}]
  let currentWord = null;

  for (const tok of tokens) {
    if (!tok) continue;

    // Token só de dígitos (com possível leading zero) — Strong ou código morfológico
    if (/^\d{1,5}$/.test(tok)) {
      if (!currentWord) continue; // Strong sem palavra anterior — ignora
      if (!currentWord.strong) {
        currentWord.strong = tok;
      } else {
        currentWord.codes.push(tok);
      }
      continue;
    }

    // Pontuação isolada — ignora
    if (/^[.,;:!?—\-'"()\[\]«»“”‘’/]+$/.test(tok)) continue;

    // É uma palavra portuguesa (pode ter pontuação anexada)
    // Limpa pontuação das bordas
    const cleanedWord = tok
      .replace(/^[.,;:!?—\-'"()\[\]«»“”‘’/]+/, '')
      .replace(/[.,;:!?—\-'"()\[\]«»“”‘’/]+$/, '')
      .trim();

    if (!cleanedWord || /^\d+$/.test(cleanedWord)) continue;

    // Se tem letras, é palavra
    if (/[a-záéíóúâêôãõçàèìòùñ]/i.test(cleanedWord)) {
      // Push palavra anterior e inicia nova
      if (currentWord && currentWord.strong) out.push(currentWord);
      currentWord = { word: cleanedWord, strong: null, codes: [] };
    }
  }
  if (currentWord && currentWord.strong) out.push(currentWord);
  return out;
}

// Quebra o texto em segmentos por versículo. Usa marcador "<frase>. N L" (ponto + espaço + número 1-3 dig + espaço + Letra).
// Também respeita marcadores stand-alone "  N\n      texto..."
// Retorna segmentos como { verse: number, text: string } na ordem.
function splitVerses(rawBlob) {
  // Substitui "  N \n     texto" (verso solo) por marcador uniforme "§§VERSE§§N§§"
  let text = rawBlob;
  // Marker para versos isolados em sua própria linha (com indent)
  text = text.replace(/(?:^|\n)\s+(\d{1,3})\s*\n/g, (_m, n) => `\n§§VERSE§§${n}§§\n`);
  // Marker para versos inline: "<sentença>. N <Letra>" → "<sentença>. §§VERSE§§N§§ <Letra>"
  text = text.replace(/([.!?:])\s+(\d{1,3})\s+([A-ZÀ-ÚÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç])/g,
    (_m, p, n, l) => `${p} §§VERSE§§${n}§§ ${l}`);

  const parts = text.split(/§§VERSE§§(\d{1,3})§§/);
  // parts: [pre, n1, content1, n2, content2, ...]
  const result = [];
  for (let i = 1; i < parts.length; i += 2) {
    const verseNum = parseInt(parts[i]);
    const content = parts[i + 1] || '';
    result.push({ verse: verseNum, text: content });
  }
  return result;
}

// MAIN
function main() {
  console.log('Lendo', TXT_PATH);
  const raw = fs.readFileSync(TXT_PATH, 'utf-8');
  const lines = raw.split('\n');
  console.log(`Total linhas: ${lines.length}`);

  // Encontra a linha de cada cabeçalho de livro na ordem esperada
  const bookStarts = []; // [{ id, lineIndex }]
  let seqIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (seqIdx >= BOOK_SEQUENCE.length) break;
    const expected = BOOK_SEQUENCE[seqIdx];
    if (isBookHeader(lines[i], expected.name)) {
      bookStarts.push({ ...expected, lineIndex: i });
      seqIdx++;
    }
  }
  console.log(`Livros detectados: ${bookStarts.length}/${BOOK_SEQUENCE.length}`);
  if (bookStarts.length < BOOK_SEQUENCE.length) {
    console.warn('AVISO: nem todos os livros foram detectados. Faltam:',
      BOOK_SEQUENCE.slice(bookStarts.length).map(b => b.name).join(', '));
  }
  // Imprime para conferência
  bookStarts.forEach(b => console.log(`  ${b.id} (${b.name}) linha ${b.lineIndex}`));

  // Para cada livro, pega o blob de texto entre o início dele e o início do próximo (ou EOF)
  const bible = {};
  for (let bi = 0; bi < bookStarts.length; bi++) {
    const start = bookStarts[bi].lineIndex + 1; // linhas após o cabeçalho
    const end = (bi + 1 < bookStarts.length) ? bookStarts[bi + 1].lineIndex : lines.length;
    const blob = lines.slice(start, end).join('\n');
    const bookId = bookStarts[bi].id;
    bible[bookId] = parseBookBlob(bookId, blob);
  }

  // Salva
  fs.writeFileSync(OUT_PATH, JSON.stringify(bible));
  console.log(`\nGravado em ${OUT_PATH}`);

  // Estatísticas
  let totalPairs = 0;
  for (const [bid, chapters] of Object.entries(bible)) {
    let count = 0;
    for (const verses of Object.values(chapters)) {
      for (const pairs of Object.values(verses)) count += pairs.length;
    }
    totalPairs += count;
    console.log(`  ${bid}: ${Object.keys(chapters).length} cap, ${count} pares (palavra→Strong)`);
  }
  console.log(`\nTOTAL pares: ${totalPairs}`);
}

// Parseia o blob de um livro: detecta capítulos e versos
function parseBookBlob(bookId, blob) {
  const chapters = {};
  // Capítulo é uma linha indentada com SÓ um número (geralmente 1-3 dígitos), em geral seguida de
  // título de seção e depois conteúdo. Mas o número de capítulo é especial: ele aparece SEM
  // contexto de versículo (ou seja, antes do primeiro verso).
  //
  // Estratégia: divide o blob por marcadores de capítulo. Um marcador de capítulo é uma linha
  // contendo apenas um número e não precedida por contexto de "verso N".
  //
  // Heurística mais simples: o número de capítulo aparece numa linha que NÃO está dentro de
  // texto de versículo. Vou usar regex: linhas que são SÓ número, e que não têm Strong na
  // mesma linha. Para distinguir de versos isolados, marco a primeira ocorrência de cada
  // sequência crescente como capítulo? Não, é frágil.
  //
  // A pista melhor: depois de uma linha de número solo, vem geralmente uma linha de TÍTULO em
  // case normal (não maiúsculas) e DEPOIS um verso. Se logo após o número solo já vem texto
  // numerado com Strongs, pode ser um verso.
  //
  // Solução robusta: usar a regra de que TODOS os capítulos começam com "1" (verso 1). Então
  // varre, e quando encontra "número solo" + algumas linhas + "1\n" ou "  1\n", o primeiro número
  // é o capítulo.

  // Mais simples ainda: faço um pré-processamento para detectar boundaries de capítulo
  // procurando padrão "<número solo>\n<linha de título>\n<verso 1>".
  const lines = blob.split('\n');
  const chapterStarts = []; // [{chapter, lineIndex}]

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!/^\d{1,3}$/.test(t)) continue;
    const num = parseInt(t);
    // Ignora se claramente é continuação de uma palavra (linha anterior termina com texto sem ponto)
    // Verifica se nas próximas linhas existe "    1\n" ou "  1\n" ou inline "1 <Letra>"
    let foundVerseOne = false;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      if (/^\s+1\s*$/.test(lines[j])) { foundVerseOne = true; break; }
      if (/^\s*1\s+[A-ZÀ-ÚÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç]/.test(lines[j])) { foundVerseOne = true; break; }
    }
    if (foundVerseOne) {
      chapterStarts.push({ chapter: num, lineIndex: i });
    }
  }

  // Filtra: chapters devem ser sequência crescente começando em 1.
  // Se houver duplicatas ou números fora de ordem, pega só os que seguem a sequência.
  const filtered = [];
  let expected = 1;
  for (const cs of chapterStarts) {
    if (cs.chapter === expected) {
      filtered.push(cs);
      expected++;
    } else if (cs.chapter === expected - 1) {
      // duplicata, ignora
    } else if (cs.chapter > expected) {
      // pulou — pode ser falso positivo. Tenta avançar mesmo assim.
      filtered.push(cs);
      expected = cs.chapter + 1;
    }
  }

  if (filtered.length === 0) {
    console.warn(`  AVISO: ${bookId} não detectou capítulos`);
    return chapters;
  }

  // Para cada capítulo, pega o blob entre seu início e o próximo
  for (let ci = 0; ci < filtered.length; ci++) {
    const startLine = filtered[ci].lineIndex + 1;
    const endLine = (ci + 1 < filtered.length) ? filtered[ci + 1].lineIndex : lines.length;
    const chBlob = lines.slice(startLine, endLine).join('\n');
    const chapterNum = filtered[ci].chapter;
    chapters[chapterNum] = parseChapterBlob(chBlob);
  }

  return chapters;
}

function parseChapterBlob(blob) {
  // Quebra em segmentos por versículo
  const segments = splitVerses(blob);
  const verses = {};
  for (const { verse, text } of segments) {
    const pairs = parseVerseSegment(text);
    if (pairs.length > 0) {
      // Mescla se o mesmo verso aparecer em segmentos múltiplos (raro)
      if (verses[verse]) {
        verses[verse] = verses[verse].concat(pairs);
      } else {
        verses[verse] = pairs;
      }
    }
  }
  return verses;
}

main();

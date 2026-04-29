#!/usr/bin/env node
/**
 * Extrai TODAS as ocorrências (palavra → Strong) do PDF SBB por livro,
 * sem se preocupar com alinhamento de cap/verso. O resultado serve como
 * índice auxiliar para o endpoint de Strong palavras.
 *
 * Por que sem cap/verso? Porque o PDF mistura formatos (Salmos tem cap
 * embutido como número, livros de 1 cap não têm marcador de cap, etc).
 * Extração linear é robusta e suficiente para popular palavras faltantes
 * no Strong-words endpoint.
 *
 * Saída: /tmp/pdf-word-index.json no formato
 *   { [bookId]: { [word_norm]: { strong: "Hxxxx" | "Gxxxx", count: N } } }
 *
 * Tomamos o Strong MAIS COMUM para cada palavra dentro de cada livro.
 */

import fs from 'fs';

const TXT_PATH = '/tmp/biblia.txt';
const OUT_PATH = '/tmp/pdf-word-index.json';

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
  { name: 'JÓ',             id: 'job', testament: 'OT' },
  { name: 'SALMOS',         id: 'psa', testament: 'OT' },
  { name: 'PROVÉRBIOS',     id: 'pro', testament: 'OT' },
  { name: 'ECLESIASTES',    id: 'ecc', testament: 'OT' },
  { name: 'CÂNTICO',        id: 'sng', testament: 'OT' },
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
  { name: 'JOÃO',           id: '1jn', testament: 'NT' },
  { name: 'JOÃO',           id: '2jn', testament: 'NT' },
  { name: 'JOÃO',           id: '3jn', testament: 'NT' },
  { name: 'JUDAS',          id: 'jud', testament: 'NT' },
  { name: 'APOCALIPSE',     id: 'rev', testament: 'NT' },
];

// Normaliza palavra: lowercase, sem acento, sem pontuação
function normalize(w) {
  return w.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?—\-'"()\[\]«»“”‘’/0-9]/g, '')
    .trim();
}

// Extrai pares (palavra, strong) de um blob de texto.
// Strategy: tokenize por whitespace; alterna palavras e Strongs.
function extractPairs(blob, testament) {
  const tokens = blob.replace(/\s+/g, ' ').trim().split(' ');
  const pairs = [];
  let currentWord = null;

  for (const tok of tokens) {
    if (!tok) continue;

    // Token só dígitos: Strong ou código
    if (/^\d{1,5}$/.test(tok)) {
      if (currentWord && !currentWord.strong) {
        // Primeiro número após palavra é o Strong
        const num = tok;
        // Hebraico tem 4-5 dígitos com leading zero geralmente; grego não
        // Mas SBB usa números puros sem prefixo H/G no PDF. Aplicamos por testamento.
        currentWord.strong = (testament === 'OT' ? 'H' : 'G') + parseInt(num);
      }
      // outros números são códigos morfológicos — ignoramos
      continue;
    }

    // É palavra (ou pontuação)
    const cleaned = normalize(tok);
    if (cleaned.length < 3) continue; // ignora "a", "e", "o", "de" etc.

    // Guarda palavra anterior
    if (currentWord && currentWord.strong) pairs.push(currentWord);
    currentWord = { word: cleaned, strong: null };
  }
  if (currentWord && currentWord.strong) pairs.push(currentWord);
  return pairs;
}

function main() {
  console.log('Lendo', TXT_PATH);
  const raw = fs.readFileSync(TXT_PATH, 'utf-8');
  const lines = raw.split('\n');

  // Encontra o início de cada livro
  const bookStarts = [];
  let seqIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (seqIdx >= BOOK_SEQUENCE.length) break;
    const expected = BOOK_SEQUENCE[seqIdx];
    if (lines[i].trim() === expected.name) {
      bookStarts.push({ ...expected, lineIndex: i });
      seqIdx++;
    }
  }
  console.log(`Livros: ${bookStarts.length}/${BOOK_SEQUENCE.length}`);

  // Para cada livro, extrai pares
  const index = {}; // bookId -> { word -> { strong, count } }
  let totalPairs = 0;

  for (let bi = 0; bi < bookStarts.length; bi++) {
    const start = bookStarts[bi].lineIndex + 1;
    const end = (bi + 1 < bookStarts.length) ? bookStarts[bi + 1].lineIndex : lines.length;
    const blob = lines.slice(start, end).join('\n');
    const bookId = bookStarts[bi].id;
    const testament = bookStarts[bi].testament;

    const pairs = extractPairs(blob, testament);
    totalPairs += pairs.length;

    // Conta por (palavra, strong)
    const wordToStrongs = {}; // word -> { strong: count }
    for (const { word, strong } of pairs) {
      if (!wordToStrongs[word]) wordToStrongs[word] = {};
      wordToStrongs[word][strong] = (wordToStrongs[word][strong] || 0) + 1;
    }

    // Para cada palavra, escolhe Strong mais comum
    const finalIndex = {};
    for (const [word, counts] of Object.entries(wordToStrongs)) {
      let bestStrong = null;
      let bestCount = 0;
      let total = 0;
      for (const [strong, count] of Object.entries(counts)) {
        total += count;
        if (count > bestCount) {
          bestCount = count;
          bestStrong = strong;
        }
      }
      finalIndex[word] = { strong: bestStrong, count: bestCount, total };
    }
    index[bookId] = finalIndex;

    console.log(`  ${bookId}: ${pairs.length} pares, ${Object.keys(finalIndex).length} palavras únicas`);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(index));
  console.log(`\nTotal pares NT+VT: ${totalPairs}`);
  console.log(`Gravado em ${OUT_PATH}`);

  // Estatística geral
  const allWords = new Set();
  for (const book of Object.values(index)) {
    for (const w of Object.keys(book)) allWords.add(w);
  }
  console.log(`Palavras portuguesas únicas (todos os livros): ${allWords.size}`);
}

main();

#!/usr/bin/env node
/**
 * Mede cobertura REAL: para cada livro, % de palavras (4+ chars) no texto
 * que retornam Strong via /api/bible/:bookId/:chapter/strong-words.
 */

const BOOKS = [
  { id: 'gen', chapters: 50 }, { id: 'exo', chapters: 40 }, { id: 'lev', chapters: 27 },
  { id: 'num', chapters: 36 }, { id: 'deu', chapters: 34 }, { id: 'jos', chapters: 24 },
  { id: 'jdg', chapters: 21 }, { id: 'rut', chapters: 4 },  { id: '1sa', chapters: 31 },
  { id: '2sa', chapters: 24 }, { id: '1ki', chapters: 22 }, { id: '2ki', chapters: 25 },
  { id: '1ch', chapters: 29 }, { id: '2ch', chapters: 36 }, { id: 'ezr', chapters: 10 },
  { id: 'neh', chapters: 13 }, { id: 'est', chapters: 10 }, { id: 'job', chapters: 42 },
  { id: 'psa', chapters: 150 }, { id: 'pro', chapters: 31 }, { id: 'ecc', chapters: 12 },
  { id: 'sng', chapters: 8 },  { id: 'isa', chapters: 66 }, { id: 'jer', chapters: 52 },
  { id: 'lam', chapters: 5 },  { id: 'ezk', chapters: 48 }, { id: 'dan', chapters: 12 },
  { id: 'hos', chapters: 14 }, { id: 'jol', chapters: 3 },  { id: 'amo', chapters: 9 },
  { id: 'oba', chapters: 1 },  { id: 'jon', chapters: 4 },  { id: 'mic', chapters: 7 },
  { id: 'nam', chapters: 3 },  { id: 'hab', chapters: 3 },  { id: 'zep', chapters: 3 },
  { id: 'hag', chapters: 2 },  { id: 'zec', chapters: 14 }, { id: 'mal', chapters: 4 },
  { id: 'mat', chapters: 28 }, { id: 'mrk', chapters: 16 }, { id: 'luk', chapters: 24 },
  { id: 'jhn', chapters: 21 }, { id: 'act', chapters: 28 }, { id: 'rom', chapters: 16 },
  { id: '1co', chapters: 16 }, { id: '2co', chapters: 13 }, { id: 'gal', chapters: 6 },
  { id: 'eph', chapters: 6 },  { id: 'php', chapters: 4 },  { id: 'col', chapters: 4 },
  { id: '1th', chapters: 5 },  { id: '2th', chapters: 3 },  { id: '1ti', chapters: 6 },
  { id: '2ti', chapters: 4 },  { id: 'tit', chapters: 3 },  { id: 'phm', chapters: 1 },
  { id: 'heb', chapters: 13 }, { id: 'jas', chapters: 5 },  { id: '1pe', chapters: 5 },
  { id: '2pe', chapters: 3 },  { id: '1jn', chapters: 5 },  { id: '2jn', chapters: 1 },
  { id: '3jn', chapters: 1 },  { id: 'jud', chapters: 1 },  { id: 'rev', chapters: 22 },
];

async function fetchJSON(url) {
  const r = await fetch(url);
  return r.json();
}

const PUNCT_RE = /[.,;:!?—\-'"()\[\]«»“”‘’]/g;

function tokens(text) {
  return text.split(/\s+/)
    .map(w => w.toLowerCase().replace(PUNCT_RE, '').trim())
    .filter(w => w.length >= 4);
}

async function measureBook(book) {
  let totalWords = 0;
  let coveredWords = 0;
  // Sample first 3 chapters per book for speed
  const chaptersToSample = Math.min(book.chapters, 3);
  for (let ch = 1; ch <= chaptersToSample; ch++) {
    try {
      const [chapterData, strongData] = await Promise.all([
        fetchJSON(`http://localhost:5000/api/bible/${book.id}/${ch}`),
        fetchJSON(`http://localhost:5000/api/bible/${book.id}/${ch}/strong-words`),
      ]);
      const verses = chapterData?.chapter?.verses;
      if (!verses) continue;
      for (const v of verses) {
        const verseTokens = tokens(v.text);
        const strongMap = strongData.strongMap?.[v.verse] || {};
        for (const t of verseTokens) {
          totalWords++;
          if (strongMap[t]) coveredWords++;
        }
      }
    } catch (e) { /* skip */ }
  }
  return { book: book.id, total: totalWords, covered: coveredWords, pct: totalWords > 0 ? (coveredWords / totalWords * 100) : 0 };
}

(async () => {
  const results = [];
  for (const b of BOOKS) {
    const r = await measureBook(b);
    results.push(r);
    console.log(`${r.book.padEnd(4)} ${r.covered.toString().padStart(5)}/${r.total.toString().padStart(5)} = ${r.pct.toFixed(1)}%`);
  }
  const totalT = results.reduce((s, r) => s + r.total, 0);
  const totalC = results.reduce((s, r) => s + r.covered, 0);
  console.log(`\n=== GERAL: ${totalC}/${totalT} = ${(totalC/totalT*100).toFixed(2)}% ===`);
  // Por testamento
  const ot = results.slice(0, 39);
  const nt = results.slice(39);
  const otT = ot.reduce((s,r)=>s+r.total,0), otC = ot.reduce((s,r)=>s+r.covered,0);
  const ntT = nt.reduce((s,r)=>s+r.total,0), ntC = nt.reduce((s,r)=>s+r.covered,0);
  console.log(`VT: ${otC}/${otT} = ${(otC/otT*100).toFixed(2)}%`);
  console.log(`NT: ${ntC}/${ntT} = ${(ntC/ntT*100).toFixed(2)}%`);
})();

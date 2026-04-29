// Compara cobertura DB vs PDF, agora considerando pdf_strong como alias.
// Foca apenas no NT (decisão do usuário: caminho misto, AT fica como está).

import fs from 'node:fs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sections = JSON.parse(fs.readFileSync('/tmp/pdf-sections.json', 'utf8'));

const NT_BOOKS = new Set([
  'mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col',
  '1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev',
]);
const BOOK_NAME = {
  mat:'Mateus',mrk:'Marcos',luk:'Lucas',jhn:'João',act:'Atos',rom:'Romanos',
  '1co':'1 Coríntios','2co':'2 Coríntios',gal:'Gálatas',eph:'Efésios',php:'Filipenses',col:'Colossenses',
  '1th':'1 Tessalonicenses','2th':'2 Tessalonicenses','1ti':'1 Timóteo','2ti':'2 Timóteo',
  tit:'Tito',phm:'Filemom',heb:'Hebreus',jas:'Tiago','1pe':'1 Pedro','2pe':'2 Pedro',
  '1jn':'1 João','2jn':'2 João','3jn':'3 João',jud:'Judas',rev:'Apocalipse',
};

function extractStrongs(chunk) {
  // Mesmo extrator usado em compare-coverage.mjs (somente 4-5 dígitos zero-padded).
  const counts = new Map();
  const re = /\b(\d{4,5})\b/g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    const num = parseInt(m[1], 10);
    if (num < 1 || num > 5624) continue; // último Strong grego é G5624
    counts.set(num, (counts.get(num) || 0) + 1);
  }
  return counts;
}

async function main() {
  const ntSections = sections.filter(s => NT_BOOKS.has(s.book));
  console.log(`\nLivros NT analisados: ${ntSections.length}\n`);

  console.log('| Livro            | PDF únicos | DB únicos (lema+alias) | Faltam | Cobertura | Antes | Depois |');
  console.log('|------------------|-----------:|-----------------------:|-------:|----------:|------:|-------:|');

  const pdfText = fs.readFileSync('/tmp/biblia_sbb.txt', 'utf8');
  const lines = pdfText.split('\n');

  const summary = [];

  for (const sec of ntSections) {
    const chunk = lines.slice(sec.line, sec.endLine).join('\n');
    sec.name = BOOK_NAME[sec.book] || sec.book;
    const pdfCounts = extractStrongs(chunk);
    const pdfUnique = pdfCounts.size;

    // Antes: apenas strong_number
    const beforeRes = await pool.query(`
      SELECT strong_number FROM bible_words
      WHERE book = $1 AND strong_number LIKE 'G%'
      GROUP BY strong_number
    `, [sec.book]);
    const beforeSet = new Set();
    for (const r of beforeRes.rows) {
      const n = parseInt(String(r.strong_number).replace(/^G/, ''), 10);
      if (Number.isFinite(n)) beforeSet.add(n);
    }

    // Depois: strong_number ∪ pdf_strong
    const afterRes = await pool.query(`
      SELECT DISTINCT s FROM (
        SELECT strong_number AS s FROM bible_words
          WHERE book = $1 AND strong_number LIKE 'G%'
        UNION
        SELECT pdf_strong AS s FROM bible_words
          WHERE book = $1 AND pdf_strong IS NOT NULL AND pdf_strong LIKE 'G%'
      ) u
    `, [sec.book]);
    const afterSet = new Set();
    for (const r of afterRes.rows) {
      const n = parseInt(String(r.s).replace(/^G/, ''), 10);
      if (Number.isFinite(n)) afterSet.add(n);
    }

    let beforeMissing = 0;
    let afterMissing = 0;
    for (const num of pdfCounts.keys()) {
      if (!beforeSet.has(num)) beforeMissing++;
      if (!afterSet.has(num)) afterMissing++;
    }

    const beforePct = ((pdfUnique - beforeMissing) / pdfUnique * 100).toFixed(1);
    const afterPct = ((pdfUnique - afterMissing) / pdfUnique * 100).toFixed(1);

    summary.push({
      book: sec.book,
      pdfUnique,
      afterUnique: afterSet.size,
      afterMissing,
      beforePct,
      afterPct,
    });

    console.log(`| ${sec.book.padEnd(16)} | ${String(pdfUnique).padStart(10)} | ${String(afterSet.size).padStart(22)} | ${String(afterMissing).padStart(6)} | ${(afterPct + '%').padStart(9)} | ${(beforePct + '%').padStart(5)} | ${(afterPct + '%').padStart(6)} |`);
  }

  // Totais
  const totalPdf = summary.reduce((a,s) => a + s.pdfUnique, 0);
  const totalMissing = summary.reduce((a,s) => a + s.afterMissing, 0);
  console.log(`\nTotal PDF únicos NT:        ${totalPdf}`);
  console.log(`Total lacunas após aliases: ${totalMissing}  (antes: ~1344)`);
  console.log(`Cobertura média NT:         ${((1 - totalMissing/totalPdf) * 100).toFixed(1)}%`);

  fs.writeFileSync('/tmp/coverage-after-aliases.json', JSON.stringify(summary, null, 2));
  console.log('\nDetalhe em /tmp/coverage-after-aliases.json');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

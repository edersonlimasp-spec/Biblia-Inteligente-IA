// Para cada livro NT, lista os Strongs do PDF que continuam ausentes (mesmo após aliases)
// e mostra contagem por Strong. Ajuda a expandir as regras de mapeamento.

import fs from 'node:fs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sections = JSON.parse(fs.readFileSync('/tmp/pdf-sections.json', 'utf8'));

const NT_BOOKS = new Set([
  'mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col',
  '1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev',
]);

function extractStrongs(chunk) {
  const counts = new Map();
  const re = /\b(\d{4,5})\b/g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    const num = parseInt(m[1], 10);
    if (num < 1 || num > 5624) continue;
    counts.set(num, (counts.get(num) || 0) + 1);
  }
  return counts;
}

async function main() {
  const ntSections = sections.filter(s => NT_BOOKS.has(s.book));
  const lines = fs.readFileSync('/tmp/biblia_sbb.txt', 'utf8').split('\n');

  // Aggregate all missing Strongs across NT
  const aggregate = new Map(); // strong → { totalCount, books: Set }

  for (const sec of ntSections) {
    const chunk = lines.slice(sec.line, sec.endLine).join('\n');
    const pdfCounts = extractStrongs(chunk);

    const dbRes = await pool.query(`
      SELECT DISTINCT s FROM (
        SELECT strong_number AS s FROM bible_words
          WHERE book = $1 AND strong_number LIKE 'G%'
        UNION
        SELECT pdf_strong AS s FROM bible_words
          WHERE book = $1 AND pdf_strong IS NOT NULL AND pdf_strong LIKE 'G%'
      ) u
    `, [sec.book]);
    const dbSet = new Set();
    for (const r of dbRes.rows) {
      const n = parseInt(String(r.s).replace(/^G/, ''), 10);
      if (Number.isFinite(n)) dbSet.add(n);
    }

    for (const [num, count] of pdfCounts) {
      if (!dbSet.has(num)) {
        const key = `G${num}`;
        if (!aggregate.has(key)) aggregate.set(key, { total: 0, books: new Set() });
        const e = aggregate.get(key);
        e.total += count;
        e.books.add(sec.book);
      }
    }
  }

  // Sort by total count
  const sorted = [...aggregate.entries()]
    .map(([s, e]) => ({ strong: s, total: e.total, books: e.books.size }))
    .sort((a, b) => b.total - a.total);

  console.log(`Total Strongs únicos faltantes (NT): ${sorted.length}`);
  console.log('\nTop 40 mais frequentes (Strong, total ocorrências, qtd livros):');
  for (const r of sorted.slice(0, 40)) {
    // Look up dictionary entry for context
    const ent = await pool.query(
      `SELECT lemma, translit, LEFT(COALESCE(portuguese_def, strongs_def), 50) as def FROM strong_entries WHERE strong_number = $1`,
      [r.strong]
    );
    const e = ent.rows[0] || {};
    console.log(`  ${r.strong.padEnd(7)} ${String(r.total).padStart(5)}× em ${r.books} livros — ${(e.lemma||'').padEnd(12)} ${(e.translit||'').padEnd(14)} ${e.def||''}`);
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

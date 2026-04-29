import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PDF_TXT = '/tmp/biblia_sbb.txt';
const SECTIONS = JSON.parse(fs.readFileSync('/tmp/pdf-sections.json', 'utf8'));
const text = fs.readFileSync(PDF_TXT, 'utf8');
const lines = text.split('\n');

const NT_BOOKS = new Set(['mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev']);

// Map our shortcode → DB book id (numeric in bible_words.book_id)
const BOOK_ID_MAP = {
  'gen':1,'exo':2,'lev':3,'num':4,'deu':5,'jos':6,'jdg':7,'rut':8,'1sa':9,'2sa':10,
  '1ki':11,'2ki':12,'1ch':13,'2ch':14,'ezr':15,'neh':16,'est':17,'job':18,'psa':19,'pro':20,
  'ecc':21,'sng':22,'isa':23,'jer':24,'lam':25,'ezk':26,'dan':27,'hos':28,'jol':29,'amo':30,
  'oba':31,'jon':32,'mic':33,'nam':34,'hab':35,'zep':36,'hag':37,'zec':38,'mal':39,
  'mat':40,'mrk':41,'luk':42,'jhn':43,'act':44,'rom':45,'1co':46,'2co':47,'gal':48,'eph':49,
  'php':50,'col':51,'1th':52,'2th':53,'1ti':54,'2ti':55,'tit':56,'phm':57,'heb':58,'jas':59,
  '1pe':60,'2pe':61,'1jn':62,'2jn':63,'3jn':64,'jud':65,'rev':66,
};

const BOOK_NAMES = {
  'gen':'Gênesis','exo':'Êxodo','lev':'Levítico','num':'Números','deu':'Deuteronômio',
  'jos':'Josué','jdg':'Juízes','rut':'Rute','1sa':'1 Samuel','2sa':'2 Samuel',
  '1ki':'1 Reis','2ki':'2 Reis','1ch':'1 Crônicas','2ch':'2 Crônicas','ezr':'Esdras',
  'neh':'Neemias','est':'Ester','job':'Jó','psa':'Salmos','pro':'Provérbios',
  'ecc':'Eclesiastes','sng':'Cantares','isa':'Isaías','jer':'Jeremias','lam':'Lamentações',
  'ezk':'Ezequiel','dan':'Daniel','hos':'Oseias','jol':'Joel','amo':'Amós','oba':'Obadias',
  'jon':'Jonas','mic':'Miqueias','nam':'Naum','hab':'Habacuque','zep':'Sofonias','hag':'Ageu',
  'zec':'Zacarias','mal':'Malaquias','mat':'Mateus','mrk':'Marcos','luk':'Lucas','jhn':'João',
  'act':'Atos','rom':'Romanos','1co':'1 Coríntios','2co':'2 Coríntios','gal':'Gálatas',
  'eph':'Efésios','php':'Filipenses','col':'Colossenses','1th':'1 Tessalonicenses','2th':'2 Tessalonicenses',
  '1ti':'1 Timóteo','2ti':'2 Timóteo','tit':'Tito','phm':'Filemom','heb':'Hebreus',
  'jas':'Tiago','1pe':'1 Pedro','2pe':'2 Pedro','1jn':'1 João','2jn':'2 João','3jn':'3 João',
  'jud':'Judas','rev':'Apocalipse',
};

// Extract Strong numbers from a chunk of text. Returns Map<strongNum, count>
// Filter: must be 4-5 digit zero-padded; range filter applied later per testament.
function extractStrongs(textChunk, isNT) {
  const counts = new Map();
  const STRONG_MAX = isNT ? 5624 : 8674;
  // Match zero-padded 4-5 digit numbers. Examples: "0430", "01254", "8804"
  // Use word boundaries.
  const re = /\b(\d{4,5})\b/g;
  let m;
  while ((m = re.exec(textChunk)) !== null) {
    const raw = m[1];
    // If exactly 4 chars and starts with non-zero, it could be a morphology code (8804 etc)
    // OR a real Strong (e.g. G1003 "Boaz" in NT). The range filter handles this.
    const num = parseInt(raw, 10);
    if (num < 1 || num > STRONG_MAX) continue;
    counts.set(num, (counts.get(num) || 0) + 1);
  }
  return counts;
}

(async () => {
  const summary = [];
  let totalPdfStrongs = 0, totalDbStrongs = 0, totalGapInstances = 0;
  const allGaps = {};

  for (const sec of SECTIONS) {
    const isNT = NT_BOOKS.has(sec.book);
    const chunk = lines.slice(sec.line, sec.endLine).join('\n');
    const pdfCounts = extractStrongs(chunk, isNT);
    const pdfTotalCount = Array.from(pdfCounts.values()).reduce((a, b) => a + b, 0);
    const pdfUnique = pdfCounts.size;

    // Query DB: bible_words for this book
    const prefix = isNT ? 'G' : 'H';

    const dbResult = await pool.query(
      `SELECT strong_number, COUNT(*) as cnt
       FROM bible_words
       WHERE book = $1 AND strong_number LIKE $2
       GROUP BY strong_number`,
      [sec.book, prefix + '%']
    );
    const dbCounts = new Map();
    for (const row of dbResult.rows) {
      const numStr = String(row.strong_number).replace(/^[HG]/i, '');
      const num = parseInt(numStr, 10);
      if (Number.isFinite(num) && num > 0) {
        dbCounts.set(num, parseInt(row.cnt, 10));
      }
    }
    const dbUnique = dbCounts.size;
    const dbTotalCount = Array.from(dbCounts.values()).reduce((a, b) => a + b, 0);

    // Find PDF strongs missing from DB
    const missingFromDb = [];
    for (const [num, cnt] of pdfCounts.entries()) {
      if (!dbCounts.has(num)) missingFromDb.push({ num, count: cnt });
    }
    // Find DB strongs missing from PDF (informational)
    const extraInDb = [];
    for (const [num] of dbCounts.entries()) {
      if (!pdfCounts.has(num)) extraInDb.push(num);
    }

    summary.push({
      book: sec.book,
      name: BOOK_NAMES[sec.book],
      isNT,
      pdfUnique, pdfTotalCount,
      dbUnique, dbTotalCount,
      missingCount: missingFromDb.length,
      extraCount: extraInDb.length,
      coveragePct: pdfUnique > 0 ? Math.round((pdfUnique - missingFromDb.length) / pdfUnique * 1000) / 10 : 100,
    });
    totalPdfStrongs += pdfUnique;
    totalDbStrongs += dbUnique;
    totalGapInstances += missingFromDb.length;
    if (missingFromDb.length > 0) {
      allGaps[sec.book] = missingFromDb.sort((a, b) => b.count - a.count).slice(0, 20);
    }
  }

  // Print table
  console.log('| Livro            | PDF únicos | DB únicos | Faltam | Extras DB | Cobertura |');
  console.log('|------------------|-----------:|----------:|-------:|----------:|----------:|');
  for (const s of summary) {
    const status = s.missingCount === 0 ? 'OK' : `FALTAM ${s.missingCount}`;
    console.log(`| ${s.name.padEnd(16)} | ${String(s.pdfUnique).padStart(10)} | ${String(s.dbUnique).padStart(9)} | ${String(s.missingCount).padStart(6)} | ${String(s.extraCount).padStart(9)} | ${String(s.coveragePct).padStart(7)}% |`);
  }
  console.log('');
  console.log(`TOTAL PDF unique Strong numbers: ${totalPdfStrongs}`);
  console.log(`TOTAL DB  unique Strong numbers: ${totalDbStrongs}`);
  console.log(`TOTAL gap (PDF strongs not in DB, summed per book): ${totalGapInstances}`);

  // Top books with biggest gaps
  const sortedGaps = summary.filter(s => s.missingCount > 0).sort((a, b) => b.missingCount - a.missingCount);
  if (sortedGaps.length > 0) {
    console.log('\nLivros com maior gap (PDF tem Strongs que a base não tem):');
    for (const s of sortedGaps.slice(0, 15)) {
      console.log(`  ${s.name.padEnd(20)} faltam ${s.missingCount} Strongs únicos do PDF`);
      const gaps = allGaps[s.book].slice(0, 12);
      const samples = gaps.map(g => `${s.isNT ? 'G' : 'H'}${g.num}(${g.count}x)`).join(', ');
      console.log(`     amostras: ${samples}`);
    }
  } else {
    console.log('\nSem lacunas detectadas — base ≥ PDF para todos os livros.');
  }

  fs.writeFileSync('/tmp/coverage-report.json', JSON.stringify({ summary, allGaps }, null, 2));
  console.log('\nRelatório completo em /tmp/coverage-report.json');
  await pool.end();
})();

import fs from 'fs';

const PDF_TXT = '/tmp/biblia_sbb.txt';
const text = fs.readFileSync(PDF_TXT, 'utf8');
const lines = text.split('\n');

// Hard boundaries (manually identified):
const OT_END = 72215;       // Malaquias 4:6 ends here. Next line: "Léxico Hebraico..."
const NT_START = 122558;    // "O EVANGELHO SEGUNDO MATEUS"
const NT_END_DICT = 146406; // Greek dictionary starts here ("1 α a al'-fah")

// Heading patterns for books. We support multi-line: when a line matches a leader
// pattern (e.g. "PRIMEIRA EPÍSTOLA DE PAULO AOS"), we look ahead for the next
// non-empty all-caps line to get the book name.

const SINGLE_HEADINGS = [
  ['GÊNESIS', 'gen'],
  ['ÊXODO', 'exo'],
  ['LEVÍTICO', 'lev'],
  ['NÚMEROS', 'num'],
  ['DEUTERONÔMIO', 'deu'],
  ['JOSUÉ', 'jos'],
  ['JUÍZES', 'jdg'],
  ['RUTE', 'rut'],
  ['ESDRAS', 'ezr'],
  ['NEEMIAS', 'neh'],
  ['ESTER', 'est'],
  ['JÓ', 'job'],
  ['SALMOS', 'psa'],
  ['PROVÉRBIOS', 'pro'],
  ['ECLESIASTES', 'ecc'],
  ['ISAÍAS', 'isa'],
  ['JEREMIAS', 'jer'],
  ['LAMENTAÇÕES', 'lam'],
  ['EZEQUIEL', 'ezk'],
  ['DANIEL', 'dan'],
  ['OSÉIAS', 'hos'],
  ['JOEL', 'jol'],
  ['AMÓS', 'amo'],
  ['OBADIAS', 'oba'],
  ['JONAS', 'jon'],
  ['MIQUÉIAS', 'mic'],
  ['NAUM', 'nam'],
  ['HABACUQUE', 'hab'],
  ['SOFONIAS', 'zep'],
  ['AGEU', 'hag'],
  ['ZACARIAS', 'zec'],
  ['MALAQUIAS', 'mal'],
  ['MARCOS', 'mrk'],
  ['LUCAS', 'luk'],
  ['GÁLATAS', 'gal'],
  ['EFÉSIOS', 'eph'],
  ['FILIPENSES', 'php'],
  ['COLOSSENSES', 'col'],
  ['TITO', 'tit'],
  ['FILEMOM', 'phm'],
  ['HEBREUS', 'heb'],
  ['TIAGO', 'jas'],
  ['JUDAS', 'jud'],
];

// Leader patterns for multi-line headings: leader → expected next-name → bookId resolver
// "MATEUS" from "O EVANGELHO SEGUNDO\n...\nMATEUS"
const MULTILINE_HEADINGS = [
  // [leader regex, name regex, book id]
  [/^O EVANGELHO SEGUNDO$/, /^MATEUS$/, 'mat'],
  [/^ATOS$/, null, 'act'], // single-line ATOS sometimes
  [/^OS ATOS DOS APÓSTOLOS$/, null, 'act'],
  [/^EPÍSTOLA DE PAULO AOS$/, /^ROMANOS$/, 'rom'],
  [/^APOCALIPSE/, null, 'rev'],
];

// Repeated single-line headings (track ordinal occurrence)
const REPEATED_SINGLE = {
  'SAMUEL':   ['1sa', '2sa'],
  'REIS':     ['1ki', '2ki'],
  'CRÔNICAS': ['1ch', '2ch'],
  'CORÍNTIOS': ['1co', '2co'],          // "PRIMEIRA/SEGUNDA EPÍSTOLA DE PAULO AOS\nCORÍNTIOS"
  'TESSALONICENSES': ['1th', '2th'],
  'TIMÓTEO': ['1ti', '2ti'],            // "PRIMEIRA/SEGUNDA EPÍSTOLA DE PAULO A\nTIMÓTEO"
  'PEDRO':   ['1pe', '2pe'],            // "PRIMEIRA/SEGUNDA EPÍSTOLA DE\nPEDRO"
};

// Special multi-line: CÂNTICO\nDOS CÂNTICOS DE SALOMÃO → sng
// João: 4 occurrences; gospel + 3 epistles
function detectOrdinal(idx) {
  for (let i = idx - 1; i >= Math.max(0, idx - 8); i--) {
    const l = lines[i].trim().toUpperCase();
    if (!l) continue;
    if (/^PRIMEIRA\b/.test(l)) return 1;
    if (/^SEGUNDA\b/.test(l)) return 2;
    if (/^TERCEIRA\b/.test(l)) return 3;
    if (/^O EVANGELHO SEGUNDO\b/.test(l)) return 0; // gospel
    if (/^EPÍSTOLA\b|^OS ATOS\b/.test(l)) break; // not a João context
  }
  return null;
}

function isJoaoGospelContext(idx) {
  for (let i = idx - 1; i >= Math.max(0, idx - 8); i--) {
    const l = lines[i].trim().toUpperCase();
    if (!l) continue;
    if (/^O EVANGELHO SEGUNDO\b/.test(l)) return true;
    if (/^PRIMEIRA\b|^SEGUNDA\b|^TERCEIRA\b/.test(l)) return false;
    if (/^EPÍSTOLA\b|^OS ATOS\b/.test(l)) return false;
  }
  return false;
}

const sections = [];
const counters = {}; // for repeated headings
let i = 0;
while (i < lines.length) {
  const line = lines[i].trim();
  if (!line) { i++; continue; }

  // CÂNTICO multi-line
  if (line === 'CÂNTICO') {
    let next = '';
    for (let j = i + 1; j <= Math.min(lines.length - 1, i + 3); j++) {
      const t = lines[j].trim();
      if (!t) continue;
      next = t;
      break;
    }
    if (next.startsWith('DOS CÂNTICOS') || next.startsWith('DOS CANTARES')) {
      sections.push({ book: 'sng', line: i, raw: 'CÂNTICO DOS CÂNTICOS DE SALOMÃO' });
    }
    i++; continue;
  }
  // OS ATOS DOS / ATOS
  if (line === 'OS ATOS DOS APÓSTOLOS' || line === 'ATOS') {
    sections.push({ book: 'act', line: i, raw: line });
    i++; continue;
  }
  // O EVANGELHO SEGUNDO\nMATEUS
  if (line === 'O EVANGELHO SEGUNDO') {
    let advanced = false;
    for (let j = i + 1; j <= Math.min(lines.length - 1, i + 5); j++) {
      const t = lines[j].trim();
      if (!t) continue;
      if (t === 'MATEUS') { sections.push({ book: 'mat', line: i, raw: 'EVANGELHO SEGUNDO MATEUS' }); i = j + 1; advanced = true; break; }
      if (t === 'MARCOS') { sections.push({ book: 'mrk', line: i, raw: 'EVANGELHO SEGUNDO MARCOS' }); i = j + 1; advanced = true; break; }
      if (t === 'LUCAS')  { sections.push({ book: 'luk', line: i, raw: 'EVANGELHO SEGUNDO LUCAS' });  i = j + 1; advanced = true; break; }
      if (t === 'JOÃO')   { sections.push({ book: 'jhn', line: i, raw: 'EVANGELHO SEGUNDO JOÃO' });   i = j + 1; advanced = true; break; }
      break;
    }
    if (!advanced) i++;
    continue;
  }
  // EPÍSTOLA DE PAULO AOS\nROMANOS  (only Romans uses this exact 2-line format)
  if (line === 'EPÍSTOLA DE PAULO AOS') {
    let advanced = false;
    for (let j = i + 1; j <= Math.min(lines.length - 1, i + 5); j++) {
      const t = lines[j].trim();
      if (!t) continue;
      if (t === 'ROMANOS') { sections.push({ book: 'rom', line: i, raw: 'EPÍSTOLA DE PAULO AOS ROMANOS' }); i = j + 1; advanced = true; break; }
      break;
    }
    if (!advanced) i++;
    continue;
  }
  // APOCALIPSE...
  if (line.startsWith('APOCALIPSE')) {
    sections.push({ book: 'rev', line: i, raw: line });
    i++; continue;
  }
  // JOÃO single-line: gospel context vs epistle ordinal
  if (line === 'JOÃO') {
    // Skip — handled by EVANGELHO SEGUNDO above OR by ordinal here
    const ord = detectOrdinal(i);
    if (ord === 1) sections.push({ book: '1jn', line: i, raw: 'JOÃO (1)' });
    else if (ord === 2) sections.push({ book: '2jn', line: i, raw: 'JOÃO (2)' });
    else if (ord === 3) sections.push({ book: '3jn', line: i, raw: 'JOÃO (3)' });
    // else: handled by EVANGELHO above (skip to avoid duplicate)
    i++; continue;
  }
  // Repeated single-line (SAMUEL/REIS/CRÔNICAS/CORÍNTIOS/etc)
  if (REPEATED_SINGLE[line]) {
    counters[line] = (counters[line] || 0) + 1;
    const arr = REPEATED_SINGLE[line];
    const book = arr[Math.min(counters[line] - 1, arr.length - 1)];
    sections.push({ book, line: i, raw: `${line} (#${counters[line]})` });
    i++; continue;
  }
  // Single-line plain
  let matched = false;
  for (const [name, book] of SINGLE_HEADINGS) {
    if (line === name || line === name + '.') {
      sections.push({ book, line: i, raw: line });
      matched = true;
      break;
    }
  }
  if (matched) { i++; continue; }
  i++;
}

// Filter to first occurrence per book
const seenBooks = new Set();
const finalSections = [];
for (const s of sections) {
  if (seenBooks.has(s.book)) continue;
  seenBooks.add(s.book);
  finalSections.push(s);
}
finalSections.sort((a, b) => a.line - b.line);

// Compute end lines: for OT books, end at next OT book OR OT_END.
// For NT books, end at next NT book OR NT_END_DICT.
const NT_BOOKS = new Set(['mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev']);
for (let k = 0; k < finalSections.length; k++) {
  const cur = finalSections[k];
  const isNT = NT_BOOKS.has(cur.book);
  let nextSameSide = null;
  for (let m = k + 1; m < finalSections.length; m++) {
    if (NT_BOOKS.has(finalSections[m].book) === isNT) { nextSameSide = finalSections[m]; break; }
  }
  if (cur.book === 'mal') {
    cur.endLine = OT_END;            // hard cap
  } else if (cur.book === 'rev') {
    cur.endLine = NT_END_DICT;
  } else {
    cur.endLine = nextSameSide ? nextSameSide.line : (isNT ? NT_END_DICT : OT_END);
  }
}

const ALL_DB_BOOKS = ['gen','exo','lev','num','deu','jos','jdg','rut','1sa','2sa','1ki','2ki','1ch','2ch','ezr','neh','est','job','psa','pro','ecc','sng','isa','jer','lam','ezk','dan','hos','jol','amo','oba','jon','mic','nam','hab','zep','hag','zec','mal','mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev'];

console.log(`Total book sections detected: ${finalSections.length}/66`);
const detected = finalSections.map(s => s.book);
const missing = ALL_DB_BOOKS.filter(b => !detected.includes(b));
console.log('Missing:', missing.join(',') || 'NONE');
const extra = detected.filter(b => !ALL_DB_BOOKS.includes(b));
console.log('Extra:', extra.join(',') || 'NONE');
console.log('\nSection ranges:');
for (const s of finalSections) {
  console.log(`  ${s.book.padEnd(4)} ${String(s.line).padStart(7)}..${String(s.endLine).padStart(7)} (${String(s.endLine - s.line).padStart(6)} lines) ${s.raw}`);
}

fs.writeFileSync('/tmp/pdf-sections.json', JSON.stringify(finalSections, null, 2));

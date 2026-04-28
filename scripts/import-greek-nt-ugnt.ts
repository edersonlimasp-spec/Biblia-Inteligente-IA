/**
 * Import Greek NT interlinear data from unfoldingWord UGNT.
 *
 * Source: unfoldingWord® Greek New Testament (CC BY-SA 4.0)
 *   https://git.door43.org/unfoldingWord/el-x-koine_ugnt
 *
 * USFM token format per word:
 *   \w word|lemma="..." strong="G09760" x-morph="..."\w*
 *
 * Strong format in UGNT is zero-padded with a sub-discriminator digit:
 *   G09760 -> G976,  G24240 -> G2424,  G55470 -> G5547
 *
 * For each UGNT word we:
 *   - Parse (book, chapter, verse, position, original_word, strong)
 *   - Look up a Portuguese single-word gloss from a layered dictionary:
 *     1. Hand-curated entries that already exist in bible_words (truth)
 *     2. Manual top-NT overrides (this file)
 *     3. Heuristic on strong_entries.portuguese_def (skips numbering)
 *   - Insert with gloss when found, otherwise null (word stays not-blue)
 *
 * Existing NT rows are replaced book-by-book to avoid duplicates while
 * preserving the curated glosses (re-applied via the truth dictionary).
 */

import { db } from "../server/db";
import { bibleWords, strongEntries } from "../shared/schema";
import { sql, eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const UGNT_DIR = "/tmp/ugnt";

const NT_BOOK_MAP: Record<string, string> = {
  "MAT": "mat", "MRK": "mrk", "LUK": "luk", "JHN": "jhn", "ACT": "act",
  "ROM": "rom", "1CO": "1co", "2CO": "2co", "GAL": "gal", "EPH": "eph",
  "PHP": "php", "COL": "col", "1TH": "1th", "2TH": "2th", "1TI": "1ti",
  "2TI": "2ti", "TIT": "tit", "PHM": "phm", "HEB": "heb", "JAS": "jas",
  "1PE": "1pe", "2PE": "2pe", "1JN": "1jn", "2JN": "2jn", "3JN": "3jn",
  "JUD": "jud", "REV": "rev",
};

const NT_BOOKS = Object.values(NT_BOOK_MAP);

/**
 * Manual overrides for the most frequent NT lemmas where the heuristic on
 * portuguese_def would pick a poor first word (verb canonical forms hidden
 * deep in the definition, definite article, copula, etc).
 *
 * Glosses are single Portuguese root words used in Almeida, lowercase.
 * Inflection variants are generated server-side at lookup time.
 */
const TOP_NT_OVERRIDES: Record<string, string> = {
  // Articles / pronouns / particles
  "G3588": "o",            // ho - definite article
  "G2532": "e",            // kai - and
  "G1161": "mas",          // de - but/and
  "G846": "ele",           // autos - he/him/it
  "G3778": "este",         // houtos - this
  "G1565": "aquele",       // ekeinos - that
  "G3756": "não",          // ou - not
  "G3361": "não",          // me - not
  "G1722": "em",           // en - in
  "G1519": "para",         // eis - to/into
  "G1537": "de",           // ek - from/out of
  "G4314": "com",          // pros - to/with
  "G575": "de",            // apo - from
  "G1909": "sobre",        // epi - upon/over
  "G5259": "por",          // hupo - by/under
  "G1223": "por",          // dia - through
  "G3326": "com",          // meta - with
  "G4862": "com",          // sun - with
  "G1473": "eu",           // ego - I
  "G4771": "tu",           // su - you
  "G2257": "nosso",        // hemon - our
  "G5210": "vós",          // humeis - you (plural)
  "G2249": "nós",          // hemeis - we
  "G3754": "que",          // hoti - that/because
  "G1437": "se",           // ean - if
  "G1487": "se",           // ei - if
  "G2443": "para",         // hina - so that
  "G302": "se",            // an - particle of contingency
  "G1063": "pois",         // gar - for/because
  "G3767": "portanto",     // oun - therefore
  "G235": "mas",           // alla - but
  "G1410": "poder",        // dunamai - to be able

  // Copula / common verbs
  "G1510": "ser",          // eimi - to be
  "G2192": "ter",          // echo - to have
  "G3004": "dizer",        // lego - to say
  "G2046": "dizer",        // ereo - to say (future)
  "G2036": "disse",        // eipon - said (aor)
  "G4160": "fazer",        // poieo - to do/make
  "G2064": "vir",          // erchomai - to come
  "G565": "ir",            // aperchomai - to go
  "G4198": "ir",           // poreuomai - to go
  "G1325": "dar",          // didomi - to give
  "G2983": "tomar",        // lambano - to take
  "G1492": "saber",        // oida - to know
  "G1097": "conhecer",     // ginosko - to know
  "G1380": "parecer",      // dokeo - to seem
  "G3708": "ver",          // horao - to see
  "G991": "ver",           // blepo - to see
  "G2334": "ver",          // theoreo - to behold
  "G191": "ouvir",         // akouo - to hear
  "G2980": "falar",        // laleo - to speak
  "G559": "afirmar",       // phemi - to say
  "G4100": "crer",         // pisteuo - to believe
  "G25": "amar",           // agapao - to love
  "G5368": "amar",         // phileo - to love (affection)
  "G2065": "pedir",        // erotao - to ask
  "G154": "pedir",         // aiteo - to ask
  "G3870": "exortar",      // parakaleo - to exhort
  "G611": "responder",     // apokrinomai - to answer
  "G2127": "abençoar",     // eulogeo - to bless
  "G4336": "orar",         // proseuchomai - to pray
  "G907": "batizar",       // baptizo - to baptize
  "G2784": "pregar",       // kerusso - to preach
  "G1321": "ensinar",      // didasko - to teach
  "G1577": "igreja",       // ekklesia - assembly/church (also lemma noun)
  "G4982": "salvar",       // sozo - to save
  "G2222": "vida",         // zoe - life
  "G2198": "viver",        // zao - to live
  "G599": "morrer",        // apothnesko - to die
  "G2289": "matar",        // thanatoo - to put to death
  "G2476": "estar",        // histemi - to stand
  "G2521": "estar",        // kathemai - to sit
  "G2523": "sentar",       // kathizo - to sit down
  "G450": "levantar",      // anistemi - to rise
  "G1453": "levantar",     // egeiro - to raise
  "G2240": "vir",          // heko - to come
  "G863": "deixar",        // aphiemi - to leave/forgive
  "G1325": "dar",          // didomi
  "G1325": "dar",
  "G3306": "permanecer",   // meno - to remain
  "G2570": "bom",          // kalos
  "G18": "bom",            // agathos

  // High-frequency nouns (proper + common)
  "G2316": "Deus",         // theos
  "G2962": "Senhor",       // kurios
  "G2424": "Jesus",        // Iesous
  "G5547": "Cristo",       // Christos
  "G3056": "palavra",      // logos
  "G4151": "espírito",     // pneuma
  "G3962": "pai",          // pater
  "G3384": "mãe",          // meter
  "G80": "irmão",          // adelphos
  "G79": "irmã",           // adelphe
  "G3439": "unigênito",    // monogenes
  "G5207": "filho",        // huios
  "G2364": "filha",         // thugater
  "G444": "homem",         // anthropos
  "G435": "homem",         // aner (man/husband)
  "G1135": "mulher",        // gune
  "G3813": "criança",      // paidion
  "G2889": "mundo",        // kosmos
  "G3772": "céu",           // ouranos
  "G1093": "terra",         // ge
  "G2281": "mar",           // thalassa
  "G5204": "água",          // hudor
  "G740": "pão",            // artos
  "G3631": "vinho",         // oinos
  "G129": "sangue",         // haima
  "G4561": "carne",         // sarx
  "G4983": "corpo",         // soma
  "G5590": "alma",          // psuche
  "G2588": "coração",       // kardia
  "G3563": "mente",         // nous
  "G4750": "boca",          // stoma
  "G3788": "olho",          // ophthalmos
  "G4750": "boca",          // stoma
  "G5495": "mão",           // cheir
  "G4228": "pé",            // pous
  "G2776": "cabeça",        // kephale
  "G3954": "ousadia",       // parresia
  "G3814": "criança",       // paidiske
  "G3624": "casa",          // oikos
  "G3614": "casa",          // oikia
  "G4172": "cidade",        // polis
  "G2992": "povo",          // laos
  "G1484": "nação",         // ethnos
  "G2453": "judeu",         // Ioudaios
  "G935": "rei",            // basileus
  "G932": "reino",          // basileia
  "G4396": "profeta",       // prophetes
  "G652": "apóstolo",       // apostolos
  "G3101": "discípulo",     // mathetes
  "G1320": "mestre",        // didaskalos
  "G2409": "sacerdote",     // hiereus
  "G749": "sumo sacerdote", // archiereus (compound; matches "sacerdote" partially)
  "G1122": "escriba",       // grammateus
  "G5330": "fariseu",       // Pharisaios
  "G4523": "saduceu",       // Saddoukaios
  "G1401": "servo",         // doulos
  "G2226": "criatura",      // zoon
  "G32": "anjo",            // aggelos
  "G1140": "demônio",       // daimonion
  "G1228": "diabo",         // diabolos
  "G4567": "Satanás",       // Satanas
  "G3686": "nome",          // onoma
  "G2098": "evangelho",     // euaggelion
  "G1391": "glória",        // doxa
  "G5485": "graça",         // charis
  "G1656": "misericórdia",  // eleos
  "G225": "verdade",        // aletheia
  "G1411": "poder",         // dunamis
  "G4102": "fé",            // pistis
  "G1680": "esperança",     // elpis
  "G26": "amor",            // agape
  "G5479": "alegria",       // chara
  "G1515": "paz",           // eirene
  "G266": "pecado",         // hamartia
  "G93": "injustiça",       // adikia
  "G1343": "justiça",       // dikaiosune
  "G1342": "justo",         // dikaios
  "G40": "santo",           // hagios
  "G2511": "limpar",        // katharizo
  "G2513": "puro",          // katharos
  "G3551": "lei",           // nomos
  "G1242": "aliança",       // diatheke
  "G2920": "juízo",         // krisis
  "G2917": "juízo",         // krima
  "G3551": "lei",           // nomos (dup, same)
  "G1492": "saber",         // oida
  "G2222": "vida",          // zoe
  "G166": "eterno",         // aionios
  "G165": "século",         // aion (often "era/eternidade")
  "G2250": "dia",           // hemera
  "G3571": "noite",         // nux
  "G5550": "tempo",         // chronos
  "G2540": "tempo",         // kairos
  "G5610": "hora",          // hora
  "G2098": "evangelho",     // euaggelion
  "G3144": "testemunha",    // martus
  "G1391": "glória",        // doxa
  "G5547": "Cristo",
  "G3056": "palavra",
  "G2316": "Deus",
  "G5457": "luz",           // phos
  "G4655": "trevas",        // skotos
  "G4653": "trevas",        // skotia
  "G2222": "vida",
  "G2937": "criatura",      // ktisis
  "G2316": "Deus",
  "G5083": "guardar",       // tereo
  "G1781": "mandar",        // entellomai
  "G1785": "mandamento",    // entole
  "G1785": "mandamento",
  "G1411": "poder",
  "G1849": "autoridade",    // exousia
  "G1411": "poder",
  "G3173": "grande",        // megas
  "G3398": "pequeno",       // mikros
  "G4183": "muitos",        // polus
  "G3956": "todo",          // pas
  "G3650": "todo",          // holos
  "G2087": "outro",         // heteros
  "G243": "outro",          // allos
  "G1538": "cada",          // hekastos
  "G3367": "ninguém",       // medeis
  "G3762": "ninguém",       // oudeis
  "G5100": "alguém",        // tis (indefinite)
  "G5101": "quem",          // tis (interrogative)
  "G3739": "que",           // hos (relative)
  "G3745": "quanto",        // hosos
  "G4214": "quanto",        // posos
  "G4459": "como",          // pos
  "G4218": "alguma vez",    // pote
  "G3753": "quando",        // hote
  "G3704": "para que",      // hopos
  "G2596": "segundo",       // kata
  "G5228": "por",           // huper
  "G3779": "assim",         // houtos (adverb)
  "G3568": "agora",         // nun
  "G5119": "então",         // tote
  "G1893": "porque",        // epei
  "G2089": "ainda",         // eti
  "G2235": "já",            // ede
  "G3568": "agora",
  "G1487": "se",
};

/**
 * Convert UGNT zero-padded Strong (e.g. G09760, G24240) to standard form (G976, G2424).
 * Pattern: G + 4 zero-padded digits + 1 disambiguator digit.
 */
function normalizeUgntStrong(raw: string): string | null {
  if (!raw) return null;
  const m = raw.match(/^([GH])(\d+)$/);
  if (!m) return null;
  const prefix = m[1];
  const digits = m[2];
  if (digits.length < 2) return prefix + digits;
  // Drop trailing disambiguator digit, then strip leading zeros
  const main = digits.slice(0, -1);
  const stripped = main.replace(/^0+/, "") || "0";
  return prefix + stripped;
}

/**
 * Smart first-word extractor for portuguese_def fields.
 * Skips numbering ("1)", "1a)", "(2)"), placeholders ("X"), and
 * very short / generic stop tokens.
 */
const PT_DEF_STOPWORDS = new Set([
  "com", "para", "por", "que", "uma", "ser", "ter", "ele", "ela",
  "isto", "isso", "este", "essa", "esse", "esta", "uma", "este",
  "respeito", "as", "os", "ou", "do", "da", "de", "no", "na",
  "ao", "aos", "um", "ver", "isto", "1a", "1b", "2a", "2b",
  "the", "and", "but",
]);
function extractGlossFromDef(def: string | null | undefined): string | null {
  if (!def) return null;
  // Strip leading numbering like "1)", "1a)", "(2)", "1.1)" etc
  let cleaned = def.trim();
  cleaned = cleaned.replace(/^[\(\s]*\d+[\)\.\-\s]*[a-z]*[\)\.\-\s]*/i, "");
  cleaned = cleaned.replace(/^[Xx][\s,]*/, "");
  // Take tokens until we find a usable Portuguese word
  const tokens = cleaned.split(/[\s,;:.()\[\]]+/).filter(Boolean);
  for (let i = 0; i < Math.min(tokens.length, 6); i++) {
    const tok = tokens[i].toLowerCase().trim();
    // skip "1)" "1a)" "(1)" leftovers
    if (/^\(?\d+[\)\.\-]?[a-z]*\)?$/.test(tok)) continue;
    if (tok === "x" || tok.length < 3) continue;
    if (PT_DEF_STOPWORDS.has(tok)) continue;
    // Must be alphabetic (with accents) — no digits, no slashes
    if (!/^[a-záéíóúâêôãõçàèìòùüñ\-]+$/i.test(tok)) continue;
    return tok;
  }
  return null;
}

async function buildGlossDictionary(): Promise<Map<string, string>> {
  console.log("Building Greek lemma -> Portuguese gloss dictionary...");
  const dict = new Map<string, string>();

  // Layer 3 (lowest priority): heuristic from strong_entries.portuguese_def
  const greekEntries = await db
    .select({ strongNumber: strongEntries.strongNumber, portugueseDef: strongEntries.portugueseDef })
    .from(strongEntries)
    .where(sql`${strongEntries.strongNumber} ~ '^G'`);
  let heuristicCount = 0;
  for (const row of greekEntries) {
    const gloss = extractGlossFromDef(row.portugueseDef);
    if (gloss) {
      dict.set(row.strongNumber, gloss);
      heuristicCount++;
    }
  }
  console.log(`  Heuristic from strong_entries: ${heuristicCount} entries`);

  // Layer 2 (mid priority): manual top-NT overrides
  for (const [k, v] of Object.entries(TOP_NT_OVERRIDES)) {
    dict.set(k, v.toLowerCase());
  }
  console.log(`  Manual overrides applied: ${Object.keys(TOP_NT_OVERRIDES).length}`);

  // Layer 1 (highest priority): existing hand-curated NT bible_words
  // For Strong numbers used in multiple verses we keep the most-frequent gloss.
  const existing = await db
    .select({
      strongNumber: bibleWords.strongNumber,
      gloss: bibleWords.gloss,
    })
    .from(bibleWords)
    .where(sql`${bibleWords.strongNumber} ~ '^G' AND ${bibleWords.gloss} IS NOT NULL AND ${bibleWords.gloss} != ''`);

  const counts = new Map<string, Map<string, number>>();
  for (const row of existing) {
    if (!row.strongNumber || !row.gloss) continue;
    const norm = row.gloss.toLowerCase().trim();
    if (!norm) continue;
    if (!counts.has(row.strongNumber)) counts.set(row.strongNumber, new Map());
    const inner = counts.get(row.strongNumber)!;
    inner.set(norm, (inner.get(norm) || 0) + 1);
  }
  let curatedCount = 0;
  for (const [strong, glosses] of counts) {
    let best = "";
    let bestN = 0;
    for (const [g, n] of glosses) {
      if (n > bestN) { best = g; bestN = n; }
    }
    if (best) {
      dict.set(strong, best);
      curatedCount++;
    }
  }
  console.log(`  Curated overrides from existing bible_words: ${curatedCount}`);
  console.log(`  Total dictionary size: ${dict.size}`);
  return dict;
}

interface ParsedWord {
  book: string;
  chapter: number;
  verse: number;
  position: number;
  originalWord: string;
  strongNumber: string;
  morphology: string | null;
}

function parseUsfm(filePath: string, bookCode: string): ParsedWord[] {
  const text = fs.readFileSync(filePath, "utf-8");
  const out: ParsedWord[] = [];
  let chapter = 0;
  let verse = 0;
  let position = 0;
  // Tokenize: split lines, look for \c, \v, and \w ... \w*
  const lines = text.split("\n");
  const wordRegex = /\\w\s+([^|]+)\|([^\\]*?)\\w\*/g;
  for (const line of lines) {
    // Chapter marker
    const cMatch = line.match(/^\\c\s+(\d+)/);
    if (cMatch) { chapter = parseInt(cMatch[1], 10); continue; }
    // Verse marker — may appear at start of line followed by content
    const vMatch = line.match(/^\\v\s+(\d+)\b/);
    if (vMatch) {
      verse = parseInt(vMatch[1], 10);
      position = 0;
      // Continue parsing words on the same line (the \v line often has no words; words are on subsequent \w lines)
    }
    // Extract all word tokens from this line
    let m;
    wordRegex.lastIndex = 0;
    while ((m = wordRegex.exec(line)) !== null) {
      const word = m[1].trim();
      const attrs = m[2];
      const strongMatch = attrs.match(/strong="([GH]\d+)"/);
      const morphMatch = attrs.match(/x-morph="([^"]+)"/);
      if (!strongMatch) continue;
      const norm = normalizeUgntStrong(strongMatch[1]);
      if (!norm) continue;
      if (chapter === 0 || verse === 0) continue;
      position++;
      out.push({
        book: bookCode,
        chapter,
        verse,
        position,
        originalWord: word,
        strongNumber: norm,
        morphology: morphMatch ? morphMatch[1] : null,
      });
    }
  }
  return out;
}

async function main() {
  console.log("=== Importing Greek NT interlinear data from UGNT ===\n");

  // 1. Build dictionary first (preserves existing curated glosses)
  const glossDict = await buildGlossDictionary();

  // 2. Parse all 27 USFM files
  console.log("\nParsing UGNT USFM files...");
  const files = fs.readdirSync(UGNT_DIR).filter(f => f.endsWith(".usfm")).sort();
  const allWords: ParsedWord[] = [];
  let mappedGlossCount = 0;
  for (const file of files) {
    const m = file.match(/^\d+-([A-Z0-9]+)\.usfm$/i);
    if (!m) continue;
    const ugntCode = m[1].toUpperCase();
    const bookCode = NT_BOOK_MAP[ugntCode];
    if (!bookCode) {
      console.warn(`  Skipping unknown book code: ${ugntCode}`);
      continue;
    }
    const words = parseUsfm(path.join(UGNT_DIR, file), bookCode);
    for (const w of words) {
      const gloss = glossDict.get(w.strongNumber) || null;
      if (gloss) mappedGlossCount++;
      allWords.push({ ...w, gloss } as any);
    }
    console.log(`  ${ugntCode} -> ${bookCode}: ${words.length} words`);
  }
  console.log(`\nTotal words parsed: ${allWords.length}`);
  console.log(`Words with Portuguese gloss: ${mappedGlossCount} (${(mappedGlossCount / allWords.length * 100).toFixed(1)}%)`);

  // 3. Replace existing NT rows atomically (transaction prevents partial state)
  console.log("\nReplacing NT rows (transactional)...");
  const ntList = NT_BOOKS.map(b => `'${b}'`).join(",");
  const BATCH = 1000;
  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`DELETE FROM bible_words WHERE book IN (${ntList})`));
    console.log(`  Deleted existing NT rows.`);
    for (let i = 0; i < allWords.length; i += BATCH) {
      const batch = allWords.slice(i, i + BATCH);
      await tx.insert(bibleWords).values(batch.map(w => ({
        book: w.book,
        chapter: w.chapter,
        verse: w.verse,
        wordPosition: w.position,
        originalWord: w.originalWord,
        strongNumber: w.strongNumber,
        morphology: w.morphology,
        gloss: (w as any).gloss,
      })));
      if (i % (BATCH * 10) === 0) {
        console.log(`  Inserted ${i + batch.length}/${allWords.length}`);
      }
    }
  });
  console.log(`  Committed total: ${allWords.length}`);

  // 4. Stats
  const stats = await db.execute(sql`
    SELECT book, COUNT(DISTINCT (chapter, verse)) AS verses, COUNT(*) AS words,
           COUNT(*) FILTER (WHERE gloss IS NOT NULL AND gloss != '') AS with_gloss
    FROM bible_words WHERE book = ANY(${NT_BOOKS}::text[])
    GROUP BY book ORDER BY book
  `);
  console.log("\n=== Final NT bible_words stats ===");
  console.log(stats.rows);

  console.log("\nDone.");
  process.exit(0);
}

main().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});

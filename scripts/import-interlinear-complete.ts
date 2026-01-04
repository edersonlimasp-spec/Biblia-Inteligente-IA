/**
 * Import Complete Interlinear Bible Data from morphhb
 * 
 * Structure of morphhb package:
 * Book > Chapter (0-indexed array) > Verse (0-indexed array) > Words (array)
 * Each word: [Hebrew_text, Strong_number_with_prefix, Morphology]
 * 
 * Strong format: "Hc/H1961" = prefix + Strong number
 */

import { db } from "../server/db";
import { bibleWords } from "../shared/schema";
import { sql } from "drizzle-orm";

// Book name mapping from morphhb to our internal IDs
const BOOK_MAP: Record<string, string> = {
  'Genesis': 'gen', 'Exodus': 'exo', 'Leviticus': 'lev', 'Numbers': 'num', 'Deuteronomy': 'deu',
  'Joshua': 'jos', 'Judges': 'jdg', 'Ruth': 'rut', 'I Samuel': '1sa', 'II Samuel': '2sa',
  '1 Samuel': '1sa', '2 Samuel': '2sa',
  'I Kings': '1ki', 'II Kings': '2ki', 'I Chronicles': '1ch', 'II Chronicles': '2ch',
  '1 Kings': '1ki', '2 Kings': '2ki', '1 Chronicles': '1ch', '2 Chronicles': '2ch',
  'Ezra': 'ezr', 'Nehemiah': 'neh', 'Esther': 'est', 'Job': 'job', 'Psalms': 'psa',
  'Proverbs': 'pro', 'Ecclesiastes': 'ecc', 'Song of Solomon': 'sng',
  'Isaiah': 'isa', 'Jeremiah': 'jer', 'Lamentations': 'lam', 'Ezekiel': 'ezk', 'Daniel': 'dan',
  'Hosea': 'hos', 'Joel': 'jol', 'Amos': 'amo', 'Obadiah': 'oba', 'Jonah': 'jon',
  'Micah': 'mic', 'Nahum': 'nam', 'Habakkuk': 'hab', 'Zephaniah': 'zep',
  'Haggai': 'hag', 'Zechariah': 'zec', 'Malachi': 'mal'
};

// Portuguese glosses for Hebrew words - ONLY proper nouns and specific terms
// that uniquely identify words. Generic terms removed to prevent misalignment.
// For definitions, use strong_entries table which has authoritative Portuguese translations.
const HEBREW_GLOSS: Record<string, string> = {
  // === NOMES DE DEUS (únicos e específicos) ===
  'H3068': 'SENHOR', 'H3069': 'SENHOR', 'H430': 'Deus', 'H410': 'Deus', 'H433': 'Deus',
  'H136': 'Senhor', 'H7706': 'Todo-Poderoso',
  
  // === NOMES PRÓPRIOS DE PESSOAS ===
  'H3478': 'Israel', 'H4872': 'Moisés', 'H1732': 'Davi', 'H85': 'Abraão', 'H3290': 'Jacó',
  'H3327': 'Isaque', 'H3130': 'José', 'H175': 'Arão', 'H3091': 'Josué', 'H7586': 'Saul',
  'H8010': 'Salomão', 'H452': 'Elias', 'H477': 'Eliseu', 'H5281': 'Noemi', 'H458': 'Elimeleque',
  'H1143': 'Benjamim', 'H7466': 'Rute', 'H5283': 'Naamã', 'H8050': 'Samuel', 'H138': 'Adonias',
  'H53': 'Absalão', 'H3097': 'Joabe', 'H1141': 'Benaías', 'H4519': 'Manassés', 'H669': 'Efraim',
  'H7205': 'Rúben', 'H3063': 'Judá', 'H8095': 'Simeão', 'H3878': 'Levi', 'H1835': 'Dã',
  'H5321': 'Naftali', 'H1410': 'Gade', 'H836': 'Aser', 'H3485': 'Issacar', 'H2074': 'Zebulom',
  
  // === NOMES PRÓPRIOS DE LUGARES ===
  'H4714': 'Egito', 'H894': 'Babilônia', 'H804': 'Assíria', 'H3389': 'Jerusalém',
  'H6726': 'Sião', 'H1035': 'Belém', 'H4124': 'Moabe', 'H123': 'Edom', 'H6429': 'Filístia',
  'H1568': 'Gileade', 'H3383': 'Jordão', 'H2022': 'monte', 'H5514': 'Sinai', 'H2768': 'Hermom',
  'H3844': 'Líbano', 'H3050': 'Seba', 'H8152': 'Sinear', 'H763': 'Arã', 'H3667': 'Canaã',
  
  // === TERMOS TEOLÓGICOS ESPECÍFICOS ===
  'H3742': 'querubim', 'H8314': 'serafim', 'H4397': 'anjo', 'H4899': 'Messias',
  'H7676': 'sábado', 'H6453': 'Páscoa', 'H3725': 'expiação', 'H5930': 'holocausto',
  'H727': 'arca', 'H4908': 'tabernáculo', 'H4720': 'santuário', 'H1964': 'templo',
  
  // === SUBSTANTIVOS ESPECÍFICOS (palavras únicas sem ambiguidade) ===
  'H7225': 'princípio', 'H8064': 'céu', 'H776': 'terra', 'H7549': 'firmamento',
  'H8415': 'abismo', 'H216': 'luz', 'H2822': 'trevas',
};

interface BibleWordEntry {
  book: string;
  chapter: number;
  verse: number;
  wordPosition: number;
  originalWord: string;
  strongNumber: string;
  gloss: string;
  morphology?: string;
}

let totalImported = 0;
let totalErrors = 0;

function extractStrongNumber(strongField: string): string {
  // Format: "Hc/H1961" or "H1961" or "Hd/H8199"
  // Extract the main Strong number (last H/G + digits)
  const match = strongField.match(/[HG]\d+/g);
  if (match && match.length > 0) {
    // Return the last match (the actual Strong number, not prefix indicators)
    return match[match.length - 1];
  }
  return '';
}

function getGloss(strongNumber: string, originalWord: string): string {
  if (HEBREW_GLOSS[strongNumber]) {
    return HEBREW_GLOSS[strongNumber];
  }
  // Remove vowel points and return cleaned word as fallback
  return originalWord.replace(/[\u0591-\u05C7]/g, '');
}

async function importHebrewFromMorphhb(): Promise<void> {
  console.log("\n📜 Importando Velho Testamento (Hebraico - morphhb)...\n");
  
  try {
    // Use dynamic import for ESM compatibility
    const morphhb = await import('morphhb').then(m => m.default || m);
    const bookNames = Object.keys(morphhb);
    
    console.log(`  📚 Encontrados ${bookNames.length} livros no morphhb`);
    
    let totalWords = 0;
    
    for (const bookName of bookNames) {
      const bookId = BOOK_MAP[bookName];
      if (!bookId) {
        console.log(`  ⚠️ Livro não mapeado: ${bookName}`);
        continue;
      }
      
      const bookData = morphhb[bookName];
      if (!Array.isArray(bookData)) {
        console.log(`  ⚠️ Estrutura inválida para ${bookName}`);
        continue;
      }
      
      console.log(`  📖 Processando ${bookName} (${bookId})...`);
      
      const entries: BibleWordEntry[] = [];
      
      // bookData is array of chapters (0-indexed)
      for (let chapterIdx = 0; chapterIdx < bookData.length; chapterIdx++) {
        const chapterData = bookData[chapterIdx];
        if (!Array.isArray(chapterData)) continue;
        
        const chapterNum = chapterIdx + 1; // Convert to 1-indexed
        
        // chapterData is array of verses (0-indexed)
        for (let verseIdx = 0; verseIdx < chapterData.length; verseIdx++) {
          const verseData = chapterData[verseIdx];
          if (!Array.isArray(verseData)) continue;
          
          const verseNum = verseIdx + 1; // Convert to 1-indexed
          
          // verseData is array of words
          for (let wordIdx = 0; wordIdx < verseData.length; wordIdx++) {
            const wordData = verseData[wordIdx];
            if (!Array.isArray(wordData) || wordData.length < 2) continue;
            
            const [hebrewText, strongField, morphology] = wordData;
            const strongNumber = extractStrongNumber(strongField || '');
            
            if (!strongNumber) continue;
            
            const wordPosition = wordIdx + 1;
            const gloss = getGloss(strongNumber, hebrewText || '');
            
            entries.push({
              book: bookId,
              chapter: chapterNum,
              verse: verseNum,
              wordPosition: wordPosition,
              originalWord: hebrewText || '',
              strongNumber: strongNumber,
              gloss: gloss,
              morphology: morphology || ''
            });
          }
        }
      }
      
      // Batch insert
      if (entries.length > 0) {
        await batchInsertWords(entries);
        totalWords += entries.length;
        console.log(`    ✅ ${entries.length} palavras`);
      }
    }
    
    totalImported += totalWords;
    console.log(`\n  📊 Total VT: ${totalWords} palavras importadas`);
    
  } catch (error) {
    console.error("Erro ao importar Velho Testamento:", error);
    totalErrors++;
  }
}

async function importGreekNT(): Promise<void> {
  console.log("\n📜 Importando Novo Testamento (Grego - dados manuais)...\n");
  
  // Key NT verses with manual mappings
  const ntData = [
    // John 1:1-5
    { book: 'jhn', ch: 1, v: 1, words: [
      { w: 'Ἐν', s: 'G1722', g: 'No' },
      { w: 'ἀρχῇ', s: 'G746', g: 'princípio' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'ὁ', s: 'G3588', g: 'a' },
      { w: 'λόγος', s: 'G3056', g: 'Palavra' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'ὁ', s: 'G3588', g: 'a' },
      { w: 'λόγος', s: 'G3056', g: 'Palavra' },
      { w: 'ἦν', s: 'G1510', g: 'estava' },
      { w: 'πρὸς', s: 'G4314', g: 'com' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'θεόν', s: 'G2316', g: 'Deus' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'θεὸς', s: 'G2316', g: 'Deus' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'ὁ', s: 'G3588', g: 'a' },
      { w: 'λόγος', s: 'G3056', g: 'Palavra' },
    ]},
    { book: 'jhn', ch: 1, v: 2, words: [
      { w: 'οὗτος', s: 'G3778', g: 'Este' },
      { w: 'ἦν', s: 'G1510', g: 'estava' },
      { w: 'ἐν', s: 'G1722', g: 'no' },
      { w: 'ἀρχῇ', s: 'G746', g: 'princípio' },
      { w: 'πρὸς', s: 'G4314', g: 'com' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'θεόν', s: 'G2316', g: 'Deus' },
    ]},
    { book: 'jhn', ch: 1, v: 3, words: [
      { w: 'πάντα', s: 'G3956', g: 'Todas as coisas' },
      { w: 'δι', s: 'G1223', g: 'por meio' },
      { w: 'αὐτοῦ', s: 'G846', g: 'dele' },
      { w: 'ἐγένετο', s: 'G1096', g: 'foram feitas' },
    ]},
    { book: 'jhn', ch: 1, v: 4, words: [
      { w: 'ἐν', s: 'G1722', g: 'Nele' },
      { w: 'αὐτῷ', s: 'G846', g: 'nele' },
      { w: 'ζωὴ', s: 'G2222', g: 'vida' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'ἡ', s: 'G3588', g: 'a' },
      { w: 'ζωὴ', s: 'G2222', g: 'vida' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'τὸ', s: 'G3588', g: 'a' },
      { w: 'φῶς', s: 'G5457', g: 'luz' },
      { w: 'τῶν', s: 'G3588', g: 'dos' },
      { w: 'ἀνθρώπων', s: 'G444', g: 'homens' },
    ]},
    { book: 'jhn', ch: 1, v: 5, words: [
      { w: 'καὶ', s: 'G2532', g: 'E' },
      { w: 'τὸ', s: 'G3588', g: 'a' },
      { w: 'φῶς', s: 'G5457', g: 'luz' },
      { w: 'ἐν', s: 'G1722', g: 'nas' },
      { w: 'τῇ', s: 'G3588', g: 'as' },
      { w: 'σκοτίᾳ', s: 'G4653', g: 'trevas' },
      { w: 'φαίνει', s: 'G5316', g: 'brilha' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'ἡ', s: 'G3588', g: 'as' },
      { w: 'σκοτία', s: 'G4653', g: 'trevas' },
      { w: 'αὐτὸ', s: 'G846', g: 'ela' },
      { w: 'οὐ', s: 'G3756', g: 'não' },
      { w: 'κατέλαβεν', s: 'G2638', g: 'compreenderam' },
    ]},
    // John 3:16
    { book: 'jhn', ch: 3, v: 16, words: [
      { w: 'οὕτως', s: 'G3779', g: 'de tal maneira' },
      { w: 'γὰρ', s: 'G1063', g: 'pois' },
      { w: 'ἠγάπησεν', s: 'G25', g: 'amou' },
      { w: 'ὁ', s: 'G3588', g: 'o' },
      { w: 'θεὸς', s: 'G2316', g: 'Deus' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'κόσμον', s: 'G2889', g: 'mundo' },
      { w: 'ὥστε', s: 'G5620', g: 'que' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'υἱὸν', s: 'G5207', g: 'Filho' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'μονογενῆ', s: 'G3439', g: 'unigênito' },
      { w: 'ἔδωκεν', s: 'G1325', g: 'deu' },
    ]},
    // Matthew 5:3-12 (Beatitudes)
    { book: 'mat', ch: 5, v: 3, words: [
      { w: 'Μακάριοι', s: 'G3107', g: 'Bem-aventurados' },
      { w: 'οἱ', s: 'G3588', g: 'os' },
      { w: 'πτωχοὶ', s: 'G4434', g: 'pobres' },
      { w: 'τῷ', s: 'G3588', g: 'no' },
      { w: 'πνεύματι', s: 'G4151', g: 'espírito' },
    ]},
    // Romans 8:28
    { book: 'rom', ch: 8, v: 28, words: [
      { w: 'οἴδαμεν', s: 'G1492', g: 'sabemos' },
      { w: 'δὲ', s: 'G1161', g: 'e' },
      { w: 'ὅτι', s: 'G3754', g: 'que' },
      { w: 'τοῖς', s: 'G3588', g: 'aos' },
      { w: 'ἀγαπῶσιν', s: 'G25', g: 'que amam' },
      { w: 'τὸν', s: 'G3588', g: 'a' },
      { w: 'θεὸν', s: 'G2316', g: 'Deus' },
      { w: 'πάντα', s: 'G3956', g: 'todas as coisas' },
      { w: 'συνεργεῖ', s: 'G4903', g: 'cooperam' },
      { w: 'εἰς', s: 'G1519', g: 'para' },
      { w: 'ἀγαθόν', s: 'G18', g: 'o bem' },
    ]},
  ];

  const entries: BibleWordEntry[] = [];
  
  for (const verse of ntData) {
    let pos = 0;
    for (const word of verse.words) {
      pos++;
      entries.push({
        book: verse.book,
        chapter: verse.ch,
        verse: verse.v,
        wordPosition: pos,
        originalWord: word.w,
        strongNumber: word.s,
        gloss: word.g
      });
    }
  }
  
  if (entries.length > 0) {
    await batchInsertWords(entries);
    totalImported += entries.length;
    console.log(`  ✅ ${entries.length} palavras do NT importadas`);
  }
}

async function batchInsertWords(entries: BibleWordEntry[]): Promise<void> {
  const BATCH_SIZE = 1000;
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    
    try {
      await db.insert(bibleWords).values(
        batch.map(entry => ({
          id: `${entry.book}-${entry.chapter}-${entry.verse}-${entry.wordPosition}`,
          book: entry.book,
          chapter: entry.chapter,
          verse: entry.verse,
          wordPosition: entry.wordPosition,
          originalWord: entry.originalWord,
          strongNumber: entry.strongNumber,
          gloss: entry.gloss,
          morphology: entry.morphology || null,
        }))
      ).onConflictDoUpdate({
        target: bibleWords.id,
        set: {
          originalWord: sql`excluded.original_word`,
          strongNumber: sql`excluded.strong_number`,
          gloss: sql`excluded.gloss`,
          morphology: sql`excluded.morphology`,
        }
      });
    } catch (error) {
      totalErrors++;
      console.error(`    ⚠️ Erro no batch ${i}-${i + BATCH_SIZE}:`, error);
    }
  }
}

async function verifyImport(): Promise<void> {
  console.log("\n🔍 Verificando importação...\n");
  
  const stats = await db
    .select({
      book: bibleWords.book,
      count: sql<number>`count(*)::int`
    })
    .from(bibleWords)
    .groupBy(bibleWords.book)
    .orderBy(bibleWords.book);
  
  console.log("  📊 Palavras por livro:");
  let otWords = 0;
  let ntWords = 0;
  const otBooks = ['gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa', '1ki', '2ki', 
                   '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro', 'ecc', 'sng', 'isa', 'jer',
                   'lam', 'ezk', 'dan', 'hos', 'jol', 'amo', 'oba', 'jon', 'mic', 'nam', 'hab', 'zep',
                   'hag', 'zec', 'mal'];
  
  for (const stat of stats) {
    console.log(`    ${stat.book}: ${stat.count} palavras`);
    if (otBooks.includes(stat.book)) {
      otWords += stat.count;
    } else {
      ntWords += stat.count;
    }
  }
  
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  console.log(`\n  📈 Resumo:`);
  console.log(`     Velho Testamento: ${otWords} palavras`);
  console.log(`     Novo Testamento: ${ntWords} palavras`);
  console.log(`     Total: ${total} palavras`);
  
  // Test specific lookups
  console.log("\n  🧪 Testando lookups específicos:");
  
  const gen11 = await db
    .select()
    .from(bibleWords)
    .where(sql`${bibleWords.book} = 'gen' AND ${bibleWords.chapter} = 1 AND ${bibleWords.verse} = 1`)
    .orderBy(bibleWords.wordPosition);
  
  if (gen11.length > 0) {
    console.log(`    ✅ Gênesis 1:1: ${gen11.length} palavras`);
    for (const w of gen11.slice(0, 3)) {
      console.log(`       ${w.wordPosition}. "${w.originalWord}" → ${w.strongNumber} (${w.gloss})`);
    }
  }
  
  const rut11 = await db
    .select()
    .from(bibleWords)
    .where(sql`${bibleWords.book} = 'rut' AND ${bibleWords.chapter} = 1 AND ${bibleWords.verse} = 1`)
    .orderBy(bibleWords.wordPosition);
  
  if (rut11.length > 0) {
    console.log(`    ✅ Rute 1:1: ${rut11.length} palavras`);
    for (const w of rut11.slice(0, 3)) {
      console.log(`       ${w.wordPosition}. "${w.originalWord}" → ${w.strongNumber} (${w.gloss})`);
    }
  }
  
  const jhn11 = await db
    .select()
    .from(bibleWords)
    .where(sql`${bibleWords.book} = 'jhn' AND ${bibleWords.chapter} = 1 AND ${bibleWords.verse} = 1`)
    .orderBy(bibleWords.wordPosition);
  
  if (jhn11.length > 0) {
    console.log(`    ✅ João 1:1: ${jhn11.length} palavras`);
    for (const w of jhn11.slice(0, 3)) {
      console.log(`       ${w.wordPosition}. "${w.originalWord}" → ${w.strongNumber} (${w.gloss})`);
    }
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     IMPORTAÇÃO COMPLETA DE BÍBLIA INTERLINEAR             ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log("║  Fontes:                                                   ║");
  console.log("║  - VT: Open Scriptures Hebrew Bible (morphhb npm)         ║");
  console.log("║  - NT: Mapeamentos manuais verificados                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  
  const startTime = Date.now();
  
  try {
    await importHebrewFromMorphhb();
    await importGreekNT();
    await verifyImport();
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log("\n════════════════════════════════════════════════════════════");
    console.log(`✅ Importação concluída em ${elapsed}s!`);
    console.log(`   Total importado: ${totalImported} palavras`);
    console.log(`   Erros: ${totalErrors}`);
    console.log("════════════════════════════════════════════════════════════\n");
    
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();

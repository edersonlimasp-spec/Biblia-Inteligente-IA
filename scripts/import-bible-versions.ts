import { db } from '../server/db';
import { bibleVersions, bibleVerses } from '@shared/schema';
import { eq } from 'drizzle-orm';

const BOOK_ABBREV_MAP: Record<string, string> = {
  'gn': 'gen', 'Gn': 'gen',
  'ex': 'exo', 'Ex': 'exo',
  'lv': 'lev', 'Lv': 'lev',
  'nm': 'num', 'Nm': 'num',
  'dt': 'deu', 'Dt': 'deu',
  'js': 'jos', 'Js': 'jos',
  'jz': 'jdg', 'Jz': 'jdg',
  'rt': 'rut', 'Rt': 'rut',
  '1sm': '1sa', '1Sm': '1sa',
  '2sm': '2sa', '2Sm': '2sa',
  '1rs': '1ki', '1Rs': '1ki',
  '2rs': '2ki', '2Rs': '2ki',
  '1cr': '1ch', '1Cr': '1ch',
  '2cr': '2ch', '2Cr': '2ch',
  'ed': 'ezr', 'Ed': 'ezr',
  'ne': 'neh', 'Ne': 'neh',
  'et': 'est', 'Et': 'est',
  'jó': 'job', 'Jó': 'job', 'job': 'job', 'Job': 'job',
  'sl': 'psa', 'Sl': 'psa',
  'pv': 'pro', 'Pv': 'pro',
  'ec': 'ecc', 'Ec': 'ecc',
  'ct': 'sng', 'Ct': 'sng',
  'is': 'isa', 'Is': 'isa',
  'jr': 'jer', 'Jr': 'jer',
  'lm': 'lam', 'Lm': 'lam',
  'ez': 'ezk', 'Ez': 'ezk',
  'dn': 'dan', 'Dn': 'dan',
  'os': 'hos', 'Os': 'hos',
  'jl': 'jol', 'Jl': 'jol',
  'am': 'amo', 'Am': 'amo',
  'ob': 'oba', 'Ob': 'oba',
  'jn': 'jon', 'Jn': 'jon',
  'mq': 'mic', 'Mq': 'mic',
  'na': 'nam', 'Na': 'nam',
  'hc': 'hab', 'Hc': 'hab',
  'sf': 'zep', 'Sf': 'zep',
  'ag': 'hag', 'Ag': 'hag',
  'zc': 'zec', 'Zc': 'zec',
  'ml': 'mal', 'Ml': 'mal',
  'mt': 'mat', 'Mt': 'mat',
  'mc': 'mrk', 'Mc': 'mrk',
  'lc': 'luk', 'Lc': 'luk',
  'jo': 'jhn', 'Jo': 'jhn',
  'at': 'act', 'At': 'act',
  'rm': 'rom', 'Rm': 'rom',
  '1co': '1co', '1Co': '1co',
  '2co': '2co', '2Co': '2co',
  'gl': 'gal', 'Gl': 'gal',
  'ef': 'eph', 'Ef': 'eph',
  'fp': 'php', 'Fp': 'php',
  'cl': 'col', 'Cl': 'col',
  '1ts': '1th', '1Ts': '1th',
  '2ts': '2th', '2Ts': '2th',
  '1tm': '1ti', '1Tm': '1ti',
  '2tm': '2ti', '2Tm': '2ti',
  'tt': 'tit', 'Tt': 'tit',
  'fm': 'phm', 'Fm': 'phm',
  'hb': 'heb', 'Hb': 'heb',
  'tg': 'jas', 'Tg': 'jas',
  '1pe': '1pe', '1Pe': '1pe',
  '2pe': '2pe', '2Pe': '2pe',
  '1jo': '1jn', '1Jo': '1jn',
  '2jo': '2jn', '2Jo': '2jn',
  '3jo': '3jn', '3Jo': '3jn',
  'jd': 'jud', 'Jd': 'jud',
  'ap': 'rev', 'Ap': 'rev',
};

const KJV_BOOK_NAMES: Record<string, string> = {
  'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deu': 'Deuteronomy',
  'jos': 'Joshua', 'jdg': 'Judges', 'rut': 'Ruth', '1sa': '1Samuel', '2sa': '2Samuel',
  '1ki': '1Kings', '2ki': '2Kings', '1ch': '1Chronicles', '2ch': '2Chronicles', 'ezr': 'Ezra',
  'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job', 'psa': 'Psalms', 'pro': 'Proverbs',
  'ecc': 'Ecclesiastes', 'sng': 'SongofSolomon', 'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations',
  'ezk': 'Ezekiel', 'dan': 'Daniel', 'hos': 'Hosea', 'jol': 'Joel', 'amo': 'Amos',
  'oba': 'Obadiah', 'jon': 'Jonah', 'mic': 'Micah', 'nam': 'Nahum', 'hab': 'Habakkuk',
  'zep': 'Zephaniah', 'hag': 'Haggai', 'zec': 'Zechariah', 'mal': 'Malachi',
  'mat': 'Matthew', 'mrk': 'Mark', 'luk': 'Luke', 'jhn': 'John', 'act': 'Acts',
  'rom': 'Romans', '1co': '1Corinthians', '2co': '2Corinthians', 'gal': 'Galatians', 'eph': 'Ephesians',
  'php': 'Philippians', 'col': 'Colossians', '1th': '1Thessalonians', '2th': '2Thessalonians',
  '1ti': '1Timothy', '2ti': '2Timothy', 'tit': 'Titus', 'phm': 'Philemon', 'heb': 'Hebrews',
  'jas': 'James', '1pe': '1Peter', '2pe': '2Peter', '1jn': '1John', '2jn': '2John',
  '3jn': '3John', 'jud': 'Jude', 'rev': 'Revelation'
};

const RVR_BOOK_NAMES: Record<string, string> = {
  'gen': 'Génesis', 'exo': 'Éxodo', 'lev': 'Levítico', 'num': 'Números', 'deu': 'Deuteronomio',
  'jos': 'Josué', 'jdg': 'Jueces', 'rut': 'Rut', '1sa': '1 Samuel', '2sa': '2 Samuel',
  '1ki': '1 Reyes', '2ki': '2 Reyes', '1ch': '1 Crónicas', '2ch': '2 Crónicas', 'ezr': 'Esdras',
  'neh': 'Nehemías', 'est': 'Ester', 'job': 'Job', 'psa': 'Salmos', 'pro': 'Proverbios',
  'ecc': 'Eclesiástes', 'sng': 'Cantares', 'isa': 'Isaías', 'jer': 'Jeremías', 'lam': 'Lamentaciones',
  'ezk': 'Ezequiel', 'dan': 'Daniel', 'hos': 'Oséas', 'jol': 'Joel', 'amo': 'Amós',
  'oba': 'Abdías', 'jon': 'Jonás', 'mic': 'Miquéas', 'nam': 'Nahum', 'hab': 'Habacuc',
  'zep': 'Sofonías', 'hag': 'Aggeo', 'zec': 'Zacarías', 'mal': 'Malaquías',
  'mat': 'San Mateo', 'mrk': 'San Márcos', 'luk': 'San Lúcas', 'jhn': 'San Juan', 'act': 'Los Actos',
  'rom': 'Romanos', '1co': '1 Corintios', '2co': '2 Corintios', 'gal': 'Gálatas', 'eph': 'Efesios',
  'php': 'Filipenses', 'col': 'Colosenses', '1th': '1 Tesalonicenses', '2th': '2 Tesalonicenses',
  '1ti': '1 Timoteo', '2ti': '2 Timoteo', 'tit': 'Tito', 'phm': 'Filemón', 'heb': 'Hebreos',
  'jas': 'Santiago', '1pe': '1 San Pedro', '2pe': '2 San Pedro', '1jn': '1 San Juan', '2jn': '2 San Juan',
  '3jn': '3 San Juan', 'jud': 'San Júdas', 'rev': 'Revelación'
};

const BOOKS_ORDER = [
  'gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa',
  '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro',
  'ecc', 'sng', 'isa', 'jer', 'lam', 'ezk', 'dan', 'hos', 'jol', 'amo',
  'oba', 'jon', 'mic', 'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
  'mat', 'mrk', 'luk', 'jhn', 'act', 'rom', '1co', '2co', 'gal', 'eph',
  'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb', 'jas',
  '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev'
];

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function ensureVersionExists(code: string, name: string, language: string) {
  const existing = await db.select().from(bibleVersions).where(eq(bibleVersions.code, code));
  if (!existing.length) {
    await db.insert(bibleVersions).values({
      code,
      name,
      language,
      license: 'public_domain',
      isActive: true,
    });
    console.log(`  ✅ Version ${code} added to database`);
  }
}

async function importFromDamarals(versionCode: string, versionName: string, language: string) {
  console.log(`\n📖 Importing ${versionCode} (${versionName})...`);
  
  const existing = await db.select().from(bibleVerses)
    .where(eq(bibleVerses.versionCode, versionCode))
    .limit(100);
  
  if (existing.length > 50) {
    console.log(`  ⏭️  ${versionCode} already has ${existing.length}+ verses, skipping...`);
    return;
  }
  
  await ensureVersionExists(versionCode, versionName, language);
  await db.delete(bibleVerses).where(eq(bibleVerses.versionCode, versionCode));
  
  let totalVerses = 0;
  
  try {
    const url = `https://raw.githubusercontent.com/damarals/biblias/main/inst/json/${versionCode}.json`;
    console.log(`  📥 Fetching from ${url}...`);
    
    const data = await fetchWithRetry(url);
    
    if (Array.isArray(data)) {
      for (const book of data) {
        const abbrev = book.abbrev;
        const bookId = BOOK_ABBREV_MAP[abbrev] || BOOK_ABBREV_MAP[abbrev.toLowerCase()];
        
        if (!bookId) {
          console.log(`  ⚠️  Unknown book abbreviation: ${abbrev}`);
          continue;
        }
        
        const versesToInsert: any[] = [];
        
        if (book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach((chapter: string[], chapterIndex: number) => {
            chapter.forEach((verseText: string, verseIndex: number) => {
              versesToInsert.push({
                versionCode,
                book: bookId,
                chapter: chapterIndex + 1,
                verse: verseIndex + 1,
                text: verseText,
              });
            });
          });
        }
        
        if (versesToInsert.length > 0) {
          for (let i = 0; i < versesToInsert.length; i += 500) {
            const batch = versesToInsert.slice(i, i + 500);
            await db.insert(bibleVerses).values(batch);
          }
          totalVerses += versesToInsert.length;
          console.log(`  ✅ ${bookId}: ${versesToInsert.length} verses`);
        }
      }
    }
    
    console.log(`  📊 ${versionCode} Total: ${totalVerses} verses imported`);
  } catch (error: any) {
    console.error(`  ❌ Error importing ${versionCode}: ${error.message}`);
  }
}

async function importKJV() {
  console.log('\n📖 Importing KJV (King James Version)...');
  
  const versionCode = 'KJV';
  
  const existing = await db.select().from(bibleVerses)
    .where(eq(bibleVerses.versionCode, versionCode))
    .limit(100);
  
  if (existing.length > 50) {
    console.log(`  ⏭️  KJV already has ${existing.length}+ verses, skipping...`);
    return;
  }
  
  await ensureVersionExists(versionCode, 'King James Version', 'en');
  await db.delete(bibleVerses).where(eq(bibleVerses.versionCode, versionCode));
  
  let totalVerses = 0;
  
  for (const bookId of BOOKS_ORDER) {
    try {
      const bookName = KJV_BOOK_NAMES[bookId];
      if (!bookName) continue;
      
      const url = `https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${encodeURIComponent(bookName)}.json`;
      
      const bookData = await fetchWithRetry(url);
      
      if (bookData && bookData.chapters) {
        const versesToInsert: any[] = [];
        
        for (const chapter of bookData.chapters) {
          const chapterNum = parseInt(chapter.chapter);
          for (const verse of chapter.verses) {
            versesToInsert.push({
              versionCode,
              book: bookId,
              chapter: chapterNum,
              verse: parseInt(verse.verse),
              text: verse.text,
            });
          }
        }
        
        if (versesToInsert.length > 0) {
          for (let i = 0; i < versesToInsert.length; i += 500) {
            const batch = versesToInsert.slice(i, i + 500);
            await db.insert(bibleVerses).values(batch);
          }
          totalVerses += versesToInsert.length;
          console.log(`  ✅ ${bookId}: ${versesToInsert.length} verses`);
        }
      }
    } catch (error: any) {
      console.log(`  ⚠️  ${bookId}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`  📊 KJV Total: ${totalVerses} verses imported`);
}

async function importRVR1960() {
  console.log('\n📖 Importing RVR1960 (Reina Valera 1960)...');
  
  const versionCode = 'RVR1960';
  
  const existing = await db.select().from(bibleVerses)
    .where(eq(bibleVerses.versionCode, versionCode))
    .limit(100);
  
  if (existing.length > 50) {
    console.log(`  ⏭️  RVR1960 already has ${existing.length}+ verses, skipping...`);
    return;
  }
  
  await ensureVersionExists(versionCode, 'Reina Valera 1960', 'es');
  await db.delete(bibleVerses).where(eq(bibleVerses.versionCode, versionCode));
  
  let totalVerses = 0;
  
  for (const bookId of BOOKS_ORDER) {
    try {
      const bookName = RVR_BOOK_NAMES[bookId];
      if (!bookName) continue;
      
      const url = `https://raw.githubusercontent.com/aruljohn/Reina-Valera/main/${encodeURIComponent(bookName)}.json`;
      
      const bookData = await fetchWithRetry(url);
      
      if (bookData && bookData.chapters) {
        const versesToInsert: any[] = [];
        
        for (const chapter of bookData.chapters) {
          const chapterNum = parseInt(chapter.chapter);
          for (const verse of chapter.verses) {
            versesToInsert.push({
              versionCode,
              book: bookId,
              chapter: chapterNum,
              verse: parseInt(verse.verse),
              text: verse.text,
            });
          }
        }
        
        if (versesToInsert.length > 0) {
          for (let i = 0; i < versesToInsert.length; i += 500) {
            const batch = versesToInsert.slice(i, i + 500);
            await db.insert(bibleVerses).values(batch);
          }
          totalVerses += versesToInsert.length;
          console.log(`  ✅ ${bookId}: ${versesToInsert.length} verses`);
        }
      }
    } catch (error: any) {
      console.log(`  ⚠️  ${bookId}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`  📊 RVR1960 Total: ${totalVerses} verses imported`);
}

async function main() {
  console.log('🚀 Starting Bible versions import...\n');
  
  try {
    await importFromDamarals('ARC', 'Almeida Revista e Corrigida', 'pt');
    await importFromDamarals('NVI', 'Nova Versão Internacional', 'pt');
    await importKJV();
    await importRVR1960();
    
    const counts = await db.select().from(bibleVerses);
    const versionCounts: Record<string, number> = {};
    counts.forEach(v => {
      versionCounts[v.versionCode] = (versionCounts[v.versionCode] || 0) + 1;
    });
    
    console.log('\n📊 Final verse counts by version:');
    Object.entries(versionCounts).sort().forEach(([code, count]) => {
      console.log(`  ${code}: ${count.toLocaleString()} verses`);
    });
    
    console.log('\n✨ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

main();

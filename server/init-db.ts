import { db } from './db';
import { strongEntries, bibleWords, studyModules, studyTracks, studyLessons } from '@shared/schema';
import { seedAdminUsers } from './seed-admins';
import { seedBibleVersions } from './seed-versions';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from 'drizzle-orm';
import { STRONG_DATA } from './strong-data-embedded';
import { STUDY_MODULES_DATA } from './study-modules-data-embedded';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENESIS_1_WORD_MAPPINGS = [
  { book: "gen", chapter: 1, verse: 1, word_position: 1, original_word: "בְּרֵאשִׁית", strong_number: "H7225", gloss: "No princípio" },
  { book: "gen", chapter: 1, verse: 1, word_position: 2, original_word: "בָּרָא", strong_number: "H1254", gloss: "criou" },
  { book: "gen", chapter: 1, verse: 1, word_position: 3, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 1, word_position: 4, original_word: "אֵת", strong_number: "H853", gloss: "os" },
  { book: "gen", chapter: 1, verse: 1, word_position: 5, original_word: "הַשָּׁמַיִם", strong_number: "H8064", gloss: "céus" },
  { book: "gen", chapter: 1, verse: 1, word_position: 6, original_word: "וְאֵת", strong_number: "H853", gloss: "e a" },
  { book: "gen", chapter: 1, verse: 1, word_position: 7, original_word: "הָאָרֶץ", strong_number: "H776", gloss: "terra" },
  { book: "gen", chapter: 1, verse: 2, word_position: 1, original_word: "וְהָאָרֶץ", strong_number: "H776", gloss: "E a terra" },
  { book: "gen", chapter: 1, verse: 2, word_position: 2, original_word: "הָיְתָה", strong_number: "H1961", gloss: "era" },
  { book: "gen", chapter: 1, verse: 2, word_position: 3, original_word: "תֹהוּ", strong_number: "H8414", gloss: "sem forma" },
  { book: "gen", chapter: 1, verse: 2, word_position: 4, original_word: "וָבֹהוּ", strong_number: "H922", gloss: "e vazia" },
  { book: "gen", chapter: 1, verse: 2, word_position: 5, original_word: "וְחֹשֶׁךְ", strong_number: "H2822", gloss: "e havia trevas" },
  { book: "gen", chapter: 1, verse: 2, word_position: 6, original_word: "עַל", strong_number: "H5921", gloss: "sobre" },
  { book: "gen", chapter: 1, verse: 2, word_position: 7, original_word: "פְּנֵי", strong_number: "H6440", gloss: "a face" },
  { book: "gen", chapter: 1, verse: 2, word_position: 8, original_word: "תְהוֹם", strong_number: "H8415", gloss: "do abismo" },
  { book: "gen", chapter: 1, verse: 2, word_position: 9, original_word: "וְרוּחַ", strong_number: "H7307", gloss: "e o Espírito" },
  { book: "gen", chapter: 1, verse: 2, word_position: 10, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "de Deus" },
  { book: "gen", chapter: 1, verse: 2, word_position: 11, original_word: "מְרַחֶפֶת", strong_number: "H7363", gloss: "se movia" },
  { book: "gen", chapter: 1, verse: 2, word_position: 12, original_word: "עַל", strong_number: "H5921", gloss: "sobre" },
  { book: "gen", chapter: 1, verse: 2, word_position: 13, original_word: "פְּנֵי", strong_number: "H6440", gloss: "a face" },
  { book: "gen", chapter: 1, verse: 2, word_position: 14, original_word: "הַמָּיִם", strong_number: "H4325", gloss: "das águas" },
  { book: "gen", chapter: 1, verse: 3, word_position: 1, original_word: "וַיֹּאמֶר", strong_number: "H559", gloss: "E disse" },
  { book: "gen", chapter: 1, verse: 3, word_position: 2, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 3, word_position: 3, original_word: "יְהִי", strong_number: "H1961", gloss: "Haja" },
  { book: "gen", chapter: 1, verse: 3, word_position: 4, original_word: "אוֹר", strong_number: "H216", gloss: "luz" },
  { book: "gen", chapter: 1, verse: 3, word_position: 5, original_word: "וַיְהִי", strong_number: "H1961", gloss: "e houve" },
  { book: "gen", chapter: 1, verse: 3, word_position: 6, original_word: "אוֹר", strong_number: "H216", gloss: "luz" },
  { book: "gen", chapter: 1, verse: 4, word_position: 1, original_word: "וַיַּרְא", strong_number: "H7200", gloss: "E viu" },
  { book: "gen", chapter: 1, verse: 4, word_position: 2, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 4, word_position: 3, original_word: "אֶת", strong_number: "H853", gloss: "a" },
  { book: "gen", chapter: 1, verse: 4, word_position: 4, original_word: "הָאוֹר", strong_number: "H216", gloss: "luz" },
  { book: "gen", chapter: 1, verse: 4, word_position: 5, original_word: "כִּי", strong_number: "H3588", gloss: "que" },
  { book: "gen", chapter: 1, verse: 4, word_position: 6, original_word: "טוֹב", strong_number: "H2896", gloss: "era boa" },
  { book: "gen", chapter: 1, verse: 4, word_position: 7, original_word: "וַיַּבְדֵּל", strong_number: "H914", gloss: "e separou" },
  { book: "gen", chapter: 1, verse: 4, word_position: 8, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 4, word_position: 9, original_word: "בֵּין", strong_number: "H996", gloss: "entre" },
  { book: "gen", chapter: 1, verse: 4, word_position: 10, original_word: "הָאוֹר", strong_number: "H216", gloss: "a luz" },
  { book: "gen", chapter: 1, verse: 4, word_position: 11, original_word: "וּבֵין", strong_number: "H996", gloss: "e entre" },
  { book: "gen", chapter: 1, verse: 4, word_position: 12, original_word: "הַחֹשֶׁךְ", strong_number: "H2822", gloss: "as trevas" },
  { book: "gen", chapter: 1, verse: 5, word_position: 1, original_word: "וַיִּקְרָא", strong_number: "H7121", gloss: "E chamou" },
  { book: "gen", chapter: 1, verse: 5, word_position: 2, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 5, word_position: 3, original_word: "לָאוֹר", strong_number: "H216", gloss: "à luz" },
  { book: "gen", chapter: 1, verse: 5, word_position: 4, original_word: "יוֹם", strong_number: "H3117", gloss: "Dia" },
  { book: "gen", chapter: 1, verse: 5, word_position: 5, original_word: "וְלַחֹשֶׁךְ", strong_number: "H2822", gloss: "e às trevas" },
  { book: "gen", chapter: 1, verse: 5, word_position: 6, original_word: "קָרָא", strong_number: "H7121", gloss: "chamou" },
  { book: "gen", chapter: 1, verse: 5, word_position: 7, original_word: "לָיְלָה", strong_number: "H3915", gloss: "Noite" },
];

async function seedBibleWords() {
  try {
    // Check if already seeded
    const count = await db.select().from(bibleWords).limit(1);
    if (count.length > 0) {
      console.log('✅ bible_words já foi populada');
      return;
    }

    console.log("🌱 Iniciando seed de bible_words para Gênesis 1...");
    
    let inserted = 0;
    for (const mapping of GENESIS_1_WORD_MAPPINGS) {
      try {
        await db.insert(bibleWords).values({
          id: `${mapping.book}-${mapping.chapter}-${mapping.verse}-${mapping.word_position}`,
          book: mapping.book,
          chapter: mapping.chapter,
          verse: mapping.verse,
          wordPosition: mapping.word_position,
          originalWord: mapping.original_word,
          strongNumber: mapping.strong_number,
          gloss: mapping.gloss,
        }).onConflictDoNothing();
        inserted++;
      } catch (error) {
        console.error(`Erro ao inserir ${mapping.gloss}:`, error);
      }
    }
    
    console.log(`✅ ${inserted} mapeamentos inseridos para Gênesis 1`);
  } catch (error) {
    console.error('Erro ao seed bible_words:', error);
  }
}

// Exported function to force seed study modules (can be called from admin endpoint)
export async function forceSeedStudyModules(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    console.log('[Force Seed Study] Iniciando importação dos módulos de estudo...');
    
    let data: any = null;
    
    // First try to load from embedded data (always available in bundle)
    if (STUDY_MODULES_DATA && STUDY_MODULES_DATA.modules && STUDY_MODULES_DATA.modules.length > 0) {
      console.log(`[Force Seed Study] ✅ Usando dados embutidos: ${STUDY_MODULES_DATA.modules.length} módulos`);
      data = STUDY_MODULES_DATA;
    } else {
      // Fallback to file system (for development)
      const possiblePaths = [
        path.resolve(__dirname, 'study-modules-data.json'),
        path.resolve(__dirname, '../server/study-modules-data.json'),
        path.resolve(process.cwd(), 'dist/study-modules-data.json'),
        path.resolve(process.cwd(), 'server/study-modules-data.json'),
        '/app/dist/study-modules-data.json',
        '/app/server/study-modules-data.json',
        './dist/study-modules-data.json',
        './server/study-modules-data.json',
      ];
      
      console.log('[Force Seed Study] Dados embutidos não disponíveis, tentando arquivos:');
      possiblePaths.forEach((p, i) => console.log(`  ${i + 1}. ${p} - ${fs.existsSync(p) ? '✅ EXISTE' : '❌ não existe'}`));
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          console.log(`[Force Seed Study] Usando arquivo: ${testPath}`);
          data = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
          break;
        }
      }
    }
    
    if (!data || !data.modules) {
      return { success: false, count: 0, message: 'Dados de estudo não encontrados (nem embutidos, nem em arquivo)' };
    }
    
    let modulesCount = 0;
    let tracksCount = 0;
    let lessonsCount = 0;
    
    for (const module of data.modules || []) {
      await db.insert(studyModules).values({
        id: module.id,
        name: module.name,
        description: module.description,
        icon: module.icon,
        color: module.color,
        order: module.order,
        level: module.level || 'iniciante',
        requiredPlan: module.requiredPlan || 'gold',
        isActive: true,
      }).onConflictDoNothing();
      modulesCount++;
    }
    
    for (const track of data.tracks || []) {
      await db.execute(sql`
        INSERT INTO study_tracks (id, module_id, level, name, description, required_plan, "order", created_at)
        VALUES (${track.id}, ${track.moduleId}, ${track.level}, ${track.name}, ${track.description}, ${track.requiredPlan}, ${track.order}, NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      tracksCount++;
    }
    
    const batchSize = 100;
    const lessons = data.lessons || [];
    for (let i = 0; i < lessons.length; i += batchSize) {
      const batch = lessons.slice(i, i + batchSize).map((lesson: any) => ({
        id: lesson.id,
        trackId: lesson.trackId,
        title: lesson.title,
        content: lesson.content,
        references: lesson.references,
        questions: lesson.questions,
        application: lesson.application,
        summary: lesson.summary,
        estimatedMinutes: lesson.estimatedMinutes,
        order: lesson.order,
        isActive: true,
      }));
      await db.insert(studyLessons).values(batch).onConflictDoNothing();
      lessonsCount += batch.length;
      console.log(`[Force Seed Study] Lições: ${Math.min(i + batchSize, lessons.length)} / ${lessons.length}`);
    }
    
    return { 
      success: true, 
      count: modulesCount + tracksCount + lessonsCount, 
      message: `Importados ${modulesCount} módulos, ${tracksCount} trilhas, ${lessonsCount} lições` 
    };
  } catch (error) {
    console.error('[Force Seed Study] Erro:', error);
    return { success: false, count: 0, message: String(error) };
  }
}

// Exported function to force seed Strong entries (can be called from admin endpoint)
export async function forceSeedStrongEntries(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    console.log('[Force Seed] Iniciando importação forçada do Strong...');
    console.log(`[Force Seed] __dirname: ${__dirname}`);
    console.log(`[Force Seed] process.cwd(): ${process.cwd()}`);
    
    let strongDataRaw: any[] | null = null;
    
    // First try to load from embedded data (always available in bundle)
    if (STRONG_DATA && Array.isArray(STRONG_DATA) && STRONG_DATA.length > 0) {
      console.log(`[Force Seed] ✅ Usando dados embutidos: ${STRONG_DATA.length} entradas`);
      strongDataRaw = STRONG_DATA;
    } else {
      // Fallback to file system (for development)
      const possiblePaths = [
        path.resolve(__dirname, 'strong-data.json'),
        path.resolve(__dirname, '../server/strong-data.json'),
        path.resolve(process.cwd(), 'dist/strong-data.json'),
        path.resolve(process.cwd(), 'server/strong-data.json'),
        '/app/dist/strong-data.json',
        '/app/server/strong-data.json',
        '/home/runner/workspace/dist/strong-data.json',
        '/home/runner/workspace/server/strong-data.json',
        './dist/strong-data.json',
        './server/strong-data.json',
      ];
      
      console.log('[Force Seed] Dados embutidos não disponíveis, tentando arquivos:');
      possiblePaths.forEach((p, i) => console.log(`  ${i + 1}. ${p} - ${fs.existsSync(p) ? '✅ EXISTE' : '❌ não existe'}`));
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          console.log(`[Force Seed] Usando arquivo: ${testPath}`);
          strongDataRaw = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
          break;
        }
      }
    }
    
    if (!strongDataRaw || strongDataRaw.length === 0) {
      return { success: false, count: 0, message: 'Dados do Strong não encontrados (nem embutidos, nem em arquivo)' };
    }
    
    const strongData = strongDataRaw.map((row: any) => ({
      id: row.id,
      strongNumber: row.strong_number ?? row.strongNumber,
      language: row.language,
      lemma: row.lemma,
      translit: row.translit,
      xlit: row.xlit,
      pron: row.pron,
      kjvDef: row.kjv_def ?? row.kjvDef,
      strongsDef: row.strongs_def ?? row.strongsDef,
      portugueseDef: row.portuguese_def ?? row.portugueseDef,
      derivation: row.derivation,
      extendedDefinition: row.extended_definition ?? row.extendedDefinition,
      createdAt: row.created_at ?? row.createdAt,
    }));
    
    console.log(`[Force Seed] Primeiro registro: ${JSON.stringify(strongData[0])}`);
    
    const batchSize = 500;
    for (let i = 0; i < strongData.length; i += batchSize) {
      const batch = strongData.slice(i, i + batchSize);
      await db.insert(strongEntries).values(batch).onConflictDoNothing();
      console.log(`[Force Seed] Importados ${Math.min(i + batchSize, strongData.length)} / ${strongData.length}`);
    }
    
    return { success: true, count: strongData.length, message: `Importados ${strongData.length} entradas com sucesso` };
  } catch (error) {
    console.error('[Force Seed] Erro:', error);
    return { success: false, count: 0, message: String(error) };
  }
}

export async function initializeDatabase() {
  try {
    console.log('🔍 Verificando se banco de dados precisa de inicialização...');
    
    // SEMPRE criar/verificar usuários admin (idempotente)
    await seedAdminUsers();
    
    // SEMPRE seed versões de Bíblia
    await seedBibleVersions();
    
    // Check if strong_entries table has SUFFICIENT data (expect ~14000 entries)
    const strongCountResult = await db.select({ count: sql<number>`count(*)` }).from(strongEntries);
    const strongCount = Number(strongCountResult[0]?.count) || 0;
    const EXPECTED_STRONG_MIN = 10000; // Should have at least 10k entries (we have 14k total)
    
    console.log(`📊 Strong entries: ${strongCount} (esperado: ${EXPECTED_STRONG_MIN}+)`);
    
    if (strongCount < EXPECTED_STRONG_MIN) {
      console.log('📥 Banco está vazio, importando dados...');
      // Use the forceSeedStrongEntries function which handles embedded data
      const result = await forceSeedStrongEntries();
      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`⚠️ ${result.message}`);
      }
    } else {
      console.log(`✅ Banco de dados já inicializado com ${strongCount} Strong entries`);
    }

    // SEMPRE seed bible_words (mapeamentos Genesis 1) se ainda não tiver
    await seedBibleWords();

    // Auto-seed Study Modules if table is empty
    await autoSeedStudyModules();

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    // Don't throw - app should still run even if data import fails
    console.log('⚠️ App continuará rodando mas com funcionalidade limitada');
  }
}

// Auto-seed study modules on startup if empty or incomplete
async function autoSeedStudyModules() {
  try {
    // Validate COMPLETENESS - not just existence
    const moduleCountResult = await db.select({ count: sql<number>`count(*)` }).from(studyModules);
    const trackCountResult = await db.select({ count: sql<number>`count(*)` }).from(studyTracks);
    const lessonCountResult = await db.select({ count: sql<number>`count(*)` }).from(studyLessons);
    
    const moduleCount = Number(moduleCountResult[0]?.count) || 0;
    const trackCount = Number(trackCountResult[0]?.count) || 0;
    const lessonCount = Number(lessonCountResult[0]?.count) || 0;
    
    console.log(`📊 Estado atual Study: ${moduleCount} módulos, ${trackCount} trilhas, ${lessonCount} lições`);
    
    // Check completeness: ALL three must have data
    const isComplete = moduleCount > 0 && trackCount > 0 && lessonCount > 0;
    
    if (isComplete) {
      console.log('✅ Study modules já populados completamente');
      return;
    }
    
    // If INCOMPLETE (any is 0), we need to do a FULL reseed
    console.log('⚠️ Dados incompletos detectados - fazendo reseed completo...');
    
    // TRUNCATE existing partial data to ensure clean state
    if (lessonCount > 0 || trackCount > 0 || moduleCount > 0) {
      console.log('🗑️ Limpando dados parciais...');
      await db.execute(sql`DELETE FROM study_lessons`);
      await db.execute(sql`DELETE FROM study_tracks`);
      await db.execute(sql`DELETE FROM study_modules`);
    }
    
    console.log('📥 Populando study modules automaticamente...');
    
    // Use the forceSeedStudyModules function which handles embedded data
    const result = await forceSeedStudyModules();
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`⚠️ ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Erro ao auto-seed study modules:', error);
  }
}

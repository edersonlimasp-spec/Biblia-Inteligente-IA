import { db } from './db';
import { strongEntries, bibleWords, studyModules, studyTracks, studyLessons, readingPlanTemplates, subscriptions, paymentReceipts } from '@shared/schema';
import { seedAdminUsers } from './seed-admins';
import { seedBibleVersions } from './seed-versions';

const READING_PLAN_TEMPLATES = [
  {
    slug: "bíblia-em-1-ano",
    titlePt: "Bíblia em 1 Ano",
    titleEn: "Bible in 1 Year",
    titleEs: "Biblia en 1 Año",
    descriptionPt: "Leia toda a Bíblia em 365 dias com 3-4 capítulos por dia",
    descriptionEn: "Read the entire Bible in 365 days with 3-4 chapters per day",
    descriptionEs: "Lee toda la Biblia en 365 días con 3-4 capítulos por día",
    category: "full-bible",
    durationDays: 365,
    defaultPace: 3,
    scheduleMode: "canonical",
    weekdaysOnly: false,
    icon: "BookOpen",
    colorGradient: "from-blue-500 to-blue-700",
    tags: ["popular", "recommended"],
    isActive: true,
    displayOrder: 1,
  },
  {
    slug: "novo-testamento-90-dias",
    titlePt: "Novo Testamento em 90 Dias",
    titleEn: "New Testament in 90 Days",
    titleEs: "Nuevo Testamento en 90 Días",
    descriptionPt: "Leia o Novo Testamento em 3 meses",
    descriptionEn: "Read the New Testament in 3 months",
    descriptionEs: "Lee el Nuevo Testamento en 3 meses",
    category: "new-testament",
    durationDays: 90,
    defaultPace: 3,
    scheduleMode: "canonical",
    weekdaysOnly: false,
    icon: "BookMarked",
    colorGradient: "from-green-500 to-green-700",
    tags: ["popular"],
    isActive: true,
    displayOrder: 2,
  },
  {
    slug: "evangelhos-30-dias",
    titlePt: "Evangelhos em 30 Dias",
    titleEn: "Gospels in 30 Days",
    titleEs: "Evangelios en 30 Días",
    descriptionPt: "Leia os 4 Evangelhos em um mês",
    descriptionEn: "Read all 4 Gospels in one month",
    descriptionEs: "Lee los 4 Evangelios en un mes",
    category: "new-testament",
    durationDays: 30,
    defaultPace: 3,
    scheduleMode: "canonical",
    weekdaysOnly: false,
    icon: "Heart",
    colorGradient: "from-purple-500 to-purple-700",
    tags: ["quick", "new"],
    isActive: true,
    displayOrder: 3,
  },
  {
    slug: "salmos-provérbios-31-dias",
    titlePt: "Salmos e Provérbios em 31 Dias",
    titleEn: "Psalms and Proverbs in 31 Days",
    titleEs: "Salmos y Proverbios en 31 Días",
    descriptionPt: "Leia 5 Salmos e 1 Provérbio por dia",
    descriptionEn: "Read 5 Psalms and 1 Proverb per day",
    descriptionEs: "Lee 5 Salmos y 1 Proverbio por día",
    category: "topical",
    durationDays: 31,
    defaultPace: 6,
    scheduleMode: "alternating",
    weekdaysOnly: false,
    icon: "Music",
    colorGradient: "from-amber-500 to-amber-700",
    tags: ["popular", "devotional"],
    isActive: true,
    displayOrder: 4,
  },
  {
    slug: "cinco-dias-bíblia",
    titlePt: "Bíblia em 5 Dias por Semana",
    titleEn: "5-Day Bible Reading",
    titleEs: "Biblia en 5 Días por Semana",
    descriptionPt: "Leia a Bíblia só durante a semana, descanse no fim de semana",
    descriptionEn: "Read the Bible on weekdays only, rest on weekends",
    descriptionEs: "Lee la Biblia solo de lunes a viernes",
    category: "full-bible",
    durationDays: 365,
    defaultPace: 4,
    scheduleMode: "canonical",
    weekdaysOnly: true,
    icon: "Calendar",
    colorGradient: "from-teal-500 to-teal-700",
    tags: ["flexible"],
    isActive: true,
    displayOrder: 5,
  },
  {
    slug: "antigo-testamento-180-dias",
    titlePt: "Antigo Testamento em 180 Dias",
    titleEn: "Old Testament in 180 Days",
    titleEs: "Antiguo Testamento en 180 Días",
    descriptionPt: "Leia todo o Antigo Testamento em 6 meses",
    descriptionEn: "Read the entire Old Testament in 6 months",
    descriptionEs: "Lee todo el Antiguo Testamento en 6 meses",
    category: "old-testament",
    durationDays: 180,
    defaultPace: 4,
    scheduleMode: "canonical",
    weekdaysOnly: false,
    icon: "ScrollText",
    colorGradient: "from-orange-500 to-orange-700",
    tags: [],
    isActive: true,
    displayOrder: 6,
  },
];
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
    console.log('[Force Seed Strong] Iniciando importação forçada do Strong...');
    
    let strongDataRaw: any[] | null = null;
    
    // Log what STRONG_DATA looks like for debugging
    console.log(`[Force Seed Strong] STRONG_DATA type: ${typeof STRONG_DATA}`);
    console.log(`[Force Seed Strong] STRONG_DATA is null/undefined: ${STRONG_DATA == null}`);
    
    // STRONG_DATA is now wrapped in object format: { exportedAt, entries: [...] }
    // Support both old array format and new object format for compatibility
    const strongDataAny = STRONG_DATA as any;
    if (strongDataAny) {
      if (Array.isArray(strongDataAny) && strongDataAny.length > 0) {
        // Old format: raw array
        console.log(`[Force Seed Strong] ✅ Usando dados embutidos (array): ${strongDataAny.length} entradas`);
        strongDataRaw = strongDataAny;
      } else if (strongDataAny.entries && Array.isArray(strongDataAny.entries) && strongDataAny.entries.length > 0) {
        // New format: { entries: [...] }
        console.log(`[Force Seed Strong] ✅ Usando dados embutidos (objeto): ${strongDataAny.entries.length} entradas`);
        console.log(`[Force Seed Strong] Exportado em: ${strongDataAny.exportedAt}`);
        strongDataRaw = strongDataAny.entries;
      } else {
        console.log(`[Force Seed Strong] ⚠️ STRONG_DATA presente mas formato inválido`);
        console.log(`[Force Seed Strong] Keys: ${Object.keys(strongDataAny || {}).join(', ')}`);
      }
    }
    
    // Fallback to file system only if embedded data not available
    if (!strongDataRaw) {
      console.log('[Force Seed Strong] Dados embutidos não disponíveis, tentando arquivos...');
      const possiblePaths = [
        path.resolve(process.cwd(), 'server/strong-data.json'),
        path.resolve(__dirname, 'strong-data.json'),
      ];
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          console.log(`[Force Seed Strong] Usando arquivo: ${testPath}`);
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
      // Let database set createdAt automatically (string from JSON causes toISOString error)
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

async function autoSeedReadingPlanTemplates() {
  try {
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(readingPlanTemplates);
    const count = Number(countResult[0]?.count) || 0;
    
    console.log(`📊 Reading Plan Templates: ${count}`);
    
    if (count > 0) {
      console.log('✅ Reading Plan Templates já populados');
      return;
    }
    
    console.log('📥 Populando Reading Plan Templates...');
    
    for (const template of READING_PLAN_TEMPLATES) {
      await db.insert(readingPlanTemplates).values(template).onConflictDoNothing();
    }
    
    console.log(`✅ ${READING_PLAN_TEMPLATES.length} Reading Plan Templates inseridos`);
  } catch (error) {
    console.error('❌ Erro ao seed Reading Plan Templates:', error);
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
    
    // Auto-seed Reading Plan Templates if table is empty
    await autoSeedReadingPlanTemplates();

    // One-shot cleanup: cancel duplicate subscriptions caused by webhook race
    await dedupDuplicateSubscriptions();

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

// One-shot cleanup: cancel duplicate active subscriptions created by the
// Mercado Pago webhook race condition. Two simultaneous webhook calls for the
// same payment created two rows in <10ms with the same store_transaction_id.
// We keep the MOST RECENT row (active) and mark the older duplicates as
// 'cancelled' so it never runs again on those same rows.
async function dedupDuplicateSubscriptions() {
  try {
    const dupes = await db.execute(sql`
      WITH ranked AS (
        SELECT id, user_id, plan_type, store_transaction_id, status, created_at,
               ROW_NUMBER() OVER (
                 PARTITION BY store_transaction_id
                 ORDER BY created_at DESC
               ) AS rn
        FROM subscriptions
        WHERE store_transaction_id IS NOT NULL
          AND store_transaction_id <> ''
          AND status IN ('active','Active','ACTIVE','approved','Approved','APPROVED')
      )
      SELECT id, user_id, plan_type, store_transaction_id, created_at
      FROM ranked
      WHERE rn > 1
    `);

    const dupRows = (dupes as any).rows || (dupes as any) || [];
    if (!Array.isArray(dupRows) || dupRows.length === 0) {
      console.log('🧹 Subscriptions: nenhuma duplicata por storeTransactionId encontrada');
      return;
    }

    const ids = dupRows.map((r: any) => r.id);
    console.log(`🧹 Subscriptions: cancelando ${ids.length} duplicata(s) por storeTransactionId race`);

    await db.execute(sql`
      UPDATE subscriptions
      SET status = 'cancelled',
          cancellation_at = COALESCE(cancellation_at, NOW())
      WHERE id = ANY(${ids}::varchar[])
    `);

    console.log(`🧹 Subscriptions: ${ids.length} duplicata(s) marcadas como 'cancelled'`);
  } catch (err) {
    console.error('⚠️ dedupDuplicateSubscriptions falhou:', err);
  }
}

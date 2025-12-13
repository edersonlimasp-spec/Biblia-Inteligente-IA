import { db } from './db';
import { strongEntries, bibleWords } from '@shared/schema';
import { seedAdminUsers } from './seed-admins';
import { seedBibleVersions } from './seed-versions';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

export async function initializeDatabase() {
  try {
    console.log('🔍 Verificando se banco de dados precisa de inicialização...');
    
    // SEMPRE criar/verificar usuários admin (idempotente)
    await seedAdminUsers();
    
    // SEMPRE seed versões de Bíblia
    await seedBibleVersions();
    
    // Check if strong_entries table has data
    const strongCount = await db.select().from(strongEntries).limit(1);
    
    if (strongCount.length === 0) {
      console.log('📥 Banco está vazio, importando dados...');
      console.log(`🔍 __dirname: ${__dirname}`);
      console.log(`🔍 process.cwd(): ${process.cwd()}`);
      
      // Import Strong dictionary data from embedded JSON file
      // Try multiple paths for dev and production environments
      // In Replit Autoscale: only dist/ folder is deployed, cwd is /app
      const possiblePaths = [
        path.resolve(__dirname, 'strong-data.json'),            // PROD: /app/dist/strong-data.json (bundled code runs from dist/)
        path.resolve(__dirname, '../server/strong-data.json'),  // DEV: when running tsx from project root
        path.resolve(process.cwd(), 'dist/strong-data.json'),   // PROD fallback: /app/dist/strong-data.json
        path.resolve(process.cwd(), 'server/strong-data.json'), // DEV fallback: from project root
        '/app/dist/strong-data.json',                           // PROD absolute: Replit autoscale path
        '/app/server/strong-data.json',                         // PROD fallback: if server/ copied
      ];
      
      console.log('🔍 Tentando encontrar strong-data.json nos seguintes caminhos:');
      possiblePaths.forEach((p, i) => console.log(`  ${i + 1}. ${p} - ${fs.existsSync(p) ? '✅ EXISTE' : '❌ não existe'}`));
      
      let strongDataPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          strongDataPath = testPath;
          break;
        }
      }
      
      if (strongDataPath) {
        console.log(`📂 ✅ Encontrado strong-data.json em: ${strongDataPath}`);
        const strongDataRaw = JSON.parse(fs.readFileSync(strongDataPath, 'utf-8'));
        
        // Map from snake_case (DB export) to the schema field names
        const strongData = strongDataRaw.map((row: any) => ({
          id: row.id,
          strongNumber: row.strong_number,
          language: row.language,
          lemma: row.lemma,
          translit: row.translit,
          xlit: row.xlit,
          pron: row.pron,
          kjvDef: row.kjv_def,
          strongsDef: row.strongs_def,
          portugueseDef: row.portuguese_def,
          derivation: row.derivation,
          createdAt: row.created_at,
        }));
        
        // Import in batches to avoid overwhelming the database
        const batchSize = 500;
        for (let i = 0; i < strongData.length; i += batchSize) {
          const batch = strongData.slice(i, i + batchSize);
          await db.insert(strongEntries).values(batch).onConflictDoNothing();
          const processed = Math.min(i + batchSize, strongData.length);
          console.log(`  ✓ Importados ${processed} / ${strongData.length}`);
        }
        console.log(`✅ Importados ${strongData.length} Strong dictionary entries`);
      } else {
        console.log('⚠️ strong-data.json não encontrado - Dicionário Strong estará vazio');
      }
    } else {
      console.log('✅ Banco de dados já inicializado com Strong entries');
    }

    // SEMPRE seed bible_words (mapeamentos Genesis 1) se ainda não tiver
    await seedBibleWords();

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    // Don't throw - app should still run even if data import fails
    console.log('⚠️ App continuará rodando mas com funcionalidade limitada');
  }
}

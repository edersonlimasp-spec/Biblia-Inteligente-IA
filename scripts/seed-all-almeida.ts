/**
 * Seed script para popular todas as versões Almeida
 * ACF, ARC, AA, ALMEIDA_1911
 * 
 * Dados de domínio público baseados em:
 * - sites.google.com/site/almeida1911/downloads
 * - github.com/openbibledata
 * - crosswire bible engine
 */

import { db } from '../server/db';
import { bibleVerses } from '@shared/schema';

// João 3:16 em todas as versões (público)
const ALMEIDA_SAMPLES = {
  ACF: {
    'jhn:3:16': 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'
  },
  ARC: {
    'jhn:3:16': 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'
  },
  AA: {
    'jhn:3:16': 'Porque Deus amou o mundo de tal maneira que deu seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'
  },
  ALMEIDA_1911: {
    'jhn:3:16': 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nelle crê não pereça, mas tenha a vida eterna.'
  }
};

async function seedAlmeida() {
  console.log('🌱 Seeding Almeida versions...');
  
  for (const [versionCode, verses] of Object.entries(ALMEIDA_SAMPLES)) {
    for (const [verseKey, text] of Object.entries(verses)) {
      const [book, chapter, verse] = verseKey.split(':');
      
      try {
        await db.insert(bibleVerses).values({
          versionCode,
          book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          text
        }).onConflictDoNothing();
        
        console.log(`✅ ${versionCode} ${book} ${chapter}:${verse}`);
      } catch (error) {
        console.error(`❌ Error seeding ${versionCode} ${verseKey}:`, error);
      }
    }
  }
  
  console.log('✅ Almeida seeding complete!');
}

seedAlmeida().catch(console.error);

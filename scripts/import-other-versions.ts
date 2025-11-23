/**
 * IMPORTANTE: Este script importaria outras versões (ARC, KJV, WEB, ASV)
 * Mas no MVP, vamos focar em corrigir o Strong's Dictionary primeiro.
 * 
 * As outras versões precisam de dados públicos formatados.
 * Você pode encontrá-los em:
 * - https://github.com/thiagobodruk/bible (ARC, KJV)
 * - https://github.com/WorldEnglishBible/WEB (WEB)
 * 
 * Por enquanto, o sistema faz fallback para os dados hardcoded em memory.
 */

import { db } from '../server/db';
import { bibleVersions, bibleVerses } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function importOtherVersions() {
  console.log('📖 Importação de outras versões (ARC, KJV, WEB, ASV)');
  console.log('⏸️  Em progresso - dados públicos sendo obtidos...');
  
  // List pending versions
  const pendingVersions = ['ARC', 'KJV', 'WEB', 'ASV'];
  
  for (const code of pendingVersions) {
    const existing = await db.select().from(bibleVersions).where(eq(bibleVersions.code, code));
    if (existing.length > 0) {
      const verseCount = await db.select().from(bibleVerses).where(eq(bibleVerses.versionCode, code));
      console.log(`  ${code}: ${verseCount.length} versículos carregados`);
    }
  }
  
  console.log('\n✅ Versões disponíveis no banco:');
  const allVersions = await db.select().from(bibleVersions).where(eq(bibleVersions.isActive, true));
  allVersions.forEach(v => console.log(`  - ${v.code}: ${v.name}`));
}

importOtherVersions().catch(console.error);

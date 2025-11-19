import { db } from '../server/db';
import { strongEntries } from '../shared/schema';

// Import Strong's dictionaries from npm package
// @ts-expect-error - strongs package doesn't have TypeScript types
import * as strongsData from 'strongs';

async function importStrongDictionary() {
  console.log('🔄 Starting Strong\'s Dictionary import from npm package...\n');

  try {
    // Load all entries (package merges Hebrew & Greek)
    console.log('📖 Loading dictionaries from strongs package...');
    const allEntries = Object.entries(strongsData);
    
    // Separate Greek (G####) and Hebrew (H####)
    const greekEntries = allEntries.filter(([key]) => key.startsWith('G'));
    const hebrewEntries = allEntries.filter(([key]) => key.startsWith('H'));
    
    console.log(`   Found ${greekEntries.length} Greek entries`);
    console.log(`   Found ${hebrewEntries.length} Hebrew entries`);
    console.log(`   Total: ${allEntries.length} entries\n`);

    // Import Greek entries in batches
    console.log('💾 Importing Greek entries to database...');
    let greekCount = 0;
    const greekBatch = [];
    
    for (const [strongNumber, data] of greekEntries) {
      greekBatch.push({
        strongNumber,
        language: 'greek',
        lemma: data.lemma || '',
        translit: data.translit || null,
        xlit: null,
        pron: null,
        kjvDef: data.kjv_def || null,
        strongsDef: data.strongs_def || null,
        derivation: data.derivation || null,
      });

      if (greekBatch.length >= 100) {
        await db.insert(strongEntries).values(greekBatch).onConflictDoNothing();
        greekCount += greekBatch.length;
        process.stdout.write(`\r   Progress: ${greekCount}/${greekEntries.length} entries`);
        greekBatch.length = 0;
      }
    }

    // Insert remaining Greek entries
    if (greekBatch.length > 0) {
      await db.insert(strongEntries).values(greekBatch).onConflictDoNothing();
      greekCount += greekBatch.length;
    }
    console.log(`\n✅ Imported ${greekCount} Greek entries\n`);

    // Import Hebrew entries in batches
    console.log('💾 Importing Hebrew entries to database...');
    let hebrewCount = 0;
    const hebrewBatch = [];
    
    for (const [strongNumber, data] of hebrewEntries) {
      hebrewBatch.push({
        strongNumber,
        language: 'hebrew',
        lemma: data.lemma || '',
        translit: data.translit || null,
        xlit: data.xlit || null,
        pron: data.pron || null,
        kjvDef: data.kjv_def || null,
        strongsDef: data.strongs_def || null,
        derivation: data.derivation || null,
      });

      if (hebrewBatch.length >= 100) {
        await db.insert(strongEntries).values(hebrewBatch).onConflictDoNothing();
        hebrewCount += hebrewBatch.length;
        process.stdout.write(`\r   Progress: ${hebrewCount}/${hebrewEntries.length} entries`);
        hebrewBatch.length = 0;
      }
    }

    // Insert remaining Hebrew entries
    if (hebrewBatch.length > 0) {
      await db.insert(strongEntries).values(hebrewBatch).onConflictDoNothing();
      hebrewCount += hebrewBatch.length;
    }
    console.log(`\n✅ Imported ${hebrewCount} Hebrew entries\n`);

    console.log(`\n🎉 IMPORT COMPLETE!`);
    console.log(`   Total: ${greekCount + hebrewCount} Strong's entries in database`);
    console.log(`   Greek: ${greekCount} entries`);
    console.log(`   Hebrew: ${hebrewCount} entries\n`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

importStrongDictionary();

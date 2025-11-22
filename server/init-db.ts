import { db } from './db';
import { strongEntries, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    console.log('🔍 Checking if database needs initialization...');
    
    // Check if strong_entries table has data
    const strongCount = await db.select().from(strongEntries).limit(1);
    
    if (strongCount.length > 0) {
      console.log('✅ Database already initialized with Strong entries');
      return;
    }

    console.log('📥 Database is empty, importing data...');
    
    // Import Strong dictionary data
    const strongDataPath = path.resolve(__dirname, '../server/strong-data.json');
    
    if (fs.existsSync(strongDataPath)) {
      console.log('📂 Found strong-data.json, importing...');
      const strongData = JSON.parse(fs.readFileSync(strongDataPath, 'utf-8'));
      
      // Import in batches to avoid overwhelming the database
      const batchSize = 500;
      for (let i = 0; i < strongData.length; i += batchSize) {
        const batch = strongData.slice(i, i + batchSize);
        await db.insert(strongEntries).values(batch).onConflictDoNothing();
        console.log(`  Imported ${Math.min(i + batchSize, strongData.length)} / ${strongData.length}`);
      }
      console.log(`✅ Imported ${strongData.length} Strong dictionary entries`);
    } else {
      console.log('⚠️ strong-data.json not found - Strong dictionary will be empty');
    }

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    // Don't throw - app should still run even if data import fails
    console.log('⚠️ App will continue but with limited functionality');
  }
}

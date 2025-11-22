import { db } from './db';
import { strongEntries } from '@shared/schema';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    console.log('🔍 Verificando se banco de dados precisa de inicialização...');
    
    // Check if strong_entries table has data
    const strongCount = await db.select().from(strongEntries).limit(1);
    
    if (strongCount.length > 0) {
      console.log('✅ Banco de dados já inicializado com Strong entries');
      return;
    }

    console.log('📥 Banco está vazio, importando dados...');
    
    // Import Strong dictionary data from embedded JSON file
    const strongDataPath = path.resolve(__dirname, '../server/strong-data.json');
    
    if (fs.existsSync(strongDataPath)) {
      console.log('📂 Encontrado strong-data.json, importando...');
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

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    // Don't throw - app should still run even if data import fails
    console.log('⚠️ App continuará rodando mas com funcionalidade limitada');
  }
}

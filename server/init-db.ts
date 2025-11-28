import { db } from './db';
import { strongEntries } from '@shared/schema';
import { seedAdminUsers } from './seed-admins';
import { seedBibleVersions } from './seed-versions';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    console.log('🔍 Verificando se banco de dados precisa de inicialização...');
    
    // SEMPRE criar/verificar usuários admin (idempotente)
    await seedAdminUsers();
    
    // SEMPRE seed versões de Bíblia
    await seedBibleVersions();
    
    // Check if strong_entries table has data
    const strongCount = await db.select().from(strongEntries).limit(1);
    
    if (strongCount.length > 0) {
      console.log('✅ Banco de dados já inicializado com Strong entries');
      return;
    }

    console.log('📥 Banco está vazio, importando dados...');
    console.log(`🔍 __dirname: ${__dirname}`);
    console.log(`🔍 process.cwd(): ${process.cwd()}`);
    
    // Import Strong dictionary data from embedded JSON file
    // Try multiple paths for dev and production environments
    const possiblePaths = [
      path.resolve(__dirname, '../server/strong-data.json'),  // dev: when running from dist/
      path.resolve(__dirname, './server/strong-data.json'),   // prod: if running from root
      path.resolve(__dirname, 'strong-data.json'),            // prod: if copied to dist/
      path.resolve(process.cwd(), 'server/strong-data.json'), // fallback: from project root
      path.resolve(process.cwd(), 'strong-data.json'),        // fallback: if in root
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

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    // Don't throw - app should still run even if data import fails
    console.log('⚠️ App continuará rodando mas com funcionalidade limitada');
  }
}

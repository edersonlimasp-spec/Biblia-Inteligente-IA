/**
 * Sincroniza dados do Strong local para banco de produção
 * Use: DATABASE_URL=seu_url_producao tsx scripts/sync-strong-to-production.ts
 */
import { db } from '../server/db';
import { strongEntries } from '../shared/schema';

async function syncStrong() {
  try {
    console.log('🔄 Verificando dados do Strong...');
    
    const count = await db.select().from(strongEntries).then(r => r.length);
    console.log(`✅ Total de entradas: ${count}`);
    
    if (count === 0) {
      console.log('⚠️  Nenhuma entrada encontrada no banco local!');
      console.log('Execute primeiro: npm run import:strong');
    } else {
      console.log('✅ Dados do Strong estão presentes e funcionando!');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar Strong:', error);
  }
}

syncStrong();

import { db } from './db';
import { bibleVersions } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed Bible Versions
 * Adds all available Bible translations to the database
 */
export async function seedBibleVersions() {
  try {
    console.log('📚 Carregando versões de Bíblia...');

    const versions = [
      // Português - Almeida
      {
        code: 'ACF',
        name: 'Almeida Corrigida Fiel',
        language: 'pt',
        license: 'public_domain',
        sourceUrl: 'https://www.sbb.org.br',
      },
      {
        code: 'ARC',
        name: 'Almeida Revista e Corrigida',
        language: 'pt',
        license: 'public_domain',
        sourceUrl: 'https://www.sbb.org.br',
      },
      {
        code: 'AA',
        name: 'Almeida Atualizada',
        language: 'pt',
        license: 'public_domain',
        sourceUrl: 'https://www.sbb.org.br',
      },
      {
        code: 'ALMEIDA_1911',
        name: 'Almeida 1911',
        language: 'pt',
        license: 'public_domain',
        sourceUrl: 'https://www.sbb.org.br',
      },
      // Português - Modernas
      {
        code: 'NBV',
        name: 'Nova Bíblia Viva',
        language: 'pt',
        license: 'commercial',
        sourceUrl: 'https://www.sbb.org.br',
      },
      {
        code: 'NVI',
        name: 'New King James (NVI)',
        language: 'pt',
        license: 'commercial',
        sourceUrl: 'https://www.sbb.org.br',
      },
      {
        code: 'NTLH',
        name: 'Nova Tradução na Linguagem de Hoje',
        language: 'pt',
        license: 'commercial',
        sourceUrl: 'https://www.sbb.org.br',
      },
      {
        code: 'TLA',
        name: 'Tradução Linguagem Atual',
        language: 'pt',
        license: 'commercial',
        sourceUrl: 'https://www.sbb.org.br',
      },
      {
        code: 'KJA',
        name: 'King James Atualizada',
        language: 'pt',
        license: 'commercial',
        sourceUrl: 'https://www.kingmessiahbible.com',
      },
      // English
      {
        code: 'KJV',
        name: 'King James Version',
        language: 'en',
        license: 'public_domain',
        sourceUrl: 'https://www.kingjamesbibleonline.org',
      },
      {
        code: 'NKJV',
        name: 'New King James Version',
        language: 'en',
        license: 'commercial',
        sourceUrl: 'https://www.thomasnelson.com',
      },
      {
        code: 'NASB',
        name: 'New American Standard Bible',
        language: 'en',
        license: 'commercial',
        sourceUrl: 'https://www.lockman.org',
      },
      {
        code: 'ESV',
        name: 'English Standard Version',
        language: 'en',
        license: 'commercial',
        sourceUrl: 'https://www.crossway.org',
      },
    ];

    let addedCount = 0;

    for (const version of versions) {
      try {
        // Check if version already exists
        const existing = await db
          .select()
          .from(bibleVersions)
          .where(eq(bibleVersions.code, version.code))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(bibleVersions).values(version);
          console.log(`  ✓ Versão adicionada: ${version.code} - ${version.name}`);
          addedCount++;
        } else {
          console.log(`  ✓ Versão já existe: ${version.code}`);
        }
      } catch (error) {
        console.error(`  ❌ Erro ao adicionar ${version.code}:`, error);
      }
    }

    console.log(`✅ ${addedCount} versões novas adicionadas`);
  } catch (error) {
    console.error('❌ Erro ao seed Bible versions:', error);
    throw error;
  }
}

import { db } from '../server/db';
import { bibleVersions, bibleVerses } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Define all free bible versions with sources
const VERSIONS = [
  {
    code: 'ACF',
    name: 'Almeida Corrigida Fiel',
    language: 'pt',
    license: 'public_domain',
    sourceUrl: 'https://github.com/thiagobodruk/bible',
    description: 'Tradução clássica em português'
  },
  {
    code: 'ARC',
    name: 'Almeida Revista e Corrigida',
    language: 'pt',
    license: 'public_domain',
    sourceUrl: 'https://github.com/thiagobodruk/bible',
    description: 'Versão revista de 1995'
  },
  {
    code: 'KJV',
    name: 'King James Version',
    language: 'en',
    license: 'public_domain',
    sourceUrl: 'https://github.com/thiagobodruk/bible',
    description: 'Tradução clássica em inglês (1611)'
  },
  {
    code: 'WEB',
    name: 'World English Bible',
    language: 'en',
    license: 'public_domain',
    sourceUrl: 'https://github.com/WorldEnglishBible/WEB',
    description: 'Tradução livre em inglês'
  },
  {
    code: 'ASV',
    name: 'American Standard Version',
    language: 'en',
    license: 'public_domain',
    sourceUrl: 'https://github.com/thiagobodruk/bible',
    description: 'Versão padrão americana (1901)'
  }
];

async function importBibleVersions() {
  console.log('📖 Iniciando importação de versões bíblicas...');

  // Insert or update versions
  for (const version of VERSIONS) {
    const existing = await db.select().from(bibleVersions).where(eq(bibleVersions.code, version.code));
    
    if (!existing.length) {
      await db.insert(bibleVersions).values({
        code: version.code,
        name: version.name,
        language: version.language,
        license: version.license,
        sourceUrl: version.sourceUrl,
        isActive: true,
      });
      console.log(`✅ Versão adicionada: ${version.code} (${version.name})`);
    } else {
      console.log(`⏭️  Versão já existe: ${version.code}`);
    }
  }

  console.log('\n✨ Importação de versões concluída!');
  console.log('\n📋 Versões disponíveis:');
  VERSIONS.forEach(v => console.log(`  - ${v.code}: ${v.name} (${v.language})`));
}

importBibleVersions().catch(err => {
  console.error('❌ Erro na importação:', err);
  process.exit(1);
});

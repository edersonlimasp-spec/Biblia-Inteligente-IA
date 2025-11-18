import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SourceBibleBook {
  abbrev: string;
  chapters: string[][]; // Array de capítulos, cada capítulo é array de strings (versículos)
}

interface Verse {
  verse: number;
  text: string;
}

interface Chapter {
  chapter: number;
  verses: Verse[];
}

// Mapeamento de abreviações do JSON para os IDs usados na aplicação
const abbrevToId: Record<string, string> = {
  'gn': 'gen', 'ex': 'exo', 'lv': 'lev', 'nm': 'num', 'dt': 'deu',
  'js': 'jos', 'jz': 'jdg', 'rt': 'rut', '1sm': '1sa', '2sm': '2sa',
  '1rs': '1ki', '2rs': '2ki', '1cr': '1ch', '2cr': '2ch', 'ed': 'ezr',
  'ne': 'neh', 'et': 'est', 'jó': 'job', 'job': 'job', 'sl': 'psa', 'pv': 'pro',
  'ec': 'ecc', 'ct': 'sng', 'is': 'isa', 'jr': 'jer', 'lm': 'lam',
  'ez': 'ezk', 'dn': 'dan', 'os': 'hos', 'jl': 'jol', 'am': 'amo',
  'ob': 'oba', 'jn': 'jon', 'mq': 'mic', 'na': 'nam', 'hc': 'hab',
  'sf': 'zep', 'ag': 'hag', 'zc': 'zec', 'ml': 'mal',
  'mt': 'mat', 'mc': 'mrk', 'lc': 'luk', 'jo': 'jhn', 'atos': 'act', 'at': 'act',
  'rm': 'rom', '1co': '1co', '2co': '2co', 'gl': 'gal', 'ef': 'eph',
  'fp': 'php', 'cl': 'col', '1ts': '1th', '2ts': '2th', '1tm': '1ti',
  '2tm': '2ti', 'tt': 'tit', 'fm': 'phm', 'hb': 'heb', 'tg': 'jas',
  '1pe': '1pe', '2pe': '2pe', '1jo': '1jn', '2jo': '2jn', '3jo': '3jn',
  'jd': 'jud', 'ap': 'rev'
};

// Nomes dos livros em português
const bookNames: Record<string, string> = {
  'gen': 'Gênesis', 'exo': 'Êxodo', 'lev': 'Levítico', 'num': 'Números', 'deu': 'Deuteronômio',
  'jos': 'Josué', 'jdg': 'Juízes', 'rut': 'Rute', '1sa': '1 Samuel', '2sa': '2 Samuel',
  '1ki': '1 Reis', '2ki': '2 Reis', '1ch': '1 Crônicas', '2ch': '2 Crônicas', 'ezr': 'Esdras',
  'neh': 'Neemias', 'est': 'Ester', 'job': 'Jó', 'psa': 'Salmos', 'pro': 'Provérbios',
  'ecc': 'Eclesiastes', 'sng': 'Cantares', 'isa': 'Isaías', 'jer': 'Jeremias', 'lam': 'Lamentações',
  'ezk': 'Ezequiel', 'dan': 'Daniel', 'hos': 'Oséias', 'jol': 'Joel', 'amo': 'Amós',
  'oba': 'Obadias', 'jon': 'Jonas', 'mic': 'Miquéias', 'nam': 'Naum', 'hab': 'Habacuque',
  'zep': 'Sofonias', 'hag': 'Ageu', 'zec': 'Zacarias', 'mal': 'Malaquias',
  'mat': 'Mateus', 'mrk': 'Marcos', 'luk': 'Lucas', 'jhn': 'João', 'act': 'Atos',
  'rom': 'Romanos', '1co': '1 Coríntios', '2co': '2 Coríntios', 'gal': 'Gálatas', 'eph': 'Efésios',
  'php': 'Filipenses', 'col': 'Colossenses', '1th': '1 Tessalonicenses', '2th': '2 Tessalonicenses',
  '1ti': '1 Timóteo', '2ti': '2 Timóteo', 'tit': 'Tito', 'phm': 'Filemom', 'heb': 'Hebreus',
  'jas': 'Tiago', '1pe': '1 Pedro', '2pe': '2 Pedro', '1jn': '1 João', '2jn': '2 João',
  '3jn': '3 João', 'jud': 'Judas', 'rev': 'Apocalipse'
};

function loadBible(): SourceBibleBook[] {
  const filePath = '/tmp/bible_acf.json';
  let data = fs.readFileSync(filePath, 'utf-8');
  
  // Remove BOM se presente
  if (data.charCodeAt(0) === 0xFEFF) {
    data = data.slice(1);
  }
  
  // Remove caracteres de controle invisíveis
  data = data.replace(/^\uFEFF/, '').trim();
  
  return JSON.parse(data);
}

function convertBook(sourceBook: SourceBibleBook): { id: string; name: string; chapters: Chapter[] } | null {
  const bookId = abbrevToId[sourceBook.abbrev];
  
  if (!bookId) {
    console.warn(`❌ Unknown abbreviation: ${sourceBook.abbrev}`);
    return null;
  }
  
  const bookName = bookNames[bookId];
  
  if (!bookName) {
    console.warn(`❌ Unknown book ID: ${bookId}`);
    return null;
  }
  
  const chapters: Chapter[] = sourceBook.chapters.map((chapterVerses, index) => ({
    chapter: index + 1,
    verses: chapterVerses.map((verseText, verseIndex) => ({
      verse: verseIndex + 1,
      text: verseText
    }))
  }));
  
  return {
    id: bookId,
    name: bookName,
    chapters
  };
}

function generateTypeScriptFile(bookData: { id: string; name: string; chapters: Chapter[] }): string {
  const { id, name, chapters } = bookData;
  
  // Sanitizar nome de exportação (não pode começar com número)
  const exportName = id.replace(/^(\d)/, 'book$1');
  
  let content = `import { Chapter } from './types';

// ${name} - ACF (Almeida Corrigida Fiel)
export const ${exportName}Chapters: Chapter[] = [\n`;
  
  // Adicionar cada capítulo
  chapters.forEach((chapter, chapterIndex) => {
    content += `  {\n`;
    content += `    chapter: ${chapter.chapter},\n`;
    content += `    verses: [\n`;
    
    chapter.verses.forEach((verse, verseIndex) => {
      // Escapar quebras de linha, barras invertidas e aspas duplas no texto
      const escapedText = verse.text
        .replace(/\\/g, '\\\\')   // Escapar barras invertidas
        .replace(/"/g, '\\"')     // Escapar aspas duplas
        .replace(/\n/g, '\\n')    // Escapar quebras de linha
        .replace(/\r/g, '');      // Remover carriage returns
      
      content += `      { verse: ${verse.verse}, text: "${escapedText}" }`;
      
      if (verseIndex < chapter.verses.length - 1) {
        content += ',\n';
      } else {
        content += '\n';
      }
    });
    
    content += `    ]\n`;
    content += `  }`;
    
    if (chapterIndex < chapters.length - 1) {
      content += ',\n';
    } else {
      content += '\n';
    }
  });
  
  content += `];\n`;
  
  return content;
}

async function main() {
  try {
    console.log('📖 Carregando Bíblia ACF...');
    const sourceBible = loadBible();
    
    console.log(`✅ ${sourceBible.length} livros carregados\n`);
    
    const outputDir = path.join(__dirname, '..', 'server', 'bible-data');
    
    // Criar diretório se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let successCount = 0;
    let totalVerses = 0;
    
    for (const sourceBook of sourceBible) {
      const converted = convertBook(sourceBook);
      
      if (!converted) {
        continue;
      }
      
      const { id, name, chapters } = converted;
      const versesCount = chapters.reduce((sum, ch) => sum + ch.verses.length, 0);
      totalVerses += versesCount;
      
      // Gerar arquivo TypeScript
      const fileContent = generateTypeScriptFile(converted);
      const fileName = `${id}.ts`;
      const filePath = path.join(outputDir, fileName);
      
      fs.writeFileSync(filePath, fileContent, 'utf-8');
      
      console.log(`✅ ${name.padEnd(20)} → ${fileName.padEnd(12)} (${chapters.length} cap., ${versesCount} vers.)`);
      successCount++;
    }
    
    console.log(`\n🎉 Importação concluída!`);
    console.log(`📚 ${successCount} livros processados`);
    console.log(`📝 ${totalVerses.toLocaleString()} versículos importados`);
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    process.exit(1);
  }
}

main();

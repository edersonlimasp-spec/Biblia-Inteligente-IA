/**
 * Script para extrair mapeamentos Strong de Êxodo e Números
 * Gera arquivos exodus-strong-mappings.ts e numbers-strong-mappings.ts
 * 
 * npm run strong:exodus-numbers
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WordMapping {
  word: string;
  strong: string;
  count: number;
}

interface ExtractionReport {
  book: string;
  totalTokens: number;
  tokensWithStrong: number;
  tokensWithoutStrong: number;
  uniqueWords: number;
  ambiguousWords: string[];
  inferredWords: string[];
  problematicWords: { word: string; count: number }[];
}

const BOOK_MAP: Record<string, string> = {
  'Exodus': 'exo',
  'Numbers': 'num',
};

async function extractStrongMappings(): Promise<void> {
  console.log("\n🔍 Extraindo mapeamentos Strong de Êxodo e Números...\n");
  
  const morphhb = await import('morphhb').then(m => m.default || m);
  const reports: ExtractionReport[] = [];
  
  for (const [bookName, bookId] of Object.entries(BOOK_MAP)) {
    console.log(`📖 Processando ${bookName}...`);
    
    const bookData = morphhb[bookName];
    if (!bookData || !Array.isArray(bookData)) {
      console.log(`  ⚠️ Livro não encontrado: ${bookName}`);
      continue;
    }
    
    const wordMappings: Map<string, Map<string, number>> = new Map();
    let totalTokens = 0;
    let tokensWithStrong = 0;
    
    for (let chapterIdx = 0; chapterIdx < bookData.length; chapterIdx++) {
      const chapterData = bookData[chapterIdx];
      if (!Array.isArray(chapterData)) continue;
      
      for (let verseIdx = 0; verseIdx < chapterData.length; verseIdx++) {
        const verseData = chapterData[verseIdx];
        if (!Array.isArray(verseData)) continue;
        
        for (const wordData of verseData) {
          if (!Array.isArray(wordData) || wordData.length < 2) continue;
          
          const [hebrewText, strongField] = wordData;
          totalTokens++;
          
          const strongNumber = extractStrongNumber(strongField || '');
          if (!strongNumber) continue;
          
          tokensWithStrong++;
          
          const normalizedWord = normalizeWord(hebrewText || '');
          if (!normalizedWord) continue;
          
          if (!wordMappings.has(normalizedWord)) {
            wordMappings.set(normalizedWord, new Map());
          }
          
          const strongCounts = wordMappings.get(normalizedWord)!;
          strongCounts.set(strongNumber, (strongCounts.get(strongNumber) || 0) + 1);
        }
      }
    }
    
    const finalMappings: Map<string, string> = new Map();
    const ambiguousWords: string[] = [];
    
    for (const [word, strongCounts] of wordMappings) {
      const entries = Array.from(strongCounts.entries());
      entries.sort((a, b) => b[1] - a[1]);
      
      if (entries.length > 1 && entries[0][1] === entries[1][1]) {
        ambiguousWords.push(`${word} (${entries.map(e => `${e[0]}:${e[1]}`).join(', ')})`);
      }
      
      finalMappings.set(word, entries[0][0]);
    }
    
    const sortedMappings = Array.from(finalMappings.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    const fileName = `${bookId}-strong-mappings.ts`;
    const varName = bookId.toUpperCase() + '_WORD_STRONG';
    
    let content = `/**
 * Mapeamentos de Strong's para ${bookName} (palavra-por-palavra)
 * Extraído automaticamente do morphhb (Open Scriptures Hebrew Bible)
 * Total: ${sortedMappings.length} palavras únicas com seus respectivos números Strong hebraicos
 * 
 * Gerado em: ${new Date().toISOString()}
 */

export const ${varName}: Record<string, string> = {\n`;
    
    for (const [word, strong] of sortedMappings) {
      const escapedWord = word.replace(/'/g, "\\'");
      content += `  '${escapedWord}': '${strong}',\n`;
    }
    
    content += `};\n\n`;
    content += `export const ${varName}_COUNT = ${sortedMappings.length};\n`;
    
    const outputPath = path.join(__dirname, '..', 'server', fileName);
    fs.writeFileSync(outputPath, content, 'utf-8');
    
    console.log(`  ✅ ${sortedMappings.length} palavras únicas salvas em server/${fileName}`);
    
    const report: ExtractionReport = {
      book: bookName,
      totalTokens,
      tokensWithStrong,
      tokensWithoutStrong: totalTokens - tokensWithStrong,
      uniqueWords: sortedMappings.length,
      ambiguousWords: ambiguousWords.slice(0, 50),
      inferredWords: [],
      problematicWords: [],
    };
    
    reports.push(report);
  }
  
  generateReport(reports);
  console.log("\n✅ Extração concluída!");
}

function extractStrongNumber(strongField: string): string {
  const match = strongField.match(/[HG]\d+/g);
  if (match && match.length > 0) {
    return match[match.length - 1];
  }
  return '';
}

function normalizeWord(hebrewText: string): string {
  return hebrewText
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[\u0591-\u05AF]/g, '')
    .trim()
    .toLowerCase();
}

function generateReport(reports: ExtractionReport[]): void {
  let reportContent = `# Relatório de Extração Strong - Êxodo e Números

Gerado em: ${new Date().toISOString()}

## Resumo

`;

  let totalTokens = 0;
  let totalWithStrong = 0;
  let totalUniqueWords = 0;

  for (const report of reports) {
    totalTokens += report.totalTokens;
    totalWithStrong += report.tokensWithStrong;
    totalUniqueWords += report.uniqueWords;
    
    reportContent += `### ${report.book}
- Total de tokens analisados: ${report.totalTokens}
- Tokens com Strong: ${report.tokensWithStrong} (${((report.tokensWithStrong / report.totalTokens) * 100).toFixed(2)}%)
- Tokens sem Strong: ${report.tokensWithoutStrong}
- Palavras únicas mapeadas: ${report.uniqueWords}

`;
  }

  reportContent += `## Totais Gerais
- Total de tokens: ${totalTokens}
- Com Strong: ${totalWithStrong} (${((totalWithStrong / totalTokens) * 100).toFixed(2)}%)
- Palavras únicas: ${totalUniqueWords}

## Palavras Ambíguas (Top 50 por livro)

`;

  for (const report of reports) {
    if (report.ambiguousWords.length > 0) {
      reportContent += `### ${report.book}\n`;
      for (const word of report.ambiguousWords) {
        reportContent += `- ${word}\n`;
      }
      reportContent += '\n';
    }
  }

  reportContent += `## Conclusão

A extração foi realizada com sucesso. Os mapeamentos foram salvos em:
- server/exo-strong-mappings.ts
- server/num-strong-mappings.ts

Estes arquivos podem ser importados e utilizados para preencher Strong em versículos de Êxodo e Números.
`;

  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, 'strong_fill_report.md');
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  
  console.log(`\n📄 Relatório salvo em reports/strong_fill_report.md`);
}

extractStrongMappings().catch(console.error);

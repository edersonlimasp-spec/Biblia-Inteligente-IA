/**
 * Script para extrair mapeamentos Strong de Levítico
 * Gera arquivo lev-strong-mappings.ts
 * 
 * Execução: npx tsx scripts/extract-leviticus-strong.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractStrongNumber(strongField: string): string | null {
  if (!strongField) return null;
  const match = strongField.match(/H(\d+)/);
  if (match) return `H${match[1]}`;
  const numMatch = strongField.match(/(\d{4,5})/);
  if (numMatch) return `H${numMatch[1]}`;
  return null;
}

function normalizeWord(word: string): string {
  return word.replace(/[\u0591-\u05C7]/g, '').trim();
}

async function extractLeviticusMappings(): Promise<void> {
  console.log("\n🔍 Extraindo mapeamentos Strong de Levítico...\n");
  
  const morphhb = await import('morphhb').then(m => m.default || m);
  
  const bookData = morphhb['Leviticus'];
  if (!bookData || !Array.isArray(bookData)) {
    console.log("❌ Livro Levítico não encontrado!");
    return;
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
  
  for (const [word, strongCounts] of wordMappings) {
    const entries = Array.from(strongCounts.entries());
    entries.sort((a, b) => b[1] - a[1]);
    finalMappings.set(word, entries[0][0]);
  }
  
  console.log(`📊 Levítico:`);
  console.log(`   Tokens totais: ${totalTokens}`);
  console.log(`   Com Strong: ${tokensWithStrong}`);
  console.log(`   Palavras únicas: ${finalMappings.size}`);
  console.log(`   Cobertura: ${((tokensWithStrong/totalTokens)*100).toFixed(2)}%`);
  
  const sortedEntries = Array.from(finalMappings.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  let fileContent = `/**
 * Mapeamentos Strong para Levítico
 * Gerado automaticamente via scripts/extract-leviticus-strong.ts
 * 
 * Total: ${finalMappings.size} palavras hebraicas únicas
 * Cobertura: ${((tokensWithStrong/totalTokens)*100).toFixed(2)}%
 */

export const LEV_WORD_STRONG: Record<string, string> = {\n`;
  
  for (const [word, strong] of sortedEntries) {
    const escapedWord = word.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    fileContent += `  "${escapedWord}": "${strong}",\n`;
  }
  
  fileContent += `};\n`;
  
  const outputPath = path.join(__dirname, '..', 'server', 'lev-strong-mappings.ts');
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  
  console.log(`\n✅ Arquivo gerado: server/lev-strong-mappings.ts`);
  console.log(`   ${finalMappings.size} mapeamentos salvos\n`);
}

extractLeviticusMappings().catch(console.error);

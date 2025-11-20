import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";

interface ParsedEntry {
  number: string;
  definition: string;
}

function parseStrongPDFImproved(textContent: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = textContent.split('\n');
  
  let currentEntry: ParsedEntry | null = null;
  let definitionLines: string[] = [];
  let isInGreekSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.includes('DITAT') || line.includes('Qal') || line.includes('Piel')) {
      continue;
    }
    
    // Detect Greek section (starts around "Strongs em Grego")
    if (line.includes('Strongs em Grego') || line.includes('grego')) {
      isInGreekSection = true;
    }
    
    // Match entry numbers: "01 ‫", "02 ‫", "1 α", "2 Α", etc.
    const entryMatch = line.match(/^(\d{1,5})\s+[‫א-תΑ-Ωα-ω]/);
    
    if (entryMatch) {
      // Save previous entry
      if (currentEntry && definitionLines.length > 0) {
        const def = definitionLines.join(' ').trim();
        // Only save if has substantial content and starts with number
        if (def.length > 20 && def.match(/^1\)/)) {
          currentEntry.definition = def;
          entries.push(currentEntry);
        }
      }
      
      // Start new entry
      const number = entryMatch[1];
      const prefix = isInGreekSection ? 'G' : 'H';
      const strongNumber = `${prefix}${number}`;
      
      currentEntry = {
        number: strongNumber,
        definition: ''
      };
      
      definitionLines = [];
      continue;
    }
    
    // Collect definition lines (only numbered items like "1)", "2)", etc.)
    if (currentEntry && line.match(/^\d+\)/)) {
      definitionLines.push(line);
    } else if (currentEntry && definitionLines.length > 0 && line.match(/^\d+[a-z]\)/)) {
      // Include sub-items like "1a)", "2b)"
      definitionLines.push(line);
    }
  }
  
  // Save last entry
  if (currentEntry && definitionLines.length > 0) {
    const def = definitionLines.join(' ').trim();
    if (def.length > 20) {
      currentEntry.definition = def;
      entries.push(currentEntry);
    }
  }
  
  return entries;
}

async function main() {
  console.log("📖 Parser Melhorado - Importando definições em português...\n");
  
  const pdfTextPath = "/tmp/strong-text.txt";
  
  if (!fs.existsSync(pdfTextPath)) {
    console.error("❌ Arquivo de texto não encontrado.");
    return;
  }
  
  console.log("📄 Lendo arquivo de texto...");
  const textContent = fs.readFileSync(pdfTextPath, 'utf-8');
  
  console.log("🔍 Parseando entradas com algoritmo melhorado...");
  const parsedEntries = parseStrongPDFImproved(textContent);
  
  console.log(`✅ Encontradas ${parsedEntries.length} entradas parseadas\n`);
  
  // Show sample
  console.log("📋 Amostra das primeiras 3 entradas:");
  parsedEntries.slice(0, 3).forEach(e => {
    console.log(`  ${e.number}: ${e.definition.substring(0, 80)}...`);
  });
  console.log();
  
  // Update database
  let updated = 0;
  
  for (const entry of parsedEntries) {
    try {
      await db
        .update(strongEntries)
        .set({ portugueseDef: entry.definition })
        .where(sql`strong_number = ${entry.number}`);
      
      updated++;
      
      if (updated % 500 === 0) {
        console.log(`  ✅ Atualizadas: ${updated} entradas...`);
      }
    } catch (error) {
      // Skip entries that don't exist
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 IMPORTAÇÃO CONCLUÍDA!");
  console.log("=".repeat(60));
  console.log(`✅ Entradas atualizadas: ${updated}`);
  
  // Show final stats
  const stats = await db
    .select({ 
      total: sql<number>`count(*)`,
      com_portugues: sql<number>`count(case when portuguese_def is not null then 1 end)`
    })
    .from(strongEntries);
  
  const total = stats[0].total;
  const withPortuguese = stats[0].com_portugues;
  const remaining = total - withPortuguese;
  const progress = ((withPortuguese / total) * 100).toFixed(1);
  
  console.log(`\n📊 ESTATÍSTICAS FINAIS:`);
  console.log(`   Total de entradas: ${total}`);
  console.log(`   Com português: ${withPortuguese} (${progress}%)`);
  console.log(`   Faltam traduzir: ${remaining} entradas`);
  console.log(`\n💡 Próximo passo: Traduzir ${remaining} entradas via OpenAI API`);
}

main()
  .then(() => {
    console.log("\n✅ Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

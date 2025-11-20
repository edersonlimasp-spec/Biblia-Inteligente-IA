import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";

interface ParsedEntry {
  number: string;
  definition: string;
}

function parseStrongPDF(textContent: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = textContent.split('\n');
  
  let currentEntry: ParsedEntry | null = null;
  let collectingDefinition = false;
  let definitionLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Try to match entry number - more flexible patterns
    // Hebrew: number followed by Hebrew character or specific markers
    const hebrewMatch = line.match(/^(\d{1,5})\s+(?:[א-ת]|‫)/);
    // Greek: number followed by Greek character
    const greekMatch = line.match(/^(\d{1,5})\s+[Α-Ωα-ω]/);
    // Also try simple number at start of line (fallback)
    const numberMatch = line.match(/^(\d{1,5})\s+\S+/);
    
    if (hebrewMatch || greekMatch || numberMatch) {
      // Save previous entry if exists
      if (currentEntry && definitionLines.length > 0) {
        currentEntry.definition = definitionLines.join(' ').trim();
        if (currentEntry.definition.length > 10) { // Only save if has substantial content
          entries.push(currentEntry);
        }
      }
      
      // Start new entry
      const number = (hebrewMatch || greekMatch || numberMatch)![1];
      
      // Determine if it's Hebrew or Greek based on content or position in file
      let prefix = 'H';
      if (greekMatch || (i > 58000 && !hebrewMatch)) { // Greek section starts around line 58782
        prefix = 'G';
      }
      
      const strongNumber = `${prefix}${number}`;
      
      currentEntry = {
        number: strongNumber,
        definition: ''
      };
      
      definitionLines = [];
      collectingDefinition = false;
      continue;
    }
    
    // Start collecting definition after we see numbered items (1), 2), etc.)
    if (currentEntry && line.match(/^1\)/)) {
      collectingDefinition = true;
    }
    
    // Collect definition lines
    if (currentEntry && collectingDefinition) {
      // Stop if we hit certain keywords that indicate end of entry
      if (line.match(/^(Qal|Piel|Pual|Hifil|Hitpael|Nifal|TDNT|DITAT)/)) {
        continue;
      }
      
      definitionLines.push(line);
    }
  }
  
  // Save last entry
  if (currentEntry && definitionLines.length > 0) {
    currentEntry.definition = definitionLines.join(' ').trim();
    entries.push(currentEntry);
  }
  
  return entries;
}

async function importFromPDF() {
  console.log("📖 Importando definições em português do PDF...\n");
  
  const pdfTextPath = "/tmp/strong-text.txt";
  
  if (!fs.existsSync(pdfTextPath)) {
    console.error("❌ Arquivo de texto não encontrado. Execute pdftotext primeiro.");
    return;
  }
  
  console.log("📄 Lendo arquivo de texto...");
  const textContent = fs.readFileSync(pdfTextPath, 'utf-8');
  
  console.log("🔍 Parseando entradas...");
  const parsedEntries = parseStrongPDF(textContent);
  
  console.log(`✅ Encontradas ${parsedEntries.length} entradas parseadas\n`);
  
  // Update database (optimized - no SELECT check)
  let updated = 0;
  
  for (const entry of parsedEntries) {
    try {
      // Direct update without checking if exists first
      await db
        .update(strongEntries)
        .set({ portugueseDef: entry.definition })
        .where(sql`strong_number = ${entry.number}`);
      
      updated++;
      
      if (updated % 500 === 0) {
        console.log(`  ✅ Atualizadas: ${updated} entradas...`);
      }
    } catch (error) {
      // Silently skip entries that don't exist
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
  const progress = ((withPortuguese / total) * 100).toFixed(1);
  
  console.log(`\n📊 Total de entradas com português: ${withPortuguese} de ${total} (${progress}%)`);
}

importFromPDF()
  .then(() => {
    console.log("\n✅ Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

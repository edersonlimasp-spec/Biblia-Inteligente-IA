import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranslationBatch {
  strongNumber: string;
  englishDef: string;
}

async function translateBatch(batch: TranslationBatch[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  // Create prompt for batch translation
  const batchText = batch.map((item, idx) => 
    `[${idx}] ${item.englishDef}`
  ).join('\n\n');
  
  const prompt = `Traduza as seguintes definições do Dicionário Bíblico Strong's do inglês para português brasileiro. Mantenha a formatação exata, incluindo numeração e parênteses. Retorne apenas as traduções, na mesma ordem, separadas por linha em branco.

${batchText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um tradutor especializado em textos bíblicos e teológicos. Traduza com precisão preservando toda a formatação, numeração e estrutura original."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const translatedText = completion.choices[0]?.message?.content || "";
    
    // Parse translations back
    const translations = translatedText.split(/\n\n+/).filter(t => t.trim());
    
    // Match translations to original entries
    batch.forEach((item, idx) => {
      if (translations[idx]) {
        // Remove the [idx] prefix if present
        const cleanTranslation = translations[idx].replace(/^\[\d+\]\s*/, '').trim();
        results.set(item.strongNumber, cleanTranslation);
      }
    });
    
  } catch (error: any) {
    console.error(`  ❌ Erro na tradução do lote:`, error.message);
  }
  
  return results;
}

async function translateRemaining() {
  console.log("🤖 TRADUÇÃO AUTOMÁTICA VIA OPENAI GPT-4o-mini\n");
  console.log("=".repeat(60));
  
  // Get all entries without Portuguese
  const entriesToTranslate = await db
    .select({
      strongNumber: strongEntries.strongNumber,
      kjvDef: strongEntries.kjvDef,
      strongsDef: strongEntries.strongsDef,
    })
    .from(strongEntries)
    .where(sql`portuguese_def IS NULL`);
  
  const total = entriesToTranslate.length;
  console.log(`📊 Total de entradas para traduzir: ${total.toLocaleString()}\n`);
  
  if (total === 0) {
    console.log("✅ Todas as entradas já possuem tradução em português!");
    return;
  }
  
  // Process in batches of 20 (good balance between speed and quality)
  const batchSize = 20;
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  const startTime = Date.now();
  
  for (let i = 0; i < entriesToTranslate.length; i += batchSize) {
    const batch: TranslationBatch[] = entriesToTranslate
      .slice(i, i + batchSize)
      .map(entry => ({
        strongNumber: entry.strongNumber,
        englishDef: entry.kjvDef || entry.strongsDef || '',
      }))
      .filter(item => item.englishDef.length > 0);
    
    console.log(`\n📦 Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(total / batchSize)}`);
    console.log(`   Processando entradas ${i + 1} a ${Math.min(i + batchSize, total)}...`);
    
    // Translate batch
    const translations = await translateBatch(batch);
    
    // Update database
    for (const [strongNumber, portugueseDef] of translations.entries()) {
      try {
        await db
          .update(strongEntries)
          .set({ portugueseDef })
          .where(sql`strong_number = ${strongNumber}`);
        
        successful++;
      } catch (error) {
        console.error(`  ❌ Erro ao salvar ${strongNumber}`);
        failed++;
      }
    }
    
    processed += batch.length;
    
    const progress = ((processed / total) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (processed / parseFloat(elapsed)).toFixed(1);
    
    console.log(`   ✅ Traduzidas: ${translations.size}/${batch.length}`);
    console.log(`   📊 Progresso geral: ${processed}/${total} (${progress}%)`);
    console.log(`   ⏱️  Tempo: ${elapsed}s | Taxa: ${rate} entradas/s`);
    
    // Small delay to avoid rate limits
    if (i + batchSize < entriesToTranslate.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Final statistics
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(1);
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 TRADUÇÃO CONCLUÍDA!");
  console.log("=".repeat(60));
  console.log(`✅ Traduções bem-sucedidas: ${successful}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`⏱️  Tempo total: ${totalTime}s`);
  
  // Show final database stats
  const stats = await db
    .select({ 
      total: sql<number>`count(*)`,
      com_portugues: sql<number>`count(case when portuguese_def is not null then 1 end)`
    })
    .from(strongEntries);
  
  const dbTotal = stats[0].total;
  const withPortuguese = stats[0].com_portugues;
  const percentual = ((withPortuguese / dbTotal) * 100).toFixed(1);
  
  console.log(`\n📊 ESTATÍSTICAS FINAIS DO BANCO:`);
  console.log(`   Total: ${dbTotal}`);
  console.log(`   Com português: ${withPortuguese} (${percentual}%)`);
  console.log(`   Faltam: ${dbTotal - withPortuguese}`);
  console.log("=".repeat(60));
}

translateRemaining()
  .then(() => {
    console.log("\n✅ Script concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

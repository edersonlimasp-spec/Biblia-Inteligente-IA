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
    const translations = translatedText.split(/\n\n+/).filter(t => t.trim());
    
    batch.forEach((item, idx) => {
      if (translations[idx]) {
        const cleanTranslation = translations[idx].replace(/^\[\d+\]\s*/, '').trim();
        results.set(item.strongNumber, cleanTranslation);
      }
    });
    
  } catch (error: any) {
    console.error(`  ❌ Erro:`, error.message);
  }
  
  return results;
}

async function translateContinuously() {
  console.log("🚀 TRADUÇÃO CONTÍNUA ATÉ 100%\n");
  console.log("=".repeat(60));
  
  let roundNumber = 1;
  const batchSize = 20;
  const maxEntriesPerRound = 2000; // Traduzir 2000 entradas por rodada
  
  while (true) {
    // Get entries without Portuguese
    const entriesToTranslate = await db
      .select({
        strongNumber: strongEntries.strongNumber,
        kjvDef: strongEntries.kjvDef,
        strongsDef: strongEntries.strongsDef,
      })
      .from(strongEntries)
      .where(sql`portuguese_def IS NULL`)
      .limit(maxEntriesPerRound);
    
    const remaining = entriesToTranslate.length;
    
    if (remaining === 0) {
      console.log("\n" + "=".repeat(60));
      console.log("🎉 100% COMPLETO! TODAS AS ENTRADAS TRADUZIDAS!");
      console.log("=".repeat(60));
      break;
    }
    
    console.log(`\n📍 RODADA ${roundNumber}`);
    console.log(`   Entradas restantes: ${remaining.toLocaleString()}`);
    console.log(`   Processando até ${Math.min(maxEntriesPerRound, remaining)} nesta rodada\n`);
    
    let processed = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < entriesToTranslate.length; i += batchSize) {
      const batch: TranslationBatch[] = entriesToTranslate
        .slice(i, i + batchSize)
        .map(entry => ({
          strongNumber: entry.strongNumber,
          englishDef: entry.kjvDef || entry.strongsDef || '',
        }))
        .filter(item => item.englishDef.length > 0);
      
      // Translate batch
      const translations = await translateBatch(batch);
      
      // Update database
      for (const [strongNumber, portugueseDef] of translations.entries()) {
        try {
          await db
            .update(strongEntries)
            .set({ portugueseDef })
            .where(sql`strong_number = ${strongNumber}`);
        } catch (error) {
          // Skip
        }
      }
      
      processed += batch.length;
      
      // Show progress every 200 entries
      if (processed % 200 === 0) {
        const progress = ((processed / entriesToTranslate.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`   ✅ ${processed}/${entriesToTranslate.length} (${progress}%) - ${elapsed}s`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const roundTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Rodada ${roundNumber} concluída em ${roundTime}s`);
    
    roundNumber++;
    
    // Small pause between rounds
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final statistics
  const stats = await db
    .select({ 
      total: sql<number>`count(*)`,
      com_portugues: sql<number>`count(case when portuguese_def is not null then 1 end)`
    })
    .from(strongEntries);
  
  const total = stats[0].total;
  const withPortuguese = stats[0].com_portugues;
  const percentual = ((withPortuguese / total) * 100).toFixed(1);
  
  console.log(`\n📊 ESTATÍSTICAS FINAIS:`);
  console.log(`   Total de entradas: ${total.toLocaleString()}`);
  console.log(`   Com português: ${withPortuguese.toLocaleString()} (${percentual}%)`);
  console.log("=".repeat(60));
}

translateContinuously()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  });

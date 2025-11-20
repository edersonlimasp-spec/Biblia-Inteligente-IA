import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

// Using Replit's AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const MAX_ENTRIES_PER_RUN = 500; // Limitar a 500 entradas por execução
const BATCH_SIZE = 50; // Tamanho do lote para GPT

interface StrongEntry {
  strongNumber: string;
  kjvDef: string | null;
  strongsDef: string | null;
}

async function translateBatch(entries: StrongEntry[]): Promise<Map<string, string>> {
  const translations = new Map<string, string>();
  
  const toTranslate = entries
    .map((entry, idx) => {
      const englishDef = entry.kjvDef || entry.strongsDef || "";
      if (!englishDef) return null;
      return `${idx}|||${englishDef}`;
    })
    .filter(Boolean);

  if (toTranslate.length === 0) {
    return translations;
  }

  const prompt = `Traduza as seguintes definições do dicionário Strong's do inglês para português brasileiro. Mantenha termos técnicos teológicos apropriados.

Formato: ÍNDICE|||DEFINIÇÃO_EM_INGLÊS

Retorne no mesmo formato: ÍNDICE|||TRADUÇÃO_EM_PORTUGUÊS

${toTranslate.join('\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Você é um tradutor especializado em termos bíblicos e teológicos do inglês para português brasileiro."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 4000,
    });

    const translatedText = response.choices[0]?.message?.content || "";
    
    // Debug: Log first response
    if (entries.length > 0 && entries[0].strongNumber === 'G1') {
      console.log("DEBUG - Primeira resposta GPT:", translatedText.substring(0, 500));
    }
    
    const lines = translatedText.split('\n').filter(line => line.includes('|||'));
    
    lines.forEach(line => {
      const parts = line.split('|||');
      if (parts.length >= 2) {
        const idxStr = parts[0].trim();
        const translation = parts.slice(1).join('|||').trim(); // Handle ||| in translation
        const idx = parseInt(idxStr);
        if (!isNaN(idx) && translation && entries[idx]) {
          translations.set(entries[idx].strongNumber, translation);
        }
      }
    });

    return translations;
  } catch (error) {
    console.error("❌ Erro na tradução:", error);
    return translations;
  }
}

async function translateIncrementalBatch() {
  console.log("🌍 Iniciando tradução incremental...\n");

  // Get entries without Portuguese translation (limited to MAX_ENTRIES_PER_RUN)
  const entriesToTranslate = await db
    .select({
      strongNumber: strongEntries.strongNumber,
      kjvDef: strongEntries.kjvDef,
      strongsDef: strongEntries.strongsDef,
    })
    .from(strongEntries)
    .where(sql`portuguese_def IS NULL`)
    .limit(MAX_ENTRIES_PER_RUN);

  console.log(`📊 Entradas para traduzir nesta execução: ${entriesToTranslate.length}`);

  if (entriesToTranslate.length === 0) {
    console.log("✅ Todas as entradas já estão traduzidas!");
    return;
  }

  let translated = 0;
  let failed = 0;

  for (let i = 0; i < entriesToTranslate.length; i += BATCH_SIZE) {
    const batch = entriesToTranslate.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(entriesToTranslate.length / BATCH_SIZE);

    console.log(`📦 Lote ${batchNum}/${totalBatches} (${batch.length} entradas)...`);

    try {
      const translations = await translateBatch(batch);

      // Update database
      for (const [strongNumber, translation] of translations) {
        await db
          .update(strongEntries)
          .set({ portugueseDef: translation })
          .where(sql`strong_number = ${strongNumber}`);
        
        translated++;
      }

      if (translations.size > 0) {
        console.log(`  ✅ ${translations.size} entradas traduzidas`);
      } else {
        failed += batch.length;
        console.log(`  ⚠️  Nenhuma tradução obtida`);
      }

      // Delay to avoid rate limits
      if (i + BATCH_SIZE < entriesToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

    } catch (error) {
      console.error(`  ❌ Erro no lote ${batchNum}:`, error);
      failed += batch.length;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Traduzidas: ${translated}`);
  console.log(`❌ Falhas: ${failed}`);
  
  // Show overall progress
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
  
  console.log("\n📊 PROGRESSO GERAL:");
  console.log(`   Total: ${total} entradas`);
  console.log(`   Traduzidas: ${withPortuguese} (${progress}%)`);
  console.log(`   Restantes: ${remaining}`);
  
  if (remaining > 0) {
    console.log(`\n💡 Execute novamente para traduzir as próximas ${Math.min(remaining, MAX_ENTRIES_PER_RUN)} entradas`);
  } else {
    console.log("\n🎉 TODAS AS ENTRADAS FORAM TRADUZIDAS!");
  }
}

translateIncrementalBatch()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

// Using Replit's AI Integrations (no personal API key needed)
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface StrongEntry {
  strongNumber: string;
  language: string;
  lemma: string;
  kjvDef: string | null;
  strongsDef: string | null;
  portugueseDef: string | null;
}

async function translateBatch(entries: StrongEntry[]): Promise<Map<string, string>> {
  const translations = new Map<string, string>();
  
  // Prepare batch for translation
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

  const prompt = `Você é um tradutor especializado em textos bíblicos e teológicos. Traduza as seguintes definições do dicionário Strong's do inglês para português brasileiro. Mantenha termos técnicos teológicos apropriados.

Cada linha tem o formato: ÍNDICE|||DEFINIÇÃO_EM_INGLÊS

Retorne APENAS as traduções no formato: ÍNDICE|||TRADUÇÃO_EM_PORTUGUÊS

Definições para traduzir:
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
    const lines = translatedText.split('\n').filter(line => line.includes('|||'));
    
    lines.forEach(line => {
      const [idxStr, translation] = line.split('|||');
      const idx = parseInt(idxStr);
      if (!isNaN(idx) && translation && entries[idx]) {
        translations.set(entries[idx].strongNumber, translation.trim());
      }
    });

    return translations;
  } catch (error) {
    console.error("Erro na tradução:", error);
    return translations;
  }
}

async function translateAllEntries() {
  console.log("🌍 Iniciando tradução de todas as entradas Strong's para português brasileiro...\n");

  // Get all entries without Portuguese translation
  const entriesToTranslate = await db
    .select()
    .from(strongEntries)
    .where(sql`portuguese_def IS NULL`)
    .orderBy(strongEntries.strongNumber);

  console.log(`📊 Total de entradas para traduzir: ${entriesToTranslate.length}`);

  if (entriesToTranslate.length === 0) {
    console.log("✅ Todas as entradas já estão traduzidas!");
    return;
  }

  const batchSize = 50; // Processar 50 entradas por vez para maior velocidade
  let translated = 0;
  let failed = 0;

  for (let i = 0; i < entriesToTranslate.length; i += batchSize) {
    const batch = entriesToTranslate.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(entriesToTranslate.length / batchSize);

    console.log(`\n📦 Processando lote ${batchNum}/${totalBatches} (${batch.length} entradas)...`);

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
        console.log(`  ✅ Traduzidas: ${translations.size} entradas`);
      } else {
        console.log(`  ⚠️  Nenhuma tradução obtida neste lote`);
        failed += batch.length;
      }

      // Progress update
      const progress = ((i + batch.length) / entriesToTranslate.length * 100).toFixed(1);
      console.log(`  📈 Progresso geral: ${progress}% (${translated} traduzidas, ${failed} falhas)`);

      // Delay to avoid rate limits
      if (i + batchSize < entriesToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo entre lotes
      }

    } catch (error) {
      console.error(`  ❌ Erro no lote ${batchNum}:`, error);
      failed += batch.length;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 TRADUÇÃO CONCLUÍDA!");
  console.log("=".repeat(60));
  console.log(`✅ Entradas traduzidas com sucesso: ${translated}`);
  console.log(`❌ Entradas com falha: ${failed}`);
  console.log(`📊 Total processado: ${translated + failed}`);
  
  // Verify final count
  const finalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(strongEntries)
    .where(sql`portuguese_def IS NOT NULL`);
  
  console.log(`\n📚 Total de entradas com português no banco: ${finalCount[0].count}`);
}

translateAllEntries()
  .then(() => {
    console.log("\n✅ Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

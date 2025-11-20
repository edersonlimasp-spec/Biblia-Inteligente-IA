import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { sql } from "drizzle-orm";

async function estimateCost() {
  console.log("💰 CALCULANDO CUSTO DA TRADUÇÃO VIA OPENAI API\n");
  console.log("=".repeat(60));
  
  // Get entries without Portuguese
  const entries = await db
    .select()
    .from(strongEntries)
    .where(sql`portuguese_def IS NULL`)
    .limit(10); // Sample for estimation
  
  const totalWithoutPortuguese = await db
    .select({ count: sql<number>`count(*)` })
    .from(strongEntries)
    .where(sql`portuguese_def IS NULL`);
  
  const total = totalWithoutPortuguese[0].count;
  
  // Calculate average tokens per entry
  let totalInputChars = 0;
  let totalOutputChars = 0;
  
  entries.forEach(entry => {
    // Input: English definition + prompt
    const prompt = `Traduza para português brasileiro: ${entry.kjvDef || entry.strongsDef}`;
    totalInputChars += prompt.length;
    
    // Output: estimated Portuguese translation (similar size)
    totalOutputChars += (entry.kjvDef || entry.strongsDef || '').length;
  });
  
  const avgInputChars = totalInputChars / entries.length;
  const avgOutputChars = totalOutputChars / entries.length;
  
  // Tokens ≈ chars / 4 (conservative estimate)
  const avgInputTokens = Math.ceil(avgInputChars / 4);
  const avgOutputTokens = Math.ceil(avgOutputChars / 4);
  
  const totalInputTokens = avgInputTokens * total;
  const totalOutputTokens = avgOutputTokens * total;
  
  console.log(`📊 ESTATÍSTICAS:`);
  console.log(`   Entradas sem português: ${total.toLocaleString()}`);
  console.log(`   Tokens médios de entrada: ${avgInputTokens}`);
  console.log(`   Tokens médios de saída: ${avgOutputTokens}`);
  console.log(`\n📈 TOTAL ESTIMADO:`);
  console.log(`   Tokens de entrada: ${totalInputTokens.toLocaleString()}`);
  console.log(`   Tokens de saída: ${totalOutputTokens.toLocaleString()}`);
  
  // OpenAI pricing (GPT-4o-mini - best for translations)
  const inputCostPer1M = 0.150;  // $0.150 per 1M input tokens
  const outputCostPer1M = 0.600; // $0.600 per 1M output tokens
  
  const inputCost = (totalInputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (totalOutputTokens / 1_000_000) * outputCostPer1M;
  const totalCost = inputCost + outputCost;
  
  console.log(`\n💵 CUSTOS (GPT-4o-mini):`);
  console.log(`   Entrada: $${inputCost.toFixed(4)}`);
  console.log(`   Saída: $${outputCost.toFixed(4)}`);
  console.log(`   ─────────────────────`);
  console.log(`   TOTAL: $${totalCost.toFixed(2)} USD`);
  
  // Also show GPT-3.5-turbo pricing (cheaper alternative)
  const gpt35InputCostPer1M = 0.0005;
  const gpt35OutputCostPer1M = 0.0015;
  
  const gpt35InputCost = (totalInputTokens / 1_000_000) * gpt35InputCostPer1M;
  const gpt35OutputCost = (totalOutputTokens / 1_000_000) * gpt35OutputCostPer1M;
  const gpt35TotalCost = gpt35InputCost + gpt35OutputCost;
  
  console.log(`\n💵 CUSTOS (GPT-3.5-turbo) - Alternativa mais barata:`);
  console.log(`   Entrada: $${gpt35InputCost.toFixed(4)}`);
  console.log(`   Saída: $${gpt35OutputCost.toFixed(4)}`);
  console.log(`   ─────────────────────`);
  console.log(`   TOTAL: $${gpt35TotalCost.toFixed(2)} USD`);
  
  console.log("\n" + "=".repeat(60));
  console.log("⚠️  IMPORTANTE:");
  console.log("   - Estes são custos da OpenAI API (separados do ChatGPT)");
  console.log("   - Valores são estimativas baseadas em amostra");
  console.log("   - Tradução em lotes de 50 entradas por vez");
  console.log("   - Recomendo GPT-4o-mini para melhor qualidade");
  console.log("=".repeat(60));
  
  process.exit(0);
}

estimateCost().catch(console.error);

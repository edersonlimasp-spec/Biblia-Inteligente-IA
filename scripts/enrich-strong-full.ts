import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI();

const PRIORITY_STRONG_NUMBERS = [
  "G5287", // Hypostasis - substance (Hebrews 11:1)
  "G4102", // Pistis - faith
  "G1650", // Elenchos - evidence (Hebrews 11:1)
  "G4229", // Pragma - thing/matter
  "G26",   // Agape - love
  "G2316", // Theos - God
  "G3056", // Logos - Word
  "G4151", // Pneuma - Spirit
  "G5485", // Charis - Grace
  "G1680", // Elpis - Hope
  "G2222", // Zoe - Life
  "G225",  // Aletheia - Truth
  "G5457", // Phos - Light
  "G4991", // Soteria - Salvation
  "G2424", // Iesous - Jesus
  "G5547", // Christos - Christ
  "G932",  // Basileia - Kingdom
  "G3772", // Ouranos - Heaven
  "G266",  // Hamartia - Sin
  "G3341", // Metanoia - Repentance
  "G1343", // Dikaiosune - Righteousness
  "H430",  // Elohim - God
  "H3068", // YHWH - LORD
  "H7225", // Reshit - Beginning
  "H1254", // Bara - Create
  "H8064", // Shamayim - Heavens
  "H776",  // Erets - Earth
  "H7462", // Ra'ah - Shepherd
  "H2637", // Chaser - Lack
  "H1516", // Gay - Valley
  "H6757", // Tsalmaveth - Shadow of death
  "H2617", // Chesed - Loving-kindness
  "H530",  // Emunah - Faithfulness
];

interface EnrichedData {
  extendedDefinition: string;
  morphologicalInfo: string;
  synonymsRelated: string;
  verseReferences: string;
}

async function generateFullEnrichment(entry: {
  strongNumber: string;
  lemma: string;
  translit: string | null;
  language: string;
  kjvDef: string | null;
  strongsDef: string | null;
  portugueseDef: string | null;
  derivation: string | null;
}): Promise<EnrichedData> {
  const isHebrew = entry.language === "hebrew";
  const languageLabel = isHebrew ? "hebraico" : "grego";
  const testament = isHebrew ? "Antigo Testamento" : "Novo Testamento";
  
  const prompt = `Você é um lexicógrafo bíblico especializado em ${languageLabel} e teologia. Analise esta palavra do Dicionário Strong e forneça uma análise COMPLETA com 7 camadas de significado.

**Número Strong:** ${entry.strongNumber}
**Palavra Original (${languageLabel}):** ${entry.lemma}
**Transliteração:** ${entry.translit || "N/A"}
**Definição Inglês (KJV):** ${entry.kjvDef || "N/A"}
**Definição Strong:** ${entry.strongsDef || "N/A"}
**Derivação:** ${entry.derivation || "N/A"}

Responda em JSON com EXATAMENTE esta estrutura (sem markdown, apenas JSON puro):

{
  "extendedDefinition": "TEXTO LONGO (300-500 palavras) com 7 camadas: 1) Significado literal/etimológico, 2) Significado teológico primário, 3) Usos contextuais no ${testament}, 4) Nuances semânticas importantes, 5) Aplicação espiritual, 6) Conexões com outras palavras-chave bíblicas, 7) Relevância para a fé cristã hoje. Escreva em parágrafos fluidos, SEM marcadores ou bullets.",
  
  "morphologicalInfo": "Análise gramatical completa: classe de palavra (substantivo/verbo/etc), gênero, número, tempo verbal se aplicável, padrão de declinação/conjugação, raiz primitiva, formação da palavra, e como a estrutura gramatical afeta o significado teológico.",
  
  "synonymsRelated": "Lista de 5-10 palavras ${languageLabel}s relacionadas com seus números Strong, significados e distinções teológicas. Formato: Palavra1 (Gxxxx) = significado e distinção; Palavra2 (Gxxxx) = significado e distinção; etc.",
  
  "verseReferences": "10-15 referências bíblicas-chave onde esta palavra aparece, agrupadas por tema. Formato: TEMA: Ref 1:1, Ref 2:2; OUTRO TEMA: Ref 3:3, etc. Inclua passagens do ${testament} mais conhecidas."
}

IMPORTANTE: Responda APENAS com o JSON, sem texto antes ou depois. Não use markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um lexicógrafo bíblico acadêmico. Responda sempre em português brasileiro. Forneça APENAS JSON válido sem markdown." },
      { role: "user", content: prompt }
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    return {
      extendedDefinition: parsed.extendedDefinition || "",
      morphologicalInfo: parsed.morphologicalInfo || "",
      synonymsRelated: parsed.synonymsRelated || "",
      verseReferences: parsed.verseReferences || "",
    };
  } catch (e) {
    console.error(`Failed to parse JSON for ${entry.strongNumber}:`, content);
    return {
      extendedDefinition: content,
      morphologicalInfo: "",
      synonymsRelated: "",
      verseReferences: "",
    };
  }
}

async function enrichStrongFull() {
  console.log("🔥 Starting FULL Strong's Dictionary enrichment with 7 layers...\n");
  
  let enrichedCount = 0;
  let errorCount = 0;
  
  console.log(`📋 Processing ${PRIORITY_STRONG_NUMBERS.length} priority terms...\n`);
  
  for (const strongNumber of PRIORITY_STRONG_NUMBERS) {
    try {
      const [entry] = await db
        .select()
        .from(strongEntries)
        .where(eq(strongEntries.strongNumber, strongNumber))
        .limit(1);
      
      if (!entry) {
        console.log(`⚠️  ${strongNumber}: Not found in database, skipping`);
        continue;
      }
      
      const needsEnrichment = !entry.extendedDefinition || 
                              !entry.morphologicalInfo || 
                              !entry.synonymsRelated ||
                              !entry.verseReferences;
      
      if (!needsEnrichment) {
        console.log(`✓  ${strongNumber}: Already fully enriched, skipping`);
        continue;
      }
      
      console.log(`🔄 ${strongNumber} (${entry.lemma}): Generating full enrichment...`);
      
      const enriched = await generateFullEnrichment({
        strongNumber: entry.strongNumber,
        lemma: entry.lemma,
        translit: entry.translit,
        language: entry.language,
        kjvDef: entry.kjvDef,
        strongsDef: entry.strongsDef,
        portugueseDef: entry.portugueseDef,
        derivation: entry.derivation,
      });
      
      await db
        .update(strongEntries)
        .set({
          extendedDefinition: enriched.extendedDefinition || entry.extendedDefinition,
          morphologicalInfo: enriched.morphologicalInfo,
          synonymsRelated: enriched.synonymsRelated,
          verseReferences: enriched.verseReferences,
          aiGenerated: true,
        })
        .where(eq(strongEntries.strongNumber, strongNumber));
      
      enrichedCount++;
      console.log(`✅ ${strongNumber}: Full enrichment saved`);
      console.log(`   - Extended: ${enriched.extendedDefinition.length} chars`);
      console.log(`   - Morphology: ${enriched.morphologicalInfo.length} chars`);
      console.log(`   - Synonyms: ${enriched.synonymsRelated.length} chars`);
      console.log(`   - Verses: ${enriched.verseReferences.length} chars`);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      errorCount++;
      console.error(`❌ ${strongNumber}: Error -`, error);
    }
  }
  
  console.log(`\n🎉 Full enrichment complete!`);
  console.log(`   ✅ Enriched: ${enrichedCount} entries`);
  console.log(`   ❌ Errors: ${errorCount} entries`);
}

enrichStrongFull()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

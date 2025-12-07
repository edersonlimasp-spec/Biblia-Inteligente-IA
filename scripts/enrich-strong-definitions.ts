import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { eq, isNull, sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI();

// Priority Strong numbers - most important biblical terms to enrich first
const PRIORITY_STRONG_NUMBERS = [
  // Genesis 1 terms (user request)
  "H430",   // Elohim - God
  "H216",   // Or - Light  
  "H2822",  // Choshek - Darkness
  "H922",   // Bohu - Void/Emptiness
  "H7225",  // Reshith - Beginning
  "H8064",  // Shamayim - Heavens
  "H776",   // Eretz - Earth
  "H8414",  // Tohu - Formless
  "H7307",  // Ruach - Spirit/Wind
  "H4325",  // Mayim - Waters
  
  // Key Greek NT terms
  "G2316",  // Theos - God
  "G3056",  // Logos - Word
  "G4151",  // Pneuma - Spirit
  "G26",    // Agape - Love
  "G4102",  // Pistis - Faith
  "G5485",  // Charis - Grace
  "G1680",  // Elpis - Hope
  "G2222",  // Zoe - Life
  "G225",   // Aletheia - Truth
  "G5457",  // Phos - Light
  "G4991",  // Soteria - Salvation
  "G2424",  // Iesous - Jesus
  "G5547",  // Christos - Christ
  "G932",   // Basileia - Kingdom
  "G3772",  // Ouranos - Heaven
  "G2588",  // Kardia - Heart
  "G5590",  // Psuche - Soul
  "G266",   // Hamartia - Sin
  "G3341",  // Metanoia - Repentance
  "G1343",  // Dikaiosune - Righteousness
  
  // Key Hebrew OT terms
  "H3068",  // YHWH - LORD
  "H136",   // Adonai - Lord
  "H410",   // El - God
  "H7225",  // Reshith - Beginning
  "H1254",  // Bara - Create
  "H1285",  // Berith - Covenant
  "H2617",  // Chesed - Loving-kindness
  "H6944",  // Qodesh - Holy
  "H6663",  // Tsadaq - Righteous
  "H3444",  // Yeshuah - Salvation
  "H4899",  // Mashiach - Messiah
  "H8451",  // Torah - Law
  "H5315",  // Nephesh - Soul
  "H3820",  // Leb - Heart
  "H530",   // Emunah - Faith/Faithfulness
];

async function generateExtendedDefinition(entry: {
  strongNumber: string;
  lemma: string;
  translit: string | null;
  language: string;
  kjvDef: string | null;
  strongsDef: string | null;
  portugueseDef: string | null;
  derivation: string | null;
}): Promise<string> {
  const isHebrew = entry.language === "hebrew";
  const languageLabel = isHebrew ? "hebraico" : "grego";
  
  const prompt = `Você é um teólogo e lexicógrafo bíblico especializado em ${languageLabel}. 

Gere uma explicação teológica detalhada em português brasileiro para a seguinte palavra do dicionário Strong:

**Número Strong:** ${entry.strongNumber}
**Palavra Original (${languageLabel}):** ${entry.lemma}
**Transliteração:** ${entry.translit || "N/A"}
**Definição em Inglês (KJV):** ${entry.kjvDef || "N/A"}
**Definição Strong:** ${entry.strongsDef || "N/A"}
**Derivação:** ${entry.derivation || "N/A"}

Sua resposta deve incluir:
1. **Significado principal** - O significado essencial da palavra em 1-2 frases.
2. **Contexto bíblico** - Como esta palavra é usada nas Escrituras, com exemplos de passagens importantes.
3. **Nuances teológicas** - Aspectos teológicos importantes que esta palavra transmite.
4. **Uso na tradição judaico-cristã** - Como esta palavra foi entendida ao longo da história da fé.

Formato: Escreva em parágrafos fluidos, sem usar marcações markdown como asteriscos ou hashes. Use um tom acadêmico mas acessível. Limite: 200-350 palavras.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um teólogo e lexicógrafo bíblico especializado. Responda sempre em português brasileiro." },
      { role: "user", content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "";
}

async function enrichStrongDefinitions() {
  console.log("🔥 Starting Strong's Dictionary enrichment with AI...\n");
  
  let enrichedCount = 0;
  let errorCount = 0;
  
  // Process priority terms first
  console.log(`📋 Processing ${PRIORITY_STRONG_NUMBERS.length} priority terms...\n`);
  
  for (const strongNumber of PRIORITY_STRONG_NUMBERS) {
    try {
      // Get entry from database
      const [entry] = await db
        .select()
        .from(strongEntries)
        .where(eq(strongEntries.strongNumber, strongNumber))
        .limit(1);
      
      if (!entry) {
        console.log(`⚠️  ${strongNumber}: Not found in database, skipping`);
        continue;
      }
      
      // Skip if already has extended definition
      if (entry.extendedDefinition) {
        console.log(`✓  ${strongNumber}: Already has extended definition, skipping`);
        continue;
      }
      
      console.log(`🔄 ${strongNumber} (${entry.lemma}): Generating extended definition...`);
      
      const extendedDef = await generateExtendedDefinition({
        strongNumber: entry.strongNumber,
        lemma: entry.lemma,
        translit: entry.translit,
        language: entry.language,
        kjvDef: entry.kjvDef,
        strongsDef: entry.strongsDef,
        portugueseDef: entry.portugueseDef,
        derivation: entry.derivation,
      });
      
      // Update database
      await db
        .update(strongEntries)
        .set({ extendedDefinition: extendedDef })
        .where(eq(strongEntries.strongNumber, strongNumber));
      
      enrichedCount++;
      console.log(`✅ ${strongNumber}: Extended definition saved (${extendedDef.length} chars)`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      errorCount++;
      console.error(`❌ ${strongNumber}: Error -`, error);
    }
  }
  
  console.log(`\n🎉 Enrichment complete!`);
  console.log(`   ✅ Enriched: ${enrichedCount} entries`);
  console.log(`   ❌ Errors: ${errorCount} entries`);
  console.log(`   ⏭️  Skipped: ${PRIORITY_STRONG_NUMBERS.length - enrichedCount - errorCount} entries`);
}

// Run enrichment
enrichStrongDefinitions()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

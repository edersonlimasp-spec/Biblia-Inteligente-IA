import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";

// Portuguese translations for common Hebrew terms
const portugueseTranslations: Record<string, string> = {
  "God (in plural form)": "Deus (forma plural - Elohim)",
  "Jehovah, the Lord": "Jeová, o SENHOR",
  "lord, master": "senhor, mestre",
  "covenant, league": "aliança, pacto",
  "people": "povo",
  "land, earth": "terra",
  "house": "casa",
  "king": "rei",
  "priest": "sacerdote",
  "altar": "altar",
  "sacrifice": "sacrifício",
  "temple": "templo",
  "tent, tabernacle": "tenda, tabernáculo",
  "ark": "arca",
  "commandment": "mandamento",
  "Torah, law": "Torá, lei",
  "blessing": "bênção",
  "curse": "maldição",
  "servant": "servo",
  "hand": "mão",
  "eye": "olho",
  "ear": "ouvido",
  "mouth": "boca",
  "voice": "voz",
  "name": "nome",
  "day": "dia",
  "night": "noite",
  "year": "ano",
  "mountain": "montanha",
  "city": "cidade",
  "gate": "porta, portão",
  "way, road": "caminho",
  "battle, war": "batalha, guerra",
  "Israel": "Israel",
  "Jerusalem": "Jerusalém",
  "Egypt": "Egito",
  "Babylon": "Babilônia",
  "father": "pai",
  "mother": "mãe",
  "son": "filho",
  "daughter": "filha",
  "heaven": "céu",
  "water": "água",
  "bread": "pão",
  "life": "vida",
  "death": "morte",
  "spirit": "espírito",
  "soul": "alma",
  "heart": "coração",
  "truth": "verdade",
  "peace": "paz (Shalom)",
  "prophet": "profeta",
  "righteous": "justo",
  "love": "amor",
  "grace": "graça",
  "mercy": "misericórdia",
};

function translateDefinition(englishDef: string): string | null {
  if (!englishDef) return null;
  const normalized = englishDef.trim();
  return portugueseTranslations[normalized] || null;
}

async function importHebrew() {
  console.log("🔥 Starting Hebrew Strong's Dictionary import from XML...");
  
  const hebrewPath = "/tmp/strongs/hebrew/StrongHebrewG.xml";
  
  if (!fs.existsSync(hebrewPath)) {
    console.error("❌ Hebrew dictionary file not found!");
    process.exit(1);
  }
  
  console.log("📖 Reading Hebrew XML file...");
  const xmlContent = fs.readFileSync(hebrewPath, 'utf-8');
  
  console.log("📝 Parsing entries...");
  
  // Match each <div type="entry" n="..."> ... </div> block
  const entryRegex = /<div type="entry" n="(\d+)">([\s\S]*?)<\/div>/g;
  const entries: Array<{
    number: string;
    lemma: string;
    translit: string;
    xlit: string;
    definition: string;
  }> = [];
  
  let match;
  while ((match = entryRegex.exec(xmlContent)) !== null) {
    const number = `H${match[1]}`;
    const entryContent = match[2];
    
    // Extract lemma (Hebrew word)
    const lemmaMatch = entryContent.match(/<w[^>]+lemma="([^"]+)"/);
    const lemma = lemmaMatch ? lemmaMatch[1] : "";
    
    // Extract transliteration
    const xlitMatch = entryContent.match(/xlit="([^"]+)"/);
    const xlit = xlitMatch ? xlitMatch[1] : null;
    
    // Extract another transliteration format if available
    const translitMatch = entryContent.match(/POS="([^"]+)"/);
    const translit = translitMatch ? translitMatch[1] : xlit;
    
    // Extract definition from <note type="explanation">
    const defMatch = entryContent.match(/<note type="explanation"[^>]*>([\s\S]*?)<\/note>/);
    let definition = "";
    if (defMatch) {
      // Remove HTML tags
      definition = defMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    // If no explanation, try to get from translation note
    if (!definition) {
      const transMatch = entryContent.match(/<note type="translation"[^>]*>([\s\S]*?)<\/note>/);
      if (transMatch) {
        definition = transMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    }
    
    entries.push({
      number,
      lemma,
      translit: translit || "",
      xlit: xlit || "",
      definition
    });
  }
  
  console.log(`✅ Found ${entries.length} Hebrew entries`);
  
  // Clear existing Hebrew entries
  console.log("🗑️  Clearing existing Hebrew entries...");
  await db.delete(strongEntries).where(sql`language = 'hebrew'`);
  
  // Import in batches
  console.log("📝 Importing Hebrew entries...");
  let importedCount = 0;
  let translatedCount = 0;
  
  const batchSize = 100;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const values = batch.map((entry) => {
      const portugueseDef = translateDefinition(entry.definition);
      if (portugueseDef) translatedCount++;
      
      return {
        strongNumber: entry.number,
        language: "hebrew",
        lemma: entry.lemma,
        translit: entry.translit || null,
        xlit: entry.xlit || null,
        pron: null,
        kjvDef: entry.definition || null,
        portugueseDef: portugueseDef,
        strongsDef: entry.definition || null,
        derivation: null,
      };
    });
    
    await db.insert(strongEntries).values(values);
    importedCount += batch.length;
    
    if (importedCount % 500 === 0) {
      console.log(`  ✅ Imported ${importedCount} entries (${translatedCount} with Portuguese translation)...`);
    }
  }
  
  console.log(`✅ Completed Hebrew import: ${entries.length} entries`);
  console.log(`\n🎉 SUCCESS! Imported ${importedCount} Hebrew Strong's entries`);
  console.log(`📊 ${translatedCount} entries have Portuguese translations`);
  console.log(`📊 ${importedCount - translatedCount} entries remain in English`);
}

importHebrew()
  .then(() => {
    console.log("✅ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  });

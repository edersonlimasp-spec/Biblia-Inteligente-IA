import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import * as fs from "fs";

// Portuguese translations for common terms (expandable)
const portugueseTranslations: Record<string, string> = {
  "God, god": "Deus, deus",
  "to love": "amar",
  "love, charity": "amor, caridade",
  "word, Word, saying, speech": "palavra, Verbo, dito, discurso",
  "spirit, Spirit, wind, breath": "espírito, Espírito, vento, respiração",
  "Lord, lord, master, sir": "Senhor, senhor, mestre, senhor",
  "Christ, anointed": "Cristo, ungido",
  "Jesus": "Jesus",
  "son": "filho",
  "man, mankind": "homem, humanidade",
  "life": "vida",
  "truth": "verdade",
  "light": "luz",
  "darkness": "trevas, escuridão",
  "faith, belief, trust": "fé, crença, confiança",
  "grace, favor, thanks": "graça, favor, graças",
  "peace": "paz",
  "glory, splendor": "glória, esplendor",
  "power, ability, might": "poder, capacidade, força",
  "kingdom, reign": "reino",
  "heaven, sky": "céu",
  "earth": "terra",
  "church, assembly": "igreja, assembleia",
  "brother": "irmão",
  "father": "pai",
  "mother": "mãe",
  "heart": "coração",
  "soul": "alma",
  "holy, saint": "santo",
  "righteous, just": "justo",
  "righteousness, justice": "justiça",
  "sin": "pecado",
  "to save, deliver": "salvar, livrar",
  "salvation, deliverance": "salvação, libertação",
  "gospel": "evangelho",
  "law": "lei",
  "covenant": "aliança",
  "witness": "testemunha",
  "prophet": "profeta",
  "apostle, messenger": "apóstolo, mensageiro",
  "to believe": "crer, acreditar",
  "to pray": "orar",
  "to know": "conhecer, saber",
  "to come": "vir",
  "to go": "ir",
  "to say, speak": "dizer, falar",
  "to see": "ver",
  "to hear": "ouvir",
  "to do, make": "fazer",
  "to give": "dar",
  "to receive": "receber",
  "to write": "escrever",
  "to read": "ler",
  "to teach": "ensinar",
  "to preach": "pregar",
  "to baptize": "batizar",
  "water": "água",
  "bread": "pão",
  "wine": "vinho",
  "blood": "sangue",
  "flesh": "carne",
  "body": "corpo",
  "cross": "cruz",
  "resurrection": "ressurreição",
  "death": "morte",
  "eternal": "eterno",
  "judgment": "juízo, julgamento",
  "mercy": "misericórdia",
  "compassion": "compaixão",
  "forgiveness": "perdão",
  "world, universe": "mundo, universo",
  "but, except, however": "mas, exceto, contudo",
  "to repent, change mind": "arrepender-se, mudar de ideia",
  "authority, power, right": "autoridade, poder, direito",
  "hope, expectation": "esperança, expectativa",
};

function translateDefinition(englishDef: string): string | null {
  if (!englishDef) return null;
  const normalized = englishDef.trim();
  return portugueseTranslations[normalized] || null;
}

function parseStrongsJS(filePath: string): Record<string, any> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/var\s+\w+\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    throw new Error(`Could not parse JSON from ${filePath}`);
  }
  return JSON.parse(match[1]);
}

async function importGreek() {
  console.log("🔥 Starting Greek Strong's Dictionary import...");
  
  const greekPath = "/tmp/strongs/greek/strongs-greek-dictionary.js";
  
  if (!fs.existsSync(greekPath)) {
    console.error("❌ Greek dictionary file not found!");
    process.exit(1);
  }
  
  console.log("📖 Parsing Greek dictionary...");
  const greekData = parseStrongsJS(greekPath);
  const greekEntries = Object.entries(greekData);
  console.log(`✅ Found ${greekEntries.length} Greek entries`);
  
  // Clear existing Greek entries
  console.log("🗑️  Clearing existing Greek entries...");
  await db.delete(strongEntries).where(sql`language = 'greek'`);
  
  // Import Greek entries
  console.log("📝 Importing Greek entries...");
  let importedCount = 0;
  let translatedCount = 0;
  
  const batchSize = 100;
  for (let i = 0; i < greekEntries.length; i += batchSize) {
    const batch = greekEntries.slice(i, i + batchSize);
    const values = batch.map(([number, entry]) => {
      const portugueseDef = translateDefinition(entry.kjv_def || "");
      if (portugueseDef) translatedCount++;
      
      return {
        strongNumber: number,
        language: "greek",
        lemma: entry.lemma || "",
        translit: entry.translit || null,
        xlit: null,
        pron: null,
        kjvDef: entry.kjv_def || null,
        portugueseDef: portugueseDef,
        strongsDef: entry.strongs_def || null,
        derivation: entry.derivation || null,
      };
    });
    
    await db.insert(strongEntries).values(values);
    importedCount += batch.length;
    
    if (importedCount % 500 === 0) {
      console.log(`  ✅ Imported ${importedCount} entries (${translatedCount} with Portuguese translation)...`);
    }
  }
  
  console.log(`✅ Completed Greek import: ${greekEntries.length} entries`);
  console.log(`\n🎉 SUCCESS! Imported ${importedCount} Greek Strong's entries`);
  console.log(`📊 ${translatedCount} entries have Portuguese translations`);
  console.log(`📊 ${importedCount - translatedCount} entries remain in English`);
}

import { sql } from "drizzle-orm";

importGreek()
  .then(() => {
    console.log("✅ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  });

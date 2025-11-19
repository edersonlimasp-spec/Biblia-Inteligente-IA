import { db } from "../server/db";
import { strongEntries } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

// Portuguese translations for common terms (expandable)
const portugueseTranslations: Record<string, string> = {
  // Common Greek words
  "God, god": "Deus, deus",
  "to love": "amar",
  "love, charity": "amor, caridade",
  "word, Word": "palavra, Verbo",
  "spirit, Spirit, wind, breath": "espírito, Espírito, vento, respiração",
  "Lord, lord, master": "Senhor, senhor, mestre",
  "Christ": "Cristo",
  "Jesus": "Jesus",
  "son": "filho",
  "man, mankind": "homem, humanidade",
  "life": "vida",
  "truth": "verdade",
  "light": "luz",
  "darkness": "trevas, escuridão",
  "faith": "fé",
  "grace": "graça",
  "peace": "paz",
  "glory": "glória",
  "power": "poder",
  "kingdom": "reino",
  "heaven": "céu",
  "earth": "terra",
  "church": "igreja",
  "brother": "irmão",
  "father": "pai",
  "mother": "mãe",
  "heart": "coração",
  "soul": "alma",
  "holy": "santo",
  "righteous, just": "justo",
  "sin": "pecado",
  "salvation": "salvação",
  "gospel": "evangelho",
  "law": "lei",
  "covenant": "aliança",
  "witness": "testemunha",
  "prophet": "profeta",
  "angel": "anjo",
  "disciple": "discípulo",
  "apostle": "apóstolo",
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
  
  // Common Hebrew words
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
};

// Function to translate English definition to Portuguese
function translateDefinition(englishDef: string): string | null {
  if (!englishDef) return null;
  
  // Check for exact match in our translation dictionary
  const normalized = englishDef.trim();
  if (portugueseTranslations[normalized]) {
    return portugueseTranslations[normalized];
  }
  
  // For now, return null for untranslated terms
  // In future, we can add AI translation or crowd-sourced translations
  return null;
}

// Parse JavaScript file containing Strong's data
function parseStrongsJS(filePath: string): Record<string, any> {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract the JSON object from the JS file
  // Format: var strongsGreekDictionary = {...}; module.exports = ...
  const match = content.match(/var\s+\w+\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    throw new Error(`Could not parse JSON from ${filePath}`);
  }
  
  return JSON.parse(match[1]);
}

async function importStrongs() {
  console.log("🔥 Starting full Strong's Dictionary import...");
  
  const greekPath = "/tmp/strongs/greek/strongs-greek-dictionary.js";
  const hebrewPath = "/tmp/strongs/hebrew/strongs-hebrew-dictionary.js";
  
  // Check if files exist
  if (!fs.existsSync(greekPath) || !fs.existsSync(hebrewPath)) {
    console.error("❌ Strong's dictionary files not found!");
    console.log("Please run: cd /tmp && git clone https://github.com/openscriptures/strongs.git");
    process.exit(1);
  }
  
  console.log("📖 Parsing Greek dictionary...");
  const greekData = parseStrongsJS(greekPath);
  const greekEntries = Object.entries(greekData);
  console.log(`✅ Found ${greekEntries.length} Greek entries`);
  
  console.log("📖 Parsing Hebrew dictionary...");
  const hebrewData = parseStrongsJS(hebrewPath);
  const hebrewEntries = Object.entries(hebrewData);
  console.log(`✅ Found ${hebrewEntries.length} Hebrew entries`);
  
  // Clear existing entries
  console.log("🗑️  Clearing existing Strong's entries...");
  await db.delete(strongEntries);
  
  // Import Greek entries
  console.log("📝 Importing Greek entries...");
  let importedCount = 0;
  let translatedCount = 0;
  
  for (const [number, entry] of greekEntries) {
    const portugueseDef = translateDefinition(entry.kjv_def || "");
    if (portugueseDef) translatedCount++;
    
    await db.insert(strongEntries).values({
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
    });
    
    importedCount++;
    
    if (importedCount % 500 === 0) {
      console.log(`  ✅ Imported ${importedCount} entries (${translatedCount} with Portuguese translation)...`);
    }
  }
  
  console.log(`✅ Completed Greek import: ${greekEntries.length} entries`);
  
  // Import Hebrew entries
  console.log("📝 Importing Hebrew entries...");
  
  for (const [number, entry] of hebrewEntries) {
    const portugueseDef = translateDefinition(entry.kjv_def || "");
    if (portugueseDef) translatedCount++;
    
    await db.insert(strongEntries).values({
      strongNumber: number,
      language: "hebrew",
      lemma: entry.lemma || "",
      translit: entry.translit || null,
      xlit: entry.xlit || null,
      pron: entry.pron || null,
      kjvDef: entry.kjv_def || null,
      portugueseDef: portugueseDef,
      strongsDef: entry.strongs_def || null,
      derivation: entry.derivation || null,
    });
    
    importedCount++;
    
    if (importedCount % 500 === 0) {
      console.log(`  ✅ Imported ${importedCount} entries (${translatedCount} with Portuguese translation)...`);
    }
  }
  
  console.log(`✅ Completed Hebrew import: ${hebrewEntries.length} entries`);
  console.log(`\n🎉 SUCCESS! Imported ${importedCount} total Strong's entries`);
  console.log(`📊 ${translatedCount} entries have Portuguese translations`);
  console.log(`📊 ${importedCount - translatedCount} entries remain in English (expandable in future)`);
}

// Run import
importStrongs()
  .then(() => {
    console.log("✅ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  });

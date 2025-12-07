import { db } from "../server/db";
import { bibleWords } from "../shared/schema";

const GENESIS_1_WORD_MAPPINGS = [
  { book: "gen", chapter: 1, verse: 1, word_position: 1, original_word: "בְּרֵאשִׁית", strong_number: "H7225", gloss: "No princípio" },
  { book: "gen", chapter: 1, verse: 1, word_position: 2, original_word: "בָּרָא", strong_number: "H1254", gloss: "criou" },
  { book: "gen", chapter: 1, verse: 1, word_position: 3, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 1, word_position: 4, original_word: "אֵת", strong_number: "H853", gloss: "os" },
  { book: "gen", chapter: 1, verse: 1, word_position: 5, original_word: "הַשָּׁמַיִם", strong_number: "H8064", gloss: "céus" },
  { book: "gen", chapter: 1, verse: 1, word_position: 6, original_word: "וְאֵת", strong_number: "H853", gloss: "e a" },
  { book: "gen", chapter: 1, verse: 1, word_position: 7, original_word: "הָאָרֶץ", strong_number: "H776", gloss: "terra" },
  
  { book: "gen", chapter: 1, verse: 2, word_position: 1, original_word: "וְהָאָרֶץ", strong_number: "H776", gloss: "E a terra" },
  { book: "gen", chapter: 1, verse: 2, word_position: 2, original_word: "הָיְתָה", strong_number: "H1961", gloss: "era" },
  { book: "gen", chapter: 1, verse: 2, word_position: 3, original_word: "תֹהוּ", strong_number: "H8414", gloss: "sem forma" },
  { book: "gen", chapter: 1, verse: 2, word_position: 4, original_word: "וָבֹהוּ", strong_number: "H922", gloss: "e vazia" },
  { book: "gen", chapter: 1, verse: 2, word_position: 5, original_word: "וְחֹשֶׁךְ", strong_number: "H2822", gloss: "e havia trevas" },
  { book: "gen", chapter: 1, verse: 2, word_position: 6, original_word: "עַל", strong_number: "H5921", gloss: "sobre" },
  { book: "gen", chapter: 1, verse: 2, word_position: 7, original_word: "פְּנֵי", strong_number: "H6440", gloss: "a face" },
  { book: "gen", chapter: 1, verse: 2, word_position: 8, original_word: "תְהוֹם", strong_number: "H8415", gloss: "do abismo" },
  { book: "gen", chapter: 1, verse: 2, word_position: 9, original_word: "וְרוּחַ", strong_number: "H7307", gloss: "e o Espírito" },
  { book: "gen", chapter: 1, verse: 2, word_position: 10, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "de Deus" },
  { book: "gen", chapter: 1, verse: 2, word_position: 11, original_word: "מְרַחֶפֶת", strong_number: "H7363", gloss: "se movia" },
  { book: "gen", chapter: 1, verse: 2, word_position: 12, original_word: "עַל", strong_number: "H5921", gloss: "sobre" },
  { book: "gen", chapter: 1, verse: 2, word_position: 13, original_word: "פְּנֵי", strong_number: "H6440", gloss: "a face" },
  { book: "gen", chapter: 1, verse: 2, word_position: 14, original_word: "הַמָּיִם", strong_number: "H4325", gloss: "das águas" },
  
  { book: "gen", chapter: 1, verse: 3, word_position: 1, original_word: "וַיֹּאמֶר", strong_number: "H559", gloss: "E disse" },
  { book: "gen", chapter: 1, verse: 3, word_position: 2, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 3, word_position: 3, original_word: "יְהִי", strong_number: "H1961", gloss: "Haja" },
  { book: "gen", chapter: 1, verse: 3, word_position: 4, original_word: "אוֹר", strong_number: "H216", gloss: "luz" },
  { book: "gen", chapter: 1, verse: 3, word_position: 5, original_word: "וַיְהִי", strong_number: "H1961", gloss: "e houve" },
  { book: "gen", chapter: 1, verse: 3, word_position: 6, original_word: "אוֹר", strong_number: "H216", gloss: "luz" },
  
  { book: "gen", chapter: 1, verse: 4, word_position: 1, original_word: "וַיַּרְא", strong_number: "H7200", gloss: "E viu" },
  { book: "gen", chapter: 1, verse: 4, word_position: 2, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 4, word_position: 3, original_word: "אֶת", strong_number: "H853", gloss: "a" },
  { book: "gen", chapter: 1, verse: 4, word_position: 4, original_word: "הָאוֹר", strong_number: "H216", gloss: "luz" },
  { book: "gen", chapter: 1, verse: 4, word_position: 5, original_word: "כִּי", strong_number: "H3588", gloss: "que" },
  { book: "gen", chapter: 1, verse: 4, word_position: 6, original_word: "טוֹב", strong_number: "H2896", gloss: "era boa" },
  { book: "gen", chapter: 1, verse: 4, word_position: 7, original_word: "וַיַּבְדֵּל", strong_number: "H914", gloss: "e separou" },
  { book: "gen", chapter: 1, verse: 4, word_position: 8, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 4, word_position: 9, original_word: "בֵּין", strong_number: "H996", gloss: "entre" },
  { book: "gen", chapter: 1, verse: 4, word_position: 10, original_word: "הָאוֹר", strong_number: "H216", gloss: "a luz" },
  { book: "gen", chapter: 1, verse: 4, word_position: 11, original_word: "וּבֵין", strong_number: "H996", gloss: "e entre" },
  { book: "gen", chapter: 1, verse: 4, word_position: 12, original_word: "הַחֹשֶׁךְ", strong_number: "H2822", gloss: "as trevas" },
  
  { book: "gen", chapter: 1, verse: 5, word_position: 1, original_word: "וַיִּקְרָא", strong_number: "H7121", gloss: "E chamou" },
  { book: "gen", chapter: 1, verse: 5, word_position: 2, original_word: "אֱלֹהִים", strong_number: "H430", gloss: "Deus" },
  { book: "gen", chapter: 1, verse: 5, word_position: 3, original_word: "לָאוֹר", strong_number: "H216", gloss: "à luz" },
  { book: "gen", chapter: 1, verse: 5, word_position: 4, original_word: "יוֹם", strong_number: "H3117", gloss: "Dia" },
  { book: "gen", chapter: 1, verse: 5, word_position: 5, original_word: "וְלַחֹשֶׁךְ", strong_number: "H2822", gloss: "e às trevas" },
  { book: "gen", chapter: 1, verse: 5, word_position: 6, original_word: "קָרָא", strong_number: "H7121", gloss: "chamou" },
  { book: "gen", chapter: 1, verse: 5, word_position: 7, original_word: "לָיְלָה", strong_number: "H3915", gloss: "Noite" },
];

async function seedBibleWords() {
  console.log("🌱 Iniciando seed de bible_words para Gênesis 1...");
  
  let inserted = 0;
  
  for (const mapping of GENESIS_1_WORD_MAPPINGS) {
    try {
      await db.insert(bibleWords).values({
        id: `${mapping.book}-${mapping.chapter}-${mapping.verse}-${mapping.word_position}`,
        book: mapping.book,
        chapter: mapping.chapter,
        verse: mapping.verse,
        wordPosition: mapping.word_position,
        originalWord: mapping.original_word,
        strongNumber: mapping.strong_number,
        gloss: mapping.gloss,
      }).onConflictDoNothing();
      inserted++;
    } catch (error) {
      console.error(`Erro ao inserir ${mapping.gloss}:`, error);
    }
  }
  
  console.log(`✅ ${inserted} mapeamentos inseridos para Gênesis 1`);
  console.log("\n📋 Mapeamentos principais:");
  console.log("  - Gn 1:1 'Deus' → H430 (Elohim)");
  console.log("  - Gn 1:2 'trevas' → H2822 (choshek)");
  console.log("  - Gn 1:2 'vazio' → H922 (bohu)");
  console.log("  - Gn 1:3 'luz' → H216 (or)");
  
  process.exit(0);
}

seedBibleWords().catch(console.error);

// Hebrew Strong's Dictionary - Sample entries for demonstration
// Full dictionary would contain all 8,674 Hebrew/Aramaic entries

export interface StrongEntry {
  number: string;
  word: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  kjvUsage: string;
}

export const hebrewStrongs: StrongEntry[] = [
  {
    number: "H1",
    word: "אָב",
    transliteration: "ab",
    pronunciation: "awb",
    definition: "pai, em sentido literal e imediato, ou figurado e remoto",
    kjvUsage: "chefe, (ante-)passado, ×patrimônio, familia, pai, fatherless, ×paterno, patrimônio, principal"
  },
  {
    number: "H430",
    word: "אֱלֹהִים",
    transliteration: "elohim",
    pronunciation: "el-o-heem'",
    definition: "deuses no sentido comum; mas especificamente usado (no plural, assim como especialmente com o artigo) do Deus supremo; ocasionalmente aplicado por via de deferência a magistrados; e algumas vezes como um superlativo",
    kjvUsage: "anjos, ×excessivo, Deus (deuses), deus (deuses), deusa, divino, grande, ídolo, juiz, poderoso"
  },
  {
    number: "H3068",
    word: "יְהֹוָה",
    transliteration: "Yᵉhōvâh",
    pronunciation: "yeh-ho-vaw'",
    definition: "o Ser Auto-Existente ou Eterno; Jeová, nome nacional judaico de Deus",
    kjvUsage: "Jeová, o Senhor"
  },
  {
    number: "H776",
    word: "אֶרֶץ",
    transliteration: "erets",
    pronunciation: "eh'-rets",
    definition: "a terra (em grande ou pequena escala, inteira ou não); por implicação, território, país, selvagem; também solo, chão",
    kjvUsage: "região, país, terra, campo, chão, países, mundo, terra"
  },
  {
    number: "H8064",
    word: "שָׁמַיִם",
    transliteration: "shamayim",
    pronunciation: "shaw-mah'-yim",
    definition: "dual de uma raiz não utilizada significando ser elevado; o céu (como elevado); por extensão, o céu, éter; algumas vezes usado de forma figurativa",
    kjvUsage: "ar, ×astrólogo, céu(s)"
  },
  {
    number: "H1254",
    word: "בָּרָא",
    transliteration: "bara",
    pronunciation: "baw-raw'",
    definition: "(absolutamente) criar; (qualificado) cortar (uma forma), selecionar, alimentar (como formativo ou processo), sempre de atividade divina, com implicação de absoluta novidade",
    kjvUsage: "escolher, criar (criador), cortar, despachar, fazer (gordo)"
  },
  {
    number: "H7307",
    word: "רוּחַ",
    transliteration: "ruwach",
    pronunciation: "roo'-akh",
    definition: "vento; por semelhança respiração, isto é, uma exalação sensível (ou mesmo violenta); figurativamente, vida, raiva, insustancialidade; por extensão, uma região do céu; por semelhança espírito, mas apenas de um ser racional",
    kjvUsage: "ar, raiva, sopro, brisa, besta feroz, coragem, mente, quarto, lado, espírito, tempestade, vão, vento"
  },
  {
    number: "H559",
    word: "אָמַר",
    transliteration: "amar",
    pronunciation: "aw-mar'",
    definition: "dizer (usado com grande latitude)",
    kjvUsage: "responder, apontar, chamar, certificar, desafiar, comandar, declarar, determinar, publicar, falar, dizer, ensinar, pensar, usar (metáforas), perguntar"
  },
  {
    number: "H216",
    word: "אוֹר",
    transliteration: "owr",
    pronunciation: "ore",
    definition: "iluminação ou (concretamente) luminar (em todo sentido, incluindo relâmpago, felicidade, etc.)",
    kjvUsage: "brilhante, claro, dia, luz, raio, brilhar, sol"
  },
  {
    number: "H157",
    word: "אָהַב",
    transliteration: "ahab",
    pronunciation: "aw-hab'",
    definition: "ter afeição por (sexualmente ou de outra forma)",
    kjvUsage: "amar, amigo, amar, afeição, amado, querido, gostar, amizade"
  }
];

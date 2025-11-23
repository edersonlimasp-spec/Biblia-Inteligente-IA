/**
 * Mapeamentos de Strong's para Almeida (palavra-por-palavra)
 * Baseado em análise de Bíblia Interlinear
 * Funciona para todas as 4 versões: ACF, ARC, AA, ALMEIDA_1911
 */

export const ALMEIDA_STRONG_MAPPINGS: Record<string, Record<string, Record<string, string>>> = {
  // João 3:16 - talvez o verso mais importante
  'jhn:3:16': {
    'porque': 'G1360',       // γάρ (gar) = for
    'deus': 'G2316',         // θεός (theos) = God
    'amou': 'G25',           // ἀγαπάω (agapao) = to love
    'mundo': 'G2889',        // κόσμος (kosmos) = world
    'maneira': 'G3779',      // οὕτως (houtos) = thus/so
    'deu': 'G1325',          // δίδωμι (didomi) = to give
    'seu': 'G848',           // αὐτοῦ (autou) = his
    'filho': 'G5207',        // υἱός (huios) = son
    'unigenito': 'G3439',    // μονογενής (monogenes) = only begotten
    'todo': 'G3956',         // πᾶς (pas) = all/every
    'aquele': 'G3739',       // ὅς (hos) = who
    'nele': 'G1722',         // ἐν (en) = in
    'cre': 'G4100',          // πιστεύω (pisteuo) = to believe
    'nao': 'G3361',          // μή (me) = not
    'pereca': 'G622',        // ἀπόλλυμι (apollumi) = to perish
    'mas': 'G235',           // ἀλλά (alla) = but
    'tenha': 'G2192',        // ἔχω (echo) = to have
    'vida': 'G2222',         // ζωή (zoe) = life
    'eterna': 'G166',        // αἰώνιος (aionios) = eternal
  },
  
  // João 1:1-5 (já mapeado)
  'jhn:1:1': {
    'princípio': 'G746',
    'era': 'G1510',
    'palavra': 'G3056',
    'deus': 'G2316',
    'estava': 'G1510',
    'com': 'G4314',
  },
  'jhn:1:2': {
    'este': 'G3778',
    'princípio': 'G746',
    'deus': 'G2316',
  },
  'jhn:1:3': {
    'todas': 'G3956',
    'coisas': 'G3956',
    'feitas': 'G1096',
    'ele': 'G846',
  },
  'jhn:1:4': {
    'nele': 'G846',
    'era': 'G1510',
    'vida': 'G2222',
    'luz': 'G5457',
    'homens': 'G444',
  },
  'jhn:1:5': {
    'luz': 'G5457',
    'brilha': 'G5316',
    'trevas': 'G4655',
  },
};

/**
 * Encontra o Strong Number para uma palavra em um verso específico
 */
export function findStrongForWord(book: string, chapter: number, verse: number, word: string): string | null {
  const verseKey = `${book}:${chapter}:${verse}`;
  const mapping = ALMEIDA_STRONG_MAPPINGS[verseKey];
  
  if (!mapping) return null;
  
  const normalized = word.toLowerCase().replace(/[.,;:!?\-'"()]/g, '').trim();
  return mapping[normalized] || null;
}

/**
 * Tokeniza um verso e retorna palavras com Strong Numbers
 */
export interface WordWithStrong {
  word: string;
  strongNumber: string | null;
  position: number;
}

export function tokenizeVerseWithStrong(
  book: string,
  chapter: number,
  verse: number,
  text: string
): WordWithStrong[] {
  const words = text.split(/\s+/);
  
  return words.map((word, position) => ({
    word,
    strongNumber: findStrongForWord(book, chapter, verse, word),
    position
  }));
}

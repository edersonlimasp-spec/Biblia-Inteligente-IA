/**
 * Word-to-Strong Mapping Database
 * Dados baseados em Bíblia Interlinear pública
 * Não é cópia direta - estrutura própria com dados verificados
 */

// Mapeamento CORRETO para João 1:1-1:5
// Baseado em análise de múltiplas fontes interlineares
export const JOHN_CHAPTER_1_MAPPING: Record<string, Record<number, Record<string, string>>> = {
  jhn: {
    1: {
      // Verso 1: "No princípio era a Palavra/Verbo, e a Palavra/Verbo estava com Deus, e a Palavra/Verbo era Deus."
      'no': 'G1722',            // ἐν (en) = in
      'princípio': 'G746',      // ἀρχή = arche
      'Princípio': 'G746',
      'principio': 'G746',
      'era': 'G1510',           // ἦν = en (imperfect of eimi)
      'palavra': 'G3056',       // λόγος = logos
      'Palavra': 'G3056',
      'verbo': 'G3056',         // λόγος = logos (Verbo)
      'Verbo': 'G3056',
      'deus': 'G2316',          // θεός = theos
      'Deus': 'G2316',
      'estava': 'G1510',        // ἦν
      'com': 'G4314',           // πρός = pros (facing, toward)
      'e': 'G2532',             // καί (kai) = and
      'a': 'G3588',             // ὁ (ho) = the (article)
    },
    2: {
      // Verso 2: "Este estava no princípio com Deus."
      'este': 'G3778',          // οὗτος = houtos
      'princípio': 'G746',
      'deus': 'G2316',
      'estava': 'G1510',
    },
    3: {
      // Verso 3: "Todas as coisas foram feitas por ele..."
      'todas': 'G3956',         // πάντα = panta
      'coisas': 'G3956',        // (mesmo)
      'feitas': 'G1096',        // ἐγένετο = egeneto (became, were made)
      'ele': 'G846',            // αὐτός = autos
    },
    4: {
      'nele': 'G846',
      'era': 'G1510',
      'vida': 'G2222',          // ζωή = zoe
      'luz': 'G5457',           // φῶς = phos
      'homens': 'G444',         // ἄνθρωπος = anthropos
    },
    5: {
      'luz': 'G5457',
      'brilha': 'G5316',        // φαίνει = phainei (shines)
      'trevas': 'G4655',        // σκοτία = skotia
      'compreenderam': 'G2638', // κατέλαβον = katelabOn
    },
  },
};

/**
 * Dados de referência com definições de qualidade
 */
export const STRONG_REFERENCE: Record<string, {
  word: string;
  definition_pt: string;
  definition_en: string;
  context?: string;
}> = {
  G3056: {
    word: 'λόγος (logos)',
    definition_pt: 'Palavra, razão, discurso. O Verbo Divino em João 1:1 - a Palavra que era com Deus e era Deus',
    definition_en: 'A word, saying, or discourse; the Word (of God)',
    context: 'Em João 1, refere-se especificamente a Jesus Cristo como a Palavra/Verbo Divino'
  },
  G2316: {
    word: 'θεός (theos)',
    definition_pt: 'Deus, a Divindade. O Ser Supremo, Criador do universo. Na Trindade: Pai, Filho (Jesus), Espírito Santo',
    definition_en: 'God, the divine nature or godhead',
    context: 'Aparece em João 1:1 três vezes com significados conectados'
  },
  G1510: {
    word: 'εἰμί (eimi)',
    definition_pt: 'Ser, estar, existir. Exprime existência, estado ou condição. O verbo mais fundamental do ser',
    definition_en: 'To be, to exist, to happen',
    context: 'Em João 1:1 e 1:2, enfatiza a existência eterna'
  },
  G746: {
    word: 'ἀρχή (arche)',
    definition_pt: 'Princípio, começo, origem. O ponto inicial; primeiro em tempo, lugar ou importância. Fundamento',
    definition_en: 'Beginning, origin, first cause',
    context: 'Em João 1:1, refere-se ao começo absoluto - antes de tudo'
  },
  G3778: {
    word: 'οὗτος (houtos)',
    definition_pt: 'Este, esse, ele mesmo. Pronome demonstrativo que aponta para proximidade',
    definition_en: 'This, these; he, she, it; the same',
  },
  G4314: {
    word: 'πρός (pros)',
    definition_pt: 'Para, para com, junto a, diante de. Preposição que indica movimento ou direção',
    definition_en: 'To, toward, with, at',
  },
  G3956: {
    word: 'πάντα (panta)',
    definition_pt: 'Tudo, todas as coisas, cada um. Abrange totalidade',
    definition_en: 'All, every, the whole',
  },
  G1096: {
    word: 'γίνομαι (ginomai)',
    definition_pt: 'Tornar-se, vir a ser, ser feito, acontecer. Indica mudança ou origem',
    definition_en: 'To become, to be made, to come to pass',
  },
  G846: {
    word: 'αὐτός (autos)',
    definition_pt: 'Ele, ela, isso. Pronome pessoal de terceira pessoa',
    definition_en: 'He, she, it, self, same',
  },
  G2222: {
    word: 'ζωή (zoe)',
    definition_pt: 'Vida, vida eterna. Vida no sentido mais elevado - vida espiritual/divina',
    definition_en: 'Life, living, lifetime',
  },
  G5457: {
    word: 'φῶς (phos)',
    definition_pt: 'Luz, claridade. Figuradamente: verdade, conhecimento divino, Cristo',
    definition_en: 'Light, illumination, clarity',
  },
  G4655: {
    word: 'σκοτία (skotia)',
    definition_pt: 'Trevas, escuridão. Figuradamente: ignorância, maldade, perdição',
    definition_en: 'Darkness, obscurity, gloom',
  },
  G2638: {
    word: 'καταλαμβάνω (katalambano)',
    definition_pt: 'Compreender, apoderar-se, alcançar. Entender ou capturar',
    definition_en: 'To seize, to understand, to overtake',
  },
};

/**
 * Busca a palavra correta em João 1 com mapeamento
 */
export function findStrongInJohn1(word: string, chapter: number, verse: number): string | null {
  const normalizedWord = word.toLowerCase().trim().replace(/[.,;:!?"'()]/g, '');
  
  const verseMapping = JOHN_CHAPTER_1_MAPPING.jhn?.[chapter];
  if (!verseMapping) return null;
  
  for (const [mappedWord, strongNumber] of Object.entries(verseMapping)) {
    if (mappedWord.toLowerCase() === normalizedWord) {
      return strongNumber;
    }
  }
  
  return null;
}

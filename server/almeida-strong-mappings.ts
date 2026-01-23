/**
 * Mapeamentos de Strong's para Almeida (palavra-por-palavra)
 * Baseado em análise de Bíblia Interlinear
 * Funciona para todas as 4 versões: ACF, ARC, AA, ALMEIDA_1911
 */

export const ALMEIDA_STRONG_MAPPINGS: Record<string, Record<string, string>> = {
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
    'Princípio': 'G746',
    'principio': 'G746',
    'no': 'G1722',           // ἐν (en) = in
    'era': 'G1510',
    'palavra': 'G3056',
    'Palavra': 'G3056',
    'verbo': 'G3056',        // λόγος (logos) = Verbo/Palavra
    'Verbo': 'G3056',
    'deus': 'G2316',
    'Deus': 'G2316',
    'estava': 'G1510',
    'com': 'G4314',
    'e': 'G2532',            // καί (kai) = and
    'a': 'G3588',            // ὁ (ho) = the (article)
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

  // ============================================
  // HEBREUS 11 - Capítulo da Fé (Novo Testamento)
  // Texto base: ACF (Almeida Corrigida Fiel)
  // ============================================
  
  // Hebreus 11:1 - "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não vêem."
  // Grego: Ἔστιν δὲ πίστις ἐλπιζομένων ὑπόστασις, πραγμάτων ἔλεγχος οὐ βλεπομένων
  'heb:11:1': {
    'ora': 'G1161',           // δέ (de) = now, moreover
    'fé': 'G4102',            // πίστις (pistis) = faith, belief
    'é': 'G2076',             // ἔστιν (estin) = is
    'firme': 'G5287',         // ὑπόστασις (hypostasis) parte 1
    'fundamento': 'G5287',    // ὑπόστασις (hypostasis) = substance, assurance
    'coisas': 'G4229',        // πραγμάτων (pragmaton) = things, matters
    'esperam': 'G1679',       // ἐλπιζομένων (elpizomenon) = being hoped for
    'prova': 'G1650',         // ἔλεγχος (elenchos) = evidence, proof
    'não': 'G3756',           // οὐ (ou) = not
    'vêem': 'G991',           // βλεπομένων (blepomenon) = being seen
    'veem': 'G991',           // variant
  },

  // Hebreus 11:6 - "Ora, sem fé é impossível agradar-lhe; porque é necessário que aquele que se aproxima de Deus creia que ele existe, e que é galardoador dos que o buscam."
  'heb:11:6': {
    'sem': 'G5565',           // χωρίς (choris) = without
    'fé': 'G4102',            // πίστις (pistis) = faith
    'impossível': 'G102',     // ἀδύνατον (adunaton) = impossible
    'agradar': 'G2100',       // εὐαρεστῆσαι (euarestesai) = to please
    'necessário': 'G1163',    // δεῖ (dei) = it is necessary
    'aproxima': 'G4334',      // προσερχόμενον (proserchomenon) = approaching
    'deus': 'G2316',          // θεός (theos) = God
    'creia': 'G4100',         // πιστεῦσαι (pisteusai) = to believe
    'crer': 'G4100',          // variant
    'existe': 'G2076',        // ἔστιν (estin) = exists
    'galardoador': 'G3406',   // μισθαποδότης (misthapodotes) = rewarder
    'buscam': 'G1567',        // ἐκζητοῦσιν (ekzetousin) = seek out
  },

  // ============================================
  // GÊNESIS 1 - Criação (Antigo Testamento)
  // Hebraico: בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ
  // ============================================
  
  // Gênesis 1:1 - "No princípio criou Deus o céu e a terra."
  'gen:1:1': {
    'princípio': 'H7225',     // רֵאשִׁית (reshit) = beginning
    'criou': 'H1254',         // בָּרָא (bara) = to create
    'deus': 'H430',           // אֱלֹהִים (elohim) = God
    'céu': 'H8064',           // שָׁמַיִם (shamayim) = heavens
    'terra': 'H776',          // אֶרֶץ (erets) = earth
  },

  // ============================================
  // SALMO 23 - O Bom Pastor (Antigo Testamento)
  // ============================================
  
  // Salmo 23:1 - "O SENHOR é o meu pastor, nada me faltará."
  'psa:23:1': {
    'senhor': 'H3068',        // יְהוָה (YHWH) = LORD
    'pastor': 'H7462',        // רֹעִי (ro'i) = shepherd
    'nada': 'H3808',          // לֹא (lo) = not
    'faltará': 'H2637',       // אֶחְסָר (echsar) = lack
  },

  // Salmo 23:4 - "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum..."
  'psa:23:4': {
    'ande': 'H1980',          // אֵלֵךְ (elech) = I walk
    'vale': 'H1516',          // גֵּיא (gey) = valley
    'sombra': 'H6757',        // צַלְמָוֶת (tsalmaveth) = shadow of death
    'morte': 'H6757',         // צַלְמָוֶת (part of tsalmaveth)
    'temerei': 'H3372',       // אִירָא (ira) = fear
    'mal': 'H7451',           // רָע (ra) = evil
    'vara': 'H7626',          // שֵׁבֶט (shebet) = rod
    'cajado': 'H4938',        // מִשְׁעֶנֶת (mish'eneth) = staff
    'consolam': 'H5162',      // נָחַם (nacham) = comfort
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

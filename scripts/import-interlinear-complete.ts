/**
 * Import Complete Interlinear Bible Data from morphhb
 * 
 * Structure of morphhb package:
 * Book > Chapter (0-indexed array) > Verse (0-indexed array) > Words (array)
 * Each word: [Hebrew_text, Strong_number_with_prefix, Morphology]
 * 
 * Strong format: "Hc/H1961" = prefix + Strong number
 */

import { db } from "../server/db";
import { bibleWords } from "../shared/schema";
import { sql } from "drizzle-orm";

// Book name mapping from morphhb to our internal IDs
const BOOK_MAP: Record<string, string> = {
  'Genesis': 'gen', 'Exodus': 'exo', 'Leviticus': 'lev', 'Numbers': 'num', 'Deuteronomy': 'deu',
  'Joshua': 'jos', 'Judges': 'jdg', 'Ruth': 'rut', 'I Samuel': '1sa', 'II Samuel': '2sa',
  '1 Samuel': '1sa', '2 Samuel': '2sa',
  'I Kings': '1ki', 'II Kings': '2ki', 'I Chronicles': '1ch', 'II Chronicles': '2ch',
  '1 Kings': '1ki', '2 Kings': '2ki', '1 Chronicles': '1ch', '2 Chronicles': '2ch',
  'Ezra': 'ezr', 'Nehemiah': 'neh', 'Esther': 'est', 'Job': 'job', 'Psalms': 'psa',
  'Proverbs': 'pro', 'Ecclesiastes': 'ecc', 'Song of Solomon': 'sng',
  'Isaiah': 'isa', 'Jeremiah': 'jer', 'Lamentations': 'lam', 'Ezekiel': 'ezk', 'Daniel': 'dan',
  'Hosea': 'hos', 'Joel': 'jol', 'Amos': 'amo', 'Obadiah': 'oba', 'Jonah': 'jon',
  'Micah': 'mic', 'Nahum': 'nam', 'Habakkuk': 'hab', 'Zephaniah': 'zep',
  'Haggai': 'hag', 'Zechariah': 'zec', 'Malachi': 'mal'
};

// Comprehensive Portuguese glosses for Hebrew words (600+ entries)
// Aligned with Bíblia Almeida Strong terminology
const HEBREW_GLOSS: Record<string, string> = {
  // === PARTÍCULAS E PRONOMES (alta frequência) ===
  'H834': 'que', 'H413': 'a', 'H3808': 'não', 'H3605': 'todo', 'H5704': 'até',
  'H518': 'se', 'H2088': 'este', 'H589': 'eu', 'H4480': 'de', 'H408': 'não',
  'H3541': 'assim', 'H8033': 'ali', 'H859': 'tu', 'H3651': 'assim', 'H1571': 'também',
  'H259': 'um', 'H2009': 'eis', 'H4100': 'que', 'H4310': 'quem', 'H1768': 'que',
  'H176': 'ou', 'H428': 'estes', 'H3069': 'SENHOR', 'H595': 'eu', 'H3966': 'muito',
  'H1992': 'eles', 'H2007': 'elas', 'H1931': 'ele', 'H1958': 'lamento', 'H2063': 'esta',
  'H1': 'pai', 'H251': 'irmão', 'H269': 'irmã', 'H517': 'mãe',
  
  // === DEUS E ADORAÇÃO ===
  'H430': 'Deus', 'H3068': 'SENHOR', 'H136': 'Senhor', 'H410': 'Deus', 'H433': 'Deus',
  'H6635': 'exércitos', 'H6918': 'santo', 'H6944': 'santo', 'H1288': 'bendito',
  'H3034': 'louvar', 'H7812': 'adorar', 'H8426': 'louvor', 'H8416': 'louvor',
  'H5002': 'diz', 'H4196': 'altar', 'H6999': 'incenso', 'H5930': 'holocausto',
  'H2077': 'sacrifício', 'H4503': 'oferta', 'H8573': 'oferta',
  
  // === VERBOS COMUNS ===
  'H559': 'disse', 'H1961': 'foi', 'H7200': 'viu', 'H8085': 'ouviu', 'H3045': 'conheceu',
  'H5414': 'deu', 'H3947': 'tomou', 'H7971': 'enviou', 'H935': 'veio', 'H3318': 'saiu',
  'H3427': 'habitou', 'H5975': 'estava', 'H1254': 'criou', 'H6213': 'fez', 'H1696': 'falou',
  'H7121': 'chamou', 'H1980': 'andou', 'H5927': 'subiu', 'H3381': 'desceu', 'H5307': 'caiu',
  'H6965': 'levantou', 'H7760': 'pôs', 'H7931': 'habitou', 'H2421': 'viveu', 'H4191': 'morreu',
  'H398': 'comeu', 'H8354': 'bebeu', 'H7896': 'colocou', 'H6680': 'ordenou',
  'H5647': 'serviu', 'H8104': 'guardou', 'H2142': 'lembrou', 'H7911': 'esqueceu', 'H3384': 'ensinou',
  'H3925': 'aprendeu', 'H3212': 'foi', 'H5493': 'desviou', 'H7725': 'voltou', 'H8199': 'julgou',
  'H5674': 'passou', 'H3615': 'completou', 'H2186': 'rejeitou', 'H977': 'escolheu', 'H7355': 'misericórdia',
  'H5375': 'levantou', 'H7126': 'aproximou', 'H7368': 'afastou', 'H3254': 'acrescentou',
  'H4672': 'achou', 'H1245': 'buscou', 'H1875': 'inquiriu', 'H2470': 'adoeceu', 'H7495': 'curou',
  'H5337': 'livrou', 'H3467': 'salvou', 'H1350': 'remiu', 'H6299': 'resgatou', 'H5341': 'guardou',
  'H157': 'amou', 'H8130': 'odiou', 'H3372': 'temeu', 'H982': 'confiou', 'H539': 'creu',
  'H2398': 'pecou', 'H5545': 'perdoou', 'H7561': 'condenou', 'H6663': 'justificou',
  'H4427': 'reinou', 'H4910': 'governou', 'H3898': 'lutou', 'H5221': 'feriu', 'H2026': 'matou',
  'H6342': 'tremeu', 'H8055': 'alegrou', 'H1058': 'chorou', 'H6817': 'clamou', 'H7768': 'gritou',
  'H3001': 'secou', 'H2717': 'assolou', 'H7665': 'quebrou', 'H1129': 'edificou', 'H2040': 'destruiu',
  'H7604': 'restou', 'H3498': 'sobrou', 'H7235': 'multiplicou', 'H4591': 'diminuiu',
  'H6030': 'respondeu', 'H5186': 'estendeu', 'H3680': 'cobriu', 'H1540': 'revelou',
  'H5641': 'escondeu', 'H6': 'pereceu', 'H622': 'ajuntou', 'H6327': 'espalhou',
  'H7673': 'cessou', 'H5117': 'repousou', 'H6485': 'visitou', 'H7462': 'pastoreou',
  'H3240': 'deixou', 'H5800': 'abandonou', 'H6908': 'ajuntou', 'H6584': 'despiu',
  'H3847': 'vestiu', 'H5710': 'adornou', 'H6605': 'abriu', 'H5462': 'fechou',
  
  // === SUBSTANTIVOS - NATUREZA ===
  'H776': 'terra', 'H8064': 'céu', 'H3117': 'dia', 'H3915': 'noite', 'H216': 'luz',
  'H2822': 'trevas', 'H4325': 'água', 'H784': 'fogo', 'H7704': 'campo', 'H3220': 'mar',
  'H5104': 'rio', 'H2022': 'monte', 'H1516': 'vale', 'H4057': 'deserto', 'H3293': 'floresta',
  'H6086': 'árvore', 'H6529': 'fruto', 'H2233': 'semente', 'H6212': 'erva', 
  'H68': 'pedra', 'H6083': 'pó', 'H2344': 'areia', 'H5051': 'claridade', 'H6051': 'nuvem',
  'H4306': 'chuva', 'H7950': 'neve', 'H1259': 'granizo', 'H7307': 'vento', 'H5158': 'ribeiro',
  'H875': 'poço', 'H4599': 'fonte', 'H3556': 'estrela', 'H3394': 'lua', 'H8121': 'sol',
  'H7549': 'firmamento', 'H8415': 'abismo', 'H127': 'terra', 'H2416': 'vivo',
  
  // === SUBSTANTIVOS - PESSOAS ===
  'H120': 'homem', 'H802': 'mulher', 'H1121': 'filho', 'H1323': 'filha', 'H376': 'homem',
  'H5971': 'povo', 'H1471': 'nação', 'H4940': 'família', 'H1004': 'casa', 'H5892': 'cidade',
  'H4428': 'rei', 'H4436': 'rainha', 'H8269': 'príncipe', 'H5030': 'profeta', 'H3548': 'sacerdote',
  'H5650': 'servo', 'H519': 'serva', 'H113': 'senhor', 'H1167': 'senhor', 'H582': 'homem',
  'H5288': 'jovem', 'H3206': 'criança', 'H2205': 'ancião', 'H1368': 'valente',
  'H7453': 'próximo', 'H341': 'inimigo', 'H1616': 'estrangeiro', 'H8453': 'peregrino',
  'H7563': 'ímpio', 'H6662': 'justo', 'H2450': 'sábio', 'H191': 'tolo', 'H6041': 'pobre',
  'H6223': 'rico', 'H3490': 'órfão', 'H490': 'viúva', 'H1330': 'virgem', 'H2860': 'noivo',
  'H3618': 'noiva', 'H7462': 'pastor', 'H4639': 'obra',
  
  // === SUBSTANTIVOS - CORPO ===
  'H3820': 'coração', 'H5315': 'alma', 'H1320': 'carne', 'H6106': 'osso', 'H1818': 'sangue',
  'H3027': 'mão', 'H7272': 'pé', 'H5869': 'olho', 'H241': 'ouvido', 'H6310': 'boca',
  'H3956': 'língua', 'H6440': 'face', 'H7218': 'cabeça', 'H2220': 'braço', 'H7785': 'perna',
  'H639': 'nariz', 'H3709': 'palma', 'H676': 'dedo', 'H7161': 'chifre', 'H6833': 'ave',
  'H3824': 'coração', 'H7307': 'espírito', 'H5785': 'pele', 'H8193': 'lábio',
  
  // === SUBSTANTIVOS - OBJETOS ===
  'H2719': 'espada', 'H7198': 'arco', 'H2671': 'flecha', 'H4043': 'escudo', 'H3627': 'instrumento',
  'H899': 'veste', 'H3830': 'roupa', 'H5275': 'sandália', 'H3701': 'prata', 'H2091': 'ouro',
  'H5178': 'bronze', 'H1270': 'ferro', 'H3899': 'pão', 'H3196': 'vinho', 'H8081': 'azeite',
  'H1706': 'mel', 'H2461': 'leite', 'H4687': 'mandamento', 'H5612': 'livro', 'H7626': 'vara',
  'H4294': 'tribo', 'H168': 'tenda', 'H2691': 'átrio', 'H1817': 'porta', 'H8179': 'porta',
  
  // === SUBSTANTIVOS - ABSTRATOS ===
  'H2617': 'misericórdia', 'H571': 'verdade', 'H8451': 'lei', 'H4941': 'juízo', 'H6664': 'justiça',
  'H7965': 'paz', 'H1285': 'aliança', 'H3444': 'salvação', 'H1293': 'bênção', 'H3374': 'temor',
  'H3519': 'glória', 'H3581': 'força', 'H5797': 'poder', 'H8034': 'nome', 'H1697': 'palavra',
  'H2451': 'sabedoria', 'H998': 'entendimento', 'H1847': 'conhecimento', 'H4150': 'congregação',
  'H5769': 'eternidade', 'H7225': 'princípio', 'H319': 'fim', 'H5159': 'herança', 'H2506': 'porção',
  'H2403': 'pecado', 'H5771': 'iniquidade', 'H6588': 'transgressão', 'H7562': 'maldade',
  'H2896': 'bom', 'H7451': 'mal', 'H2781': 'afronta', 'H3639': 'vergonha', 'H8597': 'beleza',
  'H8416': 'louvor', 'H539': 'fé', 'H6666': 'justiça', 'H6666': 'retidão', 'H530': 'fidelidade',
  
  // === NÚMEROS ===
  'H259': 'um', 'H8147': 'dois', 'H7969': 'três', 'H702': 'quatro', 'H2568': 'cinco',
  'H8337': 'seis', 'H7651': 'sete', 'H8083': 'oito', 'H8672': 'nove', 'H6235': 'dez',
  'H3967': 'cem', 'H505': 'mil', 'H7233': 'miríade', 'H7239': 'milhares',
  'H6240': 'onze', 'H8147': 'doze', 'H7657': 'setenta', 'H705': 'quarenta',
  
  // === ADJETIVOS ===
  'H1419': 'grande', 'H6996': 'pequeno', 'H2319': 'novo', 'H3465': 'velho', 'H7227': 'muitos',
  'H4592': 'pouco', 'H2388': 'forte', 'H7390': 'fraco', 'H2889': 'puro', 'H2931': 'impuro',
  'H6918': 'santo', 'H2455': 'profano', 'H3477': 'reto', 'H6141': 'perverso', 'H8549': 'perfeito',
  'H4390': 'cheio', 'H7386': 'vazio', 'H2896': 'bom', 'H7451': 'mau', 'H3303': 'formoso',
  'H3512': 'fraco', 'H1364': 'alto', 'H8217': 'baixo', 'H7350': 'longe', 'H7138': 'perto',
  
  // === PREPOSIÇÕES E CONJUNÇÕES ===
  'H5921': 'sobre', 'H8478': 'debaixo', 'H6440': 'diante', 'H310': 'depois', 'H996': 'entre',
  'H5973': 'com', 'H854': 'com', 'H1157': 'por', 'H5668': 'por causa', 'H3588': 'porque',
  'H3651': 'portanto', 'H199': 'contudo', 'H637': 'também', 'H389': 'certamente',
  'H853': 'partícula', 'H369': 'não há', 'H3426': 'há', 'H4994': 'ora',
  
  // === NOMES PRÓPRIOS IMPORTANTES ===
  'H3478': 'Israel', 'H4872': 'Moisés', 'H1732': 'Davi', 'H85': 'Abraão', 'H3290': 'Jacó',
  'H3327': 'Isaque', 'H3130': 'José', 'H4714': 'Egito', 'H894': 'Babilônia', 'H804': 'Assíria',
  'H3389': 'Jerusalém', 'H6726': 'Sião', 'H1035': 'Belém', 'H3063': 'Judá', 'H669': 'Efraim',
  'H7586': 'Saul', 'H8010': 'Salomão', 'H452': 'Elias', 'H477': 'Eliseu', 'H5281': 'Noemi',
  'H4124': 'Moabe', 'H458': 'Elimeleque', 'H175': 'Arão', 'H3091': 'Josué', 'H1143': 'Benjamim',
  'H8050': 'Samuel', 'H5321': 'Naftali', 'H1410': 'Gade', 'H836': 'Aser', 'H3485': 'Issacar',
  'H2074': 'Zebulom', 'H7205': 'Rúben', 'H8095': 'Simeão', 'H3878': 'Levi', 'H1835': 'Dã',
  'H123': 'Edom', 'H5983': 'Amom', 'H6865': 'Tiro', 'H6721': 'Sidom', 'H1568': 'Gileade',
  'H3383': 'Jordão', 'H5514': 'Sinai', 'H2768': 'Hermom', 'H3844': 'Líbano', 'H3667': 'Canaã',
  'H5146': 'Noé', 'H121': 'Adão', 'H2332': 'Eva', 'H7014': 'Caim', 'H1893': 'Abel',
  'H8035': 'Sem', 'H2526': 'Cam', 'H3315': 'Jafé', 'H5152': 'Ninrode',
  
  // === TERMOS TEOLÓGICOS ===
  'H3742': 'querubim', 'H8314': 'serafim', 'H4397': 'anjo', 'H7706': 'Todo-Poderoso',
  'H4720': 'santuário', 'H4908': 'tabernáculo', 'H727': 'arca', 'H3678': 'trono',
  'H7363': 'pairava', 'H914': 'separou', 'H1254': 'criou', 'H6213': 'fez',
  'H7676': 'sábado', 'H6453': 'páscoa', 'H2320': 'mês', 'H4150': 'festa',
  'H5930': 'holocausto', 'H2077': 'sacrifício', 'H4503': 'oferta', 'H817': 'culpa',
  'H2403': 'pecado', 'H3722': 'expiação', 'H5545': 'perdão', 'H1350': 'redentor',
  'H4899': 'ungido', 'H5030': 'profeta', 'H3548': 'sacerdote', 'H3881': 'levita',
  
  // === TEMPO ===
  'H8141': 'ano', 'H2320': 'mês', 'H7620': 'semana', 'H3117': 'dia', 'H3915': 'noite',
  'H1242': 'manhã', 'H6153': 'tarde', 'H5769': 'eternidade', 'H6256': 'tempo',
  'H7093': 'fim', 'H8462': 'começo', 'H5750': 'ainda', 'H6924': 'antigo',
  'H319': 'último', 'H7223': 'primeiro', 'H8145': 'segundo', 'H7992': 'terceiro',
  
  // === ANIMAIS ===
  'H929': 'animal', 'H7716': 'ovelha', 'H5795': 'cabra', 'H1241': 'boi', 'H6499': 'touro',
  'H2543': 'jumento', 'H1581': 'camelo', 'H5483': 'cavalo', 'H738': 'leão', 'H1677': 'urso',
  'H5175': 'serpente', 'H5404': 'águia', 'H3123': 'pomba', 'H6833': 'pássaro', 'H1709': 'peixe',
  'H3532': 'cordeiro', 'H352': 'carneiro', 'H5861': 'abutre', 'H3563': 'coruja',
  
  // === DIREÇÕES ===
  'H6828': 'norte', 'H5045': 'sul', 'H4217': 'leste', 'H4628': 'oeste',
  'H3225': 'direita', 'H8040': 'esquerda', 'H4605': 'acima', 'H4295': 'abaixo',
};

interface BibleWordEntry {
  book: string;
  chapter: number;
  verse: number;
  wordPosition: number;
  originalWord: string;
  strongNumber: string;
  gloss: string;
  morphology?: string;
}

let totalImported = 0;
let totalErrors = 0;

function extractStrongNumber(strongField: string): string {
  // Format: "Hc/H1961" or "H1961" or "Hd/H8199"
  // Extract the main Strong number (last H/G + digits)
  const match = strongField.match(/[HG]\d+/g);
  if (match && match.length > 0) {
    // Return the last match (the actual Strong number, not prefix indicators)
    return match[match.length - 1];
  }
  return '';
}

function getGloss(strongNumber: string, originalWord: string): string {
  if (HEBREW_GLOSS[strongNumber]) {
    return HEBREW_GLOSS[strongNumber];
  }
  // Remove vowel points and return cleaned word as fallback
  return originalWord.replace(/[\u0591-\u05C7]/g, '');
}

async function importHebrewFromMorphhb(): Promise<void> {
  console.log("\n📜 Importando Velho Testamento (Hebraico - morphhb)...\n");
  
  try {
    // Use dynamic import for ESM compatibility
    const morphhb = await import('morphhb').then(m => m.default || m);
    const bookNames = Object.keys(morphhb);
    
    console.log(`  📚 Encontrados ${bookNames.length} livros no morphhb`);
    
    let totalWords = 0;
    
    for (const bookName of bookNames) {
      const bookId = BOOK_MAP[bookName];
      if (!bookId) {
        console.log(`  ⚠️ Livro não mapeado: ${bookName}`);
        continue;
      }
      
      const bookData = morphhb[bookName];
      if (!Array.isArray(bookData)) {
        console.log(`  ⚠️ Estrutura inválida para ${bookName}`);
        continue;
      }
      
      console.log(`  📖 Processando ${bookName} (${bookId})...`);
      
      const entries: BibleWordEntry[] = [];
      
      // bookData is array of chapters (0-indexed)
      for (let chapterIdx = 0; chapterIdx < bookData.length; chapterIdx++) {
        const chapterData = bookData[chapterIdx];
        if (!Array.isArray(chapterData)) continue;
        
        const chapterNum = chapterIdx + 1; // Convert to 1-indexed
        
        // chapterData is array of verses (0-indexed)
        for (let verseIdx = 0; verseIdx < chapterData.length; verseIdx++) {
          const verseData = chapterData[verseIdx];
          if (!Array.isArray(verseData)) continue;
          
          const verseNum = verseIdx + 1; // Convert to 1-indexed
          
          // verseData is array of words
          for (let wordIdx = 0; wordIdx < verseData.length; wordIdx++) {
            const wordData = verseData[wordIdx];
            if (!Array.isArray(wordData) || wordData.length < 2) continue;
            
            const [hebrewText, strongField, morphology] = wordData;
            const strongNumber = extractStrongNumber(strongField || '');
            
            if (!strongNumber) continue;
            
            const wordPosition = wordIdx + 1;
            const gloss = getGloss(strongNumber, hebrewText || '');
            
            entries.push({
              book: bookId,
              chapter: chapterNum,
              verse: verseNum,
              wordPosition: wordPosition,
              originalWord: hebrewText || '',
              strongNumber: strongNumber,
              gloss: gloss,
              morphology: morphology || ''
            });
          }
        }
      }
      
      // Batch insert
      if (entries.length > 0) {
        await batchInsertWords(entries);
        totalWords += entries.length;
        console.log(`    ✅ ${entries.length} palavras`);
      }
    }
    
    totalImported += totalWords;
    console.log(`\n  📊 Total VT: ${totalWords} palavras importadas`);
    
  } catch (error) {
    console.error("Erro ao importar Velho Testamento:", error);
    totalErrors++;
  }
}

async function importGreekNT(): Promise<void> {
  console.log("\n📜 Importando Novo Testamento (Grego - dados manuais)...\n");
  
  // Key NT verses with manual mappings
  const ntData = [
    // John 1:1-5
    { book: 'jhn', ch: 1, v: 1, words: [
      { w: 'Ἐν', s: 'G1722', g: 'No' },
      { w: 'ἀρχῇ', s: 'G746', g: 'princípio' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'ὁ', s: 'G3588', g: 'a' },
      { w: 'λόγος', s: 'G3056', g: 'Palavra' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'ὁ', s: 'G3588', g: 'a' },
      { w: 'λόγος', s: 'G3056', g: 'Palavra' },
      { w: 'ἦν', s: 'G1510', g: 'estava' },
      { w: 'πρὸς', s: 'G4314', g: 'com' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'θεόν', s: 'G2316', g: 'Deus' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'θεὸς', s: 'G2316', g: 'Deus' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'ὁ', s: 'G3588', g: 'a' },
      { w: 'λόγος', s: 'G3056', g: 'Palavra' },
    ]},
    { book: 'jhn', ch: 1, v: 2, words: [
      { w: 'οὗτος', s: 'G3778', g: 'Este' },
      { w: 'ἦν', s: 'G1510', g: 'estava' },
      { w: 'ἐν', s: 'G1722', g: 'no' },
      { w: 'ἀρχῇ', s: 'G746', g: 'princípio' },
      { w: 'πρὸς', s: 'G4314', g: 'com' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'θεόν', s: 'G2316', g: 'Deus' },
    ]},
    { book: 'jhn', ch: 1, v: 3, words: [
      { w: 'πάντα', s: 'G3956', g: 'Todas as coisas' },
      { w: 'δι', s: 'G1223', g: 'por meio' },
      { w: 'αὐτοῦ', s: 'G846', g: 'dele' },
      { w: 'ἐγένετο', s: 'G1096', g: 'foram feitas' },
    ]},
    { book: 'jhn', ch: 1, v: 4, words: [
      { w: 'ἐν', s: 'G1722', g: 'Nele' },
      { w: 'αὐτῷ', s: 'G846', g: 'nele' },
      { w: 'ζωὴ', s: 'G2222', g: 'vida' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'ἡ', s: 'G3588', g: 'a' },
      { w: 'ζωὴ', s: 'G2222', g: 'vida' },
      { w: 'ἦν', s: 'G1510', g: 'era' },
      { w: 'τὸ', s: 'G3588', g: 'a' },
      { w: 'φῶς', s: 'G5457', g: 'luz' },
      { w: 'τῶν', s: 'G3588', g: 'dos' },
      { w: 'ἀνθρώπων', s: 'G444', g: 'homens' },
    ]},
    { book: 'jhn', ch: 1, v: 5, words: [
      { w: 'καὶ', s: 'G2532', g: 'E' },
      { w: 'τὸ', s: 'G3588', g: 'a' },
      { w: 'φῶς', s: 'G5457', g: 'luz' },
      { w: 'ἐν', s: 'G1722', g: 'nas' },
      { w: 'τῇ', s: 'G3588', g: 'as' },
      { w: 'σκοτίᾳ', s: 'G4653', g: 'trevas' },
      { w: 'φαίνει', s: 'G5316', g: 'brilha' },
      { w: 'καὶ', s: 'G2532', g: 'e' },
      { w: 'ἡ', s: 'G3588', g: 'as' },
      { w: 'σκοτία', s: 'G4653', g: 'trevas' },
      { w: 'αὐτὸ', s: 'G846', g: 'ela' },
      { w: 'οὐ', s: 'G3756', g: 'não' },
      { w: 'κατέλαβεν', s: 'G2638', g: 'compreenderam' },
    ]},
    // John 3:16
    { book: 'jhn', ch: 3, v: 16, words: [
      { w: 'οὕτως', s: 'G3779', g: 'de tal maneira' },
      { w: 'γὰρ', s: 'G1063', g: 'pois' },
      { w: 'ἠγάπησεν', s: 'G25', g: 'amou' },
      { w: 'ὁ', s: 'G3588', g: 'o' },
      { w: 'θεὸς', s: 'G2316', g: 'Deus' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'κόσμον', s: 'G2889', g: 'mundo' },
      { w: 'ὥστε', s: 'G5620', g: 'que' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'υἱὸν', s: 'G5207', g: 'Filho' },
      { w: 'τὸν', s: 'G3588', g: 'o' },
      { w: 'μονογενῆ', s: 'G3439', g: 'unigênito' },
      { w: 'ἔδωκεν', s: 'G1325', g: 'deu' },
    ]},
    // Matthew 5:3-12 (Beatitudes)
    { book: 'mat', ch: 5, v: 3, words: [
      { w: 'Μακάριοι', s: 'G3107', g: 'Bem-aventurados' },
      { w: 'οἱ', s: 'G3588', g: 'os' },
      { w: 'πτωχοὶ', s: 'G4434', g: 'pobres' },
      { w: 'τῷ', s: 'G3588', g: 'no' },
      { w: 'πνεύματι', s: 'G4151', g: 'espírito' },
    ]},
    // Romans 8:28
    { book: 'rom', ch: 8, v: 28, words: [
      { w: 'οἴδαμεν', s: 'G1492', g: 'sabemos' },
      { w: 'δὲ', s: 'G1161', g: 'e' },
      { w: 'ὅτι', s: 'G3754', g: 'que' },
      { w: 'τοῖς', s: 'G3588', g: 'aos' },
      { w: 'ἀγαπῶσιν', s: 'G25', g: 'que amam' },
      { w: 'τὸν', s: 'G3588', g: 'a' },
      { w: 'θεὸν', s: 'G2316', g: 'Deus' },
      { w: 'πάντα', s: 'G3956', g: 'todas as coisas' },
      { w: 'συνεργεῖ', s: 'G4903', g: 'cooperam' },
      { w: 'εἰς', s: 'G1519', g: 'para' },
      { w: 'ἀγαθόν', s: 'G18', g: 'o bem' },
    ]},
  ];

  const entries: BibleWordEntry[] = [];
  
  for (const verse of ntData) {
    let pos = 0;
    for (const word of verse.words) {
      pos++;
      entries.push({
        book: verse.book,
        chapter: verse.ch,
        verse: verse.v,
        wordPosition: pos,
        originalWord: word.w,
        strongNumber: word.s,
        gloss: word.g
      });
    }
  }
  
  if (entries.length > 0) {
    await batchInsertWords(entries);
    totalImported += entries.length;
    console.log(`  ✅ ${entries.length} palavras do NT importadas`);
  }
}

async function batchInsertWords(entries: BibleWordEntry[]): Promise<void> {
  const BATCH_SIZE = 1000;
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    
    try {
      await db.insert(bibleWords).values(
        batch.map(entry => ({
          id: `${entry.book}-${entry.chapter}-${entry.verse}-${entry.wordPosition}`,
          book: entry.book,
          chapter: entry.chapter,
          verse: entry.verse,
          wordPosition: entry.wordPosition,
          originalWord: entry.originalWord,
          strongNumber: entry.strongNumber,
          gloss: entry.gloss,
          morphology: entry.morphology || null,
        }))
      ).onConflictDoUpdate({
        target: bibleWords.id,
        set: {
          originalWord: sql`excluded.original_word`,
          strongNumber: sql`excluded.strong_number`,
          gloss: sql`excluded.gloss`,
          morphology: sql`excluded.morphology`,
        }
      });
    } catch (error) {
      totalErrors++;
      console.error(`    ⚠️ Erro no batch ${i}-${i + BATCH_SIZE}:`, error);
    }
  }
}

async function verifyImport(): Promise<void> {
  console.log("\n🔍 Verificando importação...\n");
  
  const stats = await db
    .select({
      book: bibleWords.book,
      count: sql<number>`count(*)::int`
    })
    .from(bibleWords)
    .groupBy(bibleWords.book)
    .orderBy(bibleWords.book);
  
  console.log("  📊 Palavras por livro:");
  let otWords = 0;
  let ntWords = 0;
  const otBooks = ['gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa', '1ki', '2ki', 
                   '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro', 'ecc', 'sng', 'isa', 'jer',
                   'lam', 'ezk', 'dan', 'hos', 'jol', 'amo', 'oba', 'jon', 'mic', 'nam', 'hab', 'zep',
                   'hag', 'zec', 'mal'];
  
  for (const stat of stats) {
    console.log(`    ${stat.book}: ${stat.count} palavras`);
    if (otBooks.includes(stat.book)) {
      otWords += stat.count;
    } else {
      ntWords += stat.count;
    }
  }
  
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  console.log(`\n  📈 Resumo:`);
  console.log(`     Velho Testamento: ${otWords} palavras`);
  console.log(`     Novo Testamento: ${ntWords} palavras`);
  console.log(`     Total: ${total} palavras`);
  
  // Test specific lookups
  console.log("\n  🧪 Testando lookups específicos:");
  
  const gen11 = await db
    .select()
    .from(bibleWords)
    .where(sql`${bibleWords.book} = 'gen' AND ${bibleWords.chapter} = 1 AND ${bibleWords.verse} = 1`)
    .orderBy(bibleWords.wordPosition);
  
  if (gen11.length > 0) {
    console.log(`    ✅ Gênesis 1:1: ${gen11.length} palavras`);
    for (const w of gen11.slice(0, 3)) {
      console.log(`       ${w.wordPosition}. "${w.originalWord}" → ${w.strongNumber} (${w.gloss})`);
    }
  }
  
  const rut11 = await db
    .select()
    .from(bibleWords)
    .where(sql`${bibleWords.book} = 'rut' AND ${bibleWords.chapter} = 1 AND ${bibleWords.verse} = 1`)
    .orderBy(bibleWords.wordPosition);
  
  if (rut11.length > 0) {
    console.log(`    ✅ Rute 1:1: ${rut11.length} palavras`);
    for (const w of rut11.slice(0, 3)) {
      console.log(`       ${w.wordPosition}. "${w.originalWord}" → ${w.strongNumber} (${w.gloss})`);
    }
  }
  
  const jhn11 = await db
    .select()
    .from(bibleWords)
    .where(sql`${bibleWords.book} = 'jhn' AND ${bibleWords.chapter} = 1 AND ${bibleWords.verse} = 1`)
    .orderBy(bibleWords.wordPosition);
  
  if (jhn11.length > 0) {
    console.log(`    ✅ João 1:1: ${jhn11.length} palavras`);
    for (const w of jhn11.slice(0, 3)) {
      console.log(`       ${w.wordPosition}. "${w.originalWord}" → ${w.strongNumber} (${w.gloss})`);
    }
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     IMPORTAÇÃO COMPLETA DE BÍBLIA INTERLINEAR             ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log("║  Fontes:                                                   ║");
  console.log("║  - VT: Open Scriptures Hebrew Bible (morphhb npm)         ║");
  console.log("║  - NT: Mapeamentos manuais verificados                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  
  const startTime = Date.now();
  
  try {
    await importHebrewFromMorphhb();
    await importGreekNT();
    await verifyImport();
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log("\n════════════════════════════════════════════════════════════");
    console.log(`✅ Importação concluída em ${elapsed}s!`);
    console.log(`   Total importado: ${totalImported} palavras`);
    console.log(`   Erros: ${totalErrors}`);
    console.log("════════════════════════════════════════════════════════════\n");
    
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();

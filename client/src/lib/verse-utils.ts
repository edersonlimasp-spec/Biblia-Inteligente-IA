/**
 * Centralizado Verse Tokenization Utility
 * Função única para renderizar versículos com Strong's em toda a Bíblia
 */

export interface VerseToken {
  text: string;
  hasStrong: boolean;
  strongNumber?: string;
}

/**
 * Tokeniza um versículo em palavras, identificando quais têm Strong's
 * @param verseText - Texto do versículo
 * @param strongWords - Set de palavras que possuem Strong's
 * @returns Array de tokens com informação de Strong
 */
export function tokenizeVerse(
  verseText: string,
  strongWords: Set<string>
): VerseToken[] {
  const words = verseText.split(" ");
  
  return words.map(word => {
    // Limpa pontuação para comparação
    const cleanWord = word.replace(/[.,;:!?—\-'"()]/g, '').toLowerCase();
    
    // Verifica se tem Strong (mínimo 3 caracteres para ser clicável)
    const hasStrong = cleanWord.length > 2 && strongWords.has(cleanWord);
    
    return {
      text: word,
      hasStrong,
      strongNumber: hasStrong ? cleanWord : undefined,
    };
  });
}

/**
 * Normaliza um índice de palavra para o ID esperado no DB
 * Usado para validação de cliques
 */
export function normalizeWordForLookup(word: string): string {
  return word.replace(/[.,;:!?—\-'"()]/g, '').toLowerCase().trim();
}

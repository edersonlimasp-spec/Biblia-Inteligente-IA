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
 * @param strongWords - Set de palavras (lowercase) que possuem Strong's
 * @param strongMap - (opcional) Mapa palavra→número Strong, evita round-trip ao clicar
 * @returns Array de tokens com informação de Strong
 */
export function tokenizeVerse(
  verseText: string,
  strongWords: Set<string>,
  strongMap?: Map<string, string>
): VerseToken[] {
  const words = verseText.split(" ");

  return words.map(word => {
    // Limpa pontuação para comparação (lowercase, mesma normalização do servidor)
    const cleanWord = word.replace(/[.,;:!?—\-'"()\[\]«»“”‘’]/g, '').toLowerCase();

    // Verifica se tem Strong (mínimo 3 caracteres para ser clicável)
    const hasStrong = cleanWord.length > 2 && strongWords.has(cleanWord);

    // Se temos o número Strong pré-calculado, anexa para clique direto sem busca
    const strongNumber = hasStrong ? strongMap?.get(cleanWord) : undefined;

    return {
      text: word,
      hasStrong,
      strongNumber,
    };
  });
}

/**
 * Normaliza um índice de palavra para o ID esperado no DB
 * Usado para validação de cliques
 */
export function normalizeWordForLookup(word: string): string {
  return word.replace(/[.,;:!?—\-'"()\[\]«»“”‘’]/g, '').toLowerCase().trim();
}

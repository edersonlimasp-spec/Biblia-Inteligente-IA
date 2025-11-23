/**
 * Parse verse text and find Strong Numbers for each word
 * Usa mapeamento contextual por livro/capítulo/verso
 */

import { findStrongForWord } from '@/../../server/almeida-strong-mappings';

export interface WordData {
  word: string;
  strongNumber: string | null;
  originalWord?: string;
}

export function parseVerseWithStrong(
  book: string,
  chapter: number,
  verse: number,
  text: string
): WordData[] {
  // Split by whitespace, preserving punctuation
  const words = text.split(/\s+/);
  
  return words.map((wordWithPunctuation) => {
    // Remove trailing punctuation to find Strong
    const word = wordWithPunctuation.replace(/[.,;:!?\-'"()¶]+$/, '');
    
    // Filter very short words (< 3 chars)
    const strongNumber = word.length >= 3 
      ? findStrongForWord(book, chapter, verse, word)
      : null;
    
    return {
      word: wordWithPunctuation,
      strongNumber,
    };
  });
}

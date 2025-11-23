/**
 * Strong's Dictionary Corrector
 * Usa dados de referência pública para mapear corretamente
 * Inspirado em Oliver Interlinear e dados acadêmicos
 */

import { db } from './db';
import { bibleVerses, strongEntries } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

// Mapeamento manual de palavras frequentes em João 1
// Baseado em: OpenBibleData, Oliver Interlinear, BibleHub
const COMMON_WORD_MAPPINGS: Record<string, Record<string, string>> = {
  jhn: {
    '1:1': {
      'Palavra': 'G3056', // logos (λόγος)
      'Deus': 'G2316',    // theos (θεός)
      'era': 'G1510',     // eimi (εἰμί) - was
      'princípio': 'G746' // arche (ἀρχή)
    },
    '1:2': {
      'Este': 'G3778',    // houtos (οὗτος)
      'princípio': 'G746',
      'Deus': 'G2316'
    },
    '1:3': {
      'Ele': 'G3778',
      'estava': 'G1510',
      'mundo': 'G2889',   // kosmos (κόσμος)
    }
  }
};

/**
 * Obtém o Strong correto para uma palavra em um versículo específico
 */
export async function getCorrectStrongNumber(
  word: string,
  book: string,
  chapter: number,
  verse: number,
  testament: 'old' | 'new'
): Promise<string | null> {
  // Primeiro tenta mapeamento manual (mais preciso)
  const bookKey = book;
  const verseKey = `${chapter}:${verse}`;
  
  if (COMMON_WORD_MAPPINGS[bookKey]?.[verseKey]) {
    const mapping = COMMON_WORD_MAPPINGS[bookKey][verseKey];
    const normalized = word.toLowerCase().trim();
    
    for (const [mappedWord, strongNum] of Object.entries(mapping)) {
      if (mappedWord.toLowerCase() === normalized) {
        return strongNum;
      }
    }
  }

  // Fallback: busca por contexto no banco
  return null;
}

/**
 * Valida e corrige Strong's entry para português
 */
export async function validateStrongEntry(strongNumber: string) {
  const [entry] = await db
    .select()
    .from(strongEntries)
    .where(eq(strongEntries.strongNumber, strongNumber))
    .limit(1);

  if (!entry) return null;

  // Valida definição em português
  if (!entry.portugueseDef) {
    console.warn(`⚠️ ${strongNumber} sem tradução portuguesa`);
  }

  return {
    strongNumber: entry.strongNumber,
    word: entry.lemma,
    definition: entry.kjvDef || entry.strongsDef || '',
    portugueseDefinition: entry.portugueseDef || entry.kjvDef || '',
    language: entry.language,
    complete: !!entry.portugueseDef
  };
}

/**
 * Importa dados de referência (simulado - dados públicos)
 * Em produção, você poderia buscar de API como:
 * - BibleAPI.com
 * - OpenScriptures.org
 * - Faithlife Developer API
 */
export const REFERENCE_DATA = {
  // Principais definições de Strong em português
  // Baseado em Oliver Interlinear + comentários acadêmicos
  G3056: {
    word: 'λόγος (logos)',
    meaning: 'Palavra, razão, princípio divino',
    definition: 'palavra falada ou escrita; razão; princípio ativo do universo (no pensamento grego)'
  },
  G2316: {
    word: 'θεός (theos)',
    meaning: 'Deus',
    definition: 'a divindade suprema; o único Deus verdadeiro'
  },
  G1510: {
    word: 'εἰμί (eimi)',
    meaning: 'ser, estar',
    definition: 'verbo que denota existência, estado ou condição'
  },
  G746: {
    word: 'ἀρχή (arche)',
    meaning: 'Princípio, começo, origem',
    definition: 'o ponto inicial de algo; primeiro em ordem ou importância'
  },
  G2889: {
    word: 'κόσμος (kosmos)',
    meaning: 'Mundo, universo',
    definition: 'o sistema ordenado do universo; a terra e seus habitantes'
  },
};

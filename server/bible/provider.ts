/**
 * Bible Provider - Camada de acesso aos dados bíblicos
 * 
 * Esta camada abstrai a fonte dos dados (DB local ou API externa)
 * e fornece uma interface única para acesso aos textos.
 */

import { db } from "../db";
import { bibleVerses } from "../../shared/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { getTranslation, hasDataAvailable, getDefaultTranslation } from "./translations";
import type { BibleVerse as DBBibleVerse } from "../../shared/schema";

export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  versionCode: string;
}

export interface ChapterResult {
  book: string;
  chapter: number;
  versionCode: string;
  verses: BibleVerse[];
  fallbackUsed?: boolean;
  fallbackFrom?: string;
}

export class BibleProvider {
  
  /**
   * Obtém um versículo específico
   */
  async getVerse(
    versionCode: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<BibleVerse | null> {
    const resolvedVersion = this.resolveVersion(versionCode);
    
    const result = await db
      .select()
      .from(bibleVerses)
      .where(
        and(
          eq(bibleVerses.versionCode, resolvedVersion),
          eq(bibleVerses.book, book.toLowerCase()),
          eq(bibleVerses.chapter, chapter),
          eq(bibleVerses.verse, verse)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    return {
      id: result[0].id,
      book: result[0].book,
      chapter: result[0].chapter,
      verse: result[0].verse,
      text: result[0].text,
      versionCode: resolvedVersion
    };
  }

  /**
   * Obtém todos os versículos de um capítulo
   */
  async getChapter(
    versionCode: string,
    book: string,
    chapter: number
  ): Promise<ChapterResult> {
    const originalVersion = versionCode;
    const resolvedVersion = this.resolveVersion(versionCode);
    const fallbackUsed = resolvedVersion !== originalVersion;

    const verses = await db
      .select()
      .from(bibleVerses)
      .where(
        and(
          eq(bibleVerses.versionCode, resolvedVersion),
          eq(bibleVerses.book, book.toLowerCase()),
          eq(bibleVerses.chapter, chapter)
        )
      )
      .orderBy(bibleVerses.verse);

    return {
      book: book.toLowerCase(),
      chapter,
      versionCode: resolvedVersion,
      verses: verses.map(v => ({
        id: v.id,
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        versionCode: resolvedVersion
      })),
      fallbackUsed,
      fallbackFrom: fallbackUsed ? originalVersion : undefined
    };
  }

  /**
   * Busca versículos por texto
   */
  async search(
    versionCode: string,
    query: string,
    limit: number = 50
  ): Promise<BibleVerse[]> {
    const resolvedVersion = this.resolveVersion(versionCode);

    const results = await db
      .select()
      .from(bibleVerses)
      .where(
        and(
          eq(bibleVerses.versionCode, resolvedVersion),
          ilike(bibleVerses.text, `%${query}%`)
        )
      )
      .limit(limit);

    return results.map(v => ({
      id: v.id,
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
      versionCode: resolvedVersion
    }));
  }

  /**
   * Resolve a versão a ser usada
   * Se a versão solicitada não tem dados, usa fallback
   */
  private resolveVersion(versionCode: string): string {
    if (hasDataAvailable(versionCode)) {
      return versionCode;
    }

    const translation = getTranslation(versionCode);
    if (translation) {
      const defaultForLanguage = getDefaultTranslation(translation.language);
      console.log(`[BibleProvider] Fallback: ${versionCode} -> ${defaultForLanguage} (sem dados)`);
      return defaultForLanguage;
    }

    console.log(`[BibleProvider] Versão desconhecida: ${versionCode} -> ACF`);
    return "ACF";
  }

  /**
   * Verifica se uma versão tem dados disponíveis
   */
  hasData(versionCode: string): boolean {
    return hasDataAvailable(versionCode);
  }

  /**
   * Obtém estatísticas de versões
   */
  async getVersionStats(): Promise<Record<string, number>> {
    const result = await db
      .select({
        versionCode: bibleVerses.versionCode,
        count: sql<number>`count(*)`
      })
      .from(bibleVerses)
      .groupBy(bibleVerses.versionCode);

    return result.reduce((acc, row) => {
      acc[row.versionCode] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);
  }
}

export const bibleProvider = new BibleProvider();

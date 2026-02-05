/**
 * Cross References Service
 * Módulo de referências cruzadas bíblicas - ISOLADO do core
 * Não altera as 7 camadas existentes
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { bibleBooks } from './bible-data/books';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CrossReference {
  ref: string;
  reason?: string;
}

interface BookRefsData {
  bookId: string;
  chapters: Record<string, Record<string, CrossReference[]>>;
}

const refsCache: Map<string, BookRefsData | null> = new Map();

function getRefsFilePath(bookId: string): string {
  return path.join(__dirname, '..', 'data', 'refs', `${bookId}.json`);
}

export function loadBookRefs(bookId: string): BookRefsData | null {
  if (refsCache.has(bookId)) {
    return refsCache.get(bookId) || null;
  }

  const filePath = getRefsFilePath(bookId);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as BookRefsData;
      refsCache.set(bookId, data);
      return data;
    }
  } catch (error) {
    console.error(`[CrossRefs] Error loading refs for ${bookId}:`, error);
  }

  refsCache.set(bookId, null);
  return null;
}

export function getCrossReferences(bookId: string, chapter: number, verse: number): CrossReference[] {
  const bookData = loadBookRefs(bookId);
  
  if (!bookData || !bookData.chapters) {
    return [];
  }

  const chapterData = bookData.chapters[String(chapter)];
  if (!chapterData) {
    return [];
  }

  const verseRefs = chapterData[String(verse)];
  if (!Array.isArray(verseRefs)) {
    return [];
  }

  return verseRefs;
}

export function parseRef(refString: string): { bookId: string; chapter: number; verse: number } | null {
  const parts = refString.split('.');
  if (parts.length !== 3) return null;

  const [bookId, chapterStr, verseStr] = parts;
  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);

  if (isNaN(chapter) || isNaN(verse)) return null;

  const book = bibleBooks.find(b => b.id === bookId);
  if (!book) return null;

  return { bookId, chapter, verse };
}

export function formatRef(bookId: string, chapter: number, verse: number): string {
  const book = bibleBooks.find(b => b.id === bookId);
  if (!book) return `${bookId} ${chapter}:${verse}`;
  return `${book.name} ${chapter}:${verse}`;
}

export function clearRefsCache(): void {
  refsCache.clear();
}

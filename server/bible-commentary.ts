/**
 * Bible Commentary Service
 * Módulo de comentários bíblicos - ISOLADO do core
 * Não altera as 7 camadas existentes
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CommentaryBlock {
  source: string;
  type: 'doctrinal' | 'historical' | 'linguistic' | 'devotional' | 'general';
  title?: string;
  text: string;
}

interface BookCommentaryData {
  bookId: string;
  chapters: Record<string, Record<string, CommentaryBlock[]>>;
}

const commentaryCache: Map<string, BookCommentaryData | null> = new Map();

function getCommentaryFilePath(bookId: string): string {
  return path.join(__dirname, '..', 'data', 'commentary', `${bookId}.json`);
}

export function loadBookCommentary(bookId: string): BookCommentaryData | null {
  if (commentaryCache.has(bookId)) {
    return commentaryCache.get(bookId) || null;
  }

  const filePath = getCommentaryFilePath(bookId);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as BookCommentaryData;
      commentaryCache.set(bookId, data);
      return data;
    }
  } catch (error) {
    console.error(`[Commentary] Error loading commentary for ${bookId}:`, error);
  }

  commentaryCache.set(bookId, null);
  return null;
}

export function getCommentary(bookId: string, chapter: number, verse: number): CommentaryBlock[] {
  const bookData = loadBookCommentary(bookId);
  
  if (!bookData || !bookData.chapters) {
    return [];
  }

  const chapterData = bookData.chapters[String(chapter)];
  if (!chapterData) {
    return [];
  }

  const verseCommentary = chapterData[String(verse)];
  if (!Array.isArray(verseCommentary)) {
    return [];
  }

  return verseCommentary;
}

export function clearCommentaryCache(): void {
  commentaryCache.clear();
}

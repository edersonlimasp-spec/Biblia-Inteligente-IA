import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, ensureAdmin, ensureSuperAdmin, optionalAuth, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "../auth";
import { sendPasswordResetEmail, sendReengagementEmail } from "../email";
import admin from "firebase-admin";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { askTheologicalQuestion, generateBiblicalImage, analyzeImageWithVision } from "../openai";
import { insertUserSchema, insertSubscriptionSchema, insertBookmarkSchema, insertAnnotationSchema, insertAIHistorySchema, strongEntries, users, subscriptions, bonuses, bibleVersions, bibleVerses, userBiblePreferences, bibleWords, pdfWordIndex, studyModules, studyTracks, studyLessons, studyModuleTranslations, studyTrackTranslations, studyLessonTranslations, guests, coupons, couponRedemptions, type Coupon, type CouponRedemption, insertCouponSchema, sermonRecordings } from "@shared/schema";
import { z } from "zod";
import { bibleBooks, getBookById } from "../bible-data/books";
import { getBookChapter } from "../bible-data/bible-index";
import { GREEK_WORD_MAPPINGS, HEBREW_WORD_MAPPINGS } from "../priority-word-mappings";
import { db } from "../db";
import { eq, or, like, sql, and, inArray, gte, desc } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { forceSeedStrongEntries, forceSeedStudyModules } from "../init-db";
import { getGoogleAccessToken } from "../payments/google";
import { STRONG_DATA } from "../strong-data-embedded";
import { TRANSLATION_REGISTRY, getEnabledTranslations, hasDataAvailable, getTranslation, getDefaultTranslation } from "../bible/translations";
import iapRoutes from "../payments/iap-routes";
import { generateStrongDefinition, isEntryIncomplete } from "../services/strong-ai-generator";
import { readingPlanService } from "../reading-plans";
import { transcribeAudio, generateSermonSummary, generateShareToken } from "../services/sermon-ai";
import { GENESIS_WORD_STRONG } from "../genesis-strong-mappings";
import { EXO_WORD_STRONG } from "../exo-strong-mappings";
import { NUM_WORD_STRONG } from "../num-strong-mappings";
import { LEV_WORD_STRONG } from "../lev-strong-mappings";
import { DEU_WORD_STRONG } from "../deu-strong-mappings";
import { getClientPlatform, getPlatformAllowedSources, getFromStrongCache, setInStrongCache, initFirebaseAdmin, firebaseInitialized } from "./shared";

export function registerBibleRoutes(app: Express): void {
  app.get("/api/user/bible-preferences", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const [prefs] = await db.select().from(userBiblePreferences)
        .where(eq(userBiblePreferences.userId, req.userId!))
        .limit(1);
      
      res.json(prefs || {
        defaultVersionCode: 'ACF',
        lastViewedVersionCode: 'ACF',
      });
    } catch {
      res.json({
        defaultVersionCode: 'ACF',
        lastViewedVersionCode: 'ACF',
      });
    }
  });

  // Update user's bible preferences
  app.patch("/api/user/bible-preferences", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { defaultVersionCode, lastViewedVersionCode } = req.body;
      
      const [prefs] = await db.select().from(userBiblePreferences)
        .where(eq(userBiblePreferences.userId, req.userId!))
        .limit(1);
      
      if (prefs) {
        await db.update(userBiblePreferences).set({
          defaultVersionCode: defaultVersionCode || prefs.defaultVersionCode,
          lastViewedVersionCode: lastViewedVersionCode || prefs.lastViewedVersionCode,
          updatedAt: new Date(),
        }).where(eq(userBiblePreferences.userId, req.userId!));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ error: "Erro ao atualizar preferências" });
    }
  });

  // Bible routes
  app.get("/api/bible/books", async (req, res) => {
    try {
      // Return all 66 books of the Bible
      res.json(bibleBooks);
    } catch (error) {
      console.error("Get books error:", error);
      res.status(500).json({ error: "Erro ao buscar livros" });
    }
  });

  // Global Bible search - search entire Bible for a word/phrase
  // Enhanced: Also searches Strong's transliterations (Hebrew/Greek)
  app.get("/api/bible/search-all", async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      const version = (req.query.version as string) || 'ACF';
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Termo de busca deve ter pelo menos 2 caracteres" });
      }

      // Detect transliteration patterns (Hebrew/Greek)
      // Patterns: contains apostrophe ('), hyphen with specific patterns, or Hebrew/Greek characters
      const isTransliterationPattern = /['-]/.test(query) || 
        /[\u0590-\u05FF]/.test(query) ||  // Hebrew Unicode range
        /[\u0370-\u03FF]/.test(query);     // Greek Unicode range

      let strongMatch: { strongNumber: string; translit: string | null; lemma: string; language: string } | null = null;
      let strongResults: any[] = [];
      let textResults: any[] = [];

      // If query looks like transliteration, try Strong search FIRST
      if (isTransliterationPattern) {
        // Search Strong's by transliteration or lemma
        const strongEntry = await db
          .select({
            strongNumber: strongEntries.strongNumber,
            translit: strongEntries.translit,
            lemma: strongEntries.lemma,
            language: strongEntries.language,
          })
          .from(strongEntries)
          .where(
            or(
              sql`LOWER(${strongEntries.translit}) = ${query.toLowerCase()}`,
              sql`LOWER(${strongEntries.xlit}) = ${query.toLowerCase()}`,
              sql`${strongEntries.lemma} = ${query}`
            )
          )
          .limit(1);

        if (strongEntry.length > 0) {
          strongMatch = strongEntry[0];
          const matchedStrongNumber = strongMatch.strongNumber;
          
          // Optimized: Use subquery to get unique verses with their text in a single query
          const versesWithText = await db
            .selectDistinctOn([bibleWords.book, bibleWords.chapter, bibleWords.verse], {
              book: bibleWords.book,
              chapter: bibleWords.chapter,
              verse: bibleWords.verse,
              originalWord: bibleWords.originalWord,
              text: bibleVerses.text,
            })
            .from(bibleWords)
            .leftJoin(
              bibleVerses,
              and(
                eq(bibleWords.book, bibleVerses.book),
                eq(bibleWords.chapter, bibleVerses.chapter),
                eq(bibleWords.verse, bibleVerses.verse),
                eq(bibleVerses.versionCode, version)
              )
            )
            .where(eq(bibleWords.strongNumber, matchedStrongNumber))
            .orderBy(bibleWords.book, bibleWords.chapter, bibleWords.verse)
            .limit(limit);

          for (const row of versesWithText) {
            if (row.text) {
              const bookData = getBookById(row.book);
              strongResults.push({
                book: row.book,
                chapter: row.chapter,
                verse: row.verse,
                text: row.text,
                bookName: bookData?.name || row.book,
                reference: `${bookData?.name || row.book} ${row.chapter}:${row.verse}`,
                originalWord: row.originalWord,
              });
            }
          }
        }
      }

      // If no Strong results found OR query is not a transliteration, search text
      if (strongResults.length === 0) {
        textResults = await db
          .select({
            book: bibleVerses.book,
            chapter: bibleVerses.chapter,
            verse: bibleVerses.verse,
            text: bibleVerses.text,
          })
          .from(bibleVerses)
          .where(
            and(
              eq(bibleVerses.versionCode, version),
              sql`LOWER(${bibleVerses.text}) LIKE ${'%' + query.toLowerCase() + '%'}`
            )
          )
          .orderBy(bibleVerses.book, bibleVerses.chapter, bibleVerses.verse)
          .limit(limit);
      }

      // Map book IDs to names for text results
      const resultsWithNames = textResults.map(r => {
        const bookData = getBookById(r.book);
        return {
          ...r,
          bookName: bookData?.name || r.book,
          reference: `${bookData?.name || r.book} ${r.chapter}:${r.verse}`,
        };
      });

      // Return Strong results if found, otherwise text results
      const finalResults = strongResults.length > 0 ? strongResults : resultsWithNames;

      // Note: Strong lookup is public (returns Bible verses which are public)
      // strongMatch metadata is only shown to indicate which Strong was searched
      // Full Strong definitions require authentication via /api/strong/:number endpoint
      res.json({
        query,
        version,
        total: finalResults.length,
        results: finalResults,
        strongMatch: strongMatch ? {
          strongNumber: strongMatch.strongNumber,
          translit: strongMatch.translit,
          lemma: strongMatch.lemma,
          language: strongMatch.language,
        } : null,
        isStrongSearch: strongResults.length > 0,
      });
    } catch (error) {
      console.error("Global search error:", error);
      res.status(500).json({ error: "Erro ao buscar na Bíblia" });
    }
  });

  app.get("/api/bible/:bookId/:chapter", async (req, res) => {
    // Prevent browser caching - version changes must always fetch fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const { bookId, chapter: chapterNum } = req.params;
      const requestedVersion = (req.query.version as string);
      
      // OBRIGATÓRIO: Log de entrada com todos os parâmetros
      console.log(`[Bible API] REQUEST: book=${bookId}, chapter=${chapterNum}, version=${requestedVersion || '(não enviado)'}`);
      
      // WARNING: Se version não for enviado, retornar erro em vez de default silencioso
      if (!requestedVersion) {
        console.warn(`[Bible API] WARNING: version não fornecida, usando ACF como fallback`);
      }
      
      const version_to_use = requestedVersion || 'ACF';
      const book = getBookById(bookId);
      
      if (!book) {
        return res.status(404).json({ error: "Livro não encontrado" });
      }

      const chapterInt = parseInt(chapterNum);
      if (isNaN(chapterInt) || chapterInt < 1 || chapterInt > book.chapters) {
        return res.status(404).json({ 
          error: "Capítulo inválido",
          message: `O livro ${book.name} tem ${book.chapters} capítulos. Capítulo ${chapterNum} não existe.`
        });
      }

      // Resolve version - use fallback if no data available
      let version = version_to_use;
      let fallbackUsed = false;
      let fallbackFrom: string | undefined;

      // Check if requested version has data
      const translation = getTranslation(version_to_use);
      if (!hasDataAvailable(version_to_use) && translation) {
        // Fallback to default for same language
        version = getDefaultTranslation(translation.language);
        fallbackUsed = true;
        fallbackFrom = version_to_use;
        console.log(`[Bible API] Fallback: ${version_to_use} -> ${version} (versão sem dados)`);
      }
      
      console.log(`[Bible API] RESOLVING: requested=${version_to_use}, resolved=${version}, fallback=${fallbackUsed}`);
      

      // Try to fetch from database
      let verses = await db
        .select()
        .from(bibleVerses)
        .where(
          and(
            eq(bibleVerses.versionCode, version),
            eq(bibleVerses.book, bookId),
            eq(bibleVerses.chapter, chapterInt)
          )
        )
        .orderBy(bibleVerses.verse);

      // If still no verses, try language-appropriate fallback
      if (!verses || verses.length === 0) {
        // Get fallback based on requested version's language
        const reqTranslation = getTranslation(version_to_use);
        const languageFallback = reqTranslation ? getDefaultTranslation(reqTranslation.language) : 'ACF';
        
        if (version !== languageFallback) {
          console.log(`[Bible API] No data for ${version}, trying ${languageFallback} fallback`);
          verses = await db
            .select()
            .from(bibleVerses)
            .where(
              and(
                eq(bibleVerses.versionCode, languageFallback),
                eq(bibleVerses.book, bookId),
                eq(bibleVerses.chapter, chapterInt)
              )
            )
            .orderBy(bibleVerses.verse);
          
          if (verses && verses.length > 0) {
            fallbackUsed = true;
            fallbackFrom = requestedVersion;
            version = languageFallback;
            console.log(`[Bible API] Using ${languageFallback} as fallback for ${requestedVersion}`);
          }
        }
      }

      // If still no data, try hardcoded fallback
      if (!verses || verses.length === 0) {
        const fallbackChapterData = getBookChapter(bookId, chapterInt);
        if (!fallbackChapterData) {
          return res.status(404).json({ 
            error: "Capítulo não encontrado",
            message: `Nenhum dado disponível para ${book.name} ${chapterInt}`
          });
        }
        
        res.json({ 
          book, 
          chapter: fallbackChapterData, 
          available: true, 
          version: 'ACF',
          requestedVersion,
          source: 'fallback',
          fallbackUsed: true,
          fallbackFrom: requestedVersion
        });
        return;
      }

      // Format verses from database
      const formattedVerses = verses.map(v => ({
        verse: v.verse,
        text: v.text
      }));

      res.json({ 
        book, 
        chapter: {
          chapter: chapterInt,
          verses: formattedVerses
        },
        available: true, 
        version,
        requestedVersion,
        source: 'database',
        fallbackUsed,
        fallbackFrom
      });
    } catch (error) {
      console.error("Get chapter error:", error);
      res.status(500).json({ error: "Erro ao buscar capítulo" });
    }
  });

  // Cache for Strong word mappings by language (Greek vs Hebrew)
  // Loaded once on first request per language, avoids repeated 14k+ row queries
  let strongWordMappingCacheGreek: Map<string, string> | null = null;
  let strongWordMappingCacheHebrew: Map<string, string> | null = null;
  let strongCacheLoadTime: number = 0;
  const STRONG_CACHE_TTL = 3600000; // 1 hour in milliseconds

  // New Testament books (use Greek Strong numbers starting with G)
  const NT_BOOKS = new Set([
    'mat', 'mrk', 'luk', 'jhn', 'act', 'rom', '1co', '2co', 'gal', 'eph',
    'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb', 'jas',
    '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev'
  ]);

  function isNewTestament(bookId: string): boolean {
    return NT_BOOKS.has(bookId.toLowerCase());
  }


  async function getStrongWordMapping(forGreek: boolean): Promise<Map<string, string>> {
    const now = Date.now();
    
    // Check cached version for this language
    if (forGreek && strongWordMappingCacheGreek && (now - strongCacheLoadTime) < STRONG_CACHE_TTL) {
      return strongWordMappingCacheGreek;
    }
    if (!forGreek && strongWordMappingCacheHebrew && (now - strongCacheLoadTime) < STRONG_CACHE_TTL) {
      return strongWordMappingCacheHebrew;
    }

    console.log(`[Strong Cache] Loading ${forGreek ? 'Greek' : 'Hebrew'} word mappings...`);
    const startTime = Date.now();
    
    // Filter by language prefix (G for Greek, H for Hebrew)
    const prefix = forGreek ? 'G' : 'H';
    const allStrongEntries = await db.select({
      strongNumber: strongEntries.strongNumber,
      portugueseDef: strongEntries.portugueseDef,
    }).from(strongEntries)
      .where(sql`${strongEntries.strongNumber} LIKE ${prefix + '%'}`);

    const defWordsToStrong = new Map<string, string>();
    
    // First, add all comprehensive Portuguese biblical word mappings (highest priority)
    const priorityMappings = forGreek ? GREEK_WORD_MAPPINGS : HEBREW_WORD_MAPPINGS;
    for (const [word, strongNum] of Object.entries(priorityMappings)) {
      defWordsToStrong.set(word, strongNum);
    }
    
    // Add Pentateuch word mappings for Old Testament (Genesis-Deuteronomy - 18,300+ unique words)
    if (!forGreek) {
      // Genesis mappings (3465+ words)
      for (const [word, strongNum] of Object.entries(GENESIS_WORD_STRONG)) {
        if (!defWordsToStrong.has(word)) {
          defWordsToStrong.set(word, strongNum);
        }
      }
      // Exodus mappings (4202+ words)
      for (const [word, strongNum] of Object.entries(EXO_WORD_STRONG)) {
        if (!defWordsToStrong.has(word)) {
          defWordsToStrong.set(word, strongNum);
        }
      }
      // Leviticus mappings (2726+ words)
      for (const [word, strongNum] of Object.entries(LEV_WORD_STRONG)) {
        if (!defWordsToStrong.has(word)) {
          defWordsToStrong.set(word, strongNum);
        }
      }
      // Numbers mappings (3878+ words)
      for (const [word, strongNum] of Object.entries(NUM_WORD_STRONG)) {
        if (!defWordsToStrong.has(word)) {
          defWordsToStrong.set(word, strongNum);
        }
      }
      // Deuteronomy mappings (4106+ words)
      for (const [word, strongNum] of Object.entries(DEU_WORD_STRONG)) {
        if (!defWordsToStrong.has(word)) {
          defWordsToStrong.set(word, strongNum);
        }
      }
    }
    
    // Extract FIRST WORD ONLY from each Portuguese definition (primary meaning)
    // This avoids incorrect mappings from descriptive phrases
    // Excluded words that cause incorrect mappings (too generic or from descriptions)
    const excludedWords = new Set([
      'cima', 'baixo', 'alto', 'lugar', 'local', 'parte', 'lado', 'meio', 'centro',
      'tipo', 'forma', 'modo', 'maneira', 'espécie', 'gênero', 'classe',
      'nome', 'palavra', 'termo', 'expressão', 'frase',
      'pessoa', 'coisa', 'objeto', 'elemento', 'aspecto',
      'tempo', 'momento', 'período', 'época', 'fase',
      'ação', 'ato', 'estado', 'condição', 'situação',
      'origem', 'fonte', 'raiz', 'base', 'fundamento',
      'uso', 'emprego', 'aplicação', 'sentido', 'significado',
      'exemplo', 'caso', 'instância', 'ocorrência',
      'relação', 'conexão', 'ligação', 'vínculo',
      'para', 'como', 'qual', 'onde', 'quando', 'porque',
      'mais', 'menos', 'muito', 'pouco', 'bem', 'mal',
      'ser', 'estar', 'ter', 'haver', 'fazer', 'dar',
      'que', 'quem', 'qual', 'cujo', 'onde',
    ]);
    
    for (const entry of allStrongEntries) {
      if (entry.portugueseDef) {
        // Get first significant word from definition (primary meaning)
        const firstWords = entry.portugueseDef.toLowerCase()
          .split(/[,;.:\-—()'"\/\n]/)[0] // Get first segment before punctuation
          .split(/\s+/)
          .map((w: string) => w.replace(/[.,;:!?"'()0-9\*\#]/g, '').trim())
          .filter((w: string) => w.length >= 3 && !excludedWords.has(w));
        
        // Only use the FIRST meaningful word to avoid context pollution
        if (firstWords.length > 0) {
          const primaryWord = firstWords[0];
          if (!defWordsToStrong.has(primaryWord)) {
            defWordsToStrong.set(primaryWord, entry.strongNumber);
          }
        }
      }
    }

    // Cache by language
    if (forGreek) {
      strongWordMappingCacheGreek = defWordsToStrong;
    } else {
      strongWordMappingCacheHebrew = defWordsToStrong;
    }
    strongCacheLoadTime = now;
    console.log(`[Strong Cache] Loaded ${defWordsToStrong.size} ${forGreek ? 'Greek' : 'Hebrew'} word mappings (${Object.keys(priorityMappings).length} priority) in ${Date.now() - startTime}ms`);
    
    return defWordsToStrong;
  }

  // Get words with Strong numbers for a chapter (for pre-highlighting)
  // STRATEGY 1: Use bible_words table - matches gloss against verse text using
  //             Portuguese inflection variants (singular/plural, common verb forms)
  // STRATEGY 2: Fallback to curated word mappings for words not in bible_words
  // RESPONSE: { strongWords: Record<verse, string[]>, strongMap: Record<verse, Record<word, strongNumber>> }
  //   - strongWords: backwards-compat list of clickable words per verse
  //   - strongMap: NEW shape with the actual Strong number per matched word — lets
  //               the client open the modal in one round-trip
  app.get("/api/bible/:bookId/:chapter/strong-words", async (req, res) => {
    try {
      const { bookId, chapter: chapterNum } = req.params;
      const chapterInt = parseInt(chapterNum);
      
      if (isNaN(chapterInt)) {
        return res.status(400).json({ error: "Capítulo inválido" });
      }

      // Helpers — strip accents and punctuation for robust matching
      const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanWord = (s: string) => stripAccents(s.toLowerCase())
        .replace(/[.,;:!?—\-'"()\[\]«»“”‘’]/g, '')
        .trim();

      // Generate Portuguese inflection variants of a normalized (lowercase, no-accent) gloss.
      // Used to match verse forms like "céus" against gloss "céu", "homens" against "homem", etc.
      // Conservative: only common, mostly-unambiguous patterns to avoid false positives.
      const expandPortugueseVariants = (normalized: string): Set<string> => {
        const out = new Set<string>();
        if (!normalized || normalized.length < 3) return out;
        out.add(normalized);

        // Plural variants
        if (/[aeiou]$/.test(normalized)) {
          out.add(normalized + 's');
        }
        if (normalized.endsWith('l')) {
          out.add(normalized.slice(0, -1) + 'is');         // papel → papeis
        }
        if (normalized.endsWith('m')) {
          out.add(normalized.slice(0, -1) + 'ns');         // homem → homens
        }
        if (normalized.endsWith('ao')) {
          out.add(normalized.slice(0, -2) + 'oes');        // ração → rações (sem acento)
          out.add(normalized.slice(0, -2) + 'aos');        // mão → mãos
          out.add(normalized.slice(0, -2) + 'aes');        // pão → pães
        }
        if (normalized.endsWith('r') || normalized.endsWith('s') || normalized.endsWith('z')) {
          out.add(normalized + 'es');                      // mar → mares
        }

        // Singular variants (when gloss is plural)
        if (normalized.endsWith('s') && normalized.length > 4) {
          out.add(normalized.slice(0, -1));                // dias → dia
          if (normalized.endsWith('oes')) {
            out.add(normalized.slice(0, -3) + 'ao');       // rações → ração
          }
          if (normalized.endsWith('aes') || normalized.endsWith('aos')) {
            out.add(normalized.slice(0, -3) + 'ao');       // pães/mãos → pão/mão
          }
          if (normalized.endsWith('ns')) {
            out.add(normalized.slice(0, -2) + 'm');        // homens → homem
          }
          if (normalized.endsWith('is') && normalized.length > 4) {
            out.add(normalized.slice(0, -2) + 'l');        // papeis → papel
          }
        }

        // Safety: never produce variants shorter than 3 chars to avoid
        // false-positive matches on common particles (os, as, es, mar...)
        for (const v of Array.from(out)) {
          if (v.length < 3) out.delete(v);
        }

        return out;
      };

      // STRATEGY 1: Pull all (verse, gloss, strongNumber, pdfStrong) tuples for this chapter.
      // pdf_strong (when set) is the SBB-specific exhaustive Strong for the inflected form
      // (e.g. ἦν → G2258, although the lemma εἰμί is G1510). We PREFER it because that's
      // what the printed Bible's interlinear shows.
      const wordsWithStrong = await db
        .select({
          verse: bibleWords.verse,
          wordPosition: bibleWords.wordPosition,
          gloss: bibleWords.gloss,
          strongNumber: bibleWords.strongNumber,
          pdfStrong: bibleWords.pdfStrong,
        })
        .from(bibleWords)
        .where(
          and(
            eq(bibleWords.book, bookId.toLowerCase()),
            eq(bibleWords.chapter, chapterInt),
            sql`${bibleWords.strongNumber} IS NOT NULL AND ${bibleWords.strongNumber} != ''`
          )
        )
        .orderBy(bibleWords.verse, bibleWords.wordPosition);

      // verse -> { variant -> strongNumber } (variant is normalized, accent-stripped)
      // TWO-PASS so EXACT gloss matches always beat expanded plural/singular variants.
      // Without this, "deu" (gloss of G1325 dar) would expand to "deus" and shadow the
      // exact noun gloss "Deus" (G2316) when "deu" is processed first.
      const verseVariantToStrong: Record<number, Map<string, string>> = {};

      // PASS A — exact glosses only (these are authoritative)
      for (const w of wordsWithStrong) {
        if (!w.gloss || !w.strongNumber) continue;
        if (!verseVariantToStrong[w.verse]) verseVariantToStrong[w.verse] = new Map();
        const effectiveStrong = w.pdfStrong || w.strongNumber;
        for (const piece of w.gloss.toLowerCase().trim().split(/\s+/)) {
          const norm = cleanWord(piece);
          if (norm.length < 3) continue;
          if (!verseVariantToStrong[w.verse].has(norm)) {
            verseVariantToStrong[w.verse].set(norm, effectiveStrong);
          }
        }
      }
      // PASS B — expanded plural/singular variants (only fill empty slots)
      for (const w of wordsWithStrong) {
        if (!w.gloss || !w.strongNumber) continue;
        if (!verseVariantToStrong[w.verse]) verseVariantToStrong[w.verse] = new Map();
        const effectiveStrong = w.pdfStrong || w.strongNumber;
        for (const piece of w.gloss.toLowerCase().trim().split(/\s+/)) {
          const norm = cleanWord(piece);
          if (norm.length < 3) continue;
          const variants = expandPortugueseVariants(norm);
        variants.forEach((v) => {
          if (v === norm) return;
          if (!verseVariantToStrong[w.verse].has(v)) {
            verseVariantToStrong[w.verse].set(v, effectiveStrong);
          }
        });
        }
      }

      // Now walk the actual verse text and check which Portuguese words match a variant
      // Output the EXACT word as it appears (so the client tokenizer matches by lowercase)
      const verseWordsMap: Record<number, string[]> = {};
      const strongMap: Record<number, Record<string, string>> = {};

      const chapter = await getBookChapter(bookId.toLowerCase(), chapterInt);
      if (chapter?.verses) {
        for (const verse of chapter.verses) {
          const variantMap = verseVariantToStrong[verse.verse];
          if (!variantMap || variantMap.size === 0) continue;

          const words = verse.text.split(/\s+/);
          for (const raw of words) {
            const normLower = raw.toLowerCase().replace(/[.,;:!?—\-'"()\[\]«»“”‘’]/g, '').trim();
            if (normLower.length < 3) continue;
            const normNoAccent = cleanWord(raw);

            const sn = variantMap.get(normNoAccent);
            if (sn) {
              if (!verseWordsMap[verse.verse]) verseWordsMap[verse.verse] = [];
              if (!strongMap[verse.verse]) strongMap[verse.verse] = {};
              if (!verseWordsMap[verse.verse].includes(normLower)) {
                verseWordsMap[verse.verse].push(normLower);
              }
              if (!strongMap[verse.verse][normLower]) {
                strongMap[verse.verse][normLower] = sn;
              }
            }
          }
        }
      }

      // STRATEGY 2: Curated word mappings (Map<word, strongNumber>) — covers
      // common words in NT (Greek) and OT (Hebrew) that may not be in bible_words.
      // We populate BOTH verseWordsMap AND strongMap so the click is also fast.
      try {
        const isNT = isNewTestament(bookId);
        const wordMappings = await getStrongWordMapping(isNT);

        if (chapter?.verses) {
          for (const verse of chapter.verses) {
            const verseWords = verse.text.toLowerCase()
              .split(/\s+/)
              .map((w: string) => w.replace(/[.,;:!?—\-'"()\[\]«»“”‘’]/g, '').trim())
              .filter((w: string) => w.length >= 3);

            for (const word of verseWords) {
              const sn = wordMappings.get(word);
              if (sn) {
                if (!verseWordsMap[verse.verse]) verseWordsMap[verse.verse] = [];
                if (!strongMap[verse.verse]) strongMap[verse.verse] = {};
                if (!verseWordsMap[verse.verse].includes(word)) {
                  verseWordsMap[verse.verse].push(word);
                }
                // bible_words mapping (Strategy 1) wins over curated if both exist
                if (!strongMap[verse.verse][word]) {
                  strongMap[verse.verse][word] = sn;
                }
              }
            }
          }
        }
      } catch (mappingError) {
        console.warn("Word mapping check failed:", mappingError);
      }

      // STRATEGY 3: PDF SBB Almeida-Strong word index (per-book lookup)
      // Catches everything the printed reference Bible attributes a Strong to,
      // for words not yet in bible_words nor curated mappings. Uses normalized
      // (accent-stripped, lowercase) word as key. Strategies 1 e 2 win on conflict.
      try {
        const pdfIdx = await db
          .select({
            wordNorm: pdfWordIndex.wordNorm,
            strongNumber: pdfWordIndex.strongNumber,
          })
          .from(pdfWordIndex)
          .where(eq(pdfWordIndex.bookId, bookId.toLowerCase()));

        if (pdfIdx.length > 0 && chapter?.verses) {
          // Build O(1) lookup map (normalized word → Strong)
          const pdfLookup = new Map<string, string>();
          for (const row of pdfIdx) pdfLookup.set(row.wordNorm, row.strongNumber);

          for (const verse of chapter.verses) {
            const tokens = verse.text.split(/\s+/);
            for (const raw of tokens) {
              const lower = raw.toLowerCase().replace(/[.,;:!?—\-'"()\[\]«»“”‘’]/g, '').trim();
              if (lower.length < 3) continue;
              const normNoAccent = cleanWord(raw);
              const sn = pdfLookup.get(normNoAccent);
              if (!sn) continue;

              if (!verseWordsMap[verse.verse]) verseWordsMap[verse.verse] = [];
              if (!strongMap[verse.verse]) strongMap[verse.verse] = {};
              if (!verseWordsMap[verse.verse].includes(lower)) {
                verseWordsMap[verse.verse].push(lower);
              }
              // Strategies 1 (bible_words) e 2 (curated) já preencheram — só completa lacunas
              if (!strongMap[verse.verse][lower]) {
                strongMap[verse.verse][lower] = sn;
              }
            }
          }
        }
      } catch (pdfErr) {
        console.warn("PDF word index lookup failed:", pdfErr);
      }

      res.json({
        book: bookId,
        chapter: chapterInt,
        strongWords: verseWordsMap,        // backwards compat (string[])
        strongMap,                          // NEW: word -> strongNumber per verse
        totalWords: Object.values(verseWordsMap).flat().length,
      });
    } catch (error) {
      console.error("Get Strong words error:", error);
      res.status(500).json({ error: "Erro ao buscar palavras Strong" });
    }
  });

  // Cross References API (NEW MODULE - does not affect 7-layer system)
  app.get("/api/bible/cross-references", async (req, res) => {
    try {
      const { bookId, chapter, verse } = req.query;
      
      if (!bookId || !chapter || !verse) {
        return res.json({ refs: [] });
      }
      
      const chapterNum = parseInt(chapter as string);
      const verseNum = parseInt(verse as string);
      
      if (isNaN(chapterNum) || isNaN(verseNum)) {
        return res.json({ refs: [] });
      }
      
      const { getCrossReferences } = await import("../cross-references");
      const refs = getCrossReferences(bookId as string, chapterNum, verseNum);
      
      res.json({ refs });
    } catch (error) {
      console.error("Cross references error:", error);
      res.json({ refs: [] });
    }
  });

  // Bible Commentary API (NEW MODULE - does not affect 7-layer system)
  app.get("/api/bible/commentary", async (req, res) => {
    try {
      const { bookId, chapter, verse } = req.query;
      
      if (!bookId || !chapter || !verse) {
        return res.json({ commentary_blocks: [] });
      }
      
      const chapterNum = parseInt(chapter as string);
      const verseNum = parseInt(verse as string);
      
      if (isNaN(chapterNum) || isNaN(verseNum)) {
        return res.json({ commentary_blocks: [] });
      }
      
      const { getCommentary } = await import("../bible-commentary");
      const commentary_blocks = getCommentary(bookId as string, chapterNum, verseNum);
      
      res.json({ commentary_blocks });
    } catch (error) {
      console.error("Commentary error:", error);
      res.json({ commentary_blocks: [] });
    }
  });

  // Reading Progress routes
  app.get("/api/reading-progress", async (req, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      const userId = (req as AuthRequest).userId;
      
      if (!deviceId && !userId) {
        return res.json([]);
      }
      
      const progress = await storage.getReadingProgress(userId || undefined, deviceId || undefined);
      res.json(progress);
    } catch (error) {
      console.error("Get reading progress error:", error);
      res.status(500).json({ error: "Erro ao buscar progresso de leitura" });
    }
  });

  app.post("/api/reading-progress", async (req, res) => {
    try {
      const { book, chapter, deviceId, userId } = req.body;
      
      if (!book || !chapter) {
        return res.status(400).json({ error: "book e chapter são obrigatórios" });
      }
      
      await storage.trackChapterRead(userId || undefined, deviceId || undefined, book, chapter);
      res.json({ success: true });
    } catch (error) {
      console.error("Track reading progress error:", error);
      res.status(500).json({ error: "Erro ao salvar progresso" });
    }
  });

  // Achievements routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      const userId = (req as AuthRequest).userId;
      
      if (!deviceId && !userId) {
        return res.json([]);
      }
      
      const achievements = await storage.getAchievements(userId || undefined, deviceId || undefined);
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Erro ao buscar conquistas" });
    }
  });

  // Admin endpoint to force seed Strong entries in production

}

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, ensureAdmin, ensureSuperAdmin, optionalAuth, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "../auth";
import { sendPasswordResetEmail, sendReengagementEmail } from "../email";
import admin from "firebase-admin";
import crypto from "crypto";
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
import { findEmbeddedStrongEntry } from "../strong-embedded-fallback";

export function registerAiRoutes(app: Express): void {
  app.get("/api/subscriptions", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.userId!);
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscriptions error:", error);
      res.status(500).json({ error: "Erro ao buscar assinaturas" });
    }
  });

  app.post("/api/subscriptions", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse({
        ...req.body,
        userId: req.userId,
      });

      const subscription = await storage.createSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(400).json({ error: "Erro ao criar assinatura" });
    }
  });

  // Check access permissions - NOVA REGRA: Strong requer login, sem assinatura = 2 palavras
  app.get("/api/access/strong", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin tem acesso ilimitado
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      if (isAdmin) {
        return res.json({ 
          hasAccess: true,
          reason: 'admin',
          used: 0,
          limit: 999999,
          remaining: 999999,
        });
      }
      
      // Degustação Premium de 7 dias: acesso ilimitado ao Strong's
      const trialActiveStrong = isTrialActive(user.trialStartDate);
      if (trialActiveStrong) {
        return res.json({
          hasAccess: true,
          reason: 'trial',
          used: 0,
          limit: 999999,
          remaining: 999999,
        });
      }

      // Assinantes têm acesso ilimitado ou diário (platform-aware)
      const clientPlatform1 = getClientPlatform(req);
      const allowedSources1 = getPlatformAllowedSources(clientPlatform1);
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold', allowedSources1);
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium', allowedSources1);
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'strong_lifetime', allowedSources1);
      
      if (hasPremium || hasLifetime) {
        return res.json({ 
          hasAccess: true,
          reason: 'subscription',
          used: 0,
          limit: 999999,
          remaining: 999999,
        });
      }
      
      if (hasGold) {
        const todayLookups = await storage.getTodayStrongLookups(req.userId!);
        const remaining = Math.max(0, 20 - todayLookups);
        return res.json({ 
          hasAccess: remaining > 0,
          reason: remaining > 0 ? 'gold' : 'limit_reached',
          used: todayLookups,
          limit: 20,
          remaining,
          requiresSubscription: remaining === 0,
        });
      }
      
      // NOVA REGRA: 2 consultas Strong no total para não-assinantes
      const STRONG_FREE_LIMIT = 2;
      const freeQuota = await storage.getFreeStrongQuota(req.userId!);
      const strongUsed = freeQuota?.lookupsUsed || 0;
      const remaining = Math.max(0, STRONG_FREE_LIMIT - strongUsed);
      
      res.json({ 
        hasAccess: remaining > 0,
        reason: remaining > 0 ? 'free_plan' : 'limit_reached',
        used: strongUsed,
        limit: STRONG_FREE_LIMIT,
        remaining,
        requiresSubscription: remaining === 0,
      });
    } catch (error) {
      console.error("Check strong access error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso" });
    }
  });

  // IA Professor: PLANO GRATUITO = 3 perguntas NO TOTAL (1 sem login + 2 com login)
  app.get("/api/access/ai/:mode", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const mode = req.params.mode; // 'essential' or 'premium'
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin tem acesso ilimitado
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      if (isAdmin) {
        return res.json({ 
          hasAccess: true,
          reason: 'admin',
          used: 0,
          limit: 999999,
          remaining: 999999,
        });
      }
      
      // Degustação Premium de 7 dias: acesso ilimitado ao Strong's
      const trialActiveLookup = isTrialActive(user.trialStartDate);
      if (trialActiveLookup) {
        return res.json({
          hasAccess: true,
          reason: 'trial',
          used: 0,
          limit: 999999,
          remaining: 999999,
        });
      }

      // Platform-aware Strong's access check
      const strongPlatform = getClientPlatform(req);
      const strongAllowedSources = getPlatformAllowedSources(strongPlatform);
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold', strongAllowedSources);
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium', strongAllowedSources);

      // Assinantes têm acesso ilimitado
      if (hasGold || hasPremium) {
        return res.json({ 
          hasAccess: true,
          reason: hasPremium ? 'premium' : 'gold',
          used: 0,
          limit: 999999,
          remaining: 999999,
        });
      }

      // PLANO GRATUITO: 2 perguntas com login (além de 1 sem login = 3 total)
      const AI_FREE_LIMIT = 2;
      const totalUsed = await storage.getTotalUsageCount(req.userId!);
      const remaining = Math.max(0, AI_FREE_LIMIT - totalUsed);
      
      let hasAccess = false;
      if (mode === 'essential') {
        hasAccess = remaining > 0;
      } else if (mode === 'premium') {
        // Modos premium requerem assinatura Premium
        hasAccess = false;
      }

      res.json({ 
        hasAccess,
        reason: hasAccess ? 'free_plan' : 'limit_reached',
        used: totalUsed,
        limit: AI_FREE_LIMIT,
        remaining,
        requiresSubscription: !hasAccess,
      });
    } catch (error) {
      console.error("Check AI access error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso" });
    }
  });

  // AI Professor
  app.post("/api/ai/ask", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // Validação Zod de todos os parâmetros de entrada
      const aiAskSchema = z.object({
        question: z.string().min(1, "Pergunta é obrigatória"),
        book: z.string().optional(),
        chapter: z.number().int().positive().optional(),
        verse: z.number().int().positive().optional(),
        mode: z.enum(['essential', 'premium', 'professor', 'pregador', 'exegese', 'teologica']).default('essential'),
        language: z.enum(['pt', 'en', 'es']).default('pt'),
        conversationHistory: z.array(z.any()).optional(),
        imageBase64: z.string().optional(),
        imageMimeType: z.string().optional(),
        imageUrl: z.string().optional(),
      });
      const aiParsed = aiAskSchema.safeParse(req.body);
      if (!aiParsed.success) {
        return res.status(400).json({ error: aiParsed.error.errors[0]?.message ?? "Dados inválidos" });
      }
      const { question, book, chapter, verse, mode, language } = aiParsed.data;
      
      // Premium modes that require premium subscription
      const premiumModes = ['premium', 'pregador', 'exegese', 'teologica'];

      // Check subscription status (platform-aware)
      const aiPlatform = getClientPlatform(req);
      const aiAllowedSources = getPlatformAllowedSources(aiPlatform);

      // Fetch user, subscription flags and usage counters in parallel (cuts latency vs sequential DB round-trips)
      const [user, hasGold, hasPremium, hasLifetime, totalUsed, todayCount] = await Promise.all([
        storage.getUser(req.userId!),
        storage.hasActiveSubscription(req.userId!, 'gold', aiAllowedSources),
        storage.hasActiveSubscription(req.userId!, 'premium', aiAllowedSources),
        storage.hasActiveSubscription(req.userId!, 'lifetime', aiAllowedSources),
        storage.getTotalUsageCount(req.userId!),
        storage.getTodayUsageCount(req.userId!),
      ]);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin bypass - admins have full access to all features
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';

      // Degustação Premium de 7 dias: conta como Premium
      const trialActiveAI = isTrialActive(user.trialStartDate);

      // Trial = Premium durante a degustação de 7 dias
      const effectivePremiumAI = hasPremium || hasLifetime || trialActiveAI;

      // Enforce plan permissions BEFORE making OpenAI call (admins bypass all restrictions)
      if (premiumModes.includes(mode) && !effectivePremiumAI && !isAdmin) {
        const modeNames: Record<string, string> = {
          premium: 'Premium',
          pregador: 'Pregador',
          exegese: 'Exegese Profunda',
          teologica: 'Comparação Teológica'
        };
        return res.status(403).json({ 
          error: `O modo "${modeNames[mode] || mode}" requer assinatura Premium (R$ 19,90/mês).`,
          requiresSubscription: true,
          subscriptionType: 'premium'
        });
      }
      
      // Apenas assinantes têm acesso ilimitado (Gold/Premium/Lifetime)
      // Trial inclui acesso completo (como Premium)
      const hasFullAccess = hasGold || hasPremium || hasLifetime || trialActiveAI;

      // ----------------------------------------
      // PLANO GRATUITO: 2 perguntas com login (+ 1 sem login = 3 total)
      // ----------------------------------------
      const AI_FREE_LIMIT = 2;  // 2 perguntas para usuários logados sem assinatura

      if (!hasFullAccess && !isAdmin) {
        // Plano gratuito: verificar limite total
        if (totalUsed >= AI_FREE_LIMIT) {
          return res.status(429).json({ 
            error: `Você atingiu o limite de ${AI_FREE_LIMIT} perguntas do plano gratuito. Assine um plano para continuar usando o Professor IA.`,
            requiresSubscription: true,
            totalLimit: AI_FREE_LIMIT,
            usedTotal: totalUsed
          });
        }
      } else if (!isAdmin) {
        // Assinantes/trial: verificar limite diário (100 para Premium/Trial, 30 para Gold)
        const dailyLimit = effectivePremiumAI ? 100 : 30;
        if (todayCount >= dailyLimit) {
          return res.status(429).json({ 
            error: `Você atingiu o limite diário de ${dailyLimit} perguntas. ${
              effectivePremiumAI ? 'Aguarde até amanhã para continuar.' :
              'Faça upgrade para Premium (100 perguntas/dia) ou aguarde até amanhã.'
            }`,
            dailyLimit,
            usedToday: todayCount
          });
        }
      }

      // All validations passed - make OpenAI call
      const response = await askTheologicalQuestion({
        question,
        verse: verse !== undefined ? String(verse) : undefined,
        book,
        chapter,
        mode,
        language,
      });

      // Retornar informações de uso baseadas no tipo de acesso
      const usageInfo = hasFullAccess || isAdmin
        ? {
            usedToday: todayCount + 1,
            dailyLimit: hasPremium ? 100 : 30,
            remaining: (hasPremium ? 100 : 30) - (todayCount + 1)
          }
        : {
            usedTotal: totalUsed + 1,
            totalLimit: AI_FREE_LIMIT,
            remaining: AI_FREE_LIMIT - (totalUsed + 1)
          };

      // Increment usage count before responding to keep quota enforcement accurate
      // (prevents limit bypass under rapid/concurrent requests).
      await storage.incrementUsageCount(req.userId!);

      // Send the answer immediately; non-critical tracking/history persist in background.
      res.json({ 
        response,
        usageInfo
      });

      Promise.all([
        storage.trackPageEvent(req.userId!, 'AI_QUESTION', { mode, book, chapter, verse }),
        storage.createAIHistory({
          userId: req.userId!,
          book,
          chapter,
          verse,
          question,
          response,
          aiMode: mode,
        }),
      ]).catch((err) => console.error("[AI ask] background persistence error:", err));
    } catch (error: any) {
      console.error("AI ask error:", error);
      res.status(500).json({ error: error.message || "Erro ao processar pergunta" });
    }
  });

  // AI Image Generation - DALL-E 3 (Premium only)
  app.post("/api/ai/generate-image", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { prompt, language = 'pt' } = req.body;

      // Validate input
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Descrição da imagem é obrigatória" });
      }

      if (prompt.length > 500) {
        return res.status(400).json({ error: "Descrição muito longa (máximo 500 caracteres)" });
      }

      // Get user and check subscription
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin bypass
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      // Only Premium/Lifetime users can generate images (platform-aware)
      const imgPlatform = getClientPlatform(req);
      const imgAllowedSources = getPlatformAllowedSources(imgPlatform);
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium', imgAllowedSources);
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'lifetime', imgAllowedSources);

      if (!hasPremium && !hasLifetime && !isAdmin) {
        return res.status(403).json({ 
          error: "Geração de imagens é exclusiva para assinantes Premium.",
          requiresSubscription: true,
          subscriptionType: 'premium'
        });
      }

      // Generate image via DALL-E
      const result = await generateBiblicalImage({
        prompt,
        language: language as 'pt' | 'en' | 'es',
      });

      // Track image generation event
      await storage.trackPageEvent(req.userId!, 'AI_IMAGE_GENERATED', {
        prompt,
      });

      res.json({ 
        imageUrl: result.imageUrl,
        revisedPrompt: result.revisedPrompt,
      });
    } catch (error: any) {
      console.error("AI image generation error:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar imagem" });
    }
  });

  // AI Image Analysis - GPT-4o Vision (Premium only)
  app.post("/api/ai/analyze-image", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { imageBase64, mimeType, question, language = 'pt' } = req.body;

      // Validate input
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: "Imagem é obrigatória" });
      }

      if (!mimeType || !mimeType.startsWith('image/')) {
        return res.status(400).json({ error: "Tipo de arquivo inválido" });
      }

      // Check base64 size (max ~10MB encoded)
      if (imageBase64.length > 14_000_000) {
        return res.status(400).json({ error: "Imagem muito grande (máximo 10MB)" });
      }

      // Get user and check subscription
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin bypass
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      // Only Premium/Lifetime users can analyze images with Vision (platform-aware)
      const visionPlatform = getClientPlatform(req);
      const visionAllowedSources = getPlatformAllowedSources(visionPlatform);
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium', visionAllowedSources);
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'lifetime', visionAllowedSources);

      if (!hasPremium && !hasLifetime && !isAdmin) {
        return res.status(403).json({ 
          error: "Análise de imagens é exclusiva para assinantes Premium.",
          requiresSubscription: true,
          subscriptionType: 'premium'
        });
      }

      // Analyze image via GPT-4o Vision
      const result = await analyzeImageWithVision({
        imageBase64,
        mimeType,
        question: question || "Analise esta imagem no contexto bíblico.",
        language: language as 'pt' | 'en' | 'es',
      });

      // Track image analysis event
      await storage.trackPageEvent(req.userId!, 'AI_IMAGE_ANALYZED', {
        mimeType,
        hasQuestion: !!question,
      });

      res.json({ 
        analysis: result.analysis,
      });
    } catch (error: any) {
      console.error("AI image analysis error:", error);
      res.status(500).json({ error: error.message || "Erro ao analisar imagem" });
    }
  });

  // AI History
  app.get("/api/ai/history", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const history = await storage.getUserAIHistory(req.userId!);
      res.json(history);
    } catch (error) {
      console.error("Get AI history error:", error);
      res.status(500).json({ error: "Erro ao buscar histórico" });
    }
  });

  // AI Free Questions Quota (permanent count, not daily reset)
  // PLANO GRATUITO: 2 perguntas com login (+ 1 sem login = 3 total)
  const FREE_QUESTIONS_LIMIT = 2;
  
  app.get("/api/ai/quota", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Check if user has unlimited access (admin, subscription — platform-aware)
      // PLANO GRATUITO ESTRITO: apenas assinantes (Gold/Premium/Lifetime) têm acesso ilimitado
      // Sem trial, sem bonus - apenas assinaturas pagas
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      const recPlatform = getClientPlatform(req);
      const recAllowedSources = getPlatformAllowedSources(recPlatform);
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold', recAllowedSources);
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium', recAllowedSources);
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'lifetime', recAllowedSources);
      
      const hasUnlimitedAccess = isAdmin || hasGold || hasPremium || hasLifetime;
      
      if (hasUnlimitedAccess) {
        return res.json({
          used: 0,
          limit: -1, // Unlimited
          remaining: -1,
          hasUnlimitedAccess: true,
        });
      }
      
      // PLANO GRATUITO: 2 perguntas com login
      const totalUsed = await storage.getTotalUsageCount(req.userId!);
      const remaining = Math.max(0, FREE_QUESTIONS_LIMIT - totalUsed);
      
      res.json({
        used: totalUsed,
        limit: FREE_QUESTIONS_LIMIT,
        remaining,
        hasUnlimitedAccess: false,
      });
    } catch (error) {
      console.error("Get AI quota error:", error);
      res.status(500).json({ error: "Erro ao buscar quota" });
    }
  });
  
  app.post("/api/ai/migrate-guest-quota", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { guestQuestionsUsed } = req.body;
      
      if (typeof guestQuestionsUsed !== 'number' || guestQuestionsUsed < 0) {
        return res.status(400).json({ error: "Valor inválido" });
      }
      
      await storage.migrateGuestQuotaToUser(req.userId!, guestQuestionsUsed);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Migrate guest quota error:", error);
      res.status(500).json({ error: "Erro ao migrar quota" });
    }
  });

  // Strong Dictionary Quota endpoints
  // NOVA REGRA: Strong requer login, sem assinatura = 2 palavras
  const FREE_STRONG_LIMIT = 2; // Free users (logados sem assinatura) get 2 total
  const GOLD_STRONG_DAILY_LIMIT = 20; // Gold users get 20/day
  
  app.get("/api/strong/quota", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const user = req.dbUser ?? await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado", requiresLogin: true });
      }

      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      const sharePlatform = getClientPlatform(req);
      const shareAllowedSources = getPlatformAllowedSources(sharePlatform);
      const hasGold = await storage.hasActiveSubscription(userId, 'gold', shareAllowedSources);
      const hasPremium = await storage.hasActiveSubscription(userId, 'premium', shareAllowedSources);
      const hasLifetime = await storage.hasActiveSubscription(userId, 'strong_lifetime', shareAllowedSources);
      const hasActiveBonus = await storage.hasActiveBonus(userId);

      // Premium, Lifetime, Bonus and Admin have unlimited access
      if (hasPremium || hasLifetime || hasActiveBonus || isAdmin) {
        return res.json({
          used: 0,
          limit: -1,
          remaining: -1,
          type: 'unlimited',
          hasUnlimitedAccess: true,
        });
      }

      if (hasGold) {
        const todayLookups = await storage.getTodayStrongLookups(userId);
        return res.json({
          used: todayLookups,
          limit: GOLD_STRONG_DAILY_LIMIT,
          remaining: Math.max(0, GOLD_STRONG_DAILY_LIMIT - todayLookups),
          type: 'gold',
          hasUnlimitedAccess: false,
        });
      }

      // Free user (logado sem assinatura): 2 palavras total
      const quota = await storage.getFreeStrongQuota(userId);
      const used = quota?.lookupsUsed || 0;

      return res.json({
        used,
        limit: FREE_STRONG_LIMIT,
        remaining: Math.max(0, FREE_STRONG_LIMIT - used),
        type: 'free',
        hasUnlimitedAccess: false,
      });
    } catch (error) {
      console.error("Get Strong quota error:", error);
      res.status(500).json({ error: "Erro ao buscar quota Strong" });
    }
  });
  
  app.post("/api/strong/migrate-guest-quota", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { guestLookupsUsed } = req.body;
      
      if (typeof guestLookupsUsed !== 'number' || guestLookupsUsed < 0) {
        return res.status(400).json({ error: "Valor inválido" });
      }
      
      await storage.migrateGuestStrongQuotaToUser(req.userId!, guestLookupsUsed);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Migrate guest Strong quota error:", error);
      res.status(500).json({ error: "Erro ao migrar quota Strong" });
    }
  });

  // Bookmarks
  app.get("/api/strong/diagnostics", async (req, res) => {
    try {
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(strongEntries);
      const totalCount = Number(countResult[0]?.count) || 0;
      
      // Get sample entries
      const sampleHebrew = await db.select().from(strongEntries).where(like(strongEntries.strongNumber, 'H%')).limit(3);
      const sampleGreek = await db.select().from(strongEntries).where(like(strongEntries.strongNumber, 'G%')).limit(3);
      
      res.json({
        status: totalCount > 0 ? 'OK' : 'EMPTY',
        totalEntries: totalCount,
        hebrewCount: sampleHebrew.length,
        greekCount: sampleGreek.length,
        sampleHebrew: sampleHebrew.map(e => ({ number: e.strongNumber, word: e.lemma })),
        sampleGreek: sampleGreek.map(e => ({ number: e.strongNumber, word: e.lemma })),
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Strong Diagnostics] Error:", error);
      res.status(500).json({ status: 'ERROR', error: String(error) });
    }
  });

  // Strong's Dictionary routes (Database-driven with in-memory cache)
  // NOVA REGRA: Strong REQUER LOGIN. Sem assinatura: 2 palavras gratuitas, na 3ª mostra planos
  // Gold=20/day, Premium/Lifetime=unlimited
  app.get("/api/strong/:number", ensureAuthenticated, async (req: AuthRequest, res) => {
    const startTime = Date.now();
    try {
      const { number } = req.params;
      const upperNumber = number.toUpperCase();
      
      // Strong quota limits
      const STRONG_FREE_LIMIT = 2;       // 2 words total for free users (sem assinatura)
      const STRONG_GOLD_DAILY_LIMIT = 20; // 20/day for Gold
      // Premium/Lifetime = unlimited
      
      let quotaInfo: { used: number; limit: number; type: 'free' | 'gold' | 'unlimited' } | null = null;
      
      const userId = req.userId!;
      const user = req.dbUser ?? await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({
          error: "Usuário não encontrado. Faça login novamente.",
          requiresLogin: true,
          requiresSubscription: false,
          used: 0,
          limit: STRONG_FREE_LIMIT,
        });
      }
      
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      // Parallel subscription/bonus checks (cuts latency vs sequential DB round-trips)
      const [hasGold, hasPremium, hasLifetime, hasActiveBonus] = await Promise.all([
        storage.hasActiveSubscription(userId, 'gold'),
        storage.hasActiveSubscription(userId, 'premium'),
        storage.hasActiveSubscription(userId, 'strong_lifetime'),
        storage.hasActiveBonus(userId),
      ]);
      
      // Premium, Lifetime, Bonus and Admin have unlimited access
      if (hasPremium || hasLifetime || hasActiveBonus || isAdmin) {
        quotaInfo = { used: 0, limit: -1, type: 'unlimited' };
      } else if (hasGold) {
        // Gold users: 20 lookups per day
        const todayLookups = await storage.getTodayStrongLookups(userId);
        if (todayLookups >= STRONG_GOLD_DAILY_LIMIT) {
          return res.status(429).json({
            error: "Limite diário de 20 palavras Strong atingido. Aguarde até amanhã ou assine Premium para acesso ilimitado.",
            requiresSubscription: true,
            subscriptionType: 'premium',
            requiresLogin: false,
            used: todayLookups,
            limit: STRONG_GOLD_DAILY_LIMIT,
          });
        }
        quotaInfo = { used: todayLookups, limit: STRONG_GOLD_DAILY_LIMIT, type: 'gold' };
        await storage.incrementStrongLookups(userId);
      } else {
        // NOVA REGRA: Free user sem assinatura: 2 palavras gratuitas, na 3ª mostra planos
        const freeQuota = await storage.getFreeStrongQuota(userId);
        const used = freeQuota?.lookupsUsed || 0;
        
        if (used >= STRONG_FREE_LIMIT) {
          return res.status(429).json({
            error: "Você usou suas 2 palavras Strong gratuitas. Assine um plano para continuar estudando.",
            requiresSubscription: true,
            subscriptionType: 'gold',
            requiresLogin: false,
            used: used,
            limit: STRONG_FREE_LIMIT,
          });
        }
        quotaInfo = { used, limit: STRONG_FREE_LIMIT, type: 'free' };
        await storage.incrementFreeStrongQuota(userId);
      }
      
      // Check cache first (instant response)
      const cached = getFromStrongCache(upperNumber);
      if (cached) {
        console.log(`[Strong API] Cache HIT for ${upperNumber} (${Date.now() - startTime}ms)`);
        return res.json({ ...cached, quotaInfo });
      }
      
      // Query database for Strong's entry (single optimized query with index)
      let [entry] = await db
        .select()
        .from(strongEntries)
        .where(eq(strongEntries.strongNumber, upperNumber))
        .limit(1);

      // Produção pode ter uma tabela incompleta mesmo quando o léxico completo
      // está empacotado no servidor. Recupere a entrada autoritativa antes de
      // recorrer à IA, e repare a tabela para as próximas consultas.
      if (!entry) {
        const embeddedEntry = findEmbeddedStrongEntry(upperNumber);
        if (embeddedEntry) {
          console.log(`[Strong API] Restoring ${upperNumber} from embedded lexicon`);
          await db.insert(strongEntries).values(embeddedEntry).onConflictDoNothing();
          entry = embeddedEntry as typeof entry;
        }
      }
      
      const elapsed = Date.now() - startTime;
      console.log(`[Strong API] DB query for ${upperNumber}: ${elapsed}ms`);
      
      // If entry not found OR entry is incomplete, try AI generation
      const needsAIGeneration = !entry || (entry && isEntryIncomplete(entry));
      
      if (needsAIGeneration) {
        console.log(`[Strong API] Entry ${upperNumber} ${!entry ? 'not found' : 'incomplete'}, trying AI generation...`);
        
        const aiResult = await generateStrongDefinition(upperNumber, entry?.lemma);
        
        if (aiResult) {
          console.log(`[Strong API] AI generated definition for ${upperNumber}`);
          
          // If we have a partial entry, merge AI data with it
          if (entry) {
            // Update existing entry with AI-generated content
            await db.update(strongEntries)
              .set({
                portugueseDef: aiResult.portugueseDefinition,
                extendedDefinition: aiResult.portugueseDefinition,
                morphologicalInfo: aiResult.morphologicalInfo,
                synonymsRelated: aiResult.synonymsRelated,
                verseReferences: aiResult.verseReferences,
                aiGenerated: true,
              })
              .where(eq(strongEntries.strongNumber, upperNumber));
            
            const response = {
              number: entry.strongNumber,
              word: entry.lemma,
              transliteration: entry.translit || entry.xlit || aiResult.transliteration,
              pronunciation: entry.pron || aiResult.pronunciation || '',
              definition: aiResult.definition,
              portugueseDefinition: aiResult.portugueseDefinition,
              strongsDefinition: aiResult.definition,
              kjvDefinition: null,
              derivation: entry.derivation || null,
              extendedDefinition: aiResult.portugueseDefinition,
              morphologicalInfo: aiResult.morphologicalInfo,
              synonymsRelated: aiResult.synonymsRelated,
              verseReferences: aiResult.verseReferences,
              etymology: aiResult.etymology || null,
              historicalContext: aiResult.historicalContext || null,
              theologicalSignificance: aiResult.theologicalSignificance || null,
              semanticRange: aiResult.semanticRange || null,
              culturalBackground: aiResult.culturalBackground || null,
              language: entry.language,
              aiGenerated: true,
              quotaInfo,
            };
            
            const cacheData = { ...response };
            delete (cacheData as any).quotaInfo;
            setInStrongCache(upperNumber, cacheData);
            
            return res.json(response);
          } else {
            // Create new entry entirely from AI
            const newEntry = {
              strongNumber: upperNumber,
              language: aiResult.language,
              lemma: aiResult.word,
              translit: aiResult.transliteration,
              pron: aiResult.pronunciation,
              kjvDef: aiResult.definition,
              portugueseDef: aiResult.portugueseDefinition,
              strongsDef: aiResult.definition,
              extendedDefinition: aiResult.portugueseDefinition,
              morphologicalInfo: aiResult.morphologicalInfo,
              synonymsRelated: aiResult.synonymsRelated,
              verseReferences: aiResult.verseReferences,
              aiGenerated: true,
            };
            
            // Save to database for future lookups
            await db.insert(strongEntries).values(newEntry).onConflictDoNothing();
            
            const response = {
              number: upperNumber,
              word: aiResult.word,
              transliteration: aiResult.transliteration,
              pronunciation: aiResult.pronunciation,
              definition: aiResult.definition,
              portugueseDefinition: aiResult.portugueseDefinition,
              strongsDefinition: aiResult.definition,
              kjvDefinition: aiResult.definition,
              derivation: null,
              extendedDefinition: aiResult.portugueseDefinition,
              morphologicalInfo: aiResult.morphologicalInfo,
              synonymsRelated: aiResult.synonymsRelated,
              verseReferences: aiResult.verseReferences,
              etymology: aiResult.etymology || null,
              historicalContext: aiResult.historicalContext || null,
              theologicalSignificance: aiResult.theologicalSignificance || null,
              semanticRange: aiResult.semanticRange || null,
              culturalBackground: aiResult.culturalBackground || null,
              language: aiResult.language,
              aiGenerated: true,
              quotaInfo,
            };
            
            const cacheData = { ...response };
            delete (cacheData as any).quotaInfo;
            setInStrongCache(upperNumber, cacheData);
            
            return res.json(response);
          }
        }
        
        // AI generation failed and no entry exists
        if (!entry) {
          return res.status(404).json({ 
            error: "Entrada não encontrada",
            message: `Número Strong ${upperNumber} não encontrado e não foi possível gerar definição`
          });
        }
      }
      
      // Format response with ALL available fields for rich display
      const response = {
        number: entry.strongNumber,
        word: entry.lemma,
        transliteration: entry.translit || entry.xlit || '',
        pronunciation: entry.pron || '',
        definition: entry.kjvDef || entry.strongsDef || '',
        portugueseDefinition: entry.portugueseDef || null,
        strongsDefinition: entry.strongsDef || null,
        kjvDefinition: entry.kjvDef || null,
        derivation: entry.derivation || null,
        extendedDefinition: entry.extendedDefinition || null,
        morphologicalInfo: (entry as any).morphologicalInfo || null,
        synonymsRelated: (entry as any).synonymsRelated || null,
        verseReferences: (entry as any).verseReferences || null,
        language: entry.language,
        aiGenerated: (entry as any).aiGenerated || false,
        quotaInfo,
      };
      
      // Cache the result (without quotaInfo to keep cache clean)
      const cacheData = { ...response };
      delete (cacheData as any).quotaInfo;
      setInStrongCache(upperNumber, cacheData);
      
      res.json(response);
    } catch (error) {
      console.error("Get Strong entry error:", error);
      res.status(500).json({ error: "Erro ao buscar entrada do dicionário" });
    }
  });

  // Strong's occurrences - find all verses containing this Strong number
  app.get("/api/strong/:number/occurrences", async (req, res) => {
    try {
      const { number } = req.params;
      const { limit: limitParam } = req.query;
      const upperNumber = number.toUpperCase();
      const queryLimit = Math.min(parseInt(limitParam as string) || 50, 100);
      
      // Find all occurrences of this Strong number in bible_words
      const occurrences = await db
        .select({
          book: bibleWords.book,
          chapter: bibleWords.chapter,
          verse: bibleWords.verse,
          gloss: bibleWords.gloss,
          originalWord: bibleWords.originalWord,
        })
        .from(bibleWords)
        .where(eq(bibleWords.strongNumber, upperNumber))
        .limit(queryLimit);
      
      // Group by verse reference
      const verseMap = new Map<string, { book: string; chapter: number; verse: number; words: string[] }>();
      
      for (const occ of occurrences) {
        const ref = `${occ.book}:${occ.chapter}:${occ.verse}`;
        if (!verseMap.has(ref)) {
          verseMap.set(ref, {
            book: occ.book,
            chapter: occ.chapter,
            verse: occ.verse,
            words: []
          });
        }
        verseMap.get(ref)!.words.push(occ.gloss || occ.originalWord || '');
      }
      
      const groupedOccurrences = Array.from(verseMap.values()).slice(0, 30);
      
      res.json({
        strongNumber: upperNumber,
        totalOccurrences: occurrences.length,
        verses: groupedOccurrences,
      });
    } catch (error) {
      console.error("Get Strong occurrences error:", error);
      res.status(500).json({ error: "Erro ao buscar ocorrências" });
    }
  });

  // NOTA: Strong Search não cobra quota - apenas retorna o Strong number para uma palavra
  // A quota é cobrada no /api/strong/:number (quando o usuário abre a definição)
  // Isso permite que palavras em azul apareçam para todos, mas login é necessário para ver a definição
  app.get("/api/strong/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const { book, chapter, verse } = req.query as Record<string, string>;
      const lowerQuery = query.toLowerCase();
      
      // Este endpoint apenas retorna mapeamentos, não cobra quota
      // A quota é cobrada quando o usuário clica e abre /api/strong/:number
      
      // STRATEGY 0: PRIORITY - Check curated word mappings FIRST (most reliable for common words)
      // This prevents incorrect matches from bible_words or heuristic search
      const otBooksForPriority = ['gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa', '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro', 'ecc', 'sng', 'isa', 'jer', 'lam', 'eze', 'dan', 'hos', 'joe', 'amo', 'oba', 'jon', 'mic', 'nah', 'hab', 'zep', 'hag', 'zec', 'mal'];
      const isOT = otBooksForPriority.includes(book?.toLowerCase() || '');
      const priorityMappings = isOT ? HEBREW_WORD_MAPPINGS : GREEK_WORD_MAPPINGS;
      
      // Normalize the query word
      const normalizedQuery = lowerQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
      
      // Check if this common word has a priority mapping
      if (priorityMappings[lowerQuery] || priorityMappings[normalizedQuery]) {
        const strongNum = priorityMappings[lowerQuery] || priorityMappings[normalizedQuery];
        console.log(`[Strong Search] PRIORITY MATCH: "${lowerQuery}" -> ${strongNum}`);
        
        const [strongEntry] = await db
          .select()
          .from(strongEntries)
          .where(eq(strongEntries.strongNumber, strongNum))
          .limit(1);
        
        if (strongEntry) {
          // NOVA REGRA: Search retorna apenas info básica. Definição completa requer login via /api/strong/:number
          return res.json({
            results: [{
              number: strongEntry.strongNumber,
              word: strongEntry.lemma,
              transliteration: strongEntry.translit || strongEntry.xlit || '',
              language: strongEntry.language,
              // Sem definição - requer login para ver
            }],
            total: 1,
            source: 'priority_mapping',
            exactMatch: true
          });
        }
      }
      
      // STRATEGY 1: Try exact match from bible_words table
      if (book && chapter && verse) {
        const bibleWordMappings = await db
          .select()
          .from(bibleWords)
          .where(
            and(
              eq(bibleWords.book, book.toLowerCase()),
              eq(bibleWords.chapter, parseInt(chapter)),
              eq(bibleWords.verse, parseInt(verse))
            )
          )
          .orderBy(bibleWords.wordPosition);
        
        if (bibleWordMappings.length > 0) {
          // Normalize function for comparison
          const normalize = (str: string) => str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z]/g, '');
          
          const normalizedQuery = normalize(lowerQuery);
          
          // Find matching word by gloss with deterministic priority
          // Priority 1: Exact match after normalization
          // Priority 2: Gloss contains query
          // Priority 3: Query contains gloss
          let matchedWord = bibleWordMappings.find(bw => 
            normalize(bw.gloss || '') === normalizedQuery
          );
          
          if (!matchedWord) {
            matchedWord = bibleWordMappings.find(bw => 
              normalize(bw.gloss || '').includes(normalizedQuery)
            );
          }
          
          if (!matchedWord) {
            matchedWord = bibleWordMappings.find(bw => 
              normalizedQuery.includes(normalize(bw.gloss || ''))
            );
          }
          
          if (matchedWord && matchedWord.strongNumber) {
            // Get full Strong entry for this number
            const strongEntry = await db
              .select()
              .from(strongEntries)
              .where(eq(strongEntries.strongNumber, matchedWord.strongNumber))
              .limit(1);
            
            if (strongEntry.length > 0) {
              const e = strongEntry[0];
              // NOVA REGRA: Search retorna apenas info básica. Definição completa requer login via /api/strong/:number
              return res.json({
                results: [{
                  number: e.strongNumber,
                  word: e.lemma,
                  transliteration: e.translit || e.xlit || '',
                  language: e.language,
                  // Sem definição - requer login para ver
                }],
                total: 1,
                source: 'bible_words',
                exactMatch: true
              });
            }
          }
        }
      }
      
      // STRATEGY 2: DISABLED - Heuristic search was causing incorrect mappings
      // Instead of guessing, we now inform the user that no verified mapping exists
      // This ensures data integrity and prevents incorrect Strong's references
      
      console.log(`[Strong Search] No verified mapping found for "${lowerQuery}" in ${book || 'unknown'}:${chapter || '?'}:${verse || '?'}`);
      
      res.json({ 
        results: [],
        total: 0,
        source: 'no_verified_mapping',
        message: 'Mapeamento Strong não disponível para esta palavra neste versículo. Apenas palavras com mapeamento verificado são exibidas.',
        contextUsed: true
      });
    } catch (error) {
      console.error("Search Strong error:", error);
      res.status(500).json({ error: "Erro ao buscar no dicionário" });
    }
  });

  // -----------------------------------
  // BILLING ROUTES - RevenueCat Integration
  // -----------------------------------

  // Get user billing status
  app.get("/api/billing/status", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      const trialActive = isTrialActive(user.trialStartDate);
      const subscriptions = await storage.getUserSubscriptions(user.id);
      
      const activeSubscription = subscriptions.find(s => s.status === 'active');
      const planType = activeSubscription?.planType || (trialActive ? 'trial' : 'free');
      
      res.json({
        planType,
        trialActive,
        trialDaysRemaining: trialActive ? getTrialDaysRemaining(user.trialStartDate) : 0,
        hasActiveSubscription: !!activeSubscription,
        subscription: activeSubscription || null,
      });
    } catch (error) {
      console.error("Billing status error:", error);
      res.status(500).json({ error: "Erro ao obter status de cobrança" });
    }
  });

  // Webhook para eventos RevenueCat
  app.post("/api/billing/webhook", async (req, res) => {
    try {
      const { event, app_user_id, entitlements } = req.body;
      
      if (!app_user_id) {
        return res.status(400).json({ error: "app_user_id ausente" });
      }

      const user = await storage.getUser(app_user_id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Map entitlements to plan types
      let planType = 'free';
      if (entitlements?.includes('entitlement_premium')) {
        planType = 'premium';
      } else if (entitlements?.includes('entitlement_gold')) {
        planType = 'gold';
      } else if (entitlements?.includes('entitlement_strong_lifetime')) {
        planType = 'strong_lifetime';
      }

      // Create or update subscription based on event
      if (event === 'INITIAL_PURCHASE' || event === 'RENEWAL' || event === 'PRODUCT_CHANGE') {
        await storage.createSubscription({
          userId: user.id,
          planType,
          status: 'active',
          amount: planType === 'gold' ? '9.90' : planType === 'premium' ? '19.90' : '0',
        });
      } else if (event === 'CANCELLATION' || event === 'EXPIRATION') {
        // Mark subscriptions as cancelled
        const subscriptions = await storage.getUserSubscriptions(user.id);
        for (const sub of subscriptions) {
          if (sub.planType === planType) {
            // Update subscription status to cancelled
            // (would need to implement updateSubscription method)
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Billing webhook error:", error);
      res.status(500).json({ error: "Erro ao processar webhook" });
    }
  });

  // --------------------------------------------
  // ADMIN ROUTES (Protected by role guards)
  // --------------------------------------------

  // Admin Dashboard - Stats

}

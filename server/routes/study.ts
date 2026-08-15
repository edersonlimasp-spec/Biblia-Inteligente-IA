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

export function registerStudyRoutes(app: Express): void {
  // ==================== STUDY COMPLETIONS (cartão "Seu ritmo") ====================

  // Lista as conclusões dos últimos 90 dias do usuário logado
  app.get("/api/study/completions", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const completions = await storage.getUserStudyCompletions(req.userId!, since);
      res.json(completions.map((c) => ({ ts: c.completedAt.getTime(), type: c.type ?? undefined })));
    } catch (error) {
      console.error("Erro ao buscar conclusões:", error);
      res.status(500).json({ error: "Erro ao buscar conclusões" });
    }
  });

  // Registra uma conclusão (aula, devocional ou capítulo da Biblioteca)
  app.post("/api/study/completions", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const bodySchema = z.object({
        type: z.string().max(50).optional(),
        ts: z.number().optional(), // timestamp em ms (para sincronizar conclusões offline)
      });
      const { type, ts } = bodySchema.parse(req.body ?? {});
      const completedAt = ts ? new Date(ts) : undefined;
      // Rejeita timestamps inválidos ou futuros
      if (completedAt && (isNaN(completedAt.getTime()) || completedAt.getTime() > Date.now() + 5 * 60 * 1000)) {
        return res.status(400).json({ error: "Timestamp inválido" });
      }
      const completion = await storage.createStudyCompletion({
        userId: req.userId!,
        type: type ?? null,
        ...(completedAt ? { completedAt } : {}),
      });
      res.json({ ts: completion.completedAt.getTime(), type: completion.type ?? undefined });
    } catch (error) {
      console.error("Erro ao registrar conclusão:", error);
      res.status(400).json({ error: "Erro ao registrar conclusão" });
    }
  });

  // ==================== PROFESSOR PREMIUM (Study Modules) ====================
  
  // Helper function to get translated module
  async function getTranslatedModule(module: any, lang: string): Promise<any> {
    if (lang === 'pt') return module;
    
    const [translation] = await db.select().from(studyModuleTranslations)
      .where(and(eq(studyModuleTranslations.moduleId, module.id), eq(studyModuleTranslations.language, lang)));
    
    if (translation) {
      return { ...module, name: translation.name, description: translation.description };
    }
    return module; // Fallback to PT
  }
  
  // Helper function to get translated track
  async function getTranslatedTrack(track: any, lang: string): Promise<any> {
    if (lang === 'pt') return track;
    
    const [translation] = await db.select().from(studyTrackTranslations)
      .where(and(eq(studyTrackTranslations.trackId, track.id), eq(studyTrackTranslations.language, lang)));
    
    if (translation) {
      return { ...track, name: translation.name, description: translation.description };
    }
    return track; // Fallback to PT
  }
  
  // Helper function to get translated lesson
  async function getTranslatedLesson(lesson: any, lang: string): Promise<any> {
    console.log(`[Translation] Lesson ${lesson.id}, lang=${lang}`);
    if (lang === 'pt') return lesson;
    
    const [translation] = await db.select().from(studyLessonTranslations)
      .where(and(eq(studyLessonTranslations.lessonId, lesson.id), eq(studyLessonTranslations.language, lang)));
    
    if (translation) {
      console.log(`[Translation] Found translation for ${lesson.id} in ${lang}: "${translation.title}"`);
      return {
        ...lesson,
        title: translation.title,
        content: translation.content,
        references: translation.references,
        questions: translation.questions,
        application: translation.application,
        summary: translation.summary,
      };
    }
    console.log(`[Translation] No translation found for ${lesson.id} in ${lang}, using PT fallback`);
    return lesson; // Fallback to PT
  }
  
  // Get all study modules
  app.get("/api/study/modules", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const lang = (req.query.lang as string) || 'pt';
      const modules = await storage.getStudyModules();

      if (modules.length === 0) return res.json([]);

      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;

      // Batch: 1 query para todas as trilhas, 1 para todas as lições, 1 para o progresso do usuário
      const moduleIds = modules.map(m => m.id);
      const [allTracks, userProgress] = await Promise.all([
        db.select().from(studyTracks).where(inArray(studyTracks.moduleId, moduleIds)),
        storage.getUserStudyProgress(userId, deviceId),
      ]);

      const trackIds = allTracks.map(t => t.id);
      const allLessons = trackIds.length > 0
        ? await db.select({ id: studyLessons.id, trackId: studyLessons.trackId })
            .from(studyLessons).where(inArray(studyLessons.trackId, trackIds))
        : [];

      // Montar lookups em memória
      const tracksByModule = new Map<string, typeof allTracks>();
      for (const t of allTracks) {
        const arr = tracksByModule.get(t.moduleId) ?? [];
        arr.push(t);
        tracksByModule.set(t.moduleId, arr);
      }
      const lessonIdsByTrack = new Map<string, string[]>();
      for (const l of allLessons) {
        const arr = lessonIdsByTrack.get(l.trackId) ?? [];
        arr.push(l.id);
        lessonIdsByTrack.set(l.trackId, arr);
      }
      const completedSet = new Set(
        userProgress.filter(p => p.completed).map(p => p.lessonId)
      );

      const computeModuleProgress = (moduleId: string) => {
        const tracks = tracksByModule.get(moduleId) ?? [];
        const lessonIds = tracks.flatMap(t => lessonIdsByTrack.get(t.id) ?? []);
        const total = lessonIds.length;
        if (total === 0) return { total: 0, completed: 0, percentage: 0 };
        const done = (userId || deviceId)
          ? lessonIds.filter(id => completedSet.has(id)).length
          : 0;
        return { total, completed: done, percentage: Math.round((done / total) * 100) };
      };

      // Tradução ainda por módulo (só faz query se lang !== 'pt')
      const modulesWithProgress = await Promise.all(modules.map(async (module) => {
        const progress = computeModuleProgress(module.id);
        const translatedModule = await getTranslatedModule(module, lang);
        return { ...translatedModule, progress };
      }));

      res.json(modulesWithProgress);
    } catch (error) {
      console.error("Get study modules error:", error);
      res.status(500).json({ error: "Erro ao buscar módulos de estudo" });
    }
  });
  
  // Get a specific module with tracks
  app.get("/api/study/modules/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const lang = (req.query.lang as string) || 'pt';
      const module = await storage.getStudyModuleById(id);
      
      if (!module) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }
      
      const translatedModule = await getTranslatedModule(module, lang);
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      const tracks = await storage.getModuleTracks(id);
      
      // Batch: buscar todas as lições das trilhas + progresso em 2 queries (elimina N+1)
      const trackIds = tracks.map(t => t.id);
      const [allModuleLessons, userProgress] = await Promise.all([
        trackIds.length > 0
          ? db.select({ id: studyLessons.id, trackId: studyLessons.trackId })
              .from(studyLessons).where(inArray(studyLessons.trackId, trackIds))
          : Promise.resolve([] as { id: string; trackId: string }[]),
        storage.getUserStudyProgress(userId, deviceId),
      ]);

      const lessonIdsByTrack = new Map<string, string[]>();
      for (const l of allModuleLessons) {
        const arr = lessonIdsByTrack.get(l.trackId) ?? [];
        arr.push(l.id);
        lessonIdsByTrack.set(l.trackId, arr);
      }
      const completedSet = new Set(
        userProgress.filter(p => p.completed).map(p => p.lessonId)
      );

      const tracksWithDetails = await Promise.all(tracks.map(async (track) => {
        const translatedTrack = await getTranslatedTrack(track, lang);
        const trackLessonIds = lessonIdsByTrack.get(track.id) ?? [];
        const completedLessons = (userId || deviceId)
          ? trackLessonIds.filter(id => completedSet.has(id)).length
          : 0;
        return {
          ...translatedTrack,
          totalLessons: trackLessonIds.length,
          completedLessons,
          percentage: trackLessonIds.length > 0
            ? Math.round((completedLessons / trackLessonIds.length) * 100)
            : 0,
        };
      }));

      // Progresso geral calculado dos dados já buscados (sem query adicional)
      const allLessonIds = allModuleLessons.map(l => l.id);
      const totalLessons = allLessonIds.length;
      const completedTotal = (userId || deviceId)
        ? allLessonIds.filter(id => completedSet.has(id)).length
        : 0;
      const overallProgress = {
        total: totalLessons,
        completed: completedTotal,
        percentage: totalLessons > 0 ? Math.round((completedTotal / totalLessons) * 100) : 0,
      };
      
      res.json({ 
        module: translatedModule, 
        tracks: tracksWithDetails,
        progress: overallProgress,
      });
    } catch (error) {
      console.error("Get study module error:", error);
      res.status(500).json({ error: "Erro ao buscar módulo de estudo" });
    }
  });
  
  // Get track with lessons (metadata only - no content for security)
  app.get("/api/study/tracks/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const lang = (req.query.lang as string) || 'pt';
      const lessons = await storage.getTrackLessons(id);
      
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      const userProgress = await storage.getUserStudyProgress(userId, deviceId);
      
      // Return only metadata - NOT content (content is protected in /api/study/lessons/:id)
      // Translate lesson titles
      const lessonsWithProgress = await Promise.all(lessons.map(async (lesson) => {
        const translatedLesson = await getTranslatedLesson(lesson, lang);
        const progress = userProgress.find(p => p.lessonId === lesson.id);
        return {
          id: lesson.id,
          title: translatedLesson.title,
          order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes,
          completed: progress?.completed || false,
          lastAccessAt: progress?.lastAccessAt || null,
        };
      }));
      
      res.json({ lessons: lessonsWithProgress });
    } catch (error) {
      console.error("Get track lessons error:", error);
      res.status(500).json({ error: "Erro ao buscar lições da trilha" });
    }
  });
  
  // Get a specific lesson (with access control)
  app.get("/api/study/lessons/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const lang = (req.query.lang as string) || 'pt';
      
      // Get lesson with full context (track, module, indices)
      const lessonContext = await storage.getLessonWithContext(id);
      
      if (!lessonContext) {
        return res.status(404).json({ error: "Lição não encontrada" });
      }
      
      const { lesson, track, module, lessonIndex, moduleIndex } = lessonContext;
      const userId = req.userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      const isLoggedIn = !!userId;
      
      // Check if admin (including super_admin)
      let isAdmin = false;
      if (userId) {
        const user = await storage.getUser(userId);
        isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      }
      
      // Get user plan (using hasActiveSubscription which checks BOTH subscriptions AND bonuses)
      let userPlan: 'free' | 'gold' | 'premium' = 'free';
      if (userId) {
        const hasPremium = await storage.hasActiveSubscription(userId, 'premium');
        const hasGold = await storage.hasActiveSubscription(userId, 'gold');
        const hasLifetime = await storage.hasActiveSubscription(userId, 'strong_lifetime');
        
        if (hasPremium) {
          userPlan = 'premium';
        } else if (hasGold || hasLifetime) {
          userPlan = 'gold';
        }
      }
      
      // Import and use canOpenLesson
      const { canOpenLesson } = await import("@shared/courseAccess");
      const courseLevel = track.level as 'iniciante' | 'moderado' | 'avancado';
      
      // DEBUG: Log access check parameters
      console.log(`[Lesson Access] userId=${userId}, plan=${userPlan}, courseLevel=${courseLevel}, moduleIndex=${moduleIndex}, lessonIndex=${lessonIndex}, isAdmin=${isAdmin}, isLoggedIn=${isLoggedIn}`);
      
      const accessResult = canOpenLesson({
        isLoggedIn,
        plan: userPlan,
        courseLevel,
        moduleIndex,
        lessonIndex,
        isAdmin,
      });
      
      console.log(`[Lesson Access] RESULT: allowed=${accessResult.allowed}, reason=${accessResult.reason}, requiredPlan=${accessResult.requiredPlan}`);
      
      if (!accessResult.allowed) {
        if (accessResult.reason === 'NOT_AUTHENTICATED') {
          return res.status(401).json({ 
            error: accessResult.message,
            reason: 'NOT_AUTHENTICATED',
          });
        }
        return res.status(403).json({ 
          error: accessResult.message,
          reason: 'UPGRADE_REQUIRED',
          requiredPlan: accessResult.requiredPlan,
        });
      }
      
      // Mark as accessed
      if (userId || deviceId) {
        await storage.updateStudyProgress(userId, deviceId, id, false);
      }
      
      // Get translated lesson
      const translatedLesson = await getTranslatedLesson(lesson, lang);
      
      // Get progress info
      const userProgress = await storage.getUserStudyProgress(userId, deviceId);
      const progress = userProgress.find(p => p.lessonId === id);
      
      res.json({ 
        lesson: translatedLesson,
        completed: progress?.completed || false,
      });
    } catch (error) {
      console.error("Get lesson error:", error);
      res.status(500).json({ error: "Erro ao buscar lição" });
    }
  });
  
  // Update study progress (mark lesson as completed/incomplete)
  app.post("/api/study/progress", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { lessonId, completed } = req.body;
      
      if (!lessonId) {
        return res.status(400).json({ error: "ID da lição é obrigatório" });
      }
      
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      if (!userId && !deviceId) {
        return res.status(401).json({ error: "Usuário não identificado" });
      }
      
      const progress = await storage.updateStudyProgress(userId, deviceId, lessonId, completed === true);
      
      res.json({ success: true, progress });
    } catch (error) {
      console.error("Update study progress error:", error);
      res.status(500).json({ error: "Erro ao atualizar progresso" });
    }
  });

  // Migra o progresso de lições feito sem login (deviceId) para a conta do
  // usuário autenticado. Chamado pelo cliente após login/registro.
  app.post("/api/study/progress/migrate", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string || null;
      if (!deviceId) {
        return res.json({ success: true, migrated: 0, merged: 0 });
      }
      const result = await storage.migrateStudyProgressToUser(req.userId!, deviceId);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Migrate study progress error:", error);
      res.status(500).json({ error: "Erro ao migrar progresso" });
    }
  });

  // ============================================
  // IN-APP PURCHASE (iOS/Android) ROUTES
  // ============================================
  app.get("/api/reading-plans/templates", async (req, res) => {
    try {
      const { category, duration } = req.query;
      const templates = await readingPlanService.getAllTemplates({
        category: category as string,
        duration: duration as string,
      });
      res.json(templates);
    } catch (error) {
      console.error("[Reading Plans] Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch reading plan templates" });
    }
  });

  // GET /api/reading-plans/templates/:slug - Get a specific template by slug
  app.get("/api/reading-plans/templates/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const template = await readingPlanService.getTemplateBySlug(slug);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("[Reading Plans] Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // POST /api/reading-plans/user - Create a new user reading plan
  app.post("/api/reading-plans/user", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { templateId, startDate } = req.body;
      const deviceId = req.headers['x-device-id'] as string;
      const userId = req.userId || null;
      
      if (!templateId) {
        return res.status(400).json({ error: "templateId is required" });
      }
      
      if (!userId && !deviceId) {
        return res.status(400).json({ error: "User must be logged in or provide deviceId" });
      }
      
      const plan = await readingPlanService.createUserPlan(
        userId,
        deviceId,
        templateId,
        startDate ? new Date(startDate) : undefined
      );
      
      res.status(201).json(plan);
    } catch (error) {
      console.error("[Reading Plans] Error creating user plan:", error);
      res.status(500).json({ error: "Failed to create reading plan" });
    }
  });

  // GET /api/reading-plans/user - Get user's reading plans
  app.get("/api/reading-plans/user", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      const userId = req.userId || null;
      const { status } = req.query;
      
      if (!userId && !deviceId) {
        return res.status(400).json({ error: "User must be logged in or provide deviceId" });
      }
      
      const plans = await readingPlanService.getUserPlans(
        userId,
        deviceId,
        status as string
      );
      
      res.json(plans);
    } catch (error) {
      console.error("[Reading Plans] Error fetching user plans:", error);
      res.status(500).json({ error: "Failed to fetch reading plans" });
    }
  });

  // GET /api/reading-plans/user/active - Get user's active plan with today's reading
  app.get("/api/reading-plans/user/active", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      const userId = req.userId || null;
      
      if (!userId && !deviceId) {
        return res.status(400).json({ error: "User must be logged in or provide deviceId" });
      }
      
      const plans = await readingPlanService.getUserPlans(userId, deviceId, 'active');
      
      if (plans.length === 0) {
        return res.json({ activePlan: null });
      }
      
      const activePlan = plans[0];
      const todayReading = await readingPlanService.getTodaysReading(activePlan.id);
      const upcomingReadings = await readingPlanService.getUpcomingReadings(activePlan.id, 7);
      const overdueReadings = await readingPlanService.getOverdueReadings(activePlan.id);
      
      res.json({
        activePlan,
        todayReading,
        upcomingReadings,
        overdueReadings,
      });
    } catch (error) {
      console.error("[Reading Plans] Error fetching active plan:", error);
      res.status(500).json({ error: "Failed to fetch active plan" });
    }
  });

  // GET /api/reading-plans/user/:planId - Get a specific user plan
  app.get("/api/reading-plans/user/:planId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { planId } = req.params;
      const plan = await readingPlanService.getUserPlanById(planId);
      
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      
      const todayReading = await readingPlanService.getTodaysReading(planId);
      const upcomingReadings = await readingPlanService.getUpcomingReadings(planId, 7);
      const overdueReadings = await readingPlanService.getOverdueReadings(planId);
      
      res.json({
        plan,
        todayReading,
        upcomingReadings,
        overdueReadings,
      });
    } catch (error) {
      console.error("[Reading Plans] Error fetching user plan:", error);
      res.status(500).json({ error: "Failed to fetch reading plan" });
    }
  });

  // POST /api/reading-plans/user/:planId/complete - Mark a day's reading as complete
  app.post("/api/reading-plans/user/:planId/complete", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { planId } = req.params;
      const { dayIndex, completedReadings } = req.body;
      
      if (typeof dayIndex !== 'number') {
        return res.status(400).json({ error: "dayIndex is required" });
      }
      
      const result = await readingPlanService.markReadingComplete(
        planId,
        dayIndex,
        completedReadings
      );
      
      res.json(result);
    } catch (error) {
      console.error("[Reading Plans] Error completing reading:", error);
      res.status(500).json({ error: "Failed to mark reading as complete" });
    }
  });

  // PATCH /api/reading-plans/user/:planId - Update plan settings
  app.patch("/api/reading-plans/user/:planId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { planId } = req.params;
      const { status, notificationsEnabled, notificationTime } = req.body;
      
      if (status) {
        await readingPlanService.updatePlanStatus(planId, status);
      }
      
      if (typeof notificationsEnabled === 'boolean') {
        await readingPlanService.updateNotificationSettings(
          planId,
          notificationsEnabled,
          notificationTime
        );
      }
      
      const updatedPlan = await readingPlanService.getUserPlanById(planId);
      res.json(updatedPlan);
    } catch (error) {
      console.error("[Reading Plans] Error updating plan:", error);
      res.status(500).json({ error: "Failed to update reading plan" });
    }
  });

  // DELETE /api/reading-plans/user/:planId - Delete a user plan
  app.delete("/api/reading-plans/user/:planId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { planId } = req.params;
      await readingPlanService.deletePlan(planId);
      res.json({ success: true });
    } catch (error) {
      console.error("[Reading Plans] Error deleting plan:", error);
      res.status(500).json({ error: "Failed to delete reading plan" });
    }
  });

  // GET /api/reading-plans/books - Get all Bible books info
  app.get("/api/reading-plans/books", (_req, res) => {
    res.json(readingPlanService.getAllBooks());
  });

  // ============================================================
  // PRAYER MODULE ROUTES
  // ============================================================

  // GET /api/prayer/lists - Get user's prayer lists
  app.get("/api/prayer/lists", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || null;
      const deviceId = req.headers['x-device-id'] as string;
      
      if (!userId && !deviceId) {
        return res.json([]);
      }

      const lists = await storage.getPrayerLists(userId, deviceId);
      res.json(lists);
    } catch (error) {
      console.error("[Prayer] Error fetching lists:", error);
      res.status(500).json({ error: "Failed to fetch prayer lists" });
    }
  });

  // POST /api/prayer/lists - Create a new prayer list
  app.post("/api/prayer/lists", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || null;
      const deviceId = req.headers['x-device-id'] as string;
      
      if (!userId && !deviceId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, icon, color, listType, categoryKey } = req.body;
      
      if (!title?.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      const list = await storage.createPrayerList({
        userId,
        deviceId,
        title: title.trim(),
        icon: icon || "heart",
        color: color || "#3B82F6",
        listType,
        categoryKey,
      });
      
      res.json(list);
    } catch (error) {
      console.error("[Prayer] Error creating list:", error);
      res.status(500).json({ error: "Failed to create prayer list" });
    }
  });

  // PATCH /api/prayer/lists/:id - Update a prayer list
  app.patch("/api/prayer/lists/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, icon, color, isPublic } = req.body;

      const list = await storage.updatePrayerList(id, {
        title,
        icon,
        color,
        isPublic,
      });
      
      res.json(list);
    } catch (error) {
      console.error("[Prayer] Error updating list:", error);
      res.status(500).json({ error: "Failed to update prayer list" });
    }
  });

  // DELETE /api/prayer/lists/:id - Delete a prayer list
  app.delete("/api/prayer/lists/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deletePrayerList(id);
      res.json({ success: true });
    } catch (error) {
      console.error("[Prayer] Error deleting list:", error);
      res.status(500).json({ error: "Failed to delete prayer list" });
    }
  });

  // GET /api/prayer/requests - Get user's prayer requests
  app.get("/api/prayer/requests", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || null;
      const deviceId = req.headers['x-device-id'] as string;
      const listId = req.query.listId as string | undefined;
      
      if (!userId && !deviceId) {
        return res.json([]);
      }

      const requests = await storage.getPrayerRequests(userId, deviceId, listId);
      res.json(requests);
    } catch (error) {
      console.error("[Prayer] Error fetching requests:", error);
      res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
  });

  // POST /api/prayer/requests - Create a new prayer request
  app.post("/api/prayer/requests", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || null;
      const deviceId = req.headers['x-device-id'] as string;
      
      if (!userId && !deviceId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { listId, title, description, category } = req.body;
      
      if (!listId || !title?.trim()) {
        return res.status(400).json({ error: "List ID and title are required" });
      }

      const request = await storage.createPrayerRequest({
        listId,
        userId,
        deviceId,
        title: title.trim(),
        description: description?.trim(),
        category: category || "general",
      });
      
      res.json(request);
    } catch (error) {
      console.error("[Prayer] Error creating request:", error);
      res.status(500).json({ error: "Failed to create prayer request" });
    }
  });

  // PATCH /api/prayer/requests/:id - Update a prayer request
  app.patch("/api/prayer/requests/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, status } = req.body;

      const request = await storage.updatePrayerRequest(id, {
        title,
        description,
        category,
        status,
        answeredAt: status === 'answered' ? new Date() : undefined,
      });
      
      res.json(request);
    } catch (error) {
      console.error("[Prayer] Error updating request:", error);
      res.status(500).json({ error: "Failed to update prayer request" });
    }
  });

  // DELETE /api/prayer/requests/:id - Delete a prayer request
  app.delete("/api/prayer/requests/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deletePrayerRequest(id);
      res.json({ success: true });
    } catch (error) {
      console.error("[Prayer] Error deleting request:", error);
      res.status(500).json({ error: "Failed to delete prayer request" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // ========================================
  // SERMON RECORDINGS ENDPOINTS
  // ========================================

  // GET /api/sermons - List user's sermon recordings
  app.get("/api/sermons", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { search, category, fromDate, toDate } = req.query;
      
      let query = db.select().from(sermonRecordings).where(eq(sermonRecordings.userId, userId));
      
      const results = await query.orderBy(desc(sermonRecordings.createdAt));
      
      let filtered = results;
      
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          r.speaker?.toLowerCase().includes(searchLower) ||
          r.transcriptText?.toLowerCase().includes(searchLower) ||
          r.summaryText?.toLowerCase().includes(searchLower) ||
          r.tags?.some(t => t.toLowerCase().includes(searchLower))
        );
      }
      
      if (category && typeof category === 'string') {
        filtered = filtered.filter(r => r.category === category);
      }
      
      if (fromDate && typeof fromDate === 'string') {
        const from = new Date(fromDate);
        filtered = filtered.filter(r => new Date(r.createdAt) >= from);
      }
      
      if (toDate && typeof toDate === 'string') {
        const to = new Date(toDate);
        filtered = filtered.filter(r => new Date(r.createdAt) <= to);
      }
      
      res.json(filtered);
    } catch (error) {
      console.error("[Sermons] Error listing:", error);
      res.status(500).json({ error: "Failed to list sermons" });
    }
  });

  // GET /api/sermons/:id - Get single sermon
  app.get("/api/sermons/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      const results = await db.select().from(sermonRecordings)
        .where(and(eq(sermonRecordings.id, id), eq(sermonRecordings.userId, userId)));
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Sermon not found" });
      }
      
      res.json(results[0]);
    } catch (error) {
      console.error("[Sermons] Error fetching:", error);
      res.status(500).json({ error: "Failed to fetch sermon" });
    }
  });

  // POST /api/sermons - Create or sync sermon recording
  app.post("/api/sermons", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { id, title, duration, category, speaker, tags } = req.body;
      
      if (!id || !title || duration === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const existing = await db.select().from(sermonRecordings)
        .where(eq(sermonRecordings.id, id));
      
      if (existing.length > 0) {
        await db.update(sermonRecordings)
          .set({ title, category, speaker, tags, updatedAt: new Date() })
          .where(eq(sermonRecordings.id, id));
      } else {
        await db.insert(sermonRecordings).values({
          id,
          userId,
          title,
          duration,
          category: category || "culto",
          speaker,
          tags,
        });
      }
      
      const result = await db.select().from(sermonRecordings).where(eq(sermonRecordings.id, id));
      res.json(result[0]);
    } catch (error) {
      console.error("[Sermons] Error creating:", error);
      res.status(500).json({ error: "Failed to create sermon" });
    }
  });

  // PATCH /api/sermons/:id - Update sermon
  app.patch("/api/sermons/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { title, category, speaker, tags, transcriptText, summaryText, notesText } = req.body;
      
      const existing = await db.select().from(sermonRecordings)
        .where(and(eq(sermonRecordings.id, id), eq(sermonRecordings.userId, userId)));
      
      if (existing.length === 0) {
        return res.status(404).json({ error: "Sermon not found" });
      }
      
      const updates: any = { updatedAt: new Date() };
      if (title !== undefined) updates.title = title;
      if (category !== undefined) updates.category = category;
      if (speaker !== undefined) updates.speaker = speaker;
      if (tags !== undefined) updates.tags = tags;
      if (transcriptText !== undefined) updates.transcriptText = transcriptText;
      if (summaryText !== undefined) updates.summaryText = summaryText;
      if (notesText !== undefined) updates.notesText = notesText;
      
      await db.update(sermonRecordings).set(updates).where(eq(sermonRecordings.id, id));
      
      const result = await db.select().from(sermonRecordings).where(eq(sermonRecordings.id, id));
      res.json(result[0]);
    } catch (error) {
      console.error("[Sermons] Error updating:", error);
      res.status(500).json({ error: "Failed to update sermon" });
    }
  });

  // POST /api/sermons/:id/transcribe - Transcribe audio
  app.post("/api/sermons/:id/transcribe", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { audioBase64, mimeType } = req.body;
      
      if (!audioBase64) {
        return res.status(400).json({ error: "Audio data required" });
      }
      
      const existing = await db.select().from(sermonRecordings)
        .where(and(eq(sermonRecordings.id, id), eq(sermonRecordings.userId, userId)));
      
      if (existing.length === 0) {
        return res.status(404).json({ error: "Sermon not found" });
      }
      
      await db.update(sermonRecordings)
        .set({ transcriptStatus: "processing", updatedAt: new Date() })
        .where(eq(sermonRecordings.id, id));
      
      const audioBuffer = Buffer.from(audioBase64, "base64");
      const transcriptText = await transcribeAudio(audioBuffer, mimeType || "audio/webm");
      
      await db.update(sermonRecordings)
        .set({ transcriptText, transcriptStatus: "done", updatedAt: new Date() })
        .where(eq(sermonRecordings.id, id));
      
      res.json({ success: true, transcriptText });
    } catch (error) {
      console.error("[Sermons] Transcription error:", error);
      
      const { id } = req.params;
      await db.update(sermonRecordings)
        .set({ transcriptStatus: "error", updatedAt: new Date() })
        .where(eq(sermonRecordings.id, id));
      
      res.status(500).json({ error: "Transcription failed" });
    }
  });

  // POST /api/sermons/:id/summarize - Generate AI summary
  app.post("/api/sermons/:id/summarize", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      const existing = await db.select().from(sermonRecordings)
        .where(and(eq(sermonRecordings.id, id), eq(sermonRecordings.userId, userId)));
      
      if (existing.length === 0) {
        return res.status(404).json({ error: "Sermon not found" });
      }
      
      const sermon = existing[0];
      if (!sermon.transcriptText) {
        return res.status(400).json({ error: "Transcription required before summary" });
      }
      
      const { summaryJson, summaryText } = await generateSermonSummary(sermon.transcriptText);
      
      await db.update(sermonRecordings)
        .set({ summaryJson, summaryText, updatedAt: new Date() })
        .where(eq(sermonRecordings.id, id));
      
      res.json({ success: true, summaryJson, summaryText });
    } catch (error) {
      console.error("[Sermons] Summary error:", error);
      res.status(500).json({ error: "Summary generation failed" });
    }
  });

  // POST /api/sermons/:id/share - Generate share link
  app.post("/api/sermons/:id/share", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      const existing = await db.select().from(sermonRecordings)
        .where(and(eq(sermonRecordings.id, id), eq(sermonRecordings.userId, userId)));
      
      if (existing.length === 0) {
        return res.status(404).json({ error: "Sermon not found" });
      }
      
      let shareToken = existing[0].shareToken;
      if (!shareToken) {
        shareToken = generateShareToken();
        await db.update(sermonRecordings)
          .set({ shareToken, shareEnabled: true, updatedAt: new Date() })
          .where(eq(sermonRecordings.id, id));
      } else {
        await db.update(sermonRecordings)
          .set({ shareEnabled: true, updatedAt: new Date() })
          .where(eq(sermonRecordings.id, id));
      }
      
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DOMAINS?.split(",")[0] 
          ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
          : "http://localhost:5000";
      
      res.json({ success: true, shareUrl: `${baseUrl}/share/sermon/${shareToken}` });
    } catch (error) {
      console.error("[Sermons] Share error:", error);
      res.status(500).json({ error: "Share link generation failed" });
    }
  });

  // GET /api/share/sermon/:token - Public view of shared sermon
  app.get("/api/share/sermon/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const results = await db.select().from(sermonRecordings)
        .where(and(eq(sermonRecordings.shareToken, token), eq(sermonRecordings.shareEnabled, true)));
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Shared sermon not found" });
      }
      
      const sermon = results[0];
      res.json({
        title: sermon.title,
        category: sermon.category,
        speaker: sermon.speaker,
        tags: sermon.tags,
        summaryJson: sermon.summaryJson,
        summaryText: sermon.summaryText,
        notesText: sermon.notesText,
        createdAt: sermon.createdAt,
      });
    } catch (error) {
      console.error("[Sermons] Share view error:", error);
      res.status(500).json({ error: "Failed to load shared sermon" });
    }
  });

  // DELETE /api/sermons/:id - Delete sermon
  app.delete("/api/sermons/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      const existing = await db.select().from(sermonRecordings)
        .where(and(eq(sermonRecordings.id, id), eq(sermonRecordings.userId, userId)));
      
      if (existing.length === 0) {
        return res.status(404).json({ error: "Sermon not found" });
      }
      
      await db.delete(sermonRecordings).where(eq(sermonRecordings.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("[Sermons] Delete error:", error);
      res.status(500).json({ error: "Failed to delete sermon" });
    }
  });

  // ============================================================
  // Google Play Console: Installs / Uninstalls (Reporting API)
  // ============================================================
  // Requires the service account to have the "Play Developer Reporting API"
  // permission AND the playdeveloperreporting OAuth scope. If either is missing
  // we return a graceful 200 response with `available: false` and a helpful
  // message so the dashboard can render a fallback card instead of an error.

}

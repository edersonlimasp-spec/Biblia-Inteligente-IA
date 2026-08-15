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
import { seedLibraryBooks } from "../seed-library";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerAdminRoutes(app: Express): void {
  app.post("/api/admin/make-admin", async (req: AuthRequest, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      // Check if any admin exists
      const existingAdmins = await storage.getAdminUsers();
      
      // If no admins exist, allow anyone to make themselves admin
      if (existingAdmins.length === 0) {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }
        
        await storage.makeUserAdmin(user.id);
        return res.json({ message: "Primeiro administrador criado com sucesso!", email: user.email });
      }
      
      // If admins exist, require authentication and admin privileges
      if (!req.userId) {
        return res.status(401).json({ error: "Autenticação necessária" });
      }
      
      const currentUser = await storage.getUser(req.userId);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return res.status(403).json({ error: "Apenas administradores podem criar outros administradores" });
      }
      
      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      await storage.makeUserAdmin(targetUser.id);
      res.json({ message: "Usuário promovido a administrador!", email: targetUser.email });
    } catch (error) {
      console.error("Make admin error:", error);
      res.status(500).json({ error: "Erro ao tornar usuário administrador" });
    }
  });

  // Subscriptions
  app.post("/api/admin/seed-strong", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      console.log(`[Admin] User ${req.userId} iniciando seed forçado do Strong...`);
      const result = await forceSeedStrongEntries();
      res.json(result);
    } catch (error) {
      console.error("[Admin] Erro no seed Strong:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Admin endpoint to force seed study modules in production
  app.post("/api/admin/seed-study", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      console.log(`[Admin] User ${req.userId} iniciando seed dos módulos de estudo...`);
      const result = await forceSeedStudyModules();
      res.json(result);
    } catch (error) {
      console.error("[Admin] Erro no seed módulos:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // UNIFIED DATA HEALTH DIAGNOSTIC ENDPOINT (for admin UI)
  app.get("/api/admin/diagnostics/data-health", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      console.log(`[Admin] User ${req.userId} consultando saúde dos dados...`);
      
      // Get all counts
      const modulesCount = await db.select({ count: sql<number>`count(*)` }).from(studyModules);
      const tracksCount = await db.select({ count: sql<number>`count(*)` }).from(studyTracks);
      const lessonsCount = await db.select({ count: sql<number>`count(*)` }).from(studyLessons);
      const strongCount = await db.select({ count: sql<number>`count(*)` }).from(strongEntries);
      
      const modules = Number(modulesCount[0]?.count) || 0;
      const tracks = Number(tracksCount[0]?.count) || 0;
      const lessons = Number(lessonsCount[0]?.count) || 0;
      const strong = Number(strongCount[0]?.count) || 0;
      
      // Expected minimums
      const EXPECTED_MODULES = 40;
      const EXPECTED_TRACKS = 40;
      const EXPECTED_LESSONS = 400;
      const EXPECTED_STRONG = 10000;
      
      // Check for warnings
      const warnings: string[] = [];
      
      if (modules === 0) warnings.push('Nenhum módulo de estudo encontrado');
      else if (modules < EXPECTED_MODULES) warnings.push(`Módulos abaixo do esperado: ${modules}/${EXPECTED_MODULES}`);
      
      if (tracks === 0) warnings.push('Nenhuma trilha encontrada');
      else if (tracks < EXPECTED_TRACKS) warnings.push(`Trilhas abaixo do esperado: ${tracks}/${EXPECTED_TRACKS}`);
      
      if (lessons === 0) warnings.push('Nenhuma lição encontrada');
      else if (lessons < EXPECTED_LESSONS) warnings.push(`Lições abaixo do esperado: ${lessons}/${EXPECTED_LESSONS}`);
      
      if (strong === 0) warnings.push('Dicionário Strong vazio');
      else if (strong < EXPECTED_STRONG) warnings.push(`Strong abaixo do esperado: ${strong}/${EXPECTED_STRONG}`);
      
      // Check for orphaned lessons (trackId references non-existent track)
      const orphanedLessons = await db.execute(sql`
        SELECT COUNT(*) as count FROM study_lessons l 
        LEFT JOIN study_tracks t ON l.track_id = t.id 
        WHERE t.id IS NULL
      `);
      const orphanCount = Number((orphanedLessons.rows[0] as any)?.count) || 0;
      if (orphanCount > 0) warnings.push(`${orphanCount} lições órfãs (trackId inválido)`);
      
      // Determine overall status
      let status: 'OK' | 'INCOMPLETE' | 'BROKEN' = 'OK';
      if (orphanCount > 0) status = 'BROKEN';
      else if (modules === 0 || tracks === 0 || lessons === 0 || strong === 0) status = 'INCOMPLETE';
      else if (warnings.length > 0) status = 'INCOMPLETE';
      
      res.json({
        status,
        environment: process.env.NODE_ENV || 'unknown',
        database: {
          host: process.env.PGHOST ? `${process.env.PGHOST.substring(0, 15)}...` : 'unknown',
          name: process.env.PGDATABASE || 'unknown'
        },
        counts: {
          modules,
          tracks,
          lessons,
          strong,
          orphanedLessons: orphanCount
        },
        expected: {
          modules: EXPECTED_MODULES,
          tracks: EXPECTED_TRACKS,
          lessons: EXPECTED_LESSONS,
          strong: EXPECTED_STRONG
        },
        warnings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Admin Data Health] Error:", error);
      res.status(500).json({ status: 'ERROR', error: String(error) });
    }
  });

  // Admin endpoint for COMPLETE reseed of study data (truncate + insert)
  app.post("/api/admin/diagnostics/reseed-study", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      console.log(`[Admin] User ${req.userId} iniciando RESEED COMPLETO dos cursos...`);
      
      // Step 1: Clear progress data (references lessons)
      await db.execute(sql`DELETE FROM user_study_progress`);
      console.log('[Reseed Study] Progresso de lições deletado');
      
      // Step 2: Clear all study data in correct order
      await db.execute(sql`DELETE FROM study_lessons`);
      console.log('[Reseed Study] Lições deletadas');
      await db.execute(sql`DELETE FROM study_tracks`);
      console.log('[Reseed Study] Trilhas deletadas');
      await db.execute(sql`DELETE FROM study_modules`);
      console.log('[Reseed Study] Módulos deletados');
      
      // Step 3: Reseed
      const result = await forceSeedStudyModules();
      
      // Step 4: Verify
      const modulesCount = await db.select({ count: sql<number>`count(*)` }).from(studyModules);
      const tracksCount = await db.select({ count: sql<number>`count(*)` }).from(studyTracks);
      const lessonsCount = await db.select({ count: sql<number>`count(*)` }).from(studyLessons);
      
      res.json({
        success: result.success,
        message: 'Reseed completo executado',
        counts: {
          modules: Number(modulesCount[0]?.count) || 0,
          tracks: Number(tracksCount[0]?.count) || 0,
          lessons: Number(lessonsCount[0]?.count) || 0
        },
        details: result.message
      });
    } catch (error) {
      console.error("[Admin Reseed Study] Error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Admin endpoint for COMPLETE reseed of Strong dictionary
  app.post("/api/admin/diagnostics/reseed-strong", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      console.log(`[Admin] User ${req.userId} iniciando RESEED do Strong...`);
      
      // Step 1: Clear existing Strong data
      await db.execute(sql`DELETE FROM strong_entries`);
      console.log('[Reseed Strong] Entradas existentes deletadas');
      
      // Step 2: Reseed
      const result = await forceSeedStrongEntries();
      
      // Step 3: Verify
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(strongEntries);
      const count = Number(countResult[0]?.count) || 0;
      
      res.json({
        success: result.success,
        message: 'Reseed Strong completo executado',
        count,
        details: result.message
      });
    } catch (error) {
      console.error("[Admin Reseed Strong] Error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Study modules diagnostic endpoint (public for debugging)
  app.get("/api/study/diagnostics", async (req, res) => {
    try {
      const { studyModules, studyTracks, studyLessons } = await import("@shared/schema");
      
      const modulesCount = await db.select({ count: sql<number>`count(*)` }).from(studyModules);
      const tracksCount = await db.select({ count: sql<number>`count(*)` }).from(studyTracks);
      const lessonsCount = await db.select({ count: sql<number>`count(*)` }).from(studyLessons);
      
      const sampleModules = await db.select().from(studyModules).limit(3);
      const sampleTracks = await db.select().from(studyTracks).limit(3);
      const sampleLessons = await db.select().from(studyLessons).limit(3);
      
      res.json({
        status: Number(lessonsCount[0]?.count) > 0 ? 'OK' : 'INCOMPLETE',
        modules: Number(modulesCount[0]?.count) || 0,
        tracks: Number(tracksCount[0]?.count) || 0,
        lessons: Number(lessonsCount[0]?.count) || 0,
        sampleModules: sampleModules.map(m => ({ id: m.id, name: m.name })),
        sampleTracks: sampleTracks.map(t => ({ id: t.id, name: t.name, moduleId: t.moduleId })),
        sampleLessons: sampleLessons.map(l => ({ id: l.id, title: l.title, trackId: l.trackId })),
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Study Diagnostics] Error:", error);
      res.status(500).json({ status: 'ERROR', error: String(error) });
    }
  });

  // Admin endpoint to reset and reseed study modules completely
  app.post("/api/admin/reset-study", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      console.log(`[Admin] User ${req.userId} iniciando RESET completo dos módulos de estudo...`);
      
      // Delete all existing data in correct order (progress first, then lessons, tracks, modules)
      await db.execute(sql`DELETE FROM user_study_progress`);
      console.log('[Admin Reset] Progresso deletado');
      await db.execute(sql`DELETE FROM study_lessons`);
      console.log('[Admin Reset] Lições deletadas');
      await db.execute(sql`DELETE FROM study_tracks`);
      console.log('[Admin Reset] Trilhas deletadas');
      await db.execute(sql`DELETE FROM study_modules`);
      console.log('[Admin Reset] Módulos deletados');
      
      // Now reseed
      const result = await forceSeedStudyModules();
      res.json({ ...result, message: 'Reset completo + ' + result.message });
    } catch (error) {
      console.error("[Admin] Erro no reset módulos:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Export Strong data as valid JSON (admin only, for regenerating data file)
  app.get("/api/admin/export-strong", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      console.log(`[Admin] User ${req.userId} exportando Strong data...`);
      const allEntries = await db.select().from(strongEntries).orderBy(strongEntries.strongNumber);
      console.log(`[Export] ${allEntries.length} entradas Strong exportadas`);
      res.json(allEntries);
    } catch (error) {
      console.error("[Export Strong] Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Strong's Dictionary diagnostic endpoint
  // Sincroniza a Biblioteca (livros/capítulos revisados) com o banco de
  // conteúdo (Neon) sob demanda, sem precisar reiniciar/republicar o app.
  app.post("/api/admin/library/sync", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const result = await seedLibraryBooks();
      if (!result.ok) {
        return res.status(500).json({
          message: "Falha ao sincronizar a Biblioteca",
          ...result,
        });
      }
      res.json({
        message: result.skipped
          ? `Sincronização ignorada: ${result.skipped}`
          : `Biblioteca sincronizada: ${result.booksInserted} livro(s) inserido(s), ${result.booksUpdated} atualizado(s); ${result.chaptersInserted} capítulo(s) inserido(s), ${result.chaptersUpdated} atualizado(s)`,
        ...result,
      });
    } catch (error) {
      console.error("Erro ao sincronizar Biblioteca:", error);
      res.status(500).json({ message: "Erro ao sincronizar Biblioteca" });
    }
  });

  app.get("/api/admin/stats", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { users: allUsers, total: totalCount } = await storage.getAllUsers(undefined, 10000, 0);
      
      const now = new Date();
      
      // Efficient SQL query: get subscriptions with active-like status
      const allActiveSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'Active'),
            eq(subscriptions.status, 'ACTIVE'),
            eq(subscriptions.status, 'approved'),
            eq(subscriptions.status, 'Approved'),
            eq(subscriptions.status, 'APPROVED'),
            eq(subscriptions.status, 'authorized')
          )
        );
      
      // Filter to only truly active subscriptions (not expired)
      const activeSubscriptions = allActiveSubscriptions.filter(s => {
        // Lifetime subscriptions have no end_date
        if (s.planType?.toLowerCase() === 'strong_lifetime' || !s.endDate) return true;
        // Check if end_date is in the future
        return new Date(s.endDate) > now;
      });
      
      console.log(`[Admin Stats] Active subs: ${activeSubscriptions.length}, Plans: ${activeSubscriptions.map(s => s.planType).join(', ')}`);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const recentUsers = allUsers.filter(u => new Date(u.createdAt) >= monthStart);

      // Degustação Premium de 7 dias (novos usuários em trial)
      const activeTrials = allUsers.filter(u => isTrialActive(u.trialStartDate)).length;
      // Usuários no plano gratuito real (sem trial ativo e sem assinatura)
      const subscribedUserIds = new Set(activeSubscriptions.map(s => s.userId));
      const freeUsers = allUsers.filter(u => !isTrialActive(u.trialStartDate) && !subscribedUserIds.has(u.id)).length;
      // Case-insensitive plan type matching
      const activeGold = activeSubscriptions.filter(s => s.planType?.toLowerCase() === 'gold').length;
      const activePremium = activeSubscriptions.filter(s => s.planType?.toLowerCase() === 'premium').length;
      const lifetimeStrong = activeSubscriptions.filter(s => s.planType?.toLowerCase() === 'strong_lifetime').length;
      
      console.log(`[Admin Stats] Filtered counts - Gold: ${activeGold}, Premium: ${activePremium}, Lifetime: ${lifetimeStrong}`);

      const monthlyRevenue = activeSubscriptions
        .filter(s => new Date(s.createdAt) >= monthStart)
        .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0)
        .toFixed(2);

      // Inactive users - users who haven't accessed in 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const inactiveUsers = allUsers.filter(u => {
        const lastAccess = u.lastLoginAt ? new Date(u.lastLoginAt) : null;
        // If never logged in, check createdAt
        if (!lastAccess) {
          return new Date(u.createdAt) < thirtyDaysAgo;
        }
        return lastAccess < thirtyDaysAgo;
      }).length;

      // Guest stats
      let totalGuests = 0;
      let activeGuestTrials = 0;
      let convertedGuests = 0;
      let newGuestsToday = 0;
      let activeGuestsToday = 0;
      try {
        if (typeof storage.getGuestStats === 'function') {
          const guestStats = await storage.getGuestStats();
          totalGuests = guestStats.totalGuests || 0;
          activeGuestTrials = guestStats.guestsInTrial || 0;
          convertedGuests = guestStats.linkedToUsers || 0;
          newGuestsToday = guestStats.newGuestsToday || 0;
          activeGuestsToday = guestStats.activeGuestsToday || 0;
        }
      } catch (e) {
        console.warn('Erro ao buscar guest stats:', e);
      }

      // Ensure all values are numbers (not strings)
      res.json({
        totalUsers: Number(totalCount) || 0,
        newUsersThisMonth: recentUsers.length,
        activeTrials,
        freeUsers,
        activeGoldSubscriptions: activeGold,
        activePremiumSubscriptions: activePremium,
        lifetimeStrong,
        estimatedMonthlyRevenue: monthlyRevenue,
        cancelledThisMonth: 0,
        totalGuests: Number(totalGuests) || 0,
        activeGuestTrials: Number(activeGuestTrials) || 0,
        convertedGuests: Number(convertedGuests) || 0,
        newGuestsToday: Number(newGuestsToday) || 0,
        activeGuestsToday: Number(activeGuestsToday) || 0,
        inactiveUsers,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  // Admin Metrics - Online Users
  app.get("/api/admin/metrics/online-users", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const onlineCount = await storage.getOnlineUsers(5); // Last 5 minutes
      res.json({ onlineUsers: onlineCount });
    } catch (error) {
      console.error("Online users error:", error);
      res.status(500).json({ error: "Erro ao buscar usuários online" });
    }
  });

  // Admin Metrics - AI Usage Stats
  app.get("/api/admin/metrics/ai-usage", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { days = "30" } = req.query;
      const stats = await storage.getAIUsageStats(parseInt(days as string));
      res.json(stats);
    } catch (error) {
      console.error("AI usage error:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas de IA" });
    }
  });

  // Admin Metrics - Usage Heatmap
  app.get("/api/admin/metrics/usage-heatmap", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { days = "7" } = req.query;
      const heatmap = await storage.getUsageHeatmap(parseInt(days as string));
      res.json({ heatmap });
    } catch (error) {
      console.error("Heatmap error:", error);
      res.status(500).json({ error: "Erro ao buscar heatmap" });
    }
  });

  // Admin Metrics - Abandoned Subscriptions
  app.get("/api/admin/metrics/abandoned-subscriptions", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const abandoned = await storage.getAbandonedSubscriptions();
      res.json({ abandoned });
    } catch (error) {
      console.error("Abandoned subscriptions error:", error);
      res.status(500).json({ error: "Erro ao buscar assinaturas abandonadas" });
    }
  });

  // Admin Metrics - Conversion Metrics
  app.get("/api/admin/metrics/conversion", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const metrics = await storage.getConversionMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Conversion metrics error:", error);
      res.status(500).json({ error: "Erro ao buscar métricas de conversão" });
    }
  });

  // Track Event (Authenticated)
  app.post("/api/admin/events/track", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { eventType, eventData } = req.body;
      await storage.trackPageEvent(req.userId!, eventType, eventData);
      res.json({ success: true });
    } catch (error) {
      console.error("Event tracking error:", error);
      res.status(500).json({ error: "Erro ao rastrear evento" });
    }
  });

  // Admin Metrics - Purchase History by Plan Type
  app.get("/api/admin/metrics/purchases", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { days = "30" } = req.query;
      const daysAgo = parseInt(days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get all subscriptions with active-like status (not cancelled/pending)
      // Only count actual paid subscriptions with valid status
      const allSubscriptions = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          planType: subscriptions.planType,
          status: subscriptions.status,
          amount: subscriptions.amount,
          createdAt: subscriptions.createdAt,
          startDate: subscriptions.startDate,
          endDate: subscriptions.endDate,
          storeTransactionId: subscriptions.storeTransactionId,
        })
        .from(subscriptions)
        .where(and(
          gte(subscriptions.createdAt, startDate),
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'Active'),
            eq(subscriptions.status, 'ACTIVE'),
            eq(subscriptions.status, 'approved'),
            eq(subscriptions.status, 'Approved'),
            eq(subscriptions.status, 'APPROVED')
          )
        ))
        .orderBy(desc(subscriptions.createdAt));

      // Deduplicate by storeTransactionId AND by user+planType (keep only the most recent per user/plan)
      const seenTransactionIds = new Set<string>();
      const seenUserPlans = new Set<string>();
      const uniqueSubscriptions = allSubscriptions.filter(s => {
        // First, filter by storeTransactionId
        if (s.storeTransactionId) {
          if (seenTransactionIds.has(s.storeTransactionId)) {
            return false; // Skip duplicate transaction
          }
          seenTransactionIds.add(s.storeTransactionId);
        }
        
        // Then, deduplicate by user+planType (keep only first/most recent per user/plan)
        const userPlanKey = `${s.userId}:${s.planType?.toLowerCase()}`;
        if (seenUserPlans.has(userPlanKey)) {
          return false; // Skip duplicate user+plan combination
        }
        seenUserPlans.add(userPlanKey);
        
        return true;
      });

      // Get users for these subscriptions
      const userIds = Array.from(new Set(uniqueSubscriptions.map(s => s.userId)));
      const usersData = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds.length > 0 ? userIds : ['']));
      
      const usersMap = new Map(usersData.map(u => [u.id, u]));

      // Categorize by plan type (include annual plans)
      const goldPurchases = uniqueSubscriptions
        .filter(s => s.planType?.toLowerCase() === 'gold' || s.planType?.toLowerCase() === 'gold_anual')
        .map(s => ({
          ...s,
          user: usersMap.get(s.userId),
        }));

      const premiumPurchases = uniqueSubscriptions
        .filter(s => s.planType?.toLowerCase() === 'premium' || s.planType?.toLowerCase() === 'premium_anual')
        .map(s => ({
          ...s,
          user: usersMap.get(s.userId),
        }));

      const lifetimePurchases = uniqueSubscriptions
        .filter(s => s.planType?.toLowerCase() === 'strong_lifetime')
        .map(s => ({
          ...s,
          user: usersMap.get(s.userId),
        }));

      // Calculate totals from actual amounts stored
      const goldTotal = goldPurchases.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
      const premiumTotal = premiumPurchases.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
      const lifetimeTotal = lifetimePurchases.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);

      // Daily breakdown for charts (using unique subscriptions)
      const dailyData: Record<string, { gold: number; premium: number; lifetime: number }> = {};
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { gold: 0, premium: 0, lifetime: 0 };
      }

      uniqueSubscriptions.forEach(s => {
        const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          const planType = s.planType?.toLowerCase();
          if (planType === 'gold' || planType === 'gold_anual') dailyData[dateStr].gold++;
          else if (planType === 'premium' || planType === 'premium_anual') dailyData[dateStr].premium++;
          else if (planType === 'strong_lifetime') dailyData[dateStr].lifetime++;
        }
      });

      const dailyTrend = Object.entries(dailyData)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        summary: {
          gold: { count: goldPurchases.length, total: goldTotal.toFixed(2) },
          premium: { count: premiumPurchases.length, total: premiumTotal.toFixed(2) },
          lifetime: { count: lifetimePurchases.length, total: lifetimeTotal.toFixed(2) },
        },
        recentPurchases: {
          gold: goldPurchases.slice(0, 20),
          premium: premiumPurchases.slice(0, 20),
          lifetime: lifetimePurchases.slice(0, 20),
        },
        dailyTrend,
      });
    } catch (error) {
      console.error("Purchase history error:", error);
      res.status(500).json({ error: "Erro ao buscar histórico de compras" });
    }
  });

  // Admin Metrics - Subscription Health (active, MRR, renewals, non-renewed)
  app.get("/api/admin/metrics/subscription-health", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const health = await storage.getSubscriptionHealth();
      res.json(health);
    } catch (error) {
      console.error("Subscription health error:", error);
      res.status(500).json({ error: "Erro ao buscar saúde das assinaturas" });
    }
  });

  // Admin Metrics - App Engagement (independent of store analytics)
  app.get("/api/admin/metrics/app-engagement", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { days = "30" } = req.query;
      const metrics = await storage.getAppEngagementMetrics(parseInt(days as string) || 30);
      res.json(metrics);
    } catch (error) {
      console.error("App engagement error:", error);
      res.status(500).json({ error: "Erro ao buscar métricas do app" });
    }
  });

  // Admin Metrics - Purchase Funnel (PURCHASE_STEP events)
  // Conta DISPOSITIVOS únicos que atingiram cada etapa do funil de compra,
  // agrupado por plataforma. Permite descobrir EXATAMENTE onde o usuário trava.
  app.get("/api/admin/metrics/purchase-funnel", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const daysAgo = Math.min(180, Math.max(1, parseInt(String(req.query.days || '30')) || 30));
      const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // Por etapa × plataforma: dispositivos únicos.
      const rows: any = await db.execute(sql`
        SELECT
          COALESCE(event_data->>'step', '') AS step,
          COALESCE(event_data->>'platform', 'unknown') AS platform,
          COUNT(DISTINCT device_id)::int AS devices,
          COUNT(*)::int AS events
        FROM app_events
        WHERE event_type = 'PURCHASE_STEP'
          AND created_at >= ${since}
        GROUP BY 1, 2
      `);

      // Falhas detalhadas (últimas 50) para inspeção pontual.
      const failuresRows: any = await db.execute(sql`
        SELECT
          created_at,
          COALESCE(event_data->>'step', '') AS step,
          COALESCE(event_data->>'platform', 'unknown') AS platform,
          COALESCE(event_data->>'paymentMethod', '') AS payment_method,
          COALESCE(event_data->>'planType', '') AS plan_type,
          COALESCE(event_data->>'productId', '') AS product_id,
          COALESCE(event_data->>'errorCode', '') AS error_code,
          LEFT(COALESCE(event_data->>'errorMessage', ''), 300) AS error_message
        FROM app_events
        WHERE event_type = 'PURCHASE_STEP'
          AND created_at >= ${since}
          AND event_data->>'step' IN (
            'STORE_INIT_FAIL','PRODUCT_NOT_FOUND','OFFER_NOT_FOUND',
            'ORDER_ERROR','VERIFY_FAIL','TIMEOUT','UNEXPECTED_ERROR'
          )
        ORDER BY created_at DESC
        LIMIT 50
      `);

      const list = (rows.rows || rows) as Array<{ step: string; platform: string; devices: number; events: number }>;
      const failures = (failuresRows.rows || failuresRows) as Array<any>;

      // Pivot por plataforma para o frontend.
      const STEPS = [
        'BUTTON_CLICK','LOGIN_GATE','ROUTE_NATIVE','ROUTE_MP',
        'STORE_INIT_OK','STORE_INIT_FAIL',
        'PRODUCT_FOUND','PRODUCT_NOT_FOUND','OFFER_NOT_FOUND',
        'ORDER_DISPATCHED','ORDER_ERROR','USER_CANCELLED',
        'APPROVED_RECEIVED','VERIFY_OK','VERIFY_FAIL',
        'TIMEOUT','UNEXPECTED_ERROR',
      ];

      const platforms = Array.from(new Set(list.map(r => r.platform))).sort();
      const funnel = STEPS.map(step => {
        const byPlatform: Record<string, number> = {};
        let total = 0;
        for (const p of platforms) {
          const row = list.find(r => r.step === step && r.platform === p);
          const n = row?.devices || 0;
          byPlatform[p] = n;
          total += n;
        }
        return { step, total, byPlatform };
      });

      res.json({
        windowDays: daysAgo,
        platforms,
        funnel,
        recentFailures: failures.map(f => ({
          createdAt: f.created_at,
          step: f.step,
          platform: f.platform,
          paymentMethod: f.payment_method,
          planType: f.plan_type,
          productId: f.product_id,
          errorCode: f.error_code,
          errorMessage: f.error_message,
        })),
      });
    } catch (error) {
      console.error("Purchase funnel error:", error);
      res.status(500).json({ error: "Erro ao buscar funil de compra" });
    }
  });

  // Admin Metrics - Monthly User Growth (Users vs Guests)
  app.get("/api/admin/metrics/user-growth", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth(); // 0-indexed
      
      // Get monthly user counts
      const userGrowth = await db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM')`,
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(sql`EXTRACT(YEAR FROM ${users.createdAt}) = ${currentYear}`)
        .groupBy(sql`date_trunc('month', ${users.createdAt})`)
        .orderBy(sql`date_trunc('month', ${users.createdAt})`);

      // Get monthly guest counts
      const guestGrowth = await db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${guests.createdAt}), 'YYYY-MM')`,
          count: sql<number>`count(*)::int`,
        })
        .from(guests)
        .where(sql`EXTRACT(YEAR FROM ${guests.createdAt}) = ${currentYear}`)
        .groupBy(sql`date_trunc('month', ${guests.createdAt})`)
        .orderBy(sql`date_trunc('month', ${guests.createdAt})`);

      // Create maps for easy lookup
      const userMap = new Map(userGrowth.map(r => [r.month, r.count]));
      const guestMap = new Map(guestGrowth.map(r => [r.month, r.count]));

      // Build 12-month series (Jan to Dec) with cumulative totals
      const months: Array<{ month: string; monthLabel: string; users: number; guests: number; usersTotal: number; guestsTotal: number }> = [];
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      let usersCumulative = 0;
      let guestsCumulative = 0;

      for (let m = 0; m < 12; m++) {
        const monthKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const monthlyUsers = userMap.get(monthKey) || 0;
        const monthlyGuests = guestMap.get(monthKey) || 0;
        
        // Only count actual data up to current month, show zero for future
        if (m <= currentMonth) {
          usersCumulative += monthlyUsers;
          guestsCumulative += monthlyGuests;
        }
        
        months.push({
          month: monthKey,
          monthLabel: monthNames[m],
          users: m <= currentMonth ? monthlyUsers : 0,
          guests: m <= currentMonth ? monthlyGuests : 0,
          usersTotal: m <= currentMonth ? usersCumulative : usersCumulative,
          guestsTotal: m <= currentMonth ? guestsCumulative : guestsCumulative,
        });
      }

      // Get total counts before current year for cumulative baseline
      const usersBeforeYear = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(sql`${users.createdAt} < ${`${currentYear}-01-01`}::date`);
      
      const guestsBeforeYear = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(guests)
        .where(sql`${guests.createdAt} < ${`${currentYear}-01-01`}::date`);

      res.json({
        year: currentYear,
        months,
        totals: {
          usersThisYear: usersCumulative,
          guestsThisYear: guestsCumulative,
          usersAllTime: (usersBeforeYear[0]?.count || 0) + usersCumulative,
          guestsAllTime: (guestsBeforeYear[0]?.count || 0) + guestsCumulative,
        }
      });
    } catch (error) {
      console.error("User growth error:", error);
      res.status(500).json({ error: "Erro ao buscar crescimento de usuários" });
    }
  });

  // Admin Users - List all users
  app.get("/api/admin/users", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { email, page = "1" } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const pageSize = 10;
      const skip = (pageNum - 1) * pageSize;

      const { users: usersList, total } = await storage.getAllUsers(email as string | undefined, pageSize, skip);
      const now = new Date();

      // Enrich each user with their real subscription/trial status
      const safeUsers = await Promise.all(usersList.map(async (u) => {
        const { password: _, ...rest } = u;

        // Trial status
        const trialActive = isTrialActive(u.trialStartDate);
        const trialDaysRemaining = getTrialDaysRemaining(u.trialStartDate);

        // Active subscription
        const activeSub = await storage.getActiveSubscription(u.id);

        // Calculate real subscription status
        let subscriptionStatus: string;
        let subscriptionPlan: string | null = null;
        let subscriptionEndDate: string | null = null;

        if (activeSub) {
          subscriptionPlan = activeSub.planType;
          subscriptionEndDate = activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString('pt-BR') : 'Vitalício';
          subscriptionStatus = 'active';
        } else if (trialActive) {
          subscriptionStatus = 'trial';
        } else {
          subscriptionStatus = 'free';
        }

        return {
          ...rest,
          subscriptionStatus,
          subscriptionPlan,
          subscriptionEndDate,
          trialActive,
          trialDaysRemaining,
        };
      }));

      res.json({ users: safeUsers, total });
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  });

  // Admin Users - Update user role (SUPER_ADMIN only)
  app.patch("/api/admin/users/:userId/role", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: "Role inválido" });
      }

      await storage.updateUserRole(userId, role);
      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'ROLE_CHANGED',
        targetUserId: userId,
        details: { newRole: role },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Admin role update error:", error);
      res.status(500).json({ error: "Erro ao atualizar função" });
    }
  });

  // Admin Users - Block user
  app.post("/api/admin/users/:userId/block", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      await storage.blockUser(userId);
      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'USER_BLOCKED',
        targetUserId: userId,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ error: "Erro ao bloquear usuário" });
    }
  });

  // Admin Users - Unblock user
  app.post("/api/admin/users/:userId/unblock", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      await storage.unblockUser(userId);
      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'USER_UNBLOCKED',
        targetUserId: userId,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ error: "Erro ao desbloquear usuário" });
    }
  });

  // Admin - Ativar assinatura manualmente (SUPER_ADMIN only)
  app.post("/api/admin/subscriptions/activate", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { email, planType, durationDays } = req.body;

      if (!email || !planType) {
        return res.status(400).json({ error: "Email e planType são obrigatórios" });
      }

      if (!['gold', 'premium', 'strong_lifetime'].includes(planType)) {
        return res.status(400).json({ error: "planType deve ser: gold, premium ou strong_lifetime" });
      }

      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) {
        return res.status(404).json({ error: `Usuário não encontrado: ${email}` });
      }

      const now = new Date();
      const duration = durationDays || (planType === 'strong_lifetime' ? 36500 : 30);
      const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

      const amounts: Record<string, string> = {
        gold: '9.90',
        premium: '19.90',
        strong_lifetime: '49.90'
      };

      const newSubscription = await db.insert(subscriptions).values({
        userId: targetUser.id,
        planType,
        status: 'active',
        amount: amounts[planType],
        startDate: now,
        endDate,
        source: 'admin',
      }).returning();

      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'SUBSCRIPTION_ACTIVATED_MANUALLY',
        targetUserId: targetUser.id,
        details: { planType, duration, endDate: endDate.toISOString() },
      });

      console.log(`[Admin] Assinatura ${planType} ativada manualmente para ${email} por admin ${req.userId}`);

      res.json({ 
        success: true, 
        subscription: newSubscription[0],
        message: `Assinatura ${planType} ativada para ${email} até ${endDate.toLocaleDateString('pt-BR')}`
      });
    } catch (error) {
      console.error("Admin activate subscription error:", error);
      res.status(500).json({ error: "Erro ao ativar assinatura" });
    }
  });

  // Admin - Listar todas as assinaturas
  app.get("/api/admin/subscriptions", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const allSubs = await db
        .select({
          id: subscriptions.id,
          planType: subscriptions.planType,
          status: subscriptions.status,
          amount: subscriptions.amount,
          startDate: subscriptions.startDate,
          endDate: subscriptions.endDate,
          createdAt: subscriptions.createdAt,
          userId: subscriptions.userId,
          userEmail: users.email,
        })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .orderBy(subscriptions.createdAt);

      res.json({ subscriptions: allSubs });
    } catch (error) {
      console.error("Admin subscriptions list error:", error);
      res.status(500).json({ error: "Erro ao listar assinaturas" });
    }
  });

  // Admin Monetization - Stats
  app.get("/api/admin/monetization", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const activeSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
      
      const activeGold = activeSubscriptions.filter(s => s.planType === 'gold').length;
      const activePremium = activeSubscriptions.filter(s => s.planType === 'premium').length;
      const lifetimeStrong = activeSubscriptions.filter(s => s.planType === 'strong_lifetime').length;

      const totalRevenue = activeSubscriptions
        .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0)
        .toFixed(2);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = activeSubscriptions
        .filter(s => new Date(s.createdAt) >= monthStart)
        .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0)
        .toFixed(2);

      res.json({
        activeGold,
        activePremium,
        lifetimeStrong,
        totalRevenue,
        monthlyRevenue,
      });
    } catch (error) {
      console.error("Admin monetization error:", error);
      res.status(500).json({ error: "Erro ao buscar dados de monetização" });
    }
  });

  // Admin Bonuses - Create bonus
  app.post("/api/admin/bonuses", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { userEmail, bonusType, duration, reason } = req.body;

      const targetUser = await storage.getUserByEmail(userEmail);
      if (!targetUser) {
        return res.status(404).json({ error: "Usuário não encontrado. O usuário precisa estar cadastrado no app antes de receber um bônus." });
      }

      const endAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

      const bonus = await storage.createBonus({
        userId: targetUser.id,
        bonusType,
        startAt: new Date(),
        endAt,
        reason,
        grantedByAdminId: req.userId!,
      });

      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'BONUS_GRANTED',
        targetUserId: targetUser.id,
        details: { bonusType, duration, reason },
      });

      res.json(bonus);
    } catch (error) {
      console.error("Create bonus error:", error);
      res.status(500).json({ error: "Erro ao criar bônus" });
    }
  });

  // Admin Bonuses - List active bonuses (legacy endpoint)
  app.get("/api/admin/bonuses", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const activeBonuses = await storage.getActiveBonuses();
      res.json(activeBonuses);
    } catch (error) {
      console.error("Get bonuses error:", error);
      res.status(500).json({ error: "Erro ao buscar bônus" });
    }
  });

  // Admin Bonuses - Search bonuses with email and expiry info
  app.get("/api/admin/bonuses/search", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { email, includeExpired } = req.query;
      const bonuses = await storage.getBonusesWithEmail(
        email as string | undefined,
        includeExpired === 'true'
      );
      res.json(bonuses);
    } catch (error) {
      console.error("Search bonuses error:", error);
      res.status(500).json({ error: "Erro ao buscar bônus" });
    }
  });

  // Admin Bonuses - Renew/extend bonus
  app.patch("/api/admin/bonuses/:bonusId/renew", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { bonusId } = req.params;
      const { extraDays } = req.body;
      
      if (!extraDays || extraDays <= 0) {
        return res.status(400).json({ error: "Dias adicionais inválidos" });
      }
      
      const updated = await storage.renewBonus(bonusId, extraDays);
      
      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'BONUS_RENEWED',
        details: { bonusId, extraDays, newEndAt: updated.endAt },
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Renew bonus error:", error);
      res.status(500).json({ error: "Erro ao renovar bônus" });
    }
  });

  // Admin Bonuses - Revoke bonus (SUPER_ADMIN only)
  app.delete("/api/admin/bonuses/:bonusId", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { bonusId } = req.params;
      await storage.revokeBonus(bonusId);
      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'BONUS_REVOKED',
        details: { bonusId },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Revoke bonus error:", error);
      res.status(500).json({ error: "Erro ao revogar bônus" });
    }
  });

  // Admin Bonuses - Delete bonus permanently (SUPER_ADMIN only)
  app.delete("/api/admin/bonuses/:bonusId/permanent", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { bonusId } = req.params;
      await storage.deleteBonus(bonusId);
      await storage.logAdminAction({
        adminId: req.userId!,
        actionType: 'BONUS_DELETED',
        details: { bonusId },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete bonus error:", error);
      res.status(500).json({ error: "Erro ao excluir bônus" });
    }
  });

  // Admin Logs - Get audit log
  app.get("/api/admin/logs", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const actions = await storage.getAdminActions(50);
      res.json(actions);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ error: "Erro ao buscar logs" });
    }
  });

  app.get("/api/debug/build-info", (_req, res) => {
    let buildInfo: any = null;
    try {
      const buildInfoPath = path.resolve(__dirname, '..', 'build-info.json');
      if (fs.existsSync(buildInfoPath)) {
        buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
      }
    } catch (e) {
      console.log('[Debug] Error reading build-info.json:', e);
    }
    
    res.json({
      buildId: buildInfo?.buildId || 'development',
      buildEnv: buildInfo?.env || 'development',
      timestamp: buildInfo?.timestamp || new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || "development",
      replDeployment: process.env.REPLIT_DEPLOYMENT || "not-deployed",
      replDevDomain: process.env.REPLIT_DEV_DOMAIN || "unknown",
      replDomains: process.env.REPLIT_DOMAINS || "unknown",
      databaseConnected: !!process.env.DATABASE_URL,
    });
  });

  // Bible debug endpoint - para validar dados por versão
  app.get("/api/debug/bible", async (req, res) => {
    try {
      const translationId = req.query.translationId as string || req.query.version as string;
      const book = req.query.book as string || "gen";
      const chapter = parseInt(req.query.chapter as string) || 1;

      if (!translationId) {
        console.warn("[DEBUG] WARNING: translationId não fornecido!");
        return res.status(400).json({ 
          error: "translationId é obrigatório",
          warning: "Versão não pode ser default silencioso"
        });
      }

      console.log(`[DEBUG Bible] Request: translationId=${translationId}, book=${book}, chapter=${chapter}`);

      // Check translation registry
      const translation = getTranslation(translationId);
      const hasData = hasDataAvailable(translationId);

      // Fetch first verse from database
      const verses = await db
        .select()
        .from(bibleVerses)
        .where(
          and(
            eq(bibleVerses.versionCode, translationId),
            eq(bibleVerses.book, book),
            eq(bibleVerses.chapter, chapter)
          )
        )
        .orderBy(bibleVerses.verse)
        .limit(1);

      const sampleVerse1 = verses[0]?.text || "(não encontrado)";

      // Count total verses for this version
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bibleVerses)
        .where(eq(bibleVerses.versionCode, translationId));

      res.json({
        translationId,
        book,
        chapter,
        sampleVerse1,
        source: verses.length > 0 ? "db" : "not_found",
        translationRegistry: translation ? {
          name: translation.name,
          hasData: translation.hasData,
          licenseType: translation.licenseType,
          enabled: translation.enabled,
        } : null,
        totalVersesInDb: countResult[0]?.count || 0,
        buildVersion: process.env.REPL_ID || "dev-local",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[DEBUG Bible] Error:", error);
      res.status(500).json({ error: "Erro ao buscar debug bible" });
    }
  });

  // Admin debug subscriptions endpoint
  app.get("/api/admin/debug/subscriptions", async (req, res) => {
    try {
      // Count total users
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      
      // Count subscriptions by plan
      const subsByPlan = await db
        .select({
          planType: subscriptions.planType,
          count: sql<number>`count(*)`
        })
        .from(subscriptions)
        .groupBy(subscriptions.planType);

      // Count subscriptions by status
      const subsByStatus = await db
        .select({
          status: subscriptions.status,
          count: sql<number>`count(*)`
        })
        .from(subscriptions)
        .groupBy(subscriptions.status);

      // Count active subscriptions only
      const activeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active'));

      const byPlan: Record<string, number> = {};
      for (const row of subsByPlan) {
        byPlan[row.planType || 'unknown'] = Number(row.count);
      }

      const byStatus: Record<string, number> = {};
      for (const row of subsByStatus) {
        byStatus[row.status || 'unknown'] = Number(row.count);
      }

      res.json({
        totalUsers: Number(userCount[0]?.count || 0),
        totalSubscriptions: Object.values(byPlan).reduce((a, b) => a + b, 0),
        activeSubscriptions: Number(activeCount[0]?.count || 0),
        byPlan,
        byStatus,
        dbNameOrUrlMasked: process.env.PGDATABASE || "unknown",
        buildVersion: process.env.REPL_ID || "dev-local",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[DEBUG Subscriptions] Error:", error);
      res.status(500).json({ error: "Erro ao buscar debug subscriptions" });
    }
  });

  // Debug endpoint to check a specific user's subscription (for diagnosing premium issues)
  app.get("/api/debug/user-subscription/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Get all subscriptions for this user (raw from DB)
      const userSubs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      // Check active subscriptions using storage method
      const hasGold = await storage.hasActiveSubscription(userId, 'gold');
      const hasPremium = await storage.hasActiveSubscription(userId, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(userId, 'strong_lifetime');

      // Get bonuses
      const userBonuses = await db
        .select()
        .from(bonuses)
        .where(eq(bonuses.userId, userId));

      console.log(`[DEBUG User Sub] userId=${userId}, hasGold=${hasGold}, hasPremium=${hasPremium}, rawSubs=${userSubs.length}`);

      res.json({
        userId,
        email: user.email,
        role: user.role,
        trialStartDate: user.trialStartDate,
        subscriptionsInDb: userSubs.map(s => ({
          id: s.id,
          planType: s.planType,
          status: s.status,
          startDate: s.startDate,
          endDate: s.endDate,
        })),
        bonusesInDb: userBonuses.map(b => ({
          id: b.id,
          bonusType: b.bonusType,
          startAt: b.startAt,
          endAt: b.endAt,
          isActive: b.isActive,
        })),
        computedFlags: {
          hasGold,
          hasPremium,
          hasLifetime,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[DEBUG User Sub] Error:", error);
      res.status(500).json({ error: "Erro ao buscar debug user subscription" });
    }
  });

  // Debug endpoint to list all bonuses in the system (for admin diagnosis)
  app.get("/api/debug/all-bonuses", async (req, res) => {
    try {
      const allBonuses = await db
        .select({
          bonusId: bonuses.id,
          bonusType: bonuses.bonusType,
          reason: bonuses.reason,
          isActive: bonuses.isActive,
          startAt: bonuses.startAt,
          endAt: bonuses.endAt,
          createdAt: bonuses.createdAt,
          userId: bonuses.userId,
          userEmail: users.email,
          userName: users.name,
        })
        .from(bonuses)
        .leftJoin(users, eq(bonuses.userId, users.id))
        .orderBy(desc(bonuses.createdAt));

      const now = new Date();
      const summary = {
        total: allBonuses.length,
        active: allBonuses.filter(b => b.isActive).length,
        premium_free: allBonuses.filter(b => b.bonusType === 'premium_free' && b.isActive).length,
        gold_free: allBonuses.filter(b => b.bonusType === 'gold_free' && b.isActive).length,
        trial_extend: allBonuses.filter(b => b.bonusType === 'trial_extend' && b.isActive).length,
      };

      res.json({
        summary,
        bonuses: allBonuses.map(b => ({
          id: b.bonusId,
          type: b.bonusType,
          reason: b.reason,
          isActive: b.isActive,
          startAt: b.startAt,
          endAt: b.endAt,
          isExpired: b.endAt ? new Date(b.endAt) < now : false,
          user: {
            id: b.userId,
            email: b.userEmail,
            name: b.userName,
          },
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[DEBUG All Bonuses] Error:", error);
      res.status(500).json({ error: "Erro ao buscar bônus" });
    }
  });

  // ============================================
  // USER ACTIVITY TRACKING & RE-ENGAGEMENT
  // ============================================

  // Rate limiter for heartbeat (6 hours cooldown per user)
  const heartbeatCache = new Map<string, number>();
  const HEARTBEAT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

  // POST /api/telemetry/heartbeat - Update user's last seen timestamp
  app.post("/api/telemetry/heartbeat", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      // Rate limit: only update once every 6 hours
      const lastUpdate = heartbeatCache.get(userId) || 0;
      const now = Date.now();
      
      if (now - lastUpdate < HEARTBEAT_COOLDOWN_MS) {
        const minutesRemaining = Math.ceil((HEARTBEAT_COOLDOWN_MS - (now - lastUpdate)) / 60000);
        return res.json({ 
          updated: false, 
          message: `Rate limited. Próxima atualização em ${minutesRemaining} minutos.` 
        });
      }

      // Update last seen
      const platform = req.body.platform || 'web';
      await storage.updateUserLastSeen(userId, platform);
      
      // Update rate limit cache
      heartbeatCache.set(userId, now);

      console.log(`[Heartbeat] Usuário ${userId} atualizado (platform: ${platform})`);
      res.json({ updated: true, message: "Atividade registrada" });
    } catch (error) {
      console.error("[Heartbeat] Erro:", error);
      res.status(500).json({ error: "Erro ao registrar atividade" });
    }
  });

  // POST /api/email/unsubscribe - Opt out of marketing emails
  app.post("/api/email/unsubscribe", async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      // For now, use userId directly. In production, you'd verify a signed token.
      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Set opt-out
      await storage.setUserEmailOptOut(userId, true);
      
      console.log(`[Unsubscribe] Usuário ${userId} (${user.email}) optou por não receber emails`);
      
      res.json({ success: true, message: "Você foi descadastrado com sucesso. Não receberá mais emails de marketing." });
    } catch (error) {
      console.error("[Unsubscribe] Erro:", error);
      res.status(500).json({ error: "Erro ao processar descadastro" });
    }
  });

  // GET /api/cron/send-inactive-30d - Protected cron endpoint for sending re-engagement emails
  const CRON_SECRET = process.env.CRON_SECRET;
  
  app.get("/api/cron/send-inactive-30d", async (req, res) => {
    try {
      // Verify secret
      const secret = req.headers['x-cron-secret'] || req.query.secret;
      if (!CRON_SECRET || secret !== CRON_SECRET) {
        console.log("[Cron] Tentativa de acesso não autorizada");
        return res.status(401).json({ error: "Não autorizado" });
      }

      console.log("[Cron] Iniciando campanha inactive_30_days...");
      
      const CAMPAIGN_NAME = 'inactive_30_days';
      const DAYS_INACTIVE = 30;
      const COOLDOWN_DAYS = 30;
      
      // Get inactive users
      const inactiveUsers = await storage.getInactiveUsers(DAYS_INACTIVE);
      console.log(`[Cron] Encontrados ${inactiveUsers.length} usuários inativos há ${DAYS_INACTIVE}+ dias`);

      const results = {
        total: inactiveUsers.length,
        eligible: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      };

      const appUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://bibliainteligente.replit.app';

      for (const user of inactiveUsers) {
        // Check if already received campaign in last 30 days
        const alreadyReceived = await storage.hasReceivedCampaign(user.id, CAMPAIGN_NAME, COOLDOWN_DAYS);
        if (alreadyReceived) {
          results.skipped++;
          continue;
        }

        results.eligible++;

        // Generate unsubscribe link
        const unsubscribeLink = `${appUrl}/api/email/unsubscribe?userId=${user.id}`;

        // Send email
        const emailResult = await sendReengagementEmail(user.email, user.name || undefined, unsubscribeLink);

        // Log the campaign
        await storage.logCampaign({
          userId: user.id,
          campaignName: CAMPAIGN_NAME,
          sentAt: new Date(),
          status: emailResult.success ? 'sent' : 'failed',
          providerMessageId: emailResult.messageId || null,
          errorMessage: emailResult.success ? null : emailResult.message,
        });

        if (emailResult.success) {
          results.sent++;
          console.log(`[Cron] Email enviado para ${user.email}`);
        } else {
          results.failed++;
          console.log(`[Cron] Falha ao enviar para ${user.email}: ${emailResult.message}`);
        }
      }

      console.log(`[Cron] Campanha concluída: ${JSON.stringify(results)}`);
      res.json({ success: true, results });
    } catch (error) {
      console.error("[Cron] Erro na campanha:", error);
      res.status(500).json({ error: "Erro ao executar campanha" });
    }
  });

  // GET /api/cron/mark-expired-subscriptions - Marca assinaturas expiradas
  app.get("/api/cron/mark-expired-subscriptions", async (req, res) => {
    try {
      const secret = req.headers['x-cron-secret'] || req.query.secret;
      if (!CRON_SECRET || secret !== CRON_SECRET) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      const count = await storage.markExpiredSubscriptions();
      console.log(`[Cron] markExpiredSubscriptions: ${count} assinatura(s) marcadas como expiradas`);
      res.json({ success: true, markedExpired: count });
    } catch (error) {
      console.error("[Cron] Erro ao marcar expiradas:", error);
      res.status(500).json({ error: "Erro ao marcar assinaturas expiradas" });
    }
  });

  // ============================================
  // ADMIN - PAYMENT RECEIPTS
  // ============================================

  // GET /api/admin/receipts - List payment receipts with optional filters
  app.get("/api/admin/receipts", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const options = {
        userId: req.query.userId as string | undefined,
        status: req.query.status as string | undefined,
        planType: req.query.planType as string | undefined,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };
      
      const result = await storage.getPaymentReceipts(options);
      
      res.json({
        success: true,
        receipts: result.receipts.map(r => ({
          ...r,
          grossAmountFormatted: `R$ ${(r.grossAmount / 100).toFixed(2)}`,
          feeAmountFormatted: `R$ ${((r.feeAmount || 0) / 100).toFixed(2)}`,
          taxAmountFormatted: `R$ ${((r.taxAmount || 0) / 100).toFixed(2)}`,
          netAmountFormatted: `R$ ${(r.netAmount / 100).toFixed(2)}`,
        })),
        total: result.total,
        limit: options.limit,
        offset: options.offset,
      });
    } catch (error) {
      console.error("[Admin Receipts] Erro ao listar recibos:", error);
      res.status(500).json({ error: "Erro ao listar recibos" });
    }
  });

  // GET /api/admin/receipts/stats - Get payment receipt statistics
  app.get("/api/admin/receipts/stats", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getPaymentReceiptStats();
      
      res.json({
        success: true,
        stats: {
          ...stats,
          totalGrossFormatted: `R$ ${(stats.totalGrossAmount / 100).toFixed(2)}`,
          totalNetFormatted: `R$ ${(stats.totalNetAmount / 100).toFixed(2)}`,
          totalFeesFormatted: `R$ ${(stats.totalFees / 100).toFixed(2)}`,
          last30Days: {
            ...stats.last30Days,
            grossFormatted: `R$ ${(stats.last30Days.grossAmount / 100).toFixed(2)}`,
            netFormatted: `R$ ${(stats.last30Days.netAmount / 100).toFixed(2)}`,
          },
          byPlanFormatted: Object.entries(stats.byPlan).reduce((acc, [plan, data]) => {
            acc[plan] = {
              ...data,
              grossFormatted: `R$ ${(data.grossAmount / 100).toFixed(2)}`,
              netFormatted: `R$ ${(data.netAmount / 100).toFixed(2)}`,
            };
            return acc;
          }, {} as Record<string, any>),
        },
      });
    } catch (error) {
      console.error("[Admin Receipts] Erro ao buscar estatísticas:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas de recibos" });
    }
  });

  // GET /api/admin/receipts/:id - Get single receipt with full details
  app.get("/api/admin/receipts/:id", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const receipt = await storage.getPaymentReceiptById(id);
      
      if (!receipt) {
        return res.status(404).json({ error: "Recibo não encontrado" });
      }
      
      // Get user info if available
      let user = null;
      if (receipt.userId) {
        user = await storage.getUser(receipt.userId);
      }
      
      res.json({
        success: true,
        receipt: {
          ...receipt,
          grossAmountFormatted: `R$ ${(receipt.grossAmount / 100).toFixed(2)}`,
          feeAmountFormatted: `R$ ${((receipt.feeAmount || 0) / 100).toFixed(2)}`,
          taxAmountFormatted: `R$ ${((receipt.taxAmount || 0) / 100).toFixed(2)}`,
          netAmountFormatted: `R$ ${(receipt.netAmount / 100).toFixed(2)}`,
        },
        user: user ? { id: user.id, email: user.email, name: user.name } : null,
      });
    } catch (error) {
      console.error("[Admin Receipts] Erro ao buscar recibo:", error);
      res.status(500).json({ error: "Erro ao buscar recibo" });
    }
  });

  // ============================================
  // ADMIN - CAMPAIGN MANAGEMENT
  // ============================================

  // GET /api/admin/campaigns/stats - Get campaign statistics
  app.get("/api/admin/campaigns/stats", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const CAMPAIGN_NAME = 'inactive_30_days';
      const DAYS_INACTIVE = 30;

      // Get inactive users count
      const inactiveUsers = await storage.getInactiveUsers(DAYS_INACTIVE);
      
      // Get campaign stats
      const stats = await storage.getCampaignStats(CAMPAIGN_NAME);
      
      // Count eligible (not received in last 30 days)
      let eligible = 0;
      for (const user of inactiveUsers) {
        const received = await storage.hasReceivedCampaign(user.id, CAMPAIGN_NAME, 30);
        if (!received) eligible++;
      }

      res.json({
        totalInactive: inactiveUsers.length,
        eligible,
        alreadyReceived: inactiveUsers.length - eligible,
        campaignStats: stats,
      });
    } catch (error) {
      console.error("[Admin Campaigns] Erro ao buscar stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  // GET /api/admin/campaigns/dry-run - List up to 10 users that would receive email (without sending)
  app.get("/api/admin/campaigns/dry-run", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const CAMPAIGN_NAME = 'inactive_30_days';
      const DAYS_INACTIVE = 30;
      const COOLDOWN_DAYS = 30;

      // Get inactive users
      const inactiveUsers = await storage.getInactiveUsers(DAYS_INACTIVE);
      
      // Filter eligible users (not received in last 30 days)
      const eligible: Array<{ id: string; email: string; name: string | null; lastSeenAt: Date | null }> = [];
      
      for (const user of inactiveUsers) {
        if (eligible.length >= 10) break;
        
        const received = await storage.hasReceivedCampaign(user.id, CAMPAIGN_NAME, COOLDOWN_DAYS);
        if (!received) {
          eligible.push(user);
        }
      }

      res.json({
        dryRun: true,
        totalInactive: inactiveUsers.length,
        showingFirst: eligible.length,
        users: eligible.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          lastSeenAt: u.lastSeenAt,
          daysSinceLastSeen: u.lastSeenAt 
            ? Math.floor((Date.now() - new Date(u.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
      });
    } catch (error) {
      console.error("[Admin Campaigns] Erro no dry-run:", error);
      res.status(500).json({ error: "Erro ao executar dry-run" });
    }
  });

  // POST /api/admin/campaigns/execute - Execute campaign (send emails)
  app.post("/api/admin/campaigns/execute", ensureSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { confirm } = req.body;
      
      if (confirm !== true) {
        return res.status(400).json({ error: "Confirmação obrigatória. Envie { confirm: true }" });
      }

      console.log("[Admin Campaigns] Executando campanha via admin...");
      
      const CAMPAIGN_NAME = 'inactive_30_days';
      const DAYS_INACTIVE = 30;
      const COOLDOWN_DAYS = 30;
      
      // Get inactive users
      const inactiveUsers = await storage.getInactiveUsers(DAYS_INACTIVE);

      const results = {
        total: inactiveUsers.length,
        eligible: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      };

      const appUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://bibliainteligente.replit.app';

      for (const user of inactiveUsers) {
        const alreadyReceived = await storage.hasReceivedCampaign(user.id, CAMPAIGN_NAME, COOLDOWN_DAYS);
        if (alreadyReceived) {
          results.skipped++;
          continue;
        }

        results.eligible++;

        const unsubscribeLink = `${appUrl}/api/email/unsubscribe?userId=${user.id}`;
        const emailResult = await sendReengagementEmail(user.email, user.name || undefined, unsubscribeLink);

        await storage.logCampaign({
          userId: user.id,
          campaignName: CAMPAIGN_NAME,
          sentAt: new Date(),
          status: emailResult.success ? 'sent' : 'failed',
          providerMessageId: emailResult.messageId || null,
          errorMessage: emailResult.success ? null : emailResult.message,
        });

        if (emailResult.success) {
          results.sent++;
        } else {
          results.failed++;
        }
      }

      // Log admin action
      if (req.userId) {
        await storage.logAdminAction({
          adminId: req.userId,
          actionType: 'CAMPAIGN_EXECUTED',
          details: { campaignName: CAMPAIGN_NAME, results },
        });
      }

      console.log(`[Admin Campaigns] Concluído: ${JSON.stringify(results)}`);
      res.json({ success: true, results });
    } catch (error) {
      console.error("[Admin Campaigns] Erro ao executar:", error);
      res.status(500).json({ error: "Erro ao executar campanha" });
    }
  });

  // GET /api/admin/campaigns/history - Get campaign history
  app.get("/api/admin/campaigns/history", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const campaignName = req.query.campaign as string || undefined;
      
      const logs = await storage.getCampaignLogs(campaignName, limit);
      
      res.json({ logs });
    } catch (error) {
      console.error("[Admin Campaigns] Erro ao buscar histórico:", error);
      res.status(500).json({ error: "Erro ao buscar histórico" });
    }
  });

  // ==========================================
  // READING PLANS API
  // ==========================================

  // GET /api/reading-plans/templates - Get all reading plan templates
  app.get("/api/admin/metrics/google-play-installs", ensureAdmin, async (_req: AuthRequest, res) => {
    try {
      const packageName = "app.replit.bibliainteligente.twa";
      const accessToken = await getGoogleAccessToken(
        "https://www.googleapis.com/auth/playdeveloperreporting"
      );

      if (!accessToken) {
        return res.json({
          available: false,
          reason: "credentials_missing",
          message:
            "Credenciais do Google Play não configuradas (GOOGLE_PLAY_SERVICE_ACCOUNT_KEY).",
        });
      }

      // Time window: last 28 full days (Reporting API works on day-aligned ranges in UTC).
      const now = new Date();
      const endUtc = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0
      ));
      const startUtc = new Date(endUtc);
      startUtc.setUTCDate(startUtc.getUTCDate() - 28);

      const buildTimePart = (d: Date) => ({
        year:  d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day:   d.getUTCDate(),
        timeZone: { id: "UTC" },
      });

      const queryBody = (metric: string) => ({
        timelineSpec: {
          aggregationPeriod: "DAILY",
          startTime: buildTimePart(startUtc),
          endTime:   buildTimePart(endUtc),
        },
        metrics: [metric],
      });

      const callReporting = async (metricSet: "installsMetricSet" | "errorReportMetricSet", metric: string) => {
        const url = `https://playdeveloperreporting.googleapis.com/v1beta1/apps/${packageName}/${metricSet}:query`;
        const r = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(queryBody(metric)),
        });
        const text = await r.text();
        let parsed: any = null;
        try { parsed = JSON.parse(text); } catch { /* keep null */ }
        return { ok: r.ok, status: r.status, body: parsed, raw: text };
      };

      // Active installs (current install base)
      const installs = await callReporting("installsMetricSet", "activeDeviceInstalls");

      if (!installs.ok) {
        const reason = installs.status === 403 ? "permission_missing" : "api_error";
        return res.json({
          available: false,
          reason,
          status: installs.status,
          message:
            reason === "permission_missing"
              ? "A Service Account do Google Play não tem permissão para a Play Developer Reporting API. No Play Console: Setup → Acesso à API → editar a service account → adicionar permissão 'Ver dados financeiros, pedidos e respostas a pesquisas com cancelamento' e 'Ver desempenho do app, comentários e respostas'."
              : `Erro ${installs.status} ao consultar a Play Developer Reporting API.`,
        });
      }

      // Daily series for the chart
      const installsSeries: Array<{ date: string; activeDeviceInstalls: number }> = [];
      const rows = installs.body?.rows || [];
      for (const row of rows) {
        const d = row.startTime || {};
        const yr = d.year, mo = String(d.month).padStart(2, "0"), dy = String(d.day).padStart(2, "0");
        const activeDevices = Number(
          row.metrics?.find((m: any) => m.metric === "activeDeviceInstalls")?.decimalValue?.value
            || row.metrics?.[0]?.decimalValue?.value
            || 0
        );
        installsSeries.push({ date: `${yr}-${mo}-${dy}`, activeDeviceInstalls: activeDevices });
      }

      const last = installsSeries[installsSeries.length - 1];
      const first = installsSeries[0];
      const currentInstalls = last?.activeDeviceInstalls || 0;
      const startInstalls = first?.activeDeviceInstalls || 0;
      const delta = currentInstalls - startInstalls;

      return res.json({
        available: true,
        packageName,
        windowDays: 28,
        currentInstalls,
        startInstalls,
        netChange: delta,
        series: installsSeries,
      });
    } catch (error) {
      console.error("[admin/google-play-installs] error:", error);
      res.json({
        available: false,
        reason: "api_error",
        message: "Erro inesperado ao consultar Google Play Reporting API.",
      });
    }
  });

  // ============================================================
  // Google Play Console: Subscription offers (base plans + offers)
  // ============================================================
  // Lists every subscription product, its base plans and offers (including the
  // free-trial / introductory phases). Read-only. Same graceful fallback rules.
  app.get("/api/admin/play-console/offers", ensureAdmin, async (_req: AuthRequest, res) => {
    try {
      const packageName = "app.replit.bibliainteligente.twa";
      const accessToken = await getGoogleAccessToken(); // default androidpublisher scope

      if (!accessToken) {
        return res.json({
          available: false,
          reason: "credentials_missing",
          message:
            "Credenciais do Google Play não configuradas (GOOGLE_PLAY_SERVICE_ACCOUNT_KEY).",
        });
      }

      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/subscriptions`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const text = await r.text();
      let body: any = null;
      try { body = JSON.parse(text); } catch { /* keep null */ }

      if (!r.ok) {
        return res.json({
          available: false,
          reason: r.status === 403 ? "permission_missing" : "api_error",
          status: r.status,
          message:
            r.status === 403
              ? "A Service Account não tem permissão para 'Gerenciar produtos do Google Play'. No Play Console: Setup → Acesso à API → editar service account → marcar a permissão de 'Gerenciar pedidos e assinaturas'."
              : `Erro ${r.status} ao consultar produtos de assinatura.`,
        });
      }

      // Normalise into a compact list the dashboard can render
      const subscriptions = (body?.subscriptions || []).map((s: any) => {
        const basePlans = (s.basePlans || []).map((bp: any) => {
          const phases = (bp?.regionalConfigs || []).map((rc: any) => ({
            region: rc.regionCode,
            priceMicros: rc?.price?.units && rc?.price?.nanos
              ? `${rc.price.units}.${String(rc.price.nanos).padStart(9, "0").slice(0, 2)}`
              : null,
            currency: rc?.price?.currencyCode,
          }));
          return {
            basePlanId: bp.basePlanId,
            state: bp.state,
            autoRenewing: bp?.autoRenewingBasePlanType ? true : false,
            billingPeriodDuration: bp?.autoRenewingBasePlanType?.billingPeriodDuration,
            gracePeriodDuration: bp?.autoRenewingBasePlanType?.gracePeriodDuration,
            regions: phases,
            offers: (bp.offers || []).map((o: any) => ({
              offerId: o.offerId,
              state: o.state,
              eligibility: o.offerTags?.map((t: any) => t.tag) || [],
              phases: (o.phases || []).map((ph: any) => {
                const rc = ph?.regionalConfigs?.[0] || {};
                const hasUnits = rc?.price?.units !== undefined;
                const explicitlyFree = rc?.free === true;
                return {
                  duration: ph.duration,
                  priceMicros: hasUnits
                    ? `${rc.price.units}.${String(rc.price.nanos || 0).padStart(9, "0").slice(0, 2)}`
                    : null,
                  currency: rc?.price?.currencyCode,
                  isFree: explicitlyFree || (!hasUnits && rc?.free !== false),
                };
              }),
            })),
          };
        });
        return {
          productId: s.productId,
          name: s?.listings?.[0]?.title || s.productId,
          basePlans,
        };
      });

      return res.json({
        available: true,
        packageName,
        count: subscriptions.length,
        subscriptions,
      });
    } catch (error) {
      console.error("[admin/play-console/offers] error:", error);
      res.json({
        available: false,
        reason: "api_error",
        message: "Erro inesperado ao consultar ofertas do Play Console.",
      });
    }
  });

  // TEMP: endpoint one-time para ativar assinatura vitalícia (remover após uso)
  app.post("/api/setup/grant-lifetime", async (req: Request, res: Response) => {
    const { secret, email } = req.body;
    if (secret !== "BIBLIA_GRANT_2026_TEMP") {
      return res.status(403).json({ error: "Não autorizado" });
    }
    try {
      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });
      const endDate = new Date("2099-12-31T23:59:59.000Z");
      const newSub = await db.insert(subscriptions).values({
        userId: targetUser.id,
        planType: "premium_annual",
        status: "active",
        amount: "0",
        startDate: new Date(),
        endDate,
        source: "admin",
      }).returning();
      return res.json({ success: true, subscription: newSub[0] });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  });

}

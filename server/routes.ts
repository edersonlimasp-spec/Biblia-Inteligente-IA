import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, ensureAdmin, ensureSuperAdmin, optionalAuth, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "./auth";
import { sendPasswordResetEmail, sendReengagementEmail } from "./email";
import admin from "firebase-admin";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { askTheologicalQuestion, generateBiblicalImage, analyzeImageWithVision } from "./openai";
import { insertUserSchema, insertSubscriptionSchema, insertBookmarkSchema, insertAnnotationSchema, insertAIHistorySchema, strongEntries, users, subscriptions, bonuses, bibleVersions, bibleVerses, userBiblePreferences, bibleWords, studyModules, studyTracks, studyLessons, studyModuleTranslations, studyTrackTranslations, studyLessonTranslations, guests } from "@shared/schema";
import { z } from "zod";
import { bibleBooks, getBookById } from "./bible-data/books";
import { getBookChapter } from "./bible-data/bible-index";
import { db } from "./db";
import { eq, or, like, sql, and, inArray, gte, desc } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ESM compatibility: recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { forceSeedStrongEntries, forceSeedStudyModules } from "./init-db";
import { STRONG_DATA } from "./strong-data-embedded";
import { TRANSLATION_REGISTRY, getEnabledTranslations, hasDataAvailable, getTranslation, getDefaultTranslation } from "./bible/translations";
import iapRoutes from "./payments/iap-routes";
import { generateStrongDefinition, isEntryIncomplete } from "./services/strong-ai-generator";
import { readingPlanService } from "./reading-plans";
import { transcribeAudio, generateSermonSummary, generateShareToken } from "./services/sermon-ai";
import { sermonRecordings } from "@shared/schema";

// In-memory cache for Strong entries (true LRU with TTL)
interface StrongCacheEntry {
  data: any;
  timestamp: number;
}
const strongCache = new Map<string, StrongCacheEntry>();
const STRONG_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const STRONG_CACHE_MAX_SIZE = 2000; // Max entries in cache

function getFromStrongCache(key: string): any | null {
  const entry = strongCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > STRONG_CACHE_TTL) {
    strongCache.delete(key);
    return null;
  }
  // True LRU: move to end by re-inserting (Map preserves insertion order)
  strongCache.delete(key);
  strongCache.set(key, entry);
  return entry.data;
}

function setInStrongCache(key: string, data: any): void {
  // If key exists, delete first to move to end
  if (strongCache.has(key)) {
    strongCache.delete(key);
  }
  // True LRU: evict oldest (first) entries when full
  while (strongCache.size >= STRONG_CACHE_MAX_SIZE) {
    const oldestKey = strongCache.keys().next().value;
    if (oldestKey) strongCache.delete(oldestKey);
    else break;
  }
  strongCache.set(key, { data, timestamp: Date.now() });
}

// Initialize Firebase Admin SDK (only if configured)
let firebaseInitialized = false;
function initFirebaseAdmin() {
  if (firebaseInitialized) return true;
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.log("⚠️ Firebase não configurado - login com Google desabilitado");
    return false;
  }
  
  try {
    admin.initializeApp({
      projectId: projectId,
    });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin inicializado");
    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Firebase Admin for Google login verification
  initFirebaseAdmin();
  
  // Middleware: Cache control for static files (MUST be first!)
  // This prevents browser from caching the app shell and allows updates
  app.use((req, res, next) => {
    const path = req.path;
    
    // Never cache: app shell, manifest, service worker
    if (path === '/' || path === '/index.html' || path === '/manifest.json' || path === '/sw.js') {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('ETag', '');  // Disable ETag caching for these files
    }
    // Cache assets with hashes for 1 year (they have content hashes in filename)
    else if (path.startsWith('/assets/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache other resources for 1 hour
    else if (path.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)) {
      res.set('Cache-Control', 'public, max-age=3600');
    }
    
    next();
  });

  // DEBUG: Diagnostic endpoint to check embedded data state (temporary)
  app.get("/api/debug/strong-status", async (req, res) => {
    try {
      const strongDataAny = STRONG_DATA as any;
      const dbCount = await db.select({ count: sql<number>`count(*)` }).from(strongEntries);
      
      res.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        strongData: {
          exists: !!strongDataAny,
          type: typeof strongDataAny,
          isArray: Array.isArray(strongDataAny),
          hasEntries: !!(strongDataAny?.entries),
          entriesIsArray: Array.isArray(strongDataAny?.entries),
          entriesLength: strongDataAny?.entries?.length ?? (Array.isArray(strongDataAny) ? strongDataAny.length : 0),
          exportedAt: strongDataAny?.exportedAt ?? 'N/A',
          keys: strongDataAny ? Object.keys(strongDataAny).slice(0, 10) : [],
          firstEntry: strongDataAny?.entries?.[0] ?? (Array.isArray(strongDataAny) ? strongDataAny[0] : null),
        },
        database: {
          strongEntriesCount: Number(dbCount[0]?.count) || 0,
        }
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { deviceId, ...userData } = req.body;
      const validatedData = insertUserSchema.parse(userData);
      
      if (!validatedData.email || !validatedData.password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Link deviceId to user if provided (guest converting to registered user)
      if (deviceId && typeof storage.linkGuestToUser === 'function') {
        try {
          await storage.linkGuestToUser(deviceId, user.id);
          console.log(`✅ Guest ${deviceId} vinculado ao usuário ${user.id}`);
        } catch (linkError) {
          console.warn('Erro ao vincular deviceId ao usuário:', linkError);
        }
      }

      // Auto-grant registration bonus (7-day trial extension)
      // System admin ID for auto-granted bonuses
      const SYSTEM_ADMIN_ID = '54a45c5b-7364-47dc-b1dd-0cd824384ec4';
      const now = new Date();
      const bonusEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      try {
        await storage.createBonus({
          userId: user.id,
          bonusType: 'TRIAL_EXTEND',
          startAt: now,
          endAt: bonusEndDate,
          reason: 'Bônus automático por cadastro com email (+7 dias)',
          grantedByAdminId: SYSTEM_ADMIN_ID,
        });
        console.log(`🎁 Bônus de 7 dias concedido ao usuário ${user.email}`);
      } catch (bonusError) {
        console.warn('Erro ao conceder bônus de registro:', bonusError);
      }

      // Generate token
      const token = generateToken(user.id, user.email || '', user.role || 'user');

      // Return user without password + trial info
      const { password: _, ...userWithoutPassword } = user;
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);
      
      res.json({ 
        user: userWithoutPassword, 
        token,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // ===== LOGS DETALHADOS PARA DEBUG =====
      console.log(`\n🔐 ===== TENTATIVA DE LOGIN =====`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Senha recebida: ${'*'.repeat(password?.length || 0)} (${password?.length || 0} caracteres)`);
      console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

      if (!email || !password) {
        console.log(`❌ ERRO: Email ou senha não fornecidos`);
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      console.log(`🔍 Buscando usuário no banco...`);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`❌ USUÁRIO NÃO ENCONTRADO: ${email}`);
        return res.status(401).json({ 
          error: "Email não cadastrado. Verifique o email ou crie uma nova conta.",
          errorType: "user_not_found"
        });
      }
      
      console.log(`✅ Usuário encontrado!`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Nome: ${user.name}`);
      console.log(`   - Role: ${user.role}`);
      
      if (!user.password) {
        console.log(`❌ Usuário sem senha (possivelmente login social)`);
        return res.status(401).json({ 
          error: "Esta conta usa login social. Por favor, faça login com Google.",
          errorType: "social_login"
        });
      }
      
      // Não logamos o hash em produção por segurança
      if (process.env.NODE_ENV !== 'production') {
        console.log(`   - Hash no banco: ${user.password.substring(0, 25)}...`);
      }

      console.log(`🔐 Comparando senha com bcrypt...`);
      const isPasswordValid = await verifyPassword(password, user.password);
      console.log(`🔐 Resultado bcrypt.compare: ${isPasswordValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
      
      if (!isPasswordValid) {
        console.log(`❌ SENHA INVÁLIDA para ${email}`);
        return res.status(401).json({ 
          error: "Senha incorreta. Verifique e tente novamente.",
          errorType: "invalid_password"
        });
      }

      console.log(`✅ LOGIN BEM-SUCEDIDO para ${email}!`);
      const token = generateToken(user.id, user.email || '', user.role || 'user');
      const { password: _, ...userWithoutPassword } = user;
      
      // Update last login and last seen
      await storage.updateUserLastLogin(user.id);
      await storage.updateUserLastSeen(user.id, 'web');
      
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);
      
      console.log(`🎫 Token gerado, enviando resposta...`);
      console.log(`🔐 ===== FIM DO LOGIN =====\n`);
      
      res.json({ 
        user: userWithoutPassword, 
        token,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("❌ ERRO CRÍTICO no login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // Google Firebase Authentication - verify Firebase ID token and create/login user
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken, deviceId } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ error: "Token do Google é obrigatório" });
      }
      
      if (!firebaseInitialized) {
        return res.status(503).json({ error: "Login com Google não está disponível no momento" });
      }
      
      // Verify the Firebase ID token
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (verifyError) {
        console.error("❌ Erro ao verificar token do Firebase:", verifyError);
        return res.status(401).json({ error: "Token inválido" });
      }
      
      const { email, name, picture, uid } = decodedToken;
      
      if (!email) {
        return res.status(400).json({ error: "Email não disponível na conta Google" });
      }
      
      console.log(`🔐 Login com Google: ${email}`);
      
      // Check if user already exists by email
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update profile info from Google if changed
        if (picture && user.profileImageUrl !== picture) {
          await storage.updateUser(user.id, { profileImageUrl: picture });
        }
        console.log(`✅ Usuário existente: ${email}`);
      } else {
        // Create new user with Google data
        const [firstName, ...lastNameParts] = (name || email.split('@')[0]).split(' ');
        const lastName = lastNameParts.join(' ') || null;
        
        user = await storage.createUser({
          email,
          name: name || email.split('@')[0],
          password: '', // No password for Google users
          firstName,
          lastName,
          profileImageUrl: picture || null,
          googleId: uid,
        });
        console.log(`✅ Novo usuário criado via Google: ${email}`);
      }
      
      // Link deviceId if provided (guest converting to registered)
      if (deviceId && typeof storage.linkGuestToUser === 'function') {
        try {
          await storage.linkGuestToUser(deviceId, user.id);
          console.log(`✅ Guest ${deviceId} vinculado ao usuário ${user.id}`);
        } catch (linkError) {
          console.warn('Erro ao vincular deviceId:', linkError);
        }
      }
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Generate JWT token
      const token = generateToken(user.id, user.email!, user.role || 'user');
      
      const { password: _, ...userWithoutPassword } = user;
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);
      
      res.json({
        user: userWithoutPassword,
        token,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("❌ Erro no login com Google:", error);
      res.status(500).json({ error: "Erro ao fazer login com Google" });
    }
  });

  // Get current user info
  app.get("/api/auth/me", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const { password: _, ...userWithoutPassword } = user;
      
      // Add trial info
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);

      res.json({
        user: userWithoutPassword,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  });

  // Logout - não requer autenticação pois o token pode estar expirado
  app.post("/api/auth/logout", async (req, res) => {
    try {
      console.log(`🔓 Logout realizado`);
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Erro ao fazer logout" });
    }
  });

  // Forgot password - send reset link via email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.json({ 
          message: "Se existe uma conta com esse email, você receberá um link de reset em breve." 
        });
      }

      // Generate reset token (valid for 30 minutes)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1800000); // 30 minutes

      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // Generate reset link using request origin or configured URL
      const origin = req.get('origin') || req.get('referer')?.split('?')[0].split('#')[0] || process.env.FRONTEND_URL || 'http://localhost:5000';
      const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
      
      // Send email with reset link
      const emailResult = await sendPasswordResetEmail(email, resetLink, user.name || undefined);

      // Only show dev link if email was NOT sent successfully via Resend
      const showDevLink = !emailResult.success && process.env.NODE_ENV !== 'production';
      
      res.json({ 
        message: emailResult.success 
          ? "Se existe uma conta com esse email, você receberá um link de reset em breve."
          : emailResult.message,
        emailSent: emailResult.success,
        ...(showDevLink && { devToken: resetToken, devLink: resetLink })
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  });

  // Reset password - confirm reset with token and new password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
      }

      // Get reset token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Token de reset inválido ou expirado" });
      }

      if (resetToken.used) {
        return res.status(400).json({ error: "Este token de reset já foi usado" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Token de reset expirado" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markResetTokenAsUsed(token);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Erro ao resetar senha" });
    }
  });

  // Change password (authenticated user)
  app.post("/api/auth/change-password", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      // Get current user
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verify current password
      if (!user.password) {
        return res.status(400).json({ error: "Esta conta usa login social e não possui senha" });
      }
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: "Senha atual está incorreta" });
      }

      // Prevent using same password
      const isSamePassword = await verifyPassword(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ error: "Nova senha não pode ser igual à senha atual" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(req.userId!, hashedPassword);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Erro ao alterar senha" });
    }
  });

  // User subscription status (used by AIPanel to check access)
  app.get("/api/user/subscription-status", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // Prevent caching of subscription status
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const trialActive = isTrialActive(user.trialStartDate);
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'strong_lifetime');

      // Check for active bonuses that grant Gold or Premium access
      const hasGoldBonus = await storage.hasActiveBonus(req.userId!, 'gold_free');
      const hasPremiumBonus = await storage.hasActiveBonus(req.userId!, 'premium_free');
      const hasTrialExtendBonus = await storage.hasActiveBonus(req.userId!, 'trial_extend');
      
      // Combine subscription and bonus access
      const effectiveHasGold = hasGold || hasGoldBonus || hasTrialExtendBonus;
      const effectiveHasPremium = hasPremium || hasPremiumBonus;

      // Debug log for subscription status
      console.log(`[Subscription Status] userId=${req.userId}, hasGold=${hasGold}, hasPremium=${hasPremium}, hasLifetime=${hasLifetime}, bonuses: gold=${hasGoldBonus}, premium=${hasPremiumBonus}, trial=${hasTrialExtendBonus}`);

      res.json({
        hasPremium: effectiveHasPremium,
        hasGold: effectiveHasGold,
        hasLifetime,
        trialActive,
        userId: req.userId,
      });
    } catch (error) {
      console.error("Get subscription status error:", error);
      res.status(500).json({ error: "Erro ao buscar status de assinatura" });
    }
  });

  // Update user preferred language
  app.post("/api/user/language", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { language } = req.body;
      
      if (!language || !["pt", "en", "es"].includes(language)) {
        return res.status(400).json({ error: "Idioma inválido" });
      }

      await storage.updateUserLanguage(req.userId!, language);
      res.json({ success: true, language });
    } catch (error) {
      console.error("Update language error:", error);
      res.status(500).json({ error: "Erro ao atualizar idioma" });
    }
  });

  // Admin Routes
  // IMPORTANT: This route allows the FIRST user to become admin without authentication
  // After the first admin exists, only authenticated admins can make others admin
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
      
      // Assinantes têm acesso ilimitado ou diário
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'strong_lifetime');
      
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

  // IA Professor: PLANO GRATUITO = 5 perguntas NO TOTAL (não renovável)
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
      
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');

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

      // PLANO GRATUITO: 5 perguntas NO TOTAL
      const AI_FREE_LIMIT = 5;
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
      const { question, book, chapter, verse, mode = 'essential', language = 'pt' } = req.body;

      // Validate input
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Pergunta é obrigatória" });
      }

      // Validate language
      const validLanguages = ['pt', 'en', 'es'];
      if (!validLanguages.includes(language)) {
        return res.status(400).json({ error: "Idioma inválido" });
      }

      // Validate mode - accept all AI modes
      const validModes = ['essential', 'premium', 'professor', 'pregador', 'exegese', 'teologica'];
      if (!validModes.includes(mode)) {
        return res.status(400).json({ error: "Modo inválido." });
      }
      
      // Premium modes that require premium subscription
      const premiumModes = ['premium', 'pregador', 'exegese', 'teologica'];

      // Get user and check trial status
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin bypass - admins have full access to all features
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      // PLANO GRATUITO ESTRITO: Check subscription status (sem trial, sem bonus)
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'lifetime');

      // Enforce plan permissions BEFORE making OpenAI call (admins bypass all restrictions)
      if (premiumModes.includes(mode) && !hasPremium && !hasLifetime && !isAdmin) {
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
      const hasFullAccess = hasGold || hasPremium || hasLifetime;

      // ========================================
      // PLANO GRATUITO: 5 perguntas NO TOTAL (não renovável)
      // ========================================
      const AI_FREE_LIMIT = 5;  // 5 perguntas totais para usuários gratuitos
      const totalUsed = await storage.getTotalUsageCount(req.userId!);
      
      // Para assinantes, usar limite diário mais alto
      const todayCount = await storage.getTodayUsageCount(req.userId!);
      
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
        // Assinantes: verificar limite diário (100 para Premium, 30 para Gold)
        const dailyLimit = hasPremium ? 100 : 30;
        if (todayCount >= dailyLimit) {
          return res.status(429).json({ 
            error: `Você atingiu o limite diário de ${dailyLimit} perguntas. ${
              hasPremium ? 'Aguarde até amanhã para continuar.' :
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
        verse,
        book,
        chapter,
        mode,
        language,
      });

      // Only increment usage count after successful response
      await storage.incrementUsageCount(req.userId!);

      // Track AI usage event for admin stats
      await storage.trackPageEvent(req.userId!, 'AI_QUESTION', {
        mode,
        book,
        chapter,
        verse,
      });

      // Save to history
      await storage.createAIHistory({
        userId: req.userId!,
        book,
        chapter,
        verse,
        question,
        response,
        aiMode: mode,
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
      
      res.json({ 
        response,
        usageInfo
      });
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
      
      // Only Premium/Lifetime users can generate images
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'lifetime');

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
      
      // Only Premium/Lifetime users can analyze images with Vision
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'lifetime');

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
  // PLANO GRATUITO: 5 perguntas NO TOTAL (não renovável)
  const FREE_QUESTIONS_LIMIT = 5;
  
  app.get("/api/ai/quota", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Check if user has unlimited access (admin, subscription)
      // PLANO GRATUITO ESTRITO: apenas assinantes (Gold/Premium/Lifetime) têm acesso ilimitado
      // Sem trial, sem bonus - apenas assinaturas pagas
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'lifetime');
      
      const hasUnlimitedAccess = isAdmin || hasGold || hasPremium || hasLifetime;
      
      if (hasUnlimitedAccess) {
        return res.json({
          used: 0,
          limit: -1, // Unlimited
          remaining: -1,
          hasUnlimitedAccess: true,
        });
      }
      
      // PLANO GRATUITO: 5 perguntas no total
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
  
  app.get("/api/strong/quota", async (req, res) => {
    try {
      // NOVA REGRA: Strong REQUER LOGIN
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({
          used: 0,
          limit: FREE_STRONG_LIMIT,
          remaining: 0,
          type: 'not_logged_in',
          hasUnlimitedAccess: false,
          requiresLogin: true,
        });
      }
      
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
        const user = await storage.getUser(decoded.userId);
        
        if (!user) {
          return res.json({
            used: 0,
            limit: FREE_STRONG_LIMIT,
            remaining: 0,
            type: 'not_logged_in',
            hasUnlimitedAccess: false,
            requiresLogin: true,
          });
        }
        
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';
        const hasGold = await storage.hasActiveSubscription(decoded.userId, 'gold');
        const hasPremium = await storage.hasActiveSubscription(decoded.userId, 'premium');
        const hasLifetime = await storage.hasActiveSubscription(decoded.userId, 'strong_lifetime');
        const hasActiveBonus = await storage.hasActiveBonus(decoded.userId);
        
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
          const todayLookups = await storage.getTodayStrongLookups(decoded.userId);
          return res.json({
            used: todayLookups,
            limit: GOLD_STRONG_DAILY_LIMIT,
            remaining: Math.max(0, GOLD_STRONG_DAILY_LIMIT - todayLookups),
            type: 'gold',
            hasUnlimitedAccess: false,
          });
        }
        
        // Free user (logado sem assinatura): 2 palavras total
        const quota = await storage.getFreeStrongQuota(decoded.userId);
        const used = quota?.lookupsUsed || 0;
        
        return res.json({
          used,
          limit: FREE_STRONG_LIMIT,
          remaining: Math.max(0, FREE_STRONG_LIMIT - used),
          type: 'free',
          hasUnlimitedAccess: false,
        });
      } catch (tokenError) {
        return res.json({
          used: 0,
          limit: FREE_STRONG_LIMIT,
          remaining: 0,
          type: 'not_logged_in',
          hasUnlimitedAccess: false,
          requiresLogin: true,
        });
      }
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
  app.get("/api/bookmarks", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const bookmarks = await storage.getUserBookmarks(req.userId!);
      res.json(bookmarks);
    } catch (error) {
      console.error("Get bookmarks error:", error);
      res.status(500).json({ error: "Erro ao buscar marcadores" });
    }
  });

  app.post("/api/bookmarks", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertBookmarkSchema.parse({
        ...req.body,
        userId: req.userId,
      });

      const bookmark = await storage.createBookmark(validatedData);
      res.json(bookmark);
    } catch (error) {
      console.error("Create bookmark error:", error);
      res.status(400).json({ error: "Erro ao criar marcador" });
    }
  });

  app.delete("/api/bookmarks/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteBookmark(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete bookmark error:", error);
      res.status(500).json({ error: "Erro ao deletar marcador" });
    }
  });

  // Annotations
  app.get("/api/annotations", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const annotations = await storage.getUserAnnotations(req.userId!);
      res.json(annotations);
    } catch (error) {
      console.error("Get annotations error:", error);
      res.status(500).json({ error: "Erro ao buscar anotações" });
    }
  });

  app.get("/api/annotations/:book/:chapter/:verse", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, verse } = req.params;
      const annotations = await storage.getVerseAnnotations(
        req.userId!,
        book,
        parseInt(chapter),
        parseInt(verse)
      );
      res.json(annotations);
    } catch (error) {
      console.error("Get verse annotations error:", error);
      res.status(500).json({ error: "Erro ao buscar anotações" });
    }
  });

  app.post("/api/annotations", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAnnotationSchema.parse({
        ...req.body,
        userId: req.userId,
      });

      const annotation = await storage.createAnnotation(validatedData);
      res.json(annotation);
    } catch (error) {
      console.error("Create annotation error:", error);
      res.status(400).json({ error: "Erro ao criar anotação" });
    }
  });

  app.patch("/api/annotations/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { note } = req.body;
      if (!note) {
        return res.status(400).json({ error: "Nota é obrigatória" });
      }

      const annotation = await storage.updateAnnotation(req.params.id, req.userId!, note);
      if (!annotation) {
        return res.status(404).json({ error: "Anotação não encontrada" });
      }

      res.json(annotation);
    } catch (error) {
      console.error("Update annotation error:", error);
      res.status(500).json({ error: "Erro ao atualizar anotação" });
    }
  });

  app.delete("/api/annotations/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteAnnotation(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete annotation error:", error);
      res.status(500).json({ error: "Erro ao deletar anotação" });
    }
  });

  // ===================================
  // HIGHLIGHTS ROUTES (Cloud Sync)
  // ===================================

  app.get("/api/highlights", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userHighlights = await storage.getUserHighlights(req.userId!);
      res.json(userHighlights);
    } catch (error) {
      console.error("Get highlights error:", error);
      res.status(500).json({ error: "Erro ao buscar destaques" });
    }
  });

  app.get("/api/highlights/:book/:chapter", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter } = req.params;
      const chapterHighlights = await storage.getChapterHighlights(req.userId!, book, parseInt(chapter));
      res.json(chapterHighlights);
    } catch (error) {
      console.error("Get chapter highlights error:", error);
      res.status(500).json({ error: "Erro ao buscar destaques do capítulo" });
    }
  });

  app.post("/api/highlights", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, verse, color } = req.body;
      
      if (!book || chapter === undefined || verse === undefined || !color) {
        return res.status(400).json({ error: "Livro, capítulo, versículo e cor são obrigatórios" });
      }

      const highlight = await storage.createHighlight({
        userId: req.userId!,
        book,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        color,
      });

      res.json(highlight);
    } catch (error) {
      console.error("Create highlight error:", error);
      res.status(400).json({ error: "Erro ao criar destaque" });
    }
  });

  app.delete("/api/highlights/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteHighlight(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete highlight error:", error);
      res.status(500).json({ error: "Erro ao remover destaque" });
    }
  });

  app.delete("/api/highlights/verse/:book/:chapter/:verse", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, verse } = req.params;
      await storage.deleteVerseHighlight(req.userId!, book, parseInt(chapter), parseInt(verse));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete verse highlight error:", error);
      res.status(500).json({ error: "Erro ao remover destaque do versículo" });
    }
  });

  // ===================================
  // READING HISTORY ROUTES (Cloud Sync)
  // ===================================

  app.get("/api/reading-history", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserReadingHistory(req.userId!, limit);
      res.json(history);
    } catch (error) {
      console.error("Get reading history error:", error);
      res.status(500).json({ error: "Erro ao buscar histórico de leitura" });
    }
  });

  app.post("/api/reading-history", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, versionCode } = req.body;
      
      if (!book || chapter === undefined) {
        return res.status(400).json({ error: "Livro e capítulo são obrigatórios" });
      }

      const historyEntry = await storage.addReadingHistory({
        userId: req.userId!,
        book,
        chapter: parseInt(chapter),
        versionCode: versionCode || 'ACF',
        readAt: new Date(),
      });

      res.json(historyEntry);
    } catch (error) {
      console.error("Add reading history error:", error);
      res.status(400).json({ error: "Erro ao registrar histórico de leitura" });
    }
  });

  // ===================================
  // CLOUD SYNC ROUTES
  // ===================================

  app.get("/api/sync/all", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string || 'default';
      
      const allData = await storage.getAllUserData(req.userId!);
      await storage.updateSyncState(req.userId!, deviceId);
      
      res.json({
        success: true,
        data: allData,
        syncedAt: new Date().toISOString(),
        deviceId,
      });
    } catch (error) {
      console.error("Sync all error:", error);
      res.status(500).json({ error: "Erro ao sincronizar dados" });
    }
  });

  app.get("/api/sync/state", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string || 'default';
      const state = await storage.getSyncState(req.userId!, deviceId);
      
      res.json({
        lastSyncAt: state?.lastSyncAt?.toISOString() || null,
        syncVersion: state?.syncVersion || 0,
        deviceId,
      });
    } catch (error) {
      console.error("Get sync state error:", error);
      res.status(500).json({ error: "Erro ao buscar estado de sincronização" });
    }
  });

  // ===================================
  // CHAT SESSIONS CLOUD SYNC
  // ===================================

  // Get all chat sessions from cloud
  app.get("/api/sync/chat-sessions", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const sessions = await storage.getUserChatSessions(req.userId!);
      const syncMeta = await storage.getUserSyncMeta(req.userId!);
      
      res.json({
        success: true,
        sessions,
        lastSyncedAt: syncMeta?.lastSyncedAt?.toISOString() || null,
      });
    } catch (error) {
      console.error("[Sync] Get chat sessions error:", error);
      res.status(500).json({ error: "Erro ao buscar sessões de chat" });
    }
  });

  // Sync chat sessions to cloud (upsert multiple)
  app.post("/api/sync/chat-sessions", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { sessions, deletedIds } = req.body;
      const deviceId = req.headers['x-device-id'] as string || 'default';
      
      console.log(`[Sync] User ${req.userId} syncing ${sessions?.length || 0} sessions, deleting ${deletedIds?.length || 0}`);
      
      // Delete sessions marked for deletion
      if (deletedIds && Array.isArray(deletedIds)) {
        for (const id of deletedIds) {
          await storage.deleteChatSession(id, req.userId!);
        }
      }
      
      // Upsert all sessions
      const syncedSessions = [];
      if (sessions && Array.isArray(sessions)) {
        for (const session of sessions) {
          const synced = await storage.upsertChatSession({
            id: session.id,
            userId: req.userId!,
            title: session.title,
            messages: session.messages,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
          });
          syncedSessions.push(synced);
        }
      }
      
      // Update sync metadata
      await storage.updateUserSyncMeta(req.userId!, deviceId);
      
      res.json({
        success: true,
        syncedCount: syncedSessions.length,
        deletedCount: deletedIds?.length || 0,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Sync] Sync chat sessions error:", error);
      res.status(500).json({ error: "Erro ao sincronizar sessões de chat" });
    }
  });

  // Get sessions updated since a specific timestamp (incremental sync)
  app.get("/api/sync/chat-sessions/since/:timestamp", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const since = new Date(req.params.timestamp);
      if (isNaN(since.getTime())) {
        return res.status(400).json({ error: "Timestamp inválido" });
      }
      
      const sessions = await storage.getChatSessionsSince(req.userId!, since);
      
      res.json({
        success: true,
        sessions,
        since: since.toISOString(),
      });
    } catch (error) {
      console.error("[Sync] Get sessions since error:", error);
      res.status(500).json({ error: "Erro ao buscar sessões atualizadas" });
    }
  });

  // Delete a specific chat session from cloud
  app.delete("/api/sync/chat-sessions/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteChatSession(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("[Sync] Delete chat session error:", error);
      res.status(500).json({ error: "Erro ao deletar sessão de chat" });
    }
  });

  // ===================================
  // GUEST ROUTES (anonymous visitors)
  // ===================================

  // Register or update guest device
  app.post("/api/guest/register", async (req, res) => {
    try {
      const { deviceId, platform, locale } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ error: "deviceId é obrigatório" });
      }
      
      const guest = await storage.createOrUpdateGuest(deviceId, platform || 'web', locale);
      
      // Track app open event
      await storage.trackAppEvent(deviceId, 'app_open', { platform, locale });
      
      res.json({
        success: true,
        trial: {
          active: new Date() < guest.trialEndAt,
          daysRemaining: Math.max(0, Math.ceil((guest.trialEndAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          endsAt: guest.trialEndAt.toISOString(),
        },
        isNewDevice: guest.totalSessions === 1,
      });
    } catch (error) {
      console.error("Guest register error:", error);
      res.status(500).json({ error: "Erro ao registrar dispositivo" });
    }
  });

  // Get guest trial status
  app.get("/api/guest/trial/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const trialInfo = await storage.getGuestTrialInfo(deviceId);
      
      if (!trialInfo) {
        return res.json({ active: true, daysRemaining: 30, isNew: true });
      }
      
      res.json(trialInfo);
    } catch (error) {
      console.error("Guest trial error:", error);
      res.status(500).json({ error: "Erro ao verificar trial" });
    }
  });

  // Track app event (for analytics)
  app.post("/api/events/track", async (req, res) => {
    try {
      const { deviceId, eventType, eventData } = req.body;
      
      if (!deviceId || !eventType) {
        return res.status(400).json({ error: "deviceId e eventType são obrigatórios" });
      }
      
      // Try to extract userId from auth token if provided
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
          userId = decoded.userId;
        } catch {}
      }
      
      // Update guest lastSeenAt to track online status
      if (deviceId && !userId) {
        await storage.updateGuestLastSeen(deviceId);
      }
      
      await storage.trackAppEvent(deviceId, eventType, eventData, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Track event error:", error);
      res.status(500).json({ error: "Erro ao registrar evento" });
    }
  });

  // Guest AI access check (for AI without login)
  // PLANO GRATUITO: Visitante tem 5 perguntas NO TOTAL (não renovável)
  const GUEST_AI_LIMIT = 5;
  
  app.post("/api/guest/ai/check", async (req, res) => {
    try {
      const { deviceId } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ error: "deviceId é obrigatório" });
      }
      
      // Check total usage (not daily) for guests
      const totalUsed = await storage.getGuestTotalUsageCount(deviceId);
      const remaining = Math.max(0, GUEST_AI_LIMIT - totalUsed);
      
      if (remaining <= 0) {
        return res.json({
          canAsk: false,
          reason: 'limit_reached',
          message: `Você atingiu o limite de ${GUEST_AI_LIMIT} perguntas do plano gratuito. Crie uma conta e assine para continuar.`,
          used: totalUsed,
          limit: GUEST_AI_LIMIT,
        });
      }
      
      res.json({
        canAsk: true,
        remainingQuestions: remaining,
        used: totalUsed,
        limit: GUEST_AI_LIMIT,
        mode: 'essential',
      });
    } catch (error) {
      console.error("Guest AI check error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso IA" });
    }
  });

  // Guest AI ask (AI without login)
  // PLANO GRATUITO: Visitante tem 5 perguntas NO TOTAL (não renovável)
  app.post("/api/guest/ai/ask", async (req, res) => {
    try {
      const { deviceId, question, book, chapter, verse, language } = req.body;
      
      if (!deviceId || !question) {
        return res.status(400).json({ error: "deviceId e question são obrigatórios" });
      }
      
      // Auto-register guest if not exists
      const guestExists = await storage.getGuestTrialInfo(deviceId);
      if (!guestExists) {
        await storage.createOrUpdateGuest(deviceId, 'web');
      }
      
      // Check TOTAL limit (not daily) - 5 perguntas no total para visitantes
      const totalUsed = await storage.getGuestTotalUsageCount(deviceId);
      if (totalUsed >= GUEST_AI_LIMIT) {
        return res.status(429).json({
          error: "Limite atingido",
          message: `Você atingiu o limite de ${GUEST_AI_LIMIT} perguntas do plano gratuito. Crie uma conta e assine para continuar.`,
          requiresSubscription: true,
        });
      }
      
      // Ask the AI (essential mode for guests)
      const response = await askTheologicalQuestion({
        question,
        mode: 'essential',
        book,
        chapter,
        verse,
        language,
      });
      
      // Increment usage
      await storage.incrementGuestUsageCount(deviceId);
      
      // Track event
      await storage.trackAppEvent(deviceId, 'ia_question', { 
        mode: 'essential', 
        book, 
        chapter, 
        verse 
      });
      
      res.json({
        response,
        remainingQuestions: GUEST_AI_LIMIT - totalUsed - 1,
        used: totalUsed + 1,
        limit: GUEST_AI_LIMIT,
      });
    } catch (error) {
      console.error("Guest AI ask error:", error);
      res.status(500).json({ error: "Erro ao processar pergunta" });
    }
  });

  // ===================================
  // BIBLE VERSIONS ROUTES
  // ===================================
  
  // Get all available versions from Translation Registry
  app.get("/api/versions", async (req, res) => {
    try {
      // Get verse counts from database to verify data availability
      const verseCounts = await db
        .select({
          versionCode: bibleVerses.versionCode,
          count: sql<number>`count(*)`
        })
        .from(bibleVerses)
        .groupBy(bibleVerses.versionCode);
      
      const countMap = verseCounts.reduce((acc, row) => {
        acc[row.versionCode] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // Return enabled translations with actual data status
      // Use hasData from registry (allows fallback versions to appear)
      const translations = getEnabledTranslations().map(t => ({
        code: t.code,
        name: t.name,
        language: t.language,
        licenseType: t.licenseType,
        hasData: t.hasData || (countMap[t.code] || 0) > 1000,
        verseCount: countMap[t.code] || 0,
        notes: t.notes,
        sourceUrl: t.sourceUrl
      }));

      res.json(translations);
    } catch (error) {
      console.error("Get versions error:", error);
      res.status(500).json({ error: "Erro ao buscar versões" });
    }
  });

  // Get full translation registry (for admin)
  app.get("/api/versions/registry", async (req, res) => {
    try {
      res.json(TRANSLATION_REGISTRY);
    } catch (error) {
      console.error("Get registry error:", error);
      res.status(500).json({ error: "Erro ao buscar registro" });
    }
  });

  // Get user's bible preferences
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
  app.get("/api/bible/search-all", async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      const version = (req.query.version as string) || 'ACF';
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Termo de busca deve ter pelo menos 2 caracteres" });
      }

      // Search in bibleVerses table
      const results = await db
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

      // Map book IDs to names
      const resultsWithNames = results.map(r => {
        const bookData = getBookById(r.book);
        return {
          ...r,
          bookName: bookData?.name || r.book,
          reference: `${bookData?.name || r.book} ${r.chapter}:${r.verse}`,
        };
      });

      res.json({
        query,
        version,
        total: resultsWithNames.length,
        results: resultsWithNames,
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

  // COMPREHENSIVE Portuguese word mappings for GREEK (New Testament)
  const GREEK_WORD_MAPPINGS: Record<string, string> = {
    // Core theological terms
    'deus': 'G2316', 'senhor': 'G2962', 'jesus': 'G2424', 'cristo': 'G5547',
    'espírito': 'G4151', 'santo': 'G40', 'pai': 'G3962',
    'palavra': 'G3056', 'vida': 'G2222', 'amor': 'G26', 'amou': 'G25', 'ama': 'G25', 'amar': 'G25',
    'graça': 'G5485', 'verdade': 'G225', 'luz': 'G5457', 'trevas': 'G4655',
    'salvação': 'G4991', 'salvador': 'G4990', 'pecado': 'G266', 'pecados': 'G266',
    'justiça': 'G1343', 'justo': 'G1342', 'fé': 'G4102', 'crê': 'G4100', 'crer': 'G4100',
    'esperança': 'G1680', 'glória': 'G1391', 'poder': 'G1411', 'sabedoria': 'G4678',
    // People and relationships
    'homem': 'G444', 'homens': 'G444', 'mulher': 'G1135', 'mulheres': 'G1135',
    'irmão': 'G80', 'irmãos': 'G80', 'povo': 'G2992', 'igreja': 'G1577', 'igrejas': 'G1577',
    'discípulo': 'G3101', 'discípulos': 'G3101', 'apóstolo': 'G652', 'apóstolos': 'G652',
    'profeta': 'G4396', 'profetas': 'G4396', 'rei': 'G935', 'reino': 'G932',
    'filho': 'G5207', 'filhos': 'G5207', 'filha': 'G2364', 'filhas': 'G2364',
    'servo': 'G1401', 'servos': 'G1401', 'escravo': 'G1401', 'mestre': 'G1320',
    // Common verbs
    'disse': 'G2036', 'diz': 'G3004', 'dizer': 'G3004', 'dizendo': 'G3004', 'dizem': 'G3004',
    'fala': 'G2980', 'falou': 'G2980', 'falar': 'G2980', 'falando': 'G2980',
    'veio': 'G2064', 'vem': 'G2064', 'vir': 'G2064', 'vindo': 'G2064', 'virá': 'G2064',
    'vai': 'G4198', 'foi': 'G1096', 'era': 'G1510', 'ser': 'G1510', 'está': 'G1510', 'são': 'G1510',
    'deu': 'G1325', 'dar': 'G1325', 'dá': 'G1325', 'dando': 'G1325', 'dado': 'G1325',
    'recebeu': 'G2983', 'receber': 'G2983', 'recebendo': 'G2983', 'recebido': 'G2983',
    'enviou': 'G649', 'enviar': 'G649', 'enviado': 'G649', 'envia': 'G649',
    'ouvir': 'G191', 'ouviu': 'G191', 'ouve': 'G191', 'ouvindo': 'G191', 'ouvi': 'G191',
    'ver': 'G3708', 'viu': 'G3708', 'vê': 'G3708', 'vendo': 'G3708', 'visto': 'G3708',
    'conhecer': 'G1097', 'conhece': 'G1097', 'conheceu': 'G1097', 'conhecendo': 'G1097',
    'saber': 'G1492', 'sabe': 'G1492', 'sabemos': 'G1492', 'sabia': 'G1492',
    'fazer': 'G4160', 'faz': 'G4160', 'fez': 'G4160', 'fazendo': 'G4160', 'feito': 'G4160',
    'andar': 'G4043', 'anda': 'G4043', 'andou': 'G4043', 'andando': 'G4043',
    'viver': 'G2198', 'vive': 'G2198', 'viveu': 'G2198', 'vivendo': 'G2198',
    'morrer': 'G599', 'morreu': 'G599', 'morre': 'G599', 'morrendo': 'G599',
    'creu': 'G4100', 'crendo': 'G4100', 'creram': 'G4100',
    'orar': 'G4336', 'ora': 'G4336', 'orou': 'G4336', 'orando': 'G4336', 'oração': 'G4335',
    // Places and things
    'mundo': 'G2889', 'terra': 'G1093', 'céu': 'G3772', 'céus': 'G3772',
    'casa': 'G3624', 'templo': 'G2411', 'corpo': 'G4983', 'sangue': 'G129',
    'água': 'G5204', 'pão': 'G740', 'vinho': 'G3631', 'cruz': 'G4716',
    'morte': 'G2288', 'ressurreição': 'G386', 'tumulo': 'G3419', 'sepulcro': 'G3419',
    'nome': 'G3686', 'mão': 'G5495', 'mãos': 'G5495', 'olho': 'G3788', 'olhos': 'G3788',
    'coração': 'G2588', 'alma': 'G5590', 'mente': 'G3563', 'boca': 'G4750',
    'caminho': 'G3598', 'porta': 'G2374', 'cidade': 'G4172', 'aldeia': 'G2968',
    // Time and manner
    'dia': 'G2250', 'dias': 'G2250', 'hora': 'G5610', 'tempo': 'G2540', 'noite': 'G3571',
    'sempre': 'G3842', 'eterno': 'G166', 'eterna': 'G166', 'eternamente': 'G166',
    'agora': 'G3568', 'hoje': 'G4594', 'ontem': 'G5504', 'amanhã': 'G839',
    // Adjectives and quantities
    'grande': 'G3173', 'bom': 'G18', 'boa': 'G18', 'mau': 'G2556', 'má': 'G2556',
    'todo': 'G3956', 'todos': 'G3956', 'toda': 'G3956', 'todas': 'G3956',
    'muito': 'G4183', 'muitos': 'G4183', 'muita': 'G4183', 'muitas': 'G4183',
    'novo': 'G2537', 'nova': 'G2537', 'primeiro': 'G4413', 'último': 'G2078',
    'outro': 'G243', 'outra': 'G243', 'outros': 'G243', 'outras': 'G243',
    'próprio': 'G2398', 'própria': 'G2398', 'próprios': 'G2398',
    // Prepositions and conjunctions (important biblical terms)
    'com': 'G3326', 'para': 'G1519', 'sobre': 'G1909', 'entre': 'G1722',
    'contra': 'G2596', 'através': 'G1223', 'segundo': 'G2596', 'antes': 'G4253',
    'depois': 'G3326', 'desde': 'G575', 'até': 'G2193', 'porque': 'G3754',
    'quando': 'G3752', 'onde': 'G3699', 'como': 'G5613', 'assim': 'G3779',
    // Key NT concepts
    'evangelho': 'G2098', 'batismo': 'G908', 'batizar': 'G907', 'batizado': 'G907',
    'comunhão': 'G2842', 'mandamento': 'G1785', 'mandamentos': 'G1785',
    'lei': 'G3551', 'promessa': 'G1860', 'aliança': 'G1242', 'pacto': 'G1242',
    'testemunho': 'G3141', 'testemunha': 'G3144', 'testemunhas': 'G3144',
    'milagre': 'G4592', 'milagres': 'G4592', 'sinal': 'G4592', 'sinais': 'G4592',
    'parábola': 'G3850', 'parábolas': 'G3850', 'ensinamento': 'G1322',
    'fruto': 'G2590', 'frutos': 'G2590', 'semente': 'G4690',
    // Additional verb forms and variations
    'entrou': 'G1525', 'entrar': 'G1525', 'entra': 'G1525', 'entrando': 'G1525',
    'saiu': 'G1831', 'sair': 'G1831', 'sai': 'G1831', 'saindo': 'G1831',
    'levantou': 'G450', 'levantar': 'G450', 'levanta': 'G450', 'levantando': 'G450',
    'desceu': 'G2597', 'descer': 'G2597', 'desce': 'G2597', 'descendo': 'G2597',
    'subiu': 'G305', 'subir': 'G305', 'sobe': 'G305', 'subindo': 'G305',
    'escreveu': 'G1125', 'escrever': 'G1125', 'escreve': 'G1125', 'escrito': 'G1125',
    'tomou': 'G2983', 'tomar': 'G2983', 'toma': 'G2983', 'tomando': 'G2983',
    'deixou': 'G863', 'deixar': 'G863', 'deixa': 'G863', 'deixando': 'G863',
    'seguiu': 'G190', 'seguir': 'G190', 'segue': 'G190', 'seguindo': 'G190',
    'respondeu': 'G611', 'responder': 'G611', 'responde': 'G611', 'respondendo': 'G611',
    'perguntou': 'G2065', 'perguntar': 'G2065', 'pergunta': 'G2065', 'perguntando': 'G2065',
    'curou': 'G2323', 'curar': 'G2323', 'cura': 'G2323', 'curando': 'G2323',
    'ensinou': 'G1321', 'ensinar': 'G1321', 'ensina': 'G1321', 'ensinando': 'G1321',
    'pregou': 'G2784', 'pregar': 'G2784', 'prega': 'G2784', 'pregando': 'G2784',
    'mandou': 'G2753', 'mandar': 'G2753', 'manda': 'G2753', 'mandando': 'G2753',
    'voltou': 'G1994', 'voltar': 'G1994', 'volta': 'G1994', 'voltando': 'G1994',
    'chegou': 'G2064', 'chegar': 'G2064', 'chega': 'G2064', 'chegando': 'G2064',
    'começou': 'G756', 'começar': 'G756', 'começa': 'G756', 'começando': 'G756',
    'procurou': 'G2212', 'procurar': 'G2212', 'procura': 'G2212', 'procurando': 'G2212',
    'buscou': 'G2212', 'buscar': 'G2212', 'busca': 'G2212', 'buscando': 'G2212',
    'encontrou': 'G2147', 'encontrar': 'G2147', 'encontra': 'G2147', 'encontrando': 'G2147',
    'achou': 'G2147', 'achar': 'G2147', 'acha': 'G2147', 'achando': 'G2147',
    'chamou': 'G2564', 'chamar': 'G2564', 'chama': 'G2564', 'chamando': 'G2564',
    'trouxe': 'G5342', 'trazer': 'G5342', 'traz': 'G5342', 'trazendo': 'G5342',
    'levou': 'G5342', 'levar': 'G5342', 'leva': 'G5342', 'levando': 'G5342',
    'pôs': 'G5087', 'pôr': 'G5087', 'põe': 'G5087', 'pondo': 'G5087',
    'colocou': 'G5087', 'colocar': 'G5087', 'coloca': 'G5087', 'colocando': 'G5087',
    'sentou': 'G2523', 'sentar': 'G2523', 'senta': 'G2523', 'sentando': 'G2523',
    'permanece': 'G3306', 'permanecer': 'G3306', 'permaneceu': 'G3306', 'permanecendo': 'G3306',
    'habita': 'G3306', 'habitar': 'G3306', 'habitou': 'G3306', 'habitando': 'G3306',
    // More prepositions and particles
    'pelo': 'G1223', 'pela': 'G1223', 'pelos': 'G1223', 'pelas': 'G1223',
    'dele': 'G846', 'dela': 'G846', 'deles': 'G846', 'delas': 'G846',
    'nele': 'G1722', 'nela': 'G1722', 'neles': 'G1722', 'nelas': 'G1722',
    'aquele': 'G1565', 'aquela': 'G1565', 'aqueles': 'G1565', 'aquelas': 'G1565',
    'este': 'G3778', 'esta': 'G3778', 'estes': 'G3778', 'estas': 'G3778',
    'esse': 'G1565', 'essa': 'G1565', 'esses': 'G1565', 'essas': 'G1565',
    'qual': 'G3739', 'quais': 'G3739', 'cujo': 'G3739', 'cuja': 'G3739',
    'mesmo': 'G846', 'mesma': 'G846', 'mesmos': 'G846', 'mesmas': 'G846',
    'ainda': 'G2089', 'também': 'G2532', 'porém': 'G1161', 'mas': 'G235',
    'pois': 'G1063', 'portanto': 'G3767', 'logo': 'G3767', 'então': 'G5119',
    // Quantities and comparatives
    'mais': 'G4183', 'menos': 'G1640', 'maior': 'G3187', 'menor': 'G3398',
    'melhor': 'G2909', 'pior': 'G5501', 'tanto': 'G5118', 'tão': 'G3779',
    'nada': 'G3762', 'ninguém': 'G3762', 'algum': 'G5100', 'alguma': 'G5100',
    'cada': 'G1538', 'qualquer': 'G3956', 'certo': 'G5100', 'certa': 'G5100',
    // Additional NT concepts
    'anjo': 'G32', 'anjos': 'G32', 'demônio': 'G1140', 'demônios': 'G1140',
    'diabo': 'G1228', 'satanás': 'G4567', 'espíritos': 'G4151', 'imundo': 'G169',
    'doente': 'G770', 'doentes': 'G770', 'enfermo': 'G770', 'enfermos': 'G770',
    'cego': 'G5185', 'cegos': 'G5185', 'surdo': 'G2974', 'surdos': 'G2974',
    'mudo': 'G2974', 'mudos': 'G2974', 'leproso': 'G3015', 'leprosos': 'G3015',
    'paralítico': 'G3885', 'paralíticos': 'G3885', 'morto': 'G3498', 'mortos': 'G3498',
    'pecador': 'G268', 'pecadores': 'G268', 'justos': 'G1342',
    'publicano': 'G5057', 'publicanos': 'G5057', 'fariseu': 'G5330', 'fariseus': 'G5330',
    'escriba': 'G1122', 'escribas': 'G1122', 'saduceu': 'G4523', 'saduceus': 'G4523',
    'gentio': 'G1484', 'gentios': 'G1484', 'judeu': 'G2453', 'judeus': 'G2453',
    'grego': 'G1672', 'gregos': 'G1672', 'romano': 'G4514', 'romanos': 'G4514',
    
    // === PAULINE EPISTLES VOCABULARY (Romans, Corinthians, Galatians, etc.) ===
    // Justification and salvation
    'justificação': 'G1347', 'justificar': 'G1344', 'justifica': 'G1344', 'justificado': 'G1344', 'justificados': 'G1344',
    'redenção': 'G629', 'redentor': 'G3086', 'redimir': 'G1805', 'redimido': 'G1805', 'redimidos': 'G1805',
    'reconciliação': 'G2643', 'reconciliar': 'G2644', 'reconciliado': 'G2644',
    'propiciação': 'G2435', 'expiação': 'G2435', 'propiciatório': 'G2435',
    'santificação': 'G38', 'santificar': 'G37', 'santificado': 'G37', 'santificados': 'G37',
    'adoção': 'G5206', 'herdeiro': 'G2818', 'herdeiros': 'G2818', 'herança': 'G2817',
    
    // Grace and law
    'obras': 'G2041', 'obra': 'G2041', 'trabalho': 'G2041', 'trabalhos': 'G2041',
    'circuncisão': 'G4061', 'circuncidar': 'G4059', 'circuncidado': 'G4059', 'incircunciso': 'G564',
    'liberdade': 'G1657', 'livre': 'G1658', 'livres': 'G1658', 'libertar': 'G1659', 'libertado': 'G1659',
    'escravidão': 'G1397',
    
    // Spirit and flesh
    'espiritual': 'G4152', 'espirituais': 'G4152', 'carnal': 'G4559', 'carnais': 'G4559',
    'carnes': 'G4561', 'corpos': 'G4983',
    'membro': 'G3196', 'membros': 'G3196', 'santuário': 'G3485',
    
    // Gifts and ministry
    'dom': 'G5486', 'dons': 'G5486', 'carisma': 'G5486', 'carismas': 'G5486',
    'ministério': 'G1248', 'ministrar': 'G1247', 'ministro': 'G1249', 'ministros': 'G1249',
    'edificação': 'G3619', 'edificar': 'G3618', 'edifica': 'G3618', 'edificado': 'G3618',
    'profecia': 'G4394', 'profetizar': 'G4395', 'profetiza': 'G4395',
    'língua': 'G1100', 'línguas': 'G1100', 'interpretação': 'G2058', 'interpretar': 'G2059',
    
    // Church life
    'assembleia': 'G1577', 'congregação': 'G1577', 'reunião': 'G1997',
    'ancião': 'G4245', 'anciãos': 'G4245', 'presbítero': 'G4245', 'presbíteros': 'G4245',
    'bispo': 'G1985', 'bispos': 'G1985', 'diácono': 'G1249', 'diáconos': 'G1249',
    'pastor': 'G4166', 'pastores': 'G4166', 'mestres': 'G1320',
    'evangelista': 'G2099', 'evangelistas': 'G2099', 'pregador': 'G2783',
    
    // Virtues (Galatians 5)
    'paciência': 'G3115', 'longanimidade': 'G3115', 'paciente': 'G3116',
    'bondade': 'G19', 'benignidade': 'G5544', 'mansidão': 'G4236', 'manso': 'G4239',
    'temperança': 'G1466', 'domínio': 'G1466', 'autocontrole': 'G1466',
    'fidelidade': 'G4102', 'fiel': 'G4103', 'fiéis': 'G4103',
    'alegria': 'G5479', 'alegre': 'G5463', 'alegrar': 'G5463', 'alegrai': 'G5463',
    'gozo': 'G5479', 'regozijo': 'G5479', 'regozijar': 'G5463',
    'paz': 'G1515', 'pacífico': 'G1516', 'pacificador': 'G1518',
    
    // Vices and sins
    'concupiscência': 'G1939', 'cobiça': 'G4124', 'cobiçar': 'G1937', 'avareza': 'G4124',
    'fornicação': 'G4202', 'adultério': 'G3430', 'impureza': 'G167', 'lascívia': 'G766',
    'idolatria': 'G1495', 'ídolo': 'G1497', 'ídolos': 'G1497', 'idólatra': 'G1496',
    'feitiçaria': 'G5331', 'inimizade': 'G2189', 'contenda': 'G2054', 'ciúme': 'G2205',
    'ira': 'G2372', 'discórdia': 'G2052', 'divisão': 'G1370', 'heresia': 'G139',
    'inveja': 'G5355', 'homicídio': 'G5408', 'embriaguez': 'G3178', 'glutonaria': 'G2970',
    
    // Armor of God (Ephesians 6)
    'armadura': 'G3833', 'cinto': 'G2223', 'couraça': 'G2382',
    'calçado': 'G5266', 'sandália': 'G5266', 'escudo': 'G2375',
    'capacete': 'G4030', 'espada': 'G3162',
    
    // Colossians/Ephesians themes
    'mistério': 'G3466', 'mistérios': 'G3466', 'revelação': 'G602', 'revelar': 'G601',
    'plenitude': 'G4138', 'pleno': 'G4134', 'plena': 'G4134',
    'riqueza': 'G4149', 'riquezas': 'G4149', 'tesouro': 'G2344', 'tesouros': 'G2344',
    'conhecimento': 'G1108', 'entendimento': 'G4907',
    'principado': 'G746', 'principados': 'G746', 'potestade': 'G1849', 'potestades': 'G1849',
    
    // === HEBREWS VOCABULARY ===
    'sacerdote': 'G2409', 'sacerdotes': 'G2409', 'sumo': 'G749',
    'sacrifício': 'G2378', 'sacrifícios': 'G2378', 'oferta': 'G4376', 'ofertas': 'G4376',
    'altar': 'G2379', 'santíssimo': 'G39',
    'mediador': 'G3316', 'fiador': 'G1450', 'intercessor': 'G1793',
    'testamento': 'G1242', 'testamentos': 'G1242', 'antigo': 'G3820',
    'melquisedeque': 'G3198', 'arão': 'G2', 'levítico': 'G3020',
    'perfeição': 'G5050', 'perfeito': 'G5046', 'perfeita': 'G5046', 'perfeitos': 'G5046',
    'sombra': 'G4639', 'figura': 'G5179', 'tipo': 'G5179', 'tipos': 'G5179',
    
    // === GENERAL EPISTLES VOCABULARY (James, Peter, John, Jude) ===
    // James
    'provação': 'G3986', 'provar': 'G3985', 'tentação': 'G3986', 'tentar': 'G3985',
    'perseverança': 'G5281', 'perseverar': 'G5278', 'perseverou': 'G5278',
    'sábio': 'G4680', 'sábios': 'G4680',
    'rico': 'G4145', 'ricos': 'G4145', 'pobre': 'G4434', 'pobres': 'G4434',
    'humilde': 'G5011', 'humildes': 'G5011', 'humildade': 'G5012', 'humilhar': 'G5013',
    'soberba': 'G5243', 'soberbo': 'G5244', 'soberbos': 'G5244', 'orgulho': 'G5243',
    
    // 1 Peter
    'eleito': 'G1588', 'eleitos': 'G1588', 'eleição': 'G1589',
    'estrangeiro': 'G3927', 'estrangeiros': 'G3927', 'peregrino': 'G3927', 'peregrinos': 'G3927',
    'sofrer': 'G3958', 'sofre': 'G3958', 'sofreu': 'G3958', 'sofrimento': 'G3804', 'sofrimentos': 'G3804',
    'submissão': 'G5292', 'submeter': 'G5293', 'submisso': 'G5293',
    
    // 1 John
    // 1 John (comunhão and irmão already defined above)
    'anticristo': 'G500', 'anticristos': 'G500', 'enganador': 'G4108', 'enganadores': 'G4108',
    'confissão': 'G3671', 'confessar': 'G3670', 'confessa': 'G3670', 'confessou': 'G3670',
    'guardar': 'G5083', 'guarda': 'G5083',
    
    // === REVELATION/APOCALYPSE VOCABULARY ===
    // Heavenly beings
    'cordeiro': 'G721', 'leão': 'G3023', 'dragão': 'G1404', 'serpente': 'G3789',
    'besta': 'G2342', 'bestas': 'G2342', 'fera': 'G2342', 'feras': 'G2342',
    'querubim': 'G5502', 'serafim': 'G4587',
    
    // Heavenly imagery
    'trono': 'G2362', 'tronos': 'G2362', 'coroa': 'G4735', 'coroas': 'G4735',
    'veste': 'G4749', 'vestes': 'G4749', 'branco': 'G3022', 'branca': 'G3022', 'brancos': 'G3022',
    'ouro': 'G5553', 'dourado': 'G5552', 'pedra': 'G3037', 'pedras': 'G3037',
    'jaspe': 'G2393', 'sardônio': 'G4556', 'esmeralda': 'G4665', 'safira': 'G4552',
    'arco-íris': 'G2463', 'mar': 'G2281', 'cristal': 'G2930',
    
    // Judgment imagery
    'selo': 'G4973', 'selos': 'G4973', 'taça': 'G5357', 'taças': 'G5357',
    'trombeta': 'G4536', 'trombetas': 'G4536', 'praga': 'G4127', 'pragas': 'G4127',
    'lago': 'G3041', 'fogo': 'G4442',
    'enxofre': 'G2303', 'hades': 'G86',
    
    // End times
    'vitória': 'G3529', 'vencer': 'G3528', 'vencedor': 'G3528', 'vencedores': 'G3528',
    'mártir': 'G3144', 'mártires': 'G3144',
    'tribulação': 'G2347', 'tribulações': 'G2347', 'aflição': 'G2347',
    'milênio': 'G5507', 'mil': 'G5507', 'anos': 'G2094',
    
    // New Jerusalem
    'noiva': 'G3565', 'muro': 'G5038', 'muros': 'G5038',
    'fundamento': 'G2310', 'fundamentos': 'G2310', 'rua': 'G4113', 'ruas': 'G4113',
    'rio': 'G4215', 'árvore': 'G3586',
    'folha': 'G5444', 'folhas': 'G5444',
    
    // Worship in Revelation
    'digno': 'G514', 'digna': 'G514', 'dignos': 'G514',
    'aleluia': 'G239', 'amém': 'G281', 'hosana': 'G5614',
    'honra': 'G5092', 'louvor': 'G133',
    'bendito': 'G2128', 'bendita': 'G2128', 'bendizer': 'G2127',
    
    // === ADDITIONAL COMMON WORDS FOR MAXIMUM COVERAGE ===
    // More verb forms
    'estavam': 'G1510', 'foram': 'G1096', 'havia': 'G1510', 'haviam': 'G1510',
    'tinha': 'G2192', 'tinham': 'G2192', 'tendo': 'G2192', 'tido': 'G2192',
    'seria': 'G1510', 'seriam': 'G1510', 'sendo': 'G1510', 'sido': 'G1510',
    'estou': 'G1510', 'estás': 'G1510', 'estamos': 'G1510', 'estão': 'G1510',
    'sou': 'G1510', 'és': 'G1510', 'somos': 'G1510',
    'tenho': 'G2192', 'tens': 'G2192', 'temos': 'G2192', 'têm': 'G2192',
    'vou': 'G4198', 'vais': 'G4198', 'vamos': 'G4198', 'vão': 'G4198',
    'pode': 'G1410', 'podem': 'G1410', 'podia': 'G1410', 'podiam': 'G1410', 'pôde': 'G1410',
    'poderia': 'G1410', 'poderiam': 'G1410', 'puder': 'G1410', 'pudesse': 'G1410',
    'quer': 'G2309', 'querem': 'G2309', 'queria': 'G2309', 'queriam': 'G2309', 'quis': 'G2309',
    'deve': 'G1163', 'devem': 'G1163', 'devia': 'G1163', 'deviam': 'G1163',
    
    // Additional pronouns and demonstratives
    'meu': 'G1699', 'minha': 'G1699', 'meus': 'G1699', 'minhas': 'G1699',
    'teu': 'G4674', 'tua': 'G4674', 'teus': 'G4674', 'tuas': 'G4674',
    'seu': 'G846', 'sua': 'G846', 'seus': 'G846', 'suas': 'G846',
    'nosso': 'G2257', 'nossa': 'G2257', 'nossos': 'G2257', 'nossas': 'G2257',
    'vosso': 'G5216', 'vossa': 'G5216', 'vossos': 'G5216', 'vossas': 'G5216',
    
    // Common particles and conjunctions
    'não': 'G3756', 'nem': 'G3761', 'nunca': 'G3763', 'jamais': 'G3763',
    'já': 'G2235', 'sem': 'G5565', 'só': 'G3441', 'apenas': 'G3440',
    'porém': 'G1161', 'contudo': 'G235', 'todavia': 'G3305', 'entretanto': 'G1161',
    'ora': 'G1161', 'senão': 'G1508', 'eis': 'G2400',
    
    // More verbs and verb forms
    'abre': 'G455', 'abriu': 'G455', 'abrir': 'G455', 'aberto': 'G455', 'abrindo': 'G455',
    'fecha': 'G2808', 'fechou': 'G2808', 'fechar': 'G2808', 'fechado': 'G2808',
    'põem': 'G5087', 'colocam': 'G5087', 'puseram': 'G5087',
    'tirou': 'G142', 'tirar': 'G142', 'tira': 'G142', 'tirando': 'G142',
    'tocou': 'G680', 'tocar': 'G680', 'toca': 'G680', 'tocando': 'G680',
    'caiu': 'G4098', 'cair': 'G4098', 'cai': 'G4098', 'caindo': 'G4098', 'caem': 'G4098',
    'ergueu': 'G1453', 'erguer': 'G1453', 'ergue': 'G1453', 'erguendo': 'G1453',
    'jogou': 'G906', 'jogar': 'G906', 'joga': 'G906', 'jogando': 'G906', 'lançou': 'G906', 'lançar': 'G906',
    'parou': 'G2476', 'parar': 'G2476', 'para': 'G2476', 'parando': 'G2476',
    'correu': 'G5143', 'correr': 'G5143', 'corre': 'G5143', 'correndo': 'G5143',
    'passou': 'G3928', 'passar': 'G3928', 'passa': 'G3928', 'passando': 'G3928',
    'comeu': 'G2068', 'comer': 'G2068', 'come': 'G2068', 'comendo': 'G2068',
    'bebeu': 'G4095', 'beber': 'G4095', 'bebe': 'G4095', 'bebendo': 'G4095',
    'dormiu': 'G2837', 'dormir': 'G2837', 'dorme': 'G2837', 'dormindo': 'G2837',
    'acordou': 'G1453', 'acordar': 'G1453', 'acorda': 'G1453', 'acordando': 'G1453',
    'nasceu': 'G1080', 'nascer': 'G1080', 'nasce': 'G1080', 'nascendo': 'G1080',
    'gerou': 'G1080', 'gerar': 'G1080', 'gera': 'G1080', 'gerando': 'G1080',
    'criou': 'G2936', 'criar': 'G2936', 'cria': 'G2936', 'criando': 'G2936',
    'esperou': 'G4327', 'esperar': 'G4327', 'espera': 'G4327', 'esperando': 'G4327',
    'trabalhou': 'G2038', 'trabalhar': 'G2038', 'trabalha': 'G2038', 'trabalhando': 'G2038',
    'serviu': 'G1398', 'servir': 'G1398', 'serve': 'G1398', 'servindo': 'G1398',
    'adorou': 'G4352', 'adorar': 'G4352', 'adora': 'G4352', 'adorando': 'G4352',
    'louvou': 'G134', 'louvar': 'G134', 'louva': 'G134', 'louvando': 'G134',
    'glorificou': 'G1392', 'glorificar': 'G1392', 'glorifica': 'G1392', 'glorificando': 'G1392',
    'bendisse': 'G2127', 'abençoou': 'G2127', 'abençoar': 'G2127', 'abençoa': 'G2127',
    'amaldiçoou': 'G2672', 'amaldiçoar': 'G2672', 'amaldiçoa': 'G2672',
    
    // More nouns
    'amigo': 'G5384', 'amigos': 'G5384', 'vizinho': 'G4139', 'vizinhos': 'G4139',
    'esposa': 'G1135', 'marido': 'G435', 'esposo': 'G435', 'noivo': 'G3566',
    'criança': 'G3813', 'crianças': 'G3813', 'menino': 'G3808', 'meninos': 'G3808', 'menina': 'G2877',
    'jovem': 'G3495', 'jovens': 'G3495', 'velho': 'G4246', 'velhos': 'G4246',
    'virgem': 'G3933', 'virgens': 'G3933', 'viúva': 'G5503', 'viúvas': 'G5503',
    'órfão': 'G3737', 'órfãos': 'G3737',
    'cabeça': 'G2776', 'pé': 'G4228', 'pés': 'G4228', 'dedo': 'G1147', 'dedos': 'G1147',
    'orelha': 'G3775', 'orelhas': 'G3775', 'nariz': 'G4491', 'cabelo': 'G2359', 'cabelos': 'G2359',
    'barba': 'G1069', 'joelho': 'G1119', 'joelhos': 'G1119', 'braço': 'G1023', 'braços': 'G1023',
    'perna': 'G4628', 'pernas': 'G4628', 'costas': 'G3577', 'peito': 'G4738',
    'mesa': 'G5132', 'cadeira': 'G2515', 'cama': 'G2825', 'leito': 'G2825',
    'prato': 'G4094', 'copo': 'G4221', 'vaso': 'G4632', 'vasos': 'G4632',
    'roupa': 'G2440', 'roupas': 'G2440', 'vestimenta': 'G4749', 'túnica': 'G5509',
    'cinto': 'G2223', 'sandálias': 'G4547', 'calçado': 'G5266',
    'livro': 'G975', 'livros': 'G975', 'carta': 'G1992', 'cartas': 'G1992',
    'selo': 'G4973', 'rolo': 'G974',
    'chave': 'G2807', 'chaves': 'G2807', 'tesouro': 'G2344',
    'moeda': 'G3546', 'dinheiro': 'G694', 'prata': 'G696',
    'talento': 'G5007', 'talentos': 'G5007', 'denário': 'G1220', 'denários': 'G1220',
    
    // Places
    'terra': 'G1093', 'terras': 'G1093', 'lugar': 'G5117', 'lugares': 'G5117',
    'nação': 'G1484', 'nações': 'G1484', 'província': 'G1885',
    'região': 'G5561', 'regiões': 'G5561', 'território': 'G3725',
    'praça': 'G58', 'praças': 'G58', 'mercado': 'G58',
    'sinagoga': 'G4864', 'sinagogas': 'G4864', 'jardim': 'G2779',
    'palácio': 'G4232', 'palácios': 'G4232', 'prisão': 'G5438', 'prisões': 'G5438', 'cárcere': 'G1201',
    'poço': 'G4077', 'cisternas': 'G5421', 'fonte': 'G4077',
    
    // Time expressions
    'manhã': 'G4404', 'tarde': 'G3798', 'meia-noite': 'G3317', 'madrugada': 'G3722',
    'semana': 'G4521', 'mês': 'G3376', 'meses': 'G3376',
    'hora': 'G5610', 'horas': 'G5610', 'século': 'G165', 'séculos': 'G165',
    'geração': 'G1074', 'gerações': 'G1074',
    
    // Additional adjectives
    'alto': 'G5308', 'baixo': 'G5011', 'largo': 'G4116', 'estreito': 'G4728',
    'longo': 'G3117', 'curto': 'G3641', 'profundo': 'G899', 'raso': 'G1640',
    'cheio': 'G4134', 'vazio': 'G2756', 'cheia': 'G4134', 'vazios': 'G2756',
    'limpo': 'G2513', 'limpa': 'G2513', 'limpos': 'G2513', 'sujo': 'G169', 'suja': 'G169',
    'quente': 'G2200', 'frio': 'G5593', 'morno': 'G5513',
    'seco': 'G3584', 'molhado': 'G1026', 'seca': 'G3584',
    'forte': 'G2478', 'fraco': 'G772', 'fracos': 'G772', 'fortes': 'G2478',
    'jovem': 'G3501', 'velha': 'G3820', 'antiga': 'G744', 'antigas': 'G744',
    'verdadeiro': 'G228', 'verdadeira': 'G228', 'falso': 'G5571', 'falsa': 'G5571',
    'certo': 'G3717', 'errado': 'G4105',
    'capaz': 'G2425', 'digno': 'G514', 'indigno': 'G370',
    'feliz': 'G3107', 'felizes': 'G3107', 'triste': 'G3076', 'tristes': 'G3076',
    'santo': 'G40', 'sagrado': 'G2413', 'profano': 'G952',
    
    // More missing common words
    'multidão': 'G3793', 'multidões': 'G3793', 'turba': 'G3793', 'turbas': 'G3793',
    'povo': 'G2992', 'povos': 'G2992',
    'reunir': 'G4863', 'reuniu': 'G4863', 'reuniram': 'G4863', 'reunindo': 'G4863',
    'ajuntar': 'G4863', 'ajuntou': 'G4863', 'ajuntaram': 'G4863',
    'concordes': 'G3661', 'concorde': 'G3661', 'unânimes': 'G3661',
    'cumprindo': 'G4845', 'cumprir': 'G4137', 'cumpriu': 'G4137', 'cumprido': 'G4137',
    'pentecostes': 'G4005',
    'estrondo': 'G2279', 'som': 'G2279', 'sons': 'G2279',
    'vento': 'G4151', 'ventos': 'G417',
    'cheios': 'G4130', 'encheu': 'G4130', 'encher': 'G4130', 'enchendo': 'G4130',
    'repartidas': 'G1266', 'repartir': 'G1266', 'repartiu': 'G1266',
    'assentou': 'G2523', 'assentar': 'G2523', 'assentam': 'G2523',
    'conforme': 'G2531', 'segundo': 'G2596',
    'piedoso': 'G2152', 'piedosos': 'G2152', 'devoto': 'G2152', 'devotos': 'G2152',
    'religiosos': 'G2126', 'religioso': 'G2126',
    'habitavam': 'G2730', 'habitando': 'G2730', 'habitam': 'G2730',
    'debaixo': 'G5259', 'sob': 'G5259',
    'partos': 'G3934', 'medos': 'G3370', 'elamitas': 'G1639',
    'mesopotâmia': 'G3318', 'capadócia': 'G2587', 'ásia': 'G773',
    'frígia': 'G5435', 'panfília': 'G3828', 'egito': 'G125', 'líbia': 'G3033', 'cirene': 'G2957',
    'romanos': 'G4514', 'cretenses': 'G2912', 'árabes': 'G690',
    'maravilhas': 'G3167', 'prodígios': 'G5059', 'grandezas': 'G3167',
    'embriagados': 'G3184', 'embriagar': 'G3184', 'embriagado': 'G3184', 'bêbados': 'G3184',
    'doce': 'G1098', 'mosto': 'G1098',
    'pasmados': 'G1839', 'pasmar': 'G1839', 'pasmou': 'G1839', 'admirados': 'G2296',
    'perplexos': 'G1280', 'perplexidade': 'G640',
    'zombando': 'G5512', 'zombavam': 'G5512', 'escarnecer': 'G1702',
    'terceira': 'G5154', 'terceiro': 'G5154',
    'derramar': 'G1632', 'derramou': 'G1632', 'derramarei': 'G1632', 'derramando': 'G1632',
    'profetizar': 'G4395', 'profetizarão': 'G4395', 'profetizando': 'G4395',
    'velhos': 'G4245', 'ancião': 'G4245', 'sonharão': 'G1797', 'sonhar': 'G1797',
    'servos': 'G1401', 'servas': 'G1401', 'escravo': 'G1401', 'escrava': 'G1401',
    'sangue': 'G129', 'fumo': 'G2586', 'vapor': 'G822',
    'sol': 'G2246', 'lua': 'G4582', 'estrela': 'G792', 'estrelas': 'G792',
    'escurecerá': 'G4654', 'escurecer': 'G4654', 'escuro': 'G4653',
    'invocar': 'G1941', 'invoca': 'G1941', 'invocou': 'G1941', 'invocando': 'G1941',
    'salvo': 'G4982', 'salva': 'G4982', 'salvos': 'G4982', 'salvas': 'G4982',
    'nazareno': 'G3480', 'nazaré': 'G3478',
    'aprovado': 'G584', 'aprovados': 'G584', 'aprovar': 'G1381',
    'determinado': 'G3724', 'determinar': 'G3724', 'determinação': 'G1012',
    'conselho': 'G1012', 'conselhos': 'G1012', 'deliberação': 'G1012',
    'presciência': 'G4268', 'predeterminado': 'G4309',
    'pregado': 'G4362', 'pregar': 'G2784', 'pregando': 'G2784', 'pregou': 'G2784',
    'crucificado': 'G4717', 'crucificar': 'G4717', 'crucificaram': 'G4717',
    'dores': 'G5604', 'agonia': 'G74',
    'possível': 'G1415', 'impossível': 'G102',
    'retido': 'G2902', 'reter': 'G2902', 'detido': 'G2902', 'deter': 'G2722',
    'sepultura': 'G5028', 'corrupção': 'G1312',
    'exaltado': 'G5312', 'exaltar': 'G5312', 'exaltação': 'G5311',
    'destra': 'G1188', 'direita': 'G1188',
    'recebido': 'G2983', 'recebendo': 'G2983', 'receberam': 'G2983',
    'derramado': 'G1632',
    'certo': 'G804', 'certeza': 'G803', 'certamente': 'G230',
    'compungir': 'G2660', 'compungidos': 'G2660',
    'arrepender': 'G3340', 'arrependimento': 'G3341', 'arrependei': 'G3340', 'arrependam': 'G3340',
    'batizar': 'G907', 'batizado': 'G907', 'batizados': 'G907', 'batizem': 'G907',
    'remissão': 'G859', 'perdão': 'G859', 'perdoar': 'G863',
    'chamado': 'G2564', 'chamados': 'G2564', 'vocação': 'G2821',
    'perversa': 'G4646', 'perverso': 'G4646', 'perversos': 'G4646',
    'salvai': 'G4982', 'salvar': 'G4982', 'salvador': 'G4990',
    'três': 'G5140', 'mil': 'G5507', 'milhares': 'G5505',
    'perseveravam': 'G4342', 'perseverar': 'G4342', 'perseverando': 'G4342',
    'doutrina': 'G1322', 'doutrinas': 'G1322', 'ensino': 'G1322', 'ensinos': 'G1322',
    'partir': 'G2806', 'partindo': 'G2806', 'partiram': 'G2806',
    'orações': 'G4335', 'oração': 'G4335',
    'vendiam': 'G4453', 'vender': 'G4453', 'vendeu': 'G4453', 'venda': 'G4453',
    'posses': 'G2933', 'posse': 'G2697', 'bens': 'G5224',
    'repartiam': 'G1266', 'distribuir': 'G1239', 'distribuíram': 'G1239',
    'necessidade': 'G5532', 'necessidades': 'G5532', 'necessário': 'G318',
    'favor': 'G5485', 'graça': 'G5485',
    'acrescentando': 'G4369', 'acrescentar': 'G4369', 'acrescentou': 'G4369',
  };

  // COMPREHENSIVE Portuguese word mappings for HEBREW (Old Testament)
  const HEBREW_WORD_MAPPINGS: Record<string, string> = {
    // Core theological terms
    'deus': 'H430', 'senhor': 'H3068', 'jeová': 'H3068', 'yahweh': 'H3068',
    'espírito': 'H7307', 'santo': 'H6918', 'pai': 'H1',
    'palavra': 'H1697', 'vida': 'H2416', 'amor': 'H160', 'amou': 'H157', 'amar': 'H157',
    'graça': 'H2580', 'verdade': 'H571', 'luz': 'H216', 'trevas': 'H2822',
    'salvação': 'H3444', 'salvador': 'H3467', 'pecado': 'H2403', 'pecados': 'H2403',
    'justiça': 'H6666', 'justo': 'H6662', 'fé': 'H530', 'fiel': 'H539',
    'esperança': 'H8615', 'glória': 'H3519', 'poder': 'H3581', 'sabedoria': 'H2451',
    // People and relationships
    'homem': 'H120', 'homens': 'H120', 'mulher': 'H802', 'mulheres': 'H802',
    'irmão': 'H251', 'irmãos': 'H251', 'povo': 'H5971', 'nação': 'H1471', 'nações': 'H1471',
    'profeta': 'H5030', 'profetas': 'H5030', 'rei': 'H4428', 'reis': 'H4428', 'reino': 'H4467',
    'filho': 'H1121', 'filhos': 'H1121', 'filha': 'H1323', 'filhas': 'H1323',
    'servo': 'H5650', 'servos': 'H5650', 'escravo': 'H5650', 'adon': 'H113', 'amo': 'H113',
    'sacerdote': 'H3548', 'sacerdotes': 'H3548', 'levita': 'H3881', 'levitas': 'H3881',
    // Common verbs
    'disse': 'H559', 'diz': 'H559', 'dizer': 'H559', 'dizendo': 'H559', 'dizem': 'H559',
    'fala': 'H1696', 'falou': 'H1696', 'falar': 'H1696', 'falando': 'H1696',
    'veio': 'H935', 'vem': 'H935', 'vir': 'H935', 'vindo': 'H935', 'virá': 'H935',
    'vai': 'H1980', 'foi': 'H1961', 'era': 'H1961', 'ser': 'H1961', 'está': 'H1961', 'são': 'H1961',
    'deu': 'H5414', 'dar': 'H5414', 'dá': 'H5414', 'dando': 'H5414', 'dado': 'H5414',
    'enviou': 'H7971', 'enviar': 'H7971', 'enviado': 'H7971', 'envia': 'H7971',
    'ouvir': 'H8085', 'ouviu': 'H8085', 'ouve': 'H8085', 'ouvindo': 'H8085', 'ouvi': 'H8085',
    'ver': 'H7200', 'viu': 'H7200', 'vê': 'H7200', 'vendo': 'H7200', 'visto': 'H7200',
    'conhecer': 'H3045', 'conhece': 'H3045', 'conheceu': 'H3045', 'conhecendo': 'H3045',
    'saber': 'H3045', 'sabe': 'H3045', 'sabemos': 'H3045', 'sabia': 'H3045',
    'fazer': 'H6213', 'faz': 'H6213', 'fez': 'H6213', 'fazendo': 'H6213', 'feito': 'H6213',
    'andar': 'H1980', 'anda': 'H1980', 'andou': 'H1980', 'andando': 'H1980',
    'viver': 'H2421', 'vive': 'H2421', 'viveu': 'H2421', 'vivendo': 'H2421',
    'morrer': 'H4191', 'morreu': 'H4191', 'morre': 'H4191', 'morrendo': 'H4191',
    'chamar': 'H7121', 'chamou': 'H7121', 'chama': 'H7121', 'chamado': 'H7121',
    'criar': 'H1254', 'criou': 'H1254', 'cria': 'H1254', 'criado': 'H1254',
    'separar': 'H914', 'separou': 'H914', 'separa': 'H914', 'separação': 'H914',
    // Places and things
    'mundo': 'H8398', 'terra': 'H776', 'céu': 'H8064', 'céus': 'H8064',
    'casa': 'H1004', 'templo': 'H1964', 'corpo': 'H1320', 'sangue': 'H1818',
    'água': 'H4325', 'pão': 'H3899', 'vinho': 'H3196', 'fogo': 'H784',
    'morte': 'H4194', 'túmulo': 'H6913', 'sepulcro': 'H6913',
    'nome': 'H8034', 'mão': 'H3027', 'mãos': 'H3027', 'olho': 'H5869', 'olhos': 'H5869',
    'coração': 'H3820', 'alma': 'H5315', 'boca': 'H6310', 'face': 'H6440', 'rosto': 'H6440',
    'caminho': 'H1870', 'porta': 'H8179', 'cidade': 'H5892', 'monte': 'H2022', 'montanha': 'H2022',
    'mar': 'H3220', 'rio': 'H5104', 'deserto': 'H4057', 'campo': 'H7704',
    // Time and manner
    'dia': 'H3117', 'dias': 'H3117', 'noite': 'H3915', 'tempo': 'H6256',
    'manhã': 'H1242', 'tarde': 'H6153', 'ano': 'H8141', 'anos': 'H8141',
    'sempre': 'H5769', 'eterno': 'H5769', 'eterna': 'H5769', 'eternamente': 'H5769',
    'agora': 'H6258', 'hoje': 'H3117', 'princípio': 'H7225',
    // Adjectives and quantities
    'grande': 'H1419', 'bom': 'H2896', 'boa': 'H2896', 'mau': 'H7451', 'má': 'H7451',
    'todo': 'H3605', 'todos': 'H3605', 'toda': 'H3605', 'todas': 'H3605',
    'muito': 'H3966', 'muitos': 'H7227', 'muita': 'H7227', 'muitas': 'H7227',
    'novo': 'H2319', 'nova': 'H2319', 'primeiro': 'H7223', 'último': 'H314',
    'outro': 'H312', 'outra': 'H312', 'outros': 'H312', 'outras': 'H312',
    // Prepositions and conjunctions
    'com': 'H5973', 'para': 'H413', 'sobre': 'H5921', 'entre': 'H996',
    'contra': 'H5921', 'diante': 'H6440', 'debaixo': 'H8478', 'acima': 'H4605',
    'depois': 'H310', 'desde': 'H4480', 'até': 'H5704', 'porque': 'H3588',
    'quando': 'H3588', 'onde': 'H834', 'como': 'H834', 'assim': 'H3651',
    // Key OT concepts
    'lei': 'H8451', 'torá': 'H8451', 'mandamento': 'H4687', 'mandamentos': 'H4687',
    'aliança': 'H1285', 'pacto': 'H1285', 'promessa': 'H1697',
    'testemunho': 'H5715', 'testemunha': 'H5707', 'testemunhas': 'H5707',
    'sacrifício': 'H2077', 'oferta': 'H4503', 'altar': 'H4196',
    'bênção': 'H1293', 'maldição': 'H7045', 'juízo': 'H4941', 'juízos': 'H4941',
    'misericórdia': 'H2617', 'bondade': 'H2617', 'paz': 'H7965', 'guerra': 'H4421',
    // Genesis specific
    'firmamento': 'H7549', 'expansão': 'H7549', 'abismo': 'H8415', 'vazio': 'H922',
    'seco': 'H3004', 'seca': 'H3004', 'erva': 'H6212', 'árvore': 'H6086', 'árvores': 'H6086',
    'semente': 'H2233', 'fruto': 'H6529', 'frutos': 'H6529',
    // Patriarchs and names
    'israel': 'H3478', 'jacó': 'H3290', 'abraão': 'H85', 'isaque': 'H3327',
    'moisés': 'H4872', 'davi': 'H1732', 'salomão': 'H8010',
    'judá': 'H3063', 'jerusalém': 'H3389', 'sião': 'H6726', 'egito': 'H4714',
    // Additional verb forms and variations
    'entrou': 'H935', 'entrar': 'H935', 'entra': 'H935', 'entrando': 'H935',
    'saiu': 'H3318', 'sair': 'H3318', 'sai': 'H3318', 'saindo': 'H3318',
    'levantou': 'H6965', 'levantar': 'H6965', 'levanta': 'H6965', 'levantando': 'H6965',
    'desceu': 'H3381', 'descer': 'H3381', 'desce': 'H3381', 'descendo': 'H3381',
    'subiu': 'H5927', 'subir': 'H5927', 'sobe': 'H5927', 'subindo': 'H5927',
    'escreveu': 'H3789', 'escrever': 'H3789', 'escreve': 'H3789', 'escrito': 'H3789',
    'tomou': 'H3947', 'tomar': 'H3947', 'toma': 'H3947', 'tomando': 'H3947',
    'deixou': 'H5800', 'deixar': 'H5800', 'deixa': 'H5800', 'deixando': 'H5800',
    'guardou': 'H8104', 'guardar': 'H8104', 'guarda': 'H8104', 'guardando': 'H8104',
    'voltou': 'H7725', 'voltar': 'H7725', 'volta': 'H7725', 'voltando': 'H7725',
    'chegou': 'H935', 'chegar': 'H935', 'chega': 'H935', 'chegando': 'H935',
    'procurou': 'H1245', 'procurar': 'H1245', 'procura': 'H1245', 'procurando': 'H1245',
    'buscou': 'H1245', 'buscar': 'H1245', 'busca': 'H1245', 'buscando': 'H1245',
    'encontrou': 'H4672', 'encontrar': 'H4672', 'encontra': 'H4672', 'encontrando': 'H4672',
    'achou': 'H4672', 'achar': 'H4672', 'acha': 'H4672', 'achando': 'H4672',
    'trouxe': 'H935', 'trazer': 'H935', 'traz': 'H935', 'trazendo': 'H935',
    'levou': 'H3947', 'levar': 'H3947', 'leva': 'H3947', 'levando': 'H3947',
    'pôs': 'H7760', 'pôr': 'H7760', 'põe': 'H7760', 'pondo': 'H7760',
    'colocou': 'H7760', 'colocar': 'H7760', 'coloca': 'H7760', 'colocando': 'H7760',
    'sentou': 'H3427', 'sentar': 'H3427', 'senta': 'H3427', 'sentando': 'H3427',
    'habitou': 'H3427', 'habitar': 'H3427', 'habita': 'H3427', 'habitando': 'H3427',
    'edificou': 'H1129', 'edificar': 'H1129', 'edifica': 'H1129', 'edificando': 'H1129',
    'construiu': 'H1129', 'construir': 'H1129', 'constrói': 'H1129', 'construindo': 'H1129',
    'matou': 'H2026', 'matar': 'H2026', 'mata': 'H2026', 'matando': 'H2026',
    'feriu': 'H5221', 'ferir': 'H5221', 'fere': 'H5221', 'ferindo': 'H5221',
    'salvou': 'H3467', 'salvar': 'H3467', 'salva': 'H3467', 'salvando': 'H3467',
    'livrou': 'H5337', 'livrar': 'H5337', 'livra': 'H5337', 'livrando': 'H5337',
    'julgou': 'H8199', 'julgar': 'H8199', 'julga': 'H8199', 'julgando': 'H8199',
    'reinou': 'H4427', 'reinar': 'H4427', 'reina': 'H4427', 'reinando': 'H4427',
    'nasceu': 'H3205', 'nascer': 'H3205', 'nasce': 'H3205', 'nascendo': 'H3205',
    'gerou': 'H3205', 'gerar': 'H3205', 'gera': 'H3205', 'gerando': 'H3205',
    // Demonstrative pronouns (accurate mappings only)
    'dele': 'H1931', 'dela': 'H1931', 'deles': 'H1992', 'delas': 'H1992',
    'aquele': 'H1931', 'aquela': 'H1931', 'aqueles': 'H1992', 'aquelas': 'H1992',
    'este': 'H2088', 'esta': 'H2063', 'estes': 'H428', 'estas': 'H428',
    'esse': 'H1931', 'essa': 'H1931', 'esses': 'H1992', 'essas': 'H1992',
    'qual': 'H834', 'quais': 'H834', 'cujo': 'H834', 'cuja': 'H834',
    'mesmo': 'H1931', 'mesma': 'H1931', 'mesmos': 'H1992', 'mesmas': 'H1992',
    'ainda': 'H5750', 'também': 'H1571', 'então': 'H227',
    'pois': 'H3588', 'portanto': 'H3651',
    // Quantities and comparatives (semantically accurate mappings)
    'maior': 'H1419', 'menor': 'H6996',
    'melhor': 'H2896',
    'cada': 'H3605', 'qualquer': 'H3605',
    'nada': 'H369',
    'certo': 'H259', 'certa': 'H259',
    // Additional OT concepts  
    'anjo': 'H4397', 'anjos': 'H4397', 'querubim': 'H3742', 'serafim': 'H8314',
    'inimigo': 'H341', 'inimigos': 'H341', 'adversário': 'H6862', 'adversários': 'H6862',
    'juiz': 'H8199', 'juízes': 'H8199', 'príncipe': 'H5387', 'príncipes': 'H5387',
    'capitão': 'H8269', 'capitães': 'H8269', 'exército': 'H6635', 'exércitos': 'H6635',
    'guerreiro': 'H1368', 'guerreiros': 'H1368', 'soldado': 'H6635', 'soldados': 'H6635',
    'espada': 'H2719', 'espadas': 'H2719', 'lança': 'H2595', 'lanças': 'H2595',
    'escudo': 'H4043', 'escudos': 'H4043', 'arco': 'H7198', 'arcos': 'H7198',
    'flecha': 'H2671', 'flechas': 'H2671', 'armadura': 'H5402',
    'ovelha': 'H6629', 'ovelhas': 'H6629', 'cordeiro': 'H3532', 'cordeiros': 'H3532',
    'boi': 'H7794', 'bois': 'H7794', 'vaca': 'H6510', 'vacas': 'H6510',
    'cavalo': 'H5483', 'cavalos': 'H5483', 'jumento': 'H2543', 'jumentos': 'H2543',
    'camelo': 'H1581', 'camelos': 'H1581', 'leão': 'H738', 'leões': 'H738',
    'serpente': 'H5175', 'serpentes': 'H5175', 'águia': 'H5404', 'águias': 'H5404',
    'ouro': 'H2091', 'prata': 'H3701', 'bronze': 'H5178', 'ferro': 'H1270',
    'pedra': 'H68', 'pedras': 'H68', 'rocha': 'H5553', 'rochas': 'H5553',
    'arca': 'H727', 'tenda': 'H168', 'tabernáculo': 'H4908', 'santuário': 'H4720',
    'vestes': 'H899', 'vestido': 'H899', 'manto': 'H4598', 'coroa': 'H5850',
    
    // === POETIC BOOKS VOCABULARY (Psalms, Proverbs, Job) ===
    // Praise and worship
    'louvor': 'H8416', 'louvores': 'H8416', 'louvar': 'H1984', 'louvai': 'H1984', 'louvado': 'H1984',
    'aleluia': 'H1984', 'hosana': 'H3467', 'cântico': 'H7892', 'cânticos': 'H7892',
    'salmo': 'H4210', 'salmos': 'H4210', 'harpa': 'H3658', 'harpas': 'H3658',
    'lira': 'H3658', 'címbalo': 'H6767', 'címbalos': 'H6767', 'trombeta': 'H7782', 'trombetas': 'H7782',
    'adorar': 'H7812', 'adora': 'H7812', 'adorou': 'H7812', 'adoração': 'H7812',
    'prostrar': 'H7812', 'prostrou': 'H7812', 'prostra': 'H7812',
    'cantar': 'H7891', 'canta': 'H7891', 'cantou': 'H7891', 'cantando': 'H7891', 'cantai': 'H7891',
    'exaltar': 'H7311', 'exalta': 'H7311', 'exaltou': 'H7311', 'exaltado': 'H7311', 'exaltai': 'H7311',
    'bendizer': 'H1288', 'bendiz': 'H1288', 'bendisse': 'H1288', 'bendito': 'H1288', 'bendita': 'H1288',
    'glorificar': 'H3513', 'glorifica': 'H3513', 'glorificou': 'H3513', 'glorificado': 'H3513',
    
    // Wisdom vocabulary
    'sábio': 'H2450', 'sábia': 'H2450', 'sábios': 'H2450',
    'entendimento': 'H998', 'entender': 'H995', 'entende': 'H995', 'entendeu': 'H995',
    'prudência': 'H6195', 'prudente': 'H6175', 'prudentes': 'H6175',
    'instrução': 'H4148', 'instruir': 'H3256', 'instrui': 'H3256', 'instruído': 'H3256',
    'conhecimento': 'H1847', 'conselho': 'H6098', 'conselhos': 'H6098',
    'disciplina': 'H4148', 'repreensão': 'H8433', 'correção': 'H4148',
    'insensato': 'H3684', 'insensatos': 'H3684', 'tolo': 'H191', 'tolos': 'H191',
    'louco': 'H7696', 'loucos': 'H7696', 'simples': 'H6612',
    
    // Emotions and spiritual states  
    'alegria': 'H8057', 'alegre': 'H8056', 'alegrar': 'H8055', 'alegrou': 'H8055', 'alegrai': 'H8055',
    'gozo': 'H1524', 'gozar': 'H1523', 'regozijo': 'H7797', 'regozijar': 'H7797',
    'júbilo': 'H7440', 'júbilos': 'H7440', 'exultar': 'H5937', 'exulta': 'H5937',
    'tristeza': 'H6089', 'triste': 'H6087', 'lamento': 'H5092', 'lamentar': 'H5091',
    'choro': 'H1065', 'chorar': 'H1058', 'chora': 'H1058', 'chorou': 'H1058', 'lágrima': 'H1832', 'lágrimas': 'H1832',
    'angústia': 'H6869', 'aflição': 'H6040', 'afligido': 'H6041', 'afligidos': 'H6041',
    'temor': 'H3374', 'temer': 'H3372', 'teme': 'H3372', 'temeu': 'H3372', 'temendo': 'H3372',
    'medo': 'H6343', 'pavor': 'H6343', 'terror': 'H367',
    'esperar': 'H3176', 'espera': 'H3176', 'esperou': 'H3176', 'esperando': 'H3176',
    'confiança': 'H982', 'confiar': 'H982', 'confia': 'H982', 'confiou': 'H982', 'confiando': 'H982',
    'descanso': 'H4496', 'descansar': 'H5117', 'descansa': 'H5117', 'descansou': 'H5117',
    
    // Job vocabulary
    'sofrimento': 'H6040', 'sofrer': 'H6031', 'sofre': 'H6031', 'sofreu': 'H6031',
    'dor': 'H3511', 'dores': 'H3511', 'doloroso': 'H3510', 'dolorosa': 'H3510',
    'prova': 'H5254', 'provar': 'H5254', 'provado': 'H5254', 'provação': 'H5254',
    'paciência': 'H750', 'paciente': 'H750',
    'justa': 'H6662', 'justos': 'H6662', 'justas': 'H6662',
    'retidão': 'H3476', 'reto': 'H3477', 'reta': 'H3477', 'retos': 'H3477',
    'íntegro': 'H8549', 'íntegra': 'H8549', 'integridade': 'H8537',
    'inocente': 'H5355', 'inocentes': 'H5355', 'inocência': 'H5356',
    'culpa': 'H817', 'culpado': 'H816', 'culpados': 'H816',
    'ímpio': 'H7563', 'ímpios': 'H7563', 'impiedade': 'H7562',
    'pecar': 'H2398', 'pecou': 'H2398', 'pecador': 'H2400', 'pecadores': 'H2400',
    'iniquidade': 'H5771', 'iniquidades': 'H5771', 'transgressão': 'H6588', 'transgressões': 'H6588',
    
    // Nature imagery in poetry
    'penedo': 'H6697', 'refúgio': 'H4268', 'fortaleza': 'H4581',
    'esconderijo': 'H5643', 'sombra': 'H6738', 'asas': 'H3671', 'asa': 'H3671',
    'pastor': 'H7462', 'pastores': 'H7462', 'apascentar': 'H7462', 'rebanho': 'H6629',
    'fonte': 'H4599', 'fontes': 'H4599', 'ribeiro': 'H5158', 'ribeiros': 'H5158',
    'vale': 'H6010', 'vales': 'H6010', 'colina': 'H1389', 'colinas': 'H1389',
    'floresta': 'H3293', 'bosque': 'H3293', 'oliveira': 'H2132', 'oliveiras': 'H2132',
    'palmeira': 'H8558', 'cedro': 'H730', 'cedros': 'H730', 'cipreste': 'H1265',
    'lírio': 'H7799', 'lírios': 'H7799', 'rosa': 'H2261', 'rosas': 'H2261',
    'vinha': 'H3754', 'vinhas': 'H3754', 'uva': 'H6025', 'uvas': 'H6025',
    
    // === PROPHETIC VOCABULARY (Isaiah, Jeremiah, Ezekiel, Minor Prophets) ===
    // Prophetic terms
    'profecia': 'H5016', 'profecias': 'H5016', 'profetizar': 'H5012', 'profetiza': 'H5012',
    'visão': 'H2377', 'visões': 'H2377', 'sonho': 'H2472', 'sonhos': 'H2472',
    'revelação': 'H1540', 'revelar': 'H1540', 'revelou': 'H1540', 'revelado': 'H1540',
    'oráculo': 'H4853', 'oráculos': 'H4853', 'palavras': 'H1697',
    'mensagem': 'H1697', 'mensageiro': 'H4397', 'mensageiros': 'H4397',
    
    // Judgment vocabulary
    'julgamento': 'H4941', 'ira': 'H639', 'furor': 'H2534', 'indignação': 'H2195',
    'castigo': 'H6066', 'castigar': 'H3256', 'castigou': 'H3256', 'castigado': 'H3256',
    'punição': 'H6066', 'punir': 'H6485', 'puniu': 'H6485',
    'destruição': 'H7701', 'destruir': 'H7843', 'destruiu': 'H7843', 'destruído': 'H7843',
    'assolação': 'H8047', 'assolar': 'H8074', 'assolou': 'H8074', 'assolado': 'H8074',
    'ruína': 'H7612', 'ruínas': 'H7612', 'cair': 'H5307', 'caiu': 'H5307', 'queda': 'H5307',
    'cativeiro': 'H7628', 'cativo': 'H7628', 'cativos': 'H7628', 'exílio': 'H1473',
    'deportação': 'H1546', 'deportar': 'H1540', 'deportado': 'H1540', 'deportados': 'H1540',
    
    // Restoration vocabulary
    'restauração': 'H7725', 'restaurar': 'H7725', 'restaurou': 'H7725', 'restaurado': 'H7725',
    'redenção': 'H1353', 'redentor': 'H1350', 'redimir': 'H1350', 'redimiu': 'H1350', 'redimido': 'H1350',
    'resgate': 'H6306', 'resgatar': 'H6299', 'resgatou': 'H6299', 'resgatado': 'H6299',
    'consolar': 'H5162', 'consola': 'H5162', 'consolou': 'H5162', 'consolação': 'H5165', 'consolado': 'H5162',
    'renovar': 'H2318', 'renova': 'H2318', 'renovado': 'H2318', 'renovação': 'H2318',
    'curar': 'H7495', 'cura': 'H7495', 'curou': 'H7495', 'curado': 'H7495', 'curas': 'H7495',
    'sarar': 'H7495', 'sara': 'H7495', 'sarou': 'H7495', 'sarado': 'H7495',
    
    // Messianic vocabulary
    'messias': 'H4899', 'ungido': 'H4899', 'ungidos': 'H4899', 'ungir': 'H4886', 'ungiu': 'H4886',
    'escravos': 'H5650',
    'remanescente': 'H7611', 'resto': 'H7611', 'sobrevivente': 'H6412', 'sobreviventes': 'H6412',
    'varão': 'H376', 'varões': 'H376', 'renovo': 'H6780',
    'raiz': 'H8328', 'raízes': 'H8328', 'tronco': 'H1503', 'ramo': 'H5342', 'ramos': 'H5342',
    
    // Covenant and faithfulness
    'fiéis': 'H539',
    'verdadeiro': 'H571', 'verdadeira': 'H571',
    'amado': 'H157', 'amada': 'H157',
    'benignidade': 'H2617', 'clemência': 'H2617',
    'favor': 'H2580', 'favorecer': 'H2603', 'favoreceu': 'H2603',
    'perdão': 'H5547', 'perdoar': 'H5545', 'perdoa': 'H5545', 'perdoou': 'H5545', 'perdoado': 'H5545',
    
    // Nations and peoples
    'gentio': 'H1471', 'gentios': 'H1471', 'pagão': 'H1471', 'pagãos': 'H1471',
    'estrangeiro': 'H5236', 'estrangeiros': 'H5236', 'forasteiro': 'H1616', 'forasteiros': 'H1616',
    'peregrino': 'H1616', 'peregrinos': 'H1616',
    'babilônia': 'H894', 'assíria': 'H804', 'assírios': 'H804',
    'edom': 'H123', 'moabe': 'H4124', 'amom': 'H5983', 'filisteus': 'H6430',
    
    // Temple and worship
    'incenso': 'H7004', 'holocausto': 'H5930', 'holocaustos': 'H5930',
    'expiação': 'H3725', 'expiar': 'H3722', 'expiou': 'H3722',
    'purificação': 'H2893', 'purificar': 'H2891', 'purificou': 'H2891', 'purificado': 'H2891', 'puro': 'H2889', 'pura': 'H2889',
    'imundo': 'H2931', 'imunda': 'H2931', 'imundos': 'H2931', 'imundas': 'H2931', 'imundícia': 'H2932',
    'santa': 'H6918', 'santos': 'H6918', 'santas': 'H6918',
    'santidade': 'H6944', 'santificar': 'H6942', 'santificou': 'H6942', 'santificado': 'H6942',
    'consagrar': 'H6942', 'consagrou': 'H6942', 'consagrado': 'H6942', 'consagração': 'H4394',
    
    // Eschatological terms
    'fim': 'H7093', 'fins': 'H7093', 'últimos': 'H314',
    'tribunal': 'H4941',
    'ressurreição': 'H6965', 'ressuscitar': 'H6965', 'ressuscitou': 'H6965',
    'vivente': 'H2416', 'viventes': 'H2416',
    
    // === ADDITIONAL COMMON WORDS FOR MAXIMUM COVERAGE ===
    // More verb forms
    'estavam': 'H1961', 'foram': 'H1961', 'havia': 'H1961', 'haviam': 'H1961',
    'tinha': 'H1961', 'tinham': 'H1961', 'tendo': 'H1961', 'tido': 'H1961',
    'seria': 'H1961', 'seriam': 'H1961', 'sendo': 'H1961', 'sido': 'H1961',
    'estou': 'H1961', 'estás': 'H1961', 'estamos': 'H1961', 'estão': 'H1961',
    'sou': 'H1961', 'és': 'H1961', 'somos': 'H1961',
    'tenho': 'H1961', 'tens': 'H1961', 'temos': 'H1961', 'têm': 'H1961',
    'vou': 'H1980', 'vais': 'H1980', 'vamos': 'H1980', 'vão': 'H1980',
    'pode': 'H3201', 'podem': 'H3201', 'podia': 'H3201', 'podiam': 'H3201', 'pôde': 'H3201',
    'poderia': 'H3201', 'poderiam': 'H3201', 'puder': 'H3201', 'pudesse': 'H3201',
    'quer': 'H14', 'querem': 'H14', 'queria': 'H14', 'queriam': 'H14', 'quis': 'H14',
    'deve': 'H3426', 'devem': 'H3426', 'devia': 'H3426', 'deviam': 'H3426',
    
    // Additional pronouns and demonstratives
    'meu': 'H3027', 'minha': 'H3027', 'meus': 'H3027', 'minhas': 'H3027',
    'teu': 'H3027', 'tua': 'H3027', 'teus': 'H3027', 'tuas': 'H3027',
    'seu': 'H1931', 'sua': 'H1931', 'seus': 'H1931', 'suas': 'H1931',
    'nosso': 'H587', 'nossa': 'H587', 'nossos': 'H587', 'nossas': 'H587',
    
    // Common particles and conjunctions
    'não': 'H3808', 'nem': 'H3808', 'nunca': 'H3808', 'jamais': 'H3808',
    'já': 'H3528', 'sem': 'H1097', 'só': 'H905', 'apenas': 'H389',
    'ora': 'H6258', 'senão': 'H3588', 'eis': 'H2009',
    
    // More verbs and verb forms
    'abre': 'H6605', 'abriu': 'H6605', 'abrir': 'H6605', 'aberto': 'H6605', 'abrindo': 'H6605',
    'fecha': 'H5462', 'fechou': 'H5462', 'fechar': 'H5462', 'fechado': 'H5462',
    'põem': 'H7760', 'colocam': 'H7760', 'puseram': 'H7760',
    'tirou': 'H3947', 'tirar': 'H3947', 'tira': 'H3947', 'tirando': 'H3947',
    'tocou': 'H5060', 'tocar': 'H5060', 'toca': 'H5060', 'tocando': 'H5060',
    'caiu': 'H5307', 'cair': 'H5307', 'cai': 'H5307', 'caindo': 'H5307', 'caem': 'H5307',
    'ergueu': 'H6965', 'erguer': 'H6965', 'ergue': 'H6965', 'erguendo': 'H6965',
    'jogou': 'H7993', 'jogar': 'H7993', 'joga': 'H7993', 'jogando': 'H7993', 'lançou': 'H7993', 'lançar': 'H7993',
    'parou': 'H5975', 'parar': 'H5975', 'parando': 'H5975',
    'correu': 'H7323', 'correr': 'H7323', 'corre': 'H7323', 'correndo': 'H7323',
    'passou': 'H5674', 'passar': 'H5674', 'passa': 'H5674', 'passando': 'H5674',
    'comeu': 'H398', 'comer': 'H398', 'come': 'H398', 'comendo': 'H398',
    'bebeu': 'H8354', 'beber': 'H8354', 'bebe': 'H8354', 'bebendo': 'H8354',
    'dormiu': 'H3462', 'dormir': 'H3462', 'dorme': 'H3462', 'dormindo': 'H3462',
    'acordou': 'H6974', 'acordar': 'H6974', 'acorda': 'H6974', 'acordando': 'H6974',
    'esperou': 'H6960', 'esperar': 'H6960', 'esperando': 'H6960',
    'trabalhou': 'H5647', 'trabalhar': 'H5647', 'trabalha': 'H5647', 'trabalhando': 'H5647',
    'serviu': 'H5647', 'servir': 'H5647', 'serve': 'H5647', 'servindo': 'H5647',
    'adorou': 'H7812', 'adorar': 'H7812', 'adoração': 'H7812',
    'glorificou': 'H3513', 'glorificar': 'H3513', 'glorifica': 'H3513', 'glorificando': 'H3513',
    'abençoou': 'H1288', 'abençoar': 'H1288', 'abençoa': 'H1288',
    'amaldiçoou': 'H779', 'amaldiçoar': 'H779', 'amaldiçoa': 'H779', 'maldição': 'H779',
    
    // More nouns
    'amigo': 'H7453', 'amigos': 'H7453', 'vizinho': 'H7453', 'vizinhos': 'H7453',
    'esposa': 'H802', 'marido': 'H376', 'esposo': 'H376', 'noiva': 'H3618', 'noivo': 'H2860',
    'criança': 'H3206', 'crianças': 'H3206', 'menino': 'H5288', 'meninos': 'H5288', 'menina': 'H5291',
    'jovem': 'H5288', 'jovens': 'H5288', 'velho': 'H2205', 'velhos': 'H2205',
    'virgem': 'H1330', 'virgens': 'H1330', 'viúva': 'H490', 'viúvas': 'H490',
    'órfão': 'H3490', 'órfãos': 'H3490',
    'cabeça': 'H7218', 'pé': 'H7272', 'pés': 'H7272', 'dedo': 'H676', 'dedos': 'H676',
    'orelha': 'H241', 'orelhas': 'H241', 'cabelo': 'H8181', 'cabelos': 'H8181',
    'barba': 'H2206', 'joelho': 'H1290', 'joelhos': 'H1290', 'braço': 'H2220', 'braços': 'H2220',
    'costas': 'H1458', 'peito': 'H2373',
    'mesa': 'H7979', 'cama': 'H4904', 'leito': 'H4904',
    'prato': 'H5602', 'copo': 'H3563', 'vaso': 'H3627', 'vasos': 'H3627',
    'roupa': 'H899', 'roupas': 'H899', 'vestimenta': 'H899', 'túnica': 'H3801',
    'sandálias': 'H5275', 'calçados': 'H5275',
    'livro': 'H5612', 'livros': 'H5612', 'carta': 'H5612', 'cartas': 'H5612',
    'rolo': 'H5612',
    'chave': 'H4668', 'chaves': 'H4668', 'tesouro': 'H214',
    'moeda': 'H3701', 'dinheiro': 'H3701',
    
    // Places
    'terras': 'H776', 'lugares': 'H4725',
    'província': 'H4082', 'províncias': 'H4082',
    'região': 'H1366', 'regiões': 'H1366', 'território': 'H1366',
    'praça': 'H7339', 'praças': 'H7339', 'mercado': 'H7784',
    'jardim': 'H1588', 'jardins': 'H1588',
    'palácio': 'H1964', 'palácios': 'H1964', 'prisão': 'H1004', 'prisões': 'H1004', 'cárcere': 'H1004',
    'poço': 'H875', 'cisterna': 'H953', 'cisternas': 'H953',
    
    // Time expressions
    'mês': 'H2320', 'meses': 'H2320',
    'semana': 'H7620', 'semanas': 'H7620',
    'hora': 'H8160', 'horas': 'H8160',
    'geração': 'H1755', 'gerações': 'H1755',
    
    // Additional adjectives
    'largo': 'H7342', 'estreito': 'H6862',
    'longo': 'H752', 'curto': 'H7114', 'profundo': 'H6013',
    'cheio': 'H4392', 'vazio': 'H7387', 'cheia': 'H4392', 'vazios': 'H7387',
    'limpo': 'H2889', 'limpa': 'H2889', 'limpos': 'H2889', 'sujo': 'H2931', 'suja': 'H2931',
    'quente': 'H2527', 'frio': 'H7119',
    'seco': 'H6723', 'molhado': 'H7377',
    'forte': 'H2389', 'fraco': 'H7390', 'fracos': 'H7390', 'fortes': 'H2389',
    'velha': 'H3465', 'antiga': 'H6924', 'antigas': 'H6924',
    'verdadeiro': 'H571', 'verdadeira': 'H571', 'falso': 'H8267', 'falsa': 'H8267',
    'capaz': 'H3201', 'indigno': 'H959',
    'feliz': 'H835', 'felizes': 'H835', 'alegres': 'H8056',
    'sagrado': 'H6944', 'profano': 'H2455',
  };

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
  // STRATEGY 1: Use bible_words table (for Genesis and other mapped chapters)
  // STRATEGY 2: Fallback to heuristic matching against strong_entries.portugueseDef (for all books)
  app.get("/api/bible/:bookId/:chapter/strong-words", async (req, res) => {
    try {
      const { bookId, chapter: chapterNum } = req.params;
      const chapterInt = parseInt(chapterNum);
      
      if (isNaN(chapterInt)) {
        return res.status(400).json({ error: "Capítulo inválido" });
      }

      // STRATEGY 1: Try exact match from bible_words table (most accurate)
      const wordsWithStrong = await db
        .select({
          verse: bibleWords.verse,
          wordPosition: bibleWords.wordPosition,
          gloss: bibleWords.gloss,
          strongNumber: bibleWords.strongNumber,
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

      // Create a map of verse -> list of individual words with Strong
      const verseWordsMap: Record<number, string[]> = {};
      for (const w of wordsWithStrong) {
        if (w.gloss) {
          if (!verseWordsMap[w.verse]) {
            verseWordsMap[w.verse] = [];
          }
          const glossWords = w.gloss.toLowerCase().trim().split(/\s+/);
          for (const word of glossWords) {
            const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim();
            if (cleanWord.length >= 3 && !verseWordsMap[w.verse].includes(cleanWord)) {
              verseWordsMap[w.verse].push(cleanWord);
            }
          }
        }
      }

      // STRATEGY 2: Use expanded word mappings (priority + first-word definitions)
      // This provides more coverage while avoiding incorrect mappings
      try {
        const isNT = isNewTestament(bookId);
        const wordMappings = await getStrongWordMapping(isNT);
        
        // Get the chapter text to check for mapped words
        const chapter = await getBookChapter(bookId.toLowerCase(), chapterInt);
        if (chapter && chapter.verses) {
          for (const verse of chapter.verses) {
            const verseWords = verse.text.toLowerCase()
              .split(/\s+/)
              .map((w: string) => w.replace(/[.,;:!?"'()]/g, '').trim())
              .filter((w: string) => w.length >= 2);

            for (const word of verseWords) {
              // Add if this word has a verified mapping
              if (wordMappings.has(word) && !verseWordsMap[verse.verse]?.includes(word)) {
                if (!verseWordsMap[verse.verse]) {
                  verseWordsMap[verse.verse] = [];
                }
                verseWordsMap[verse.verse].push(word);
              }
            }
          }
        }
      } catch (mappingError) {
        console.warn("Word mapping check failed:", mappingError);
      }

      res.json({
        book: bookId,
        chapter: chapterInt,
        strongWords: verseWordsMap,
        totalWords: Object.values(verseWordsMap).flat().length,
      });
    } catch (error) {
      console.error("Get Strong words error:", error);
      res.status(500).json({ error: "Erro ao buscar palavras Strong" });
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
  app.get("/api/strong/:number", async (req, res) => {
    const startTime = Date.now();
    try {
      const { number } = req.params;
      const upperNumber = number.toUpperCase();
      
      // Strong quota limits
      const STRONG_FREE_LIMIT = 2;       // 2 words total for free users (sem assinatura)
      const STRONG_GOLD_DAILY_LIMIT = 20; // 20/day for Gold
      // Premium/Lifetime = unlimited
      
      let quotaInfo: { used: number; limit: number; type: 'free' | 'gold' | 'unlimited' } | null = null;
      
      // NOVA REGRA: Strong SEMPRE requer login
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: "Faça login para acessar o Dicionário Strong",
          requiresLogin: true,
          requiresSubscription: false,
          used: 0,
          limit: STRONG_FREE_LIMIT,
        });
      }
      
      const token = authHeader.substring(7);
      let userId: string;
      
      try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
        userId = decoded.userId;
      } catch (tokenError) {
        return res.status(401).json({
          error: "Sessão expirada. Faça login novamente para acessar o Dicionário Strong",
          requiresLogin: true,
          requiresSubscription: false,
          used: 0,
          limit: STRONG_FREE_LIMIT,
        });
      }
      
      const user = await storage.getUser(userId);
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
      const hasGold = await storage.hasActiveSubscription(userId, 'gold');
      const hasPremium = await storage.hasActiveSubscription(userId, 'premium');
      const hasLifetime = await storage.hasActiveSubscription(userId, 'strong_lifetime');
      const hasActiveBonus = await storage.hasActiveBonus(userId);
      
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
      const [entry] = await db
        .select()
        .from(strongEntries)
        .where(eq(strongEntries.strongNumber, upperNumber))
        .limit(1);
      
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

  // ===================================
  // BILLING ROUTES - RevenueCat Integration
  // ===================================

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

  // ============================================
  // ADMIN ROUTES (Protected by role guards)
  // ============================================

  // Admin Dashboard - Stats
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

      const activeTrials = allUsers.filter(u => isTrialActive(u.trialStartDate)).length;
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

      // Get all subscriptions with active-like status
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
        })
        .from(subscriptions)
        .where(gte(subscriptions.createdAt, startDate))
        .orderBy(desc(subscriptions.createdAt));

      // Get users for these subscriptions
      const userIds = Array.from(new Set(allSubscriptions.map(s => s.userId)));
      const usersData = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds.length > 0 ? userIds : ['']));
      
      const usersMap = new Map(usersData.map(u => [u.id, u]));

      // Categorize by plan type
      const goldPurchases = allSubscriptions
        .filter(s => s.planType?.toLowerCase() === 'gold')
        .map(s => ({
          ...s,
          user: usersMap.get(s.userId),
        }));

      const premiumPurchases = allSubscriptions
        .filter(s => s.planType?.toLowerCase() === 'premium')
        .map(s => ({
          ...s,
          user: usersMap.get(s.userId),
        }));

      const lifetimePurchases = allSubscriptions
        .filter(s => s.planType?.toLowerCase() === 'strong_lifetime')
        .map(s => ({
          ...s,
          user: usersMap.get(s.userId),
        }));

      // Calculate totals
      const goldTotal = goldPurchases.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
      const premiumTotal = premiumPurchases.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
      const lifetimeTotal = lifetimePurchases.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);

      // Daily breakdown for charts
      const dailyData: Record<string, { gold: number; premium: number; lifetime: number }> = {};
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { gold: 0, premium: 0, lifetime: 0 };
      }

      allSubscriptions.forEach(s => {
        const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          const planType = s.planType?.toLowerCase();
          if (planType === 'gold') dailyData[dateStr].gold++;
          else if (planType === 'premium') dailyData[dateStr].premium++;
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
        .where(sql`${users.createdAt} < '${currentYear}-01-01'`);
      
      const guestsBeforeYear = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(guests)
        .where(sql`${guests.createdAt} < '${currentYear}-01-01'`);

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
      
      // Remove passwords
      const safeUsers = usersList.map(u => {
        const { password: _, ...rest } = u;
        return rest;
      });

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
  app.get("/api/study/modules", async (req, res) => {
    try {
      const lang = (req.query.lang as string) || 'pt';
      const modules = await storage.getStudyModules();
      
      // Get user/guest info for progress
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      // Add progress info and translate each module
      const modulesWithProgress = await Promise.all(modules.map(async (module) => {
        const progress = await storage.getModuleProgress(module.id, userId, deviceId);
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
  app.get("/api/study/modules/:id", async (req, res) => {
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
      
      // Add lesson counts and progress to tracks, with translation
      const tracksWithDetails = await Promise.all(tracks.map(async (track) => {
        const translatedTrack = await getTranslatedTrack(track, lang);
        const lessons = await storage.getTrackLessons(track.id);
        const userProgress = await storage.getUserStudyProgress(userId, deviceId);
        const trackLessonIds = lessons.map(l => l.id);
        const completedLessons = userProgress.filter(p => 
          trackLessonIds.includes(p.lessonId) && p.completed
        ).length;
        
        return {
          ...translatedTrack,
          totalLessons: lessons.length,
          completedLessons,
          percentage: lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0,
        };
      }));
      
      const overallProgress = await storage.getModuleProgress(id, userId, deviceId);
      
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
  app.get("/api/study/tracks/:id", async (req, res) => {
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
  app.post("/api/study/progress", async (req, res) => {
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

  // ============================================
  // IN-APP PURCHASE (iOS/Android) ROUTES
  // ============================================
  app.use('/api/iap', iapRoutes);

  // ============================================
  // MERCADO PAGO CHECKOUT PRO INTEGRATION
  // ============================================
  
  // Plan configuration with fixed prices (BRL)
  const MP_PLAN_CONFIG: Record<string, { title: string; price: number; days: number | null }> = {
    gold: { title: "Bíblia Inteligente - Plano Gold", price: 9.90, days: 30 },
    premium: { title: "Bíblia Inteligente - Plano Premium", price: 19.90, days: 30 },
    vitalicio: { title: "Bíblia Inteligente - Strong Vitalício", price: 49.90, days: null },
    strong_lifetime: { title: "Bíblia Inteligente - Strong Vitalício", price: 49.90, days: null },
  };
  
  // PRODUCTION URL - Always use this for redirects after payment
  // This ensures users are NEVER redirected to *.picard.replit.dev
  const PRODUCTION_APP_URL = 'https://bibliainteligente.replit.app';
  
  // Get APP_URL - for webhooks (can use dev domain)
  function getAppUrl(): string {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    // For REPLIT_DOMAINS, prefer the .replit.app production domain
    if (process.env.REPLIT_DOMAINS) {
      const domains = process.env.REPLIT_DOMAINS.split(',');
      // Find the production domain (ends with .replit.app)
      const prodDomain = domains.find(d => d.endsWith('.replit.app'));
      if (prodDomain) {
        return `https://${prodDomain}`;
      }
      if (domains.length > 0) {
        return `https://${domains[0]}`;
      }
    }
    // Fallback to dev domain only if no production domain
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    return 'https://localhost:5000';
  }
  
  // Create Mercado Pago Checkout preference
  app.post("/api/mp/create-checkout", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const { plan } = req.body;
      if (!plan || !MP_PLAN_CONFIG[plan]) {
        return res.status(400).json({ error: "Plano inválido. Escolha: gold, premium ou vitalicio" });
      }
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("[MP] MP_ACCESS_TOKEN não configurado");
        return res.status(500).json({ error: "Configuração de pagamento não disponível" });
      }
      
      const planConfig = MP_PLAN_CONFIG[plan];
      const planType = plan === 'strong_lifetime' ? 'vitalicio' : plan;
      
      // Fetch user email for payer info
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`[MP] ❌ Usuário não encontrado: ${userId}`);
        return res.status(400).json({ error: "Usuário não encontrado" });
      }
      
      const userEmail = user.email;
      if (!userEmail) {
        console.warn(`[MP] ⚠️ Usuário ${userId} não tem email cadastrado`);
      }
      
      // Create external reference with user and plan info (CRITICAL for webhook)
      const externalReference = JSON.stringify({
        userId,
        plan: planType,
        days: planConfig.days,
        lifetime: planConfig.days === null,
      });
      
      console.log(`[MP] ════════════════════════════════════════════════════`);
      console.log(`[MP] CRIANDO CHECKOUT`);
      console.log(`[MP] userId: ${userId}`);
      console.log(`[MP] email: ${userEmail}`);
      console.log(`[MP] plan: ${plan}`);
      console.log(`[MP] price: R$${planConfig.price}`);
      console.log(`[MP] external_reference: ${externalReference}`);
      console.log(`[MP] ════════════════════════════════════════════════════`);
      
      // Create Mercado Pago preference
      // IMPORTANT: back_urls MUST use PRODUCTION_APP_URL to avoid *.picard.replit.dev redirect
      const preference = {
        items: [{
          id: `plan_${planType}`,
          title: planConfig.title,
          description: `Plano ${planType.charAt(0).toUpperCase() + planType.slice(1)} - Bíblia Inteligente IA`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: planConfig.price,
        }],
        // ETAPA C: external_reference com userId (CRÍTICO)
        external_reference: externalReference,
        // ETAPA C: metadata com userId e plan (redundância para segurança)
        metadata: {
          userId: userId,
          user_id: userId,
          plan: planType,
          planType: planType,
          userEmail: userEmail || '',
        },
        // Payer info (only if email exists)
        ...(userEmail ? { payer: { email: userEmail } } : {}),
        back_urls: {
          success: `${PRODUCTION_APP_URL}/mp/return?status=success`,
          failure: `${PRODUCTION_APP_URL}/mp/return?status=failure`,
          pending: `${PRODUCTION_APP_URL}/mp/return?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${PRODUCTION_APP_URL}/api/mp/webhook`,
        // Statement descriptor
        statement_descriptor: "BIBLIA IA",
      };
      
      console.log(`[MP] Preference payload:`, JSON.stringify(preference, null, 2));
      
      console.log(`[MP] create-checkout plan=${plan} userId=${userId} price=${planConfig.price}`);
      
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify(preference),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MP] Erro ao criar preferência: ${response.status} - ${errorText}`);
        return res.status(500).json({ error: "Erro ao criar checkout" });
      }
      
      const data = await response.json();
      console.log(`[MP] Checkout criado: preference_id=${data.id}`);
      console.log(`[MP] init_point=${data.init_point}`);
      
      res.json({
        init_point: data.init_point,
        preference_id: data.id,
      });
    } catch (error) {
      console.error("[MP] Erro ao criar checkout:", error);
      res.status(500).json({ error: "Erro interno ao processar pagamento" });
    }
  });
  
  // ===================================
  // MERCADO PAGO PIX - Create Pix payment with QR Code
  // ===================================
  app.post("/api/mp/create-pix", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const { plan } = req.body;
      if (!plan || !MP_PLAN_CONFIG[plan]) {
        return res.status(400).json({ error: "Plano inválido. Escolha: gold, premium ou vitalicio" });
      }
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("[MP Pix] MP_ACCESS_TOKEN não configurado");
        return res.status(500).json({ error: "Configuração de pagamento não disponível" });
      }
      
      const planConfig = MP_PLAN_CONFIG[plan];
      const planType = plan === 'strong_lifetime' ? 'vitalicio' : plan;
      
      // Fetch user for payer info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ error: "Usuário não encontrado" });
      }
      
      // External reference for webhook
      const externalReference = JSON.stringify({
        userId,
        plan: planType,
        days: planConfig.days,
        lifetime: planConfig.days === null,
      });
      
      console.log(`[MP Pix] ════════════════════════════════════════════════════`);
      console.log(`[MP Pix] CRIANDO PAGAMENTO PIX`);
      console.log(`[MP Pix] userId: ${userId}, plan: ${plan}, price: R$${planConfig.price}`);
      console.log(`[MP Pix] ════════════════════════════════════════════════════`);
      
      // Create Pix payment via Mercado Pago API
      const pixPayment = {
        transaction_amount: planConfig.price,
        description: planConfig.title,
        payment_method_id: "pix",
        payer: {
          email: user.email || `user_${userId}@bibliaintegente.app`,
          first_name: user.name?.split(' ')[0] || "Usuario",
          last_name: user.name?.split(' ').slice(1).join(' ') || "App",
        },
        external_reference: externalReference,
        metadata: {
          userId: userId,
          plan: planType,
        },
        notification_url: `${PRODUCTION_APP_URL}/api/mp/webhook`,
      };
      
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpAccessToken}`,
          "X-Idempotency-Key": `pix_${userId}_${plan}_${Date.now()}`,
        },
        body: JSON.stringify(pixPayment),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MP Pix] Erro ao criar pagamento: ${response.status} - ${errorText}`);
        return res.status(500).json({ error: "Erro ao gerar Pix" });
      }
      
      const data = await response.json();
      console.log(`[MP Pix] Pagamento criado: id=${data.id}, status=${data.status}`);
      
      // Extract Pix data
      const pixData = data.point_of_interaction?.transaction_data;
      
      if (!pixData?.qr_code || !pixData?.qr_code_base64) {
        console.error("[MP Pix] QR Code não retornado pela API");
        return res.status(500).json({ error: "Erro ao gerar QR Code Pix" });
      }
      
      res.json({
        paymentId: data.id,
        status: data.status,
        qrCode: pixData.qr_code, // Código copia-e-cola
        qrCodeBase64: pixData.qr_code_base64, // Imagem em base64
        expirationDate: pixData.expiration_date,
        ticketUrl: pixData.ticket_url,
        amount: planConfig.price,
        planName: planConfig.title,
      });
    } catch (error) {
      console.error("[MP Pix] Erro ao criar pagamento:", error);
      res.status(500).json({ error: "Erro interno ao processar Pix" });
    }
  });
  
  // Check Pix payment status (with ownership verification)
  app.get("/api/mp/pix-status/:paymentId", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.userId;
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        return res.status(500).json({ error: "Configuração não disponível" });
      }
      
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
        },
      });
      
      if (!response.ok) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }
      
      const data = await response.json();
      
      // Security: Verify payment belongs to requesting user
      let paymentUserId: string | null = null;
      try {
        if (data.external_reference) {
          const refData = JSON.parse(data.external_reference);
          paymentUserId = refData.userId;
        }
      } catch (e) {
        // external_reference might not be JSON
      }
      
      if (!paymentUserId) {
        paymentUserId = data.metadata?.userId || data.metadata?.user_id;
      }
      
      if (paymentUserId && paymentUserId !== userId) {
        console.warn(`[MP Pix Status] Unauthorized: user ${userId} tried to check payment of user ${paymentUserId}`);
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      res.json({
        status: data.status,
        statusDetail: data.status_detail,
        approved: data.status === 'approved',
      });
    } catch (error) {
      console.error("[MP Pix Status] Erro:", error);
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });
  
  // ===================================
  // MERCADO PAGO RETURN ROUTE - Redirect after payment
  // ===================================
  
  // GET /mp/return - Rota de retorno após pagamento no Mercado Pago
  // Esta rota SEMPRE redireciona para o app, nunca mostra erro
  app.get("/mp/return", (req, res) => {
    console.log("[MP Return] ========================================");
    console.log("[MP Return] Query params:", req.query);
    
    // Extrair parâmetros do Mercado Pago
    const status = req.query.status as string || 'unknown';
    const paymentId = req.query.payment_id as string || req.query.collection_id as string || '';
    const preferenceId = req.query.preference_id as string || '';
    const externalReference = req.query.external_reference as string || '';
    const merchantOrderId = req.query.merchant_order_id as string || '';
    
    console.log(`[MP Return] status=${status}, payment_id=${paymentId}, preference_id=${preferenceId}`);
    
    // Construir URL de redirecionamento para as páginas existentes no frontend
    // O frontend tem: /pagamento/sucesso, /pagamento/erro, /pagamento/pendente
    let redirectPath = '/pagamento/sucesso'; // default para sucesso
    
    if (status === 'success' || status === 'approved') {
      redirectPath = '/pagamento/sucesso';
    } else if (status === 'failure' || status === 'rejected') {
      redirectPath = '/pagamento/erro';
    } else if (status === 'pending' || status === 'in_process') {
      redirectPath = '/pagamento/pendente';
    }
    
    // Adicionar parâmetros úteis
    const queryParams = new URLSearchParams();
    if (paymentId) queryParams.set('payment_id', paymentId);
    if (preferenceId) queryParams.set('preference_id', preferenceId);
    
    const queryString = queryParams.toString();
    if (queryString) {
      redirectPath += `?${queryString}`;
    }
    
    // Construir URL final (SEMPRE para produção, nunca para *.picard.replit.dev)
    const finalUrl = `${PRODUCTION_APP_URL}${redirectPath}`;
    
    console.log(`[MP Return] Redirecionando para: ${finalUrl}`);
    
    // SEMPRE retornar redirect 302
    res.redirect(302, finalUrl);
  });
  
  // GET /api/mp/status - Verificar status da assinatura do usuário
  app.get("/api/mp/status", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      // Buscar assinaturas ativas do usuário
      const hasGold = await storage.hasActiveSubscription(userId, 'gold');
      const hasPremium = await storage.hasActiveSubscription(userId, 'premium');
      const hasStrongLifetime = await storage.hasActiveSubscription(userId, 'strong_lifetime');
      
      // Buscar detalhes da assinatura
      const subscription = await storage.getActiveSubscription(userId);
      
      res.json({
        success: true,
        hasActiveSubscription: hasGold || hasPremium || hasStrongLifetime,
        plans: {
          gold: hasGold,
          premium: hasPremium,
          strong_lifetime: hasStrongLifetime,
        },
        subscription: subscription ? {
          id: subscription.id,
          planType: subscription.planType,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        } : null,
      });
    } catch (error) {
      console.error("[MP Status] Error:", error);
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });
  
  // ===================================
  // MERCADO PAGO WEBHOOK - COMPLETE IMPLEMENTATION
  // ===================================
  
  // Memory storage for last webhook (expires after 15 minutes)
  interface LastWebhookData {
    receivedAt: Date;
    query: any;
    body: any;
    headers: any;
    processedResult?: {
      success: boolean;
      userId?: string;
      plan?: string;
      error?: string;
      receiptCreated?: boolean;
      grossAmount?: number;
      netAmount?: number;
    };
  }
  let lastWebhookData: LastWebhookData | null = null;
  
  // GET /api/mp/health - Health check endpoint
  app.get("/api/mp/health", (_req, res) => {
    console.log("[MP] Health check");
    res.status(200).json({ 
      ok: true,
      timestamp: new Date().toISOString(),
      webhookUrl: `${PRODUCTION_APP_URL}/api/mp/webhook`,
      hasToken: !!process.env.MP_ACCESS_TOKEN,
    });
  });
  
  // GET /api/mp/last-webhook - Returns the last webhook received (for debugging)
  app.get("/api/mp/last-webhook", (_req, res) => {
    console.log("[MP] Last webhook request");
    
    if (!lastWebhookData) {
      return res.status(200).json({ 
        message: "Nenhum webhook recebido ainda",
        lastWebhook: null,
      });
    }
    
    // Check if expired (15 minutes)
    const now = new Date();
    const age = now.getTime() - lastWebhookData.receivedAt.getTime();
    const maxAge = 15 * 60 * 1000; // 15 minutes
    
    if (age > maxAge) {
      return res.status(200).json({
        message: "Último webhook expirou (mais de 15 minutos)",
        expiredAt: new Date(lastWebhookData.receivedAt.getTime() + maxAge).toISOString(),
        lastWebhook: null,
      });
    }
    
    res.status(200).json({
      message: "Último webhook recebido",
      ageSeconds: Math.round(age / 1000),
      lastWebhook: lastWebhookData,
    });
  });
  
  // GET /api/mp/webhook - Endpoint de teste para verificar se webhook está online
  app.get("/api/mp/webhook", (_req, res) => {
    console.log("[MP Webhook] GET - Teste de verificação do endpoint");
    res.status(200).send("OK webhook endpoint online");
  });
  
  // POST /api/mp/webhook - Recebe notificações do Mercado Pago
  app.post("/api/mp/webhook", async (req, res) => {
    const webhookReceivedAt = new Date();
    
    // Log imediato de recebimento
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║           WEBHOOK MERCADO PAGO RECEBIDO                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("[MP Webhook] Timestamp:", webhookReceivedAt.toISOString());
    console.log("[MP Webhook] Query:", JSON.stringify(req.query, null, 2));
    console.log("[MP Webhook] Body:", JSON.stringify(req.body, null, 2));
    console.log("[MP Webhook] Headers:", JSON.stringify({
      'content-type': req.headers['content-type'],
      'x-signature': req.headers['x-signature'],
      'x-request-id': req.headers['x-request-id'],
    }, null, 2));
    
    // Armazenar dados do webhook para debug (clonar de forma segura)
    const safeClone = (obj: unknown): unknown => {
      try {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj, (key, value) => {
          if (typeof value === 'bigint') return value.toString();
          if (typeof value === 'function') return '[function]';
          if (value instanceof Date) return value.toISOString();
          return value;
        }));
      } catch {
        return { _cloneError: true, toString: String(obj).substring(0, 500) };
      }
    };
    
    lastWebhookData = {
      receivedAt: webhookReceivedAt,
      query: safeClone(req.query) as any,
      body: safeClone(req.body) as any,
      headers: {
        'content-type': req.headers['content-type'] || null,
        'x-signature': req.headers['x-signature'] || null,
        'x-request-id': req.headers['x-request-id'] || null,
      },
    };
    
    // Responder 200 IMEDIATAMENTE para o Mercado Pago não reenviar
    res.sendStatus(200);
    console.log("[MP Webhook] ✓ Respondeu 200 OK ao Mercado Pago");
    
    // Processar em background (após resposta)
    try {
      // Extrair type de múltiplas fontes possíveis
      const type = 
        req.query.type as string || 
        req.query.topic as string || 
        req.body?.type || 
        req.body?.topic || 
        req.body?.action || 
        '';
      
      // Extrair dataId de múltiplas fontes possíveis
      const dataId = 
        req.query["data.id"] as string || 
        req.query.id as string || 
        req.body?.data?.id || 
        req.body?.id || 
        '';
      
      console.log(`[MP Webhook] Extracted: type="${type}", dataId="${dataId}"`);
      
      if (!dataId) {
        console.log("[MP Webhook] ❌ Sem dataId - ignorando notificação");
        lastWebhookData.processedResult = { success: false, error: "Sem dataId" };
        return;
      }
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("[MP Webhook] ❌ MP_ACCESS_TOKEN não configurado!");
        lastWebhookData.processedResult = { success: false, error: "MP_ACCESS_TOKEN não configurado" };
        return;
      }
      
      // Determinar se é payment ou preapproval (assinatura recorrente)
      const isPayment = type === 'payment' || type.startsWith('payment.');
      const isPreapproval = type === 'subscription_preapproval' || type === 'preapproval' || type.startsWith('subscription');
      
      console.log(`[MP Webhook] Tipo de notificação: isPayment=${isPayment}, isPreapproval=${isPreapproval}`);
      
      let apiUrl: string;
      if (isPreapproval) {
        apiUrl = `https://api.mercadopago.com/preapproval/${dataId}`;
      } else {
        // Default: tratar como payment
        apiUrl = `https://api.mercadopago.com/v1/payments/${dataId}`;
      }
      
      console.log(`[MP Webhook] Buscando dados em: ${apiUrl}`);
      
      // Buscar detalhes do pagamento/assinatura no Mercado Pago
      const mpResponse = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
        },
      });
      
      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error(`[MP Webhook] ❌ Erro ao buscar MP API: ${mpResponse.status} - ${errorText}`);
        lastWebhookData.processedResult = { success: false, error: `Erro MP API: ${mpResponse.status}` };
        return;
      }
      
      const mpData = await mpResponse.json();
      console.log(`[MP Webhook] ✓ Dados recebidos do MP API`);
      console.log(`[MP Webhook] Dados do MP:`, JSON.stringify(mpData, null, 2));
      
      // Verificar status aprovado
      const status = mpData.status;
      const isApproved = 
        status === 'approved' || 
        status === 'authorized' || 
        status === 'active';
      
      console.log(`[MP Webhook] Status: ${status}, isApproved: ${isApproved}`);
      
      if (!isApproved) {
        console.log(`[MP Webhook] ⏳ Pagamento não aprovado ainda (status=${status}) - aguardando`);
        return;
      }
      
      // ========================================
      // IDENTIFICAR USUÁRIO E PLANO
      // ========================================
      
      // Tentar obter dados do external_reference (JSON com userId, plan, days, lifetime)
      let userId: string | null = null;
      let plan: string | null = null;
      let days: number | null = null;
      let lifetime: boolean = false;
      
      // Primeiro: tentar external_reference (prioridade)
      const externalRef = mpData.external_reference || mpData.reason || '';
      console.log(`[MP Webhook] external_reference: "${externalRef}"`);
      
      if (externalRef) {
        try {
          const refData = JSON.parse(externalRef);
          userId = refData.userId || refData.user_id || null;
          plan = refData.plan || refData.planType || null;
          days = refData.days || null;
          lifetime = refData.lifetime || false;
          console.log(`[MP Webhook] Parsed external_reference: userId=${userId}, plan=${plan}, days=${days}, lifetime=${lifetime}`);
        } catch (e) {
          // external_reference não é JSON, pode ser string simples (email ou ID)
          console.log(`[MP Webhook] external_reference não é JSON: "${externalRef}"`);
          // Tentar usar como userId diretamente se parecer um UUID ou email
          if (externalRef.includes('@') || externalRef.length > 20) {
            // Pode ser email, tentar buscar usuário
            const userByEmail = await storage.getUserByEmail(externalRef);
            if (userByEmail) {
              userId = userByEmail.id;
              console.log(`[MP Webhook] Encontrado usuário por email: ${userId}`);
            }
          }
        }
      }
      
      // Segundo: tentar metadata (pode ser objeto, string JSON, ou URL-encoded)
      // Procurar metadata em vários locais possíveis
      const possibleMetadatas = [
        mpData.metadata,
        mpData.preapproval_plan?.metadata,
        mpData.data?.metadata,
      ].filter(Boolean);
      
      for (const rawMetadata of possibleMetadatas) {
        if (userId) break; // Já encontrou usuário
        
        let metadataObj = rawMetadata;
        
        // Se metadata for string, tentar parsear
        if (typeof metadataObj === 'string') {
          const trimmed = metadataObj.trim();
          
          // Tentar JSON parse
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              metadataObj = JSON.parse(trimmed);
              console.log(`[MP Webhook] Metadata era string JSON, parseado:`, JSON.stringify(metadataObj));
            } catch (e) {
              console.log(`[MP Webhook] Metadata string falhou JSON parse: "${trimmed.substring(0, 100)}"`);
              metadataObj = null;
            }
          } 
          // Tentar URL-encoded (ex: "userId=123&plan=premium")
          else if (trimmed.includes('=')) {
            try {
              const params = new URLSearchParams(trimmed);
              metadataObj = Object.fromEntries(params);
              console.log(`[MP Webhook] Metadata era URL-encoded, parseado:`, JSON.stringify(metadataObj));
            } catch (e) {
              console.log(`[MP Webhook] Metadata URL-encoded falhou: "${trimmed.substring(0, 100)}"`);
              metadataObj = null;
            }
          } else {
            metadataObj = null;
          }
        }
        
        if (metadataObj && typeof metadataObj === 'object') {
          userId = metadataObj.user_id || metadataObj.userId || null;
          plan = metadataObj.plan || metadataObj.planType || plan;
          console.log(`[MP Webhook] Metadata object: userId=${userId}, plan=${plan}`);
        }
      }
      
      // Terceiro: tentar payer email
      if (!userId && mpData.payer?.email) {
        const payerEmail = mpData.payer.email;
        console.log(`[MP Webhook] Tentando buscar usuário pelo email do pagador: ${payerEmail}`);
        const userByEmail = await storage.getUserByEmail(payerEmail);
        if (userByEmail) {
          userId = userByEmail.id;
          console.log(`[MP Webhook] ✓ Encontrado usuário pelo email do pagador: ${userId}`);
        }
      }
      
      if (!userId) {
        console.error(`[MP Webhook] ❌ Não foi possível identificar usuário! external_reference="${externalRef}", metadata=${JSON.stringify(mpData.metadata)}, payer=${JSON.stringify(mpData.payer)}`);
        return;
      }
      
      // Inferir plano pelo valor se não foi especificado
      // Para payments: transaction_amount
      // Para preapprovals: auto_recurring.transaction_amount (pode estar em vários níveis)
      const transactionAmount = mpData.transaction_amount || 
                               mpData.auto_recurring?.transaction_amount ||
                               mpData.data?.auto_recurring?.transaction_amount ||
                               mpData.preapproval_plan?.auto_recurring?.transaction_amount ||
                               null;
      
      if (!plan && transactionAmount) {
        const amount = parseFloat(transactionAmount);
        if (amount <= 10) plan = 'gold';
        else if (amount <= 25) plan = 'premium';
        else plan = 'strong_lifetime';
        console.log(`[MP Webhook] Plano inferido pelo valor R$${amount}: ${plan}`);
      }
      
      // Tentar também pelo 'reason' do preapproval (pode conter nome do plano)
      if (!plan && mpData.reason) {
        const reason = mpData.reason.toLowerCase();
        if (reason.includes('gold')) plan = 'gold';
        else if (reason.includes('premium')) plan = 'premium';
        else if (reason.includes('vitalicio') || reason.includes('lifetime')) plan = 'strong_lifetime';
        if (plan) {
          console.log(`[MP Webhook] Plano inferido pelo reason "${mpData.reason}": ${plan}`);
        }
      }
      
      if (!plan) {
        plan = 'premium'; // Default para premium se não conseguir identificar
        console.log(`[MP Webhook] ⚠️ Plano não identificado, usando default: ${plan}`);
      }
      
      // Inferir dias pelo plano se não especificado
      if (!days && !lifetime) {
        if (plan === 'strong_lifetime' || plan === 'vitalicio') {
          lifetime = true;
        } else {
          days = 30; // Default 30 dias
        }
      }
      
      // ========================================
      // ATIVAR PLANO DO USUÁRIO
      // ========================================
      
      // Calcular data de término
      let endDate: Date | null = null;
      if (!lifetime && days) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
      }
      
      // Normalizar nome do plano
      const planType = plan === 'vitalicio' ? 'strong_lifetime' : plan;
      const amount = mpData.transaction_amount?.toString() || 
                     MP_PLAN_CONFIG[plan]?.price.toFixed(2) || 
                     MP_PLAN_CONFIG[planType]?.price.toFixed(2) || 
                     "0.00";
      
      console.log(`[MP Webhook] 🔄 Ativando plano: userId=${userId}, planType=${planType}, days=${days}, lifetime=${lifetime}, endDate=${endDate?.toISOString()}`);
      
      // ========================================
      // EXTRAIR VALORES FINANCEIROS DETALHADOS
      // ========================================
      
      // Valor bruto (transaction_amount) em centavos
      const grossAmountFloat = parseFloat(mpData.transaction_amount || mpData.auto_recurring?.transaction_amount || '0');
      const grossAmount = Math.round(grossAmountFloat * 100); // Converter para centavos
      
      // Taxas do Mercado Pago (fee_details)
      let feeAmount = 0;
      if (mpData.fee_details && Array.isArray(mpData.fee_details)) {
        for (const fee of mpData.fee_details) {
          feeAmount += Math.round(parseFloat(fee.amount || '0') * 100);
        }
      }
      
      // Impostos (taxes_amount se disponível)
      const taxAmount = Math.round(parseFloat(mpData.taxes_amount || '0') * 100);
      
      // Valor líquido (net_amount ou calculado)
      let netAmount = Math.round(parseFloat(mpData.net_amount || '0') * 100);
      if (!netAmount && grossAmount) {
        netAmount = grossAmount - feeAmount - taxAmount;
      }
      
      // Logging detalhado dos valores financeiros
      console.log(`[MP Webhook] ╔════════════════════════════════════════════════════════════╗`);
      console.log(`[MP Webhook] ║           DETALHES FINANCEIROS DO RECIBO                   ║`);
      console.log(`[MP Webhook] ╠════════════════════════════════════════════════════════════╣`);
      console.log(`[MP Webhook] ║ Valor Bruto:   R$ ${(grossAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Taxas MP:      R$ ${(feeAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Impostos:      R$ ${(taxAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Valor Líquido: R$ ${(netAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Origem:        ${isPreapproval ? 'Assinatura Recorrente' : 'Pagamento Único'}`);
      console.log(`[MP Webhook] ╚════════════════════════════════════════════════════════════╝`);
      
      // Verificar se já existe recibo para este pagamento (evitar duplicidade)
      const existingReceipt = await storage.getPaymentReceiptByExternalId(dataId);
      if (existingReceipt) {
        console.log(`[MP Webhook] ⚠️ Recibo já existe para paymentId=${dataId}, atualizando...`);
        await storage.updatePaymentReceipt(existingReceipt.id, {
          status: status,
          statusDetail: mpData.status_detail || null,
          processedAt: new Date(),
        });
      }
      
      // Usar função existente para criar/atualizar assinatura
      const subscription = await storage.upsertSubscription({
        userId,
        planType,
        status: 'active',
        startDate: new Date(),
        endDate,
        amount,
      });
      
      console.log(`[MP Webhook] ✅ ASSINATURA ATIVADA!`);
      console.log(`[MP Webhook] ✅ subscriptionId=${subscription.id}`);
      console.log(`[MP Webhook] ✅ userId=${userId}`);
      console.log(`[MP Webhook] ✅ planType=${planType}`);
      console.log(`[MP Webhook] ✅ endDate=${subscription.endDate}`);
      
      // ========================================
      // CRIAR RECIBO DE PAGAMENTO DETALHADO
      // ========================================
      
      if (!existingReceipt) {
        const payerEmail = mpData.payer?.email || null;
        
        // Validação do recibo
        const validationErrors: string[] = [];
        if (!userId) validationErrors.push('userId não identificado');
        if (!grossAmount) validationErrors.push('grossAmount zerado');
        if (!planType) validationErrors.push('planType não identificado');
        
        const paymentReceipt = await storage.createPaymentReceipt({
          externalPaymentId: dataId,
          paymentProvider: 'mercadopago',
          paymentType: isPreapproval ? 'preapproval' : 'payment',
          userId: userId || null,
          userEmail: payerEmail,
          planType: planType,
          subscriptionDays: lifetime ? null : (days || 30),
          isLifetime: lifetime,
          grossAmount,
          feeAmount,
          taxAmount,
          netAmount,
          currency: mpData.currency_id || 'BRL',
          status: status,
          statusDetail: mpData.status_detail || null,
          origin: 'webhook',
          ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || null,
          userAgent: req.headers['user-agent'] || null,
          deviceId: null,
          providerRawData: mpData,
          isValidated: validationErrors.length === 0,
          validationErrors: validationErrors.length > 0 ? validationErrors : null,
          validatedAt: validationErrors.length === 0 ? new Date() : null,
          subscriptionId: subscription.id,
          activatedAt: new Date(),
          paymentDate: new Date(mpData.date_created || mpData.date_approved || new Date()),
          processedAt: new Date(),
        });
        
        console.log(`[MP Webhook] ✅ RECIBO CRIADO: receiptId=${paymentReceipt.id}`);
        console.log(`[MP Webhook] ✅ isValidated=${paymentReceipt.isValidated}`);
        if (validationErrors.length > 0) {
          console.log(`[MP Webhook] ⚠️ Erros de validação: ${validationErrors.join(', ')}`);
        }
      }
      
      // Rastrear evento de conversão para métricas admin
      await storage.trackPageEvent(userId, 'SUBSCRIPTION_ACTIVATED', { 
        planType, 
        paymentId: dataId,
        amount,
        source: 'mp_webhook',
        grossAmount,
        netAmount,
        feeAmount,
      });
      console.log(`[MP Webhook] ✅ Evento SUBSCRIPTION_ACTIVATED rastreado`);
      
      // Verificação final
      const verify = await storage.hasActiveSubscription(userId, planType);
      console.log(`[MP Webhook] ✅ VERIFICAÇÃO FINAL: hasActiveSubscription(${userId}, ${planType}) = ${verify}`);
      console.log(`[MP Webhook] ╔════════════════════════════════════════════════════════════╗`);
      console.log(`[MP Webhook] ║     PROCESSAMENTO CONCLUÍDO COM SUCESSO!                  ║`);
      console.log(`[MP Webhook] ╚════════════════════════════════════════════════════════════╝`);
      
      // Armazenar resultado de sucesso
      if (lastWebhookData) {
        lastWebhookData.processedResult = { 
          success: true, 
          userId, 
          plan: planType,
          receiptCreated: !existingReceipt,
          grossAmount,
          netAmount,
        };
      }
      
    } catch (error) {
      console.error("[MP Webhook] ❌ ERRO ao processar webhook:", error);
      // Armazenar resultado de erro
      if (lastWebhookData) {
        lastWebhookData.processedResult = { 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  });

  // ===================================
  // DEBUG ENDPOINTS (Obrigatórios para validação)
  // ===================================

  // Build info endpoint - para validar versão em produção
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
  const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret';
  
  app.get("/api/cron/send-inactive-30d", async (req, res) => {
    try {
      // Verify secret
      const secret = req.headers['x-cron-secret'] || req.query.secret;
      if (secret !== CRON_SECRET) {
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

  const httpServer = createServer(app);
  return httpServer;
}

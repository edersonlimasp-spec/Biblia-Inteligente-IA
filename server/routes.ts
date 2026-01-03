import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, ensureAdmin, ensureSuperAdmin, optionalAuth, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "./auth";
import { sendPasswordResetEmail, sendReengagementEmail } from "./email";
import admin from "firebase-admin";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { askTheologicalQuestion } from "./openai";
import { insertUserSchema, insertSubscriptionSchema, insertBookmarkSchema, insertAnnotationSchema, insertAIHistorySchema, strongEntries, users, subscriptions, bonuses, bibleVersions, bibleVerses, userBiblePreferences, bibleWords, studyModules, studyTracks, studyLessons, studyModuleTranslations, studyTrackTranslations, studyLessonTranslations } from "@shared/schema";
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

      // Debug log for subscription status
      console.log(`[Subscription Status] userId=${req.userId}, hasGold=${hasGold}, hasPremium=${hasPremium}, hasLifetime=${hasLifetime}`);

      res.json({
        hasPremium,
        hasGold,
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

  // Check access permissions
  app.get("/api/access/strong", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin bypass - admins have full access
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      // Check trial or lifetime subscription
      const trialActive = isTrialActive(user.trialStartDate);
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'strong_lifetime');
      
      res.json({ 
        hasAccess: isAdmin || trialActive || hasLifetime,
        reason: isAdmin ? 'admin' : trialActive ? 'trial' : hasLifetime ? 'subscription' : 'none',
      });
    } catch (error) {
      console.error("Check strong access error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso" });
    }
  });

  app.get("/api/access/ai/:mode", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const mode = req.params.mode; // 'essential' or 'premium'
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Admin bypass - admins have full access to all modes
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      // Check trial (gives access to essential mode during 30 days)
      const trialActive = isTrialActive(user.trialStartDate);
      
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');

      let hasAccess = false;
      if (isAdmin) {
        // Admins have full access to all modes
        hasAccess = true;
      } else if (mode === 'essential') {
        // Trial grants access to essential mode
        hasAccess = trialActive || hasGold || hasPremium;
      } else if (mode === 'premium') {
        // Only premium subscription grants premium access
        hasAccess = hasPremium;
      }

      res.json({ 
        hasAccess,
        reason: isAdmin ? 'admin' : trialActive ? 'trial' : hasPremium ? 'premium' : hasGold ? 'gold' : 'none'
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

      const trialActive = isTrialActive(user.trialStartDate);
      
      // Admin bypass - admins have full access to all features
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      // Check subscription status
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');

      // Enforce plan permissions BEFORE making OpenAI call (admins bypass all restrictions)
      if (premiumModes.includes(mode) && !hasPremium && !isAdmin) {
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

      // Check for active bonus (extends trial/access)
      const hasActiveBonus = await storage.hasActiveBonus(req.userId!);
      const hasFullAccess = trialActive || hasGold || hasPremium || hasActiveBonus;

      // Enforce rate limits BEFORE making OpenAI call (admins have no limit)
      const todayCount = await storage.getTodayUsageCount(req.userId!);
      
      // Limits: Premium=100, Gold/Trial/Bonus=30, Expired trial (free)=3
      const FREE_DAILY_LIMIT = 3;
      const limit = isAdmin ? 999999 : (hasPremium ? 100 : hasFullAccess ? 30 : FREE_DAILY_LIMIT);

      if (todayCount >= limit && !isAdmin) {
        // Special message for expired trial users on 4th attempt
        if (!hasFullAccess && todayCount >= FREE_DAILY_LIMIT) {
          return res.status(429).json({ 
            error: `Você atingiu o limite diário de ${FREE_DAILY_LIMIT} perguntas gratuitas. Assine um plano para perguntas ilimitadas, ou aguarde até amanhã para mais ${FREE_DAILY_LIMIT} perguntas.`,
            requiresSubscription: true,
            subscriptionType: 'gold',
            dailyLimit: FREE_DAILY_LIMIT,
            usedToday: todayCount,
            upgradeRequired: true
          });
        }
        
        return res.status(429).json({ 
          error: `Você atingiu o limite diário de ${limit} perguntas. ${
            hasGold ? 'Faça upgrade para Premium (100 perguntas/dia) ou aguarde até amanhã.' : 
            hasPremium ? 'Aguarde até amanhã para continuar.' :
            'Assine um plano para continuar usando o Professor.'
          }`,
          requiresSubscription: !hasGold && !hasPremium,
          dailyLimit: limit,
          usedToday: todayCount
        });
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

      res.json({ 
        response,
        usageInfo: {
          usedToday: todayCount + 1,
          dailyLimit: limit,
          remaining: limit - (todayCount + 1)
        }
      });
    } catch (error: any) {
      console.error("AI ask error:", error);
      res.status(500).json({ error: error.message || "Erro ao processar pergunta" });
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
  // Rules: Guest=2 questions, User=5 questions total (includes guest questions migrated)
  const FREE_QUESTIONS_LIMIT = 5;
  
  app.get("/api/ai/quota", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Check if user has unlimited access (admin, subscription, or trial)
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');
      const trialActive = isTrialActive(user.trialStartDate);
      const hasActiveBonus = await storage.hasActiveBonus(req.userId!);
      
      const hasUnlimitedAccess = isAdmin || hasGold || hasPremium || trialActive || hasActiveBonus;
      
      if (hasUnlimitedAccess) {
        return res.json({
          used: 0,
          limit: Infinity,
          remaining: Infinity,
          hasUnlimitedAccess: true,
        });
      }
      
      // Get quota from database
      const quota = await storage.getFreeAiQuota(req.userId!);
      const used = quota?.questionsUsed || 0;
      const remaining = Math.max(0, FREE_QUESTIONS_LIMIT - used);
      
      res.json({
        used,
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
  const FREE_STRONG_LIMIT = 4; // Free users get 4 total
  const GUEST_STRONG_LIMIT = 2; // Guests get 2 total
  const GOLD_STRONG_DAILY_LIMIT = 20; // Gold users get 20/day
  
  app.get("/api/strong/quota", async (req, res) => {
    try {
      const { deviceId } = req.query as { deviceId?: string };
      
      // Check if authenticated user
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
          const user = await storage.getUser(decoded.userId);
          
          if (user) {
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
            
            // Free user
            const quota = await storage.getFreeStrongQuota(decoded.userId);
            const used = quota?.lookupsUsed || 0;
            
            return res.json({
              used,
              limit: FREE_STRONG_LIMIT,
              remaining: Math.max(0, FREE_STRONG_LIMIT - used),
              type: 'free',
              hasUnlimitedAccess: false,
            });
          }
        } catch (tokenError) {
          // Invalid token, treat as guest
        }
      }
      
      // Guest user
      if (deviceId) {
        const used = await storage.getGuestStrongQuota(deviceId);
        return res.json({
          used,
          limit: GUEST_STRONG_LIMIT,
          remaining: Math.max(0, GUEST_STRONG_LIMIT - used),
          type: 'guest',
          hasUnlimitedAccess: false,
        });
      }
      
      // No auth, no deviceId - return guest default
      res.json({
        used: 0,
        limit: GUEST_STRONG_LIMIT,
        remaining: GUEST_STRONG_LIMIT,
        type: 'guest',
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
  app.post("/api/guest/ai/check", async (req, res) => {
    try {
      const { deviceId } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ error: "deviceId é obrigatório" });
      }
      
      // Check if trial is active
      const trialInfo = await storage.getGuestTrialInfo(deviceId);
      if (!trialInfo) {
        // New device, trial starts now
        return res.json({ 
          canAsk: true, 
          remainingQuestions: 30,
          mode: 'essential',
          isNew: true,
        });
      }
      
      if (!trialInfo.active) {
        return res.json({ 
          canAsk: false, 
          reason: 'trial_expired',
          message: 'Seu período de teste expirou. Assine para continuar.',
        });
      }
      
      // Check daily usage limit (30 questions/day for guests)
      const todayCount = await storage.getGuestTodayUsageCount(deviceId);
      const limit = 30;
      
      if (todayCount >= limit) {
        return res.json({
          canAsk: false,
          reason: 'daily_limit',
          message: `Limite diário de ${limit} perguntas atingido. Tente novamente amanhã.`,
        });
      }
      
      res.json({
        canAsk: true,
        remainingQuestions: limit - todayCount,
        mode: 'essential',
        trial: trialInfo,
      });
    } catch (error) {
      console.error("Guest AI check error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso IA" });
    }
  });

  // Guest AI ask (AI without login)
  app.post("/api/guest/ai/ask", async (req, res) => {
    try {
      const { deviceId, question, book, chapter, verse, language } = req.body;
      
      if (!deviceId || !question) {
        return res.status(400).json({ error: "deviceId e question são obrigatórios" });
      }
      
      // Auto-register guest if not exists (ensures guest record before AI usage)
      let trialInfo = await storage.getGuestTrialInfo(deviceId);
      if (!trialInfo) {
        // Create guest record on-the-fly
        await storage.createOrUpdateGuest(deviceId, 'web');
        trialInfo = await storage.getGuestTrialInfo(deviceId);
      }
      
      // Check trial
      if (trialInfo && !trialInfo.active) {
        return res.status(403).json({ 
          error: "Trial expirado",
          message: "Seu período de teste expirou. Assine para continuar."
        });
      }
      
      // Check daily limit
      const todayCount = await storage.getGuestTodayUsageCount(deviceId);
      if (todayCount >= 30) {
        return res.status(429).json({
          error: "Limite diário atingido",
          message: "Você atingiu o limite de 30 perguntas por dia."
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
        remainingQuestions: 30 - todayCount - 1,
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
      const translations = getEnabledTranslations().map(t => ({
        code: t.code,
        name: t.name,
        language: t.language,
        licenseType: t.licenseType,
        hasData: (countMap[t.code] || 0) > 1000,
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

      // If still no verses, try ACF as ultimate fallback
      if (!verses || verses.length === 0) {
        if (version !== 'ACF') {
          verses = await db
            .select()
            .from(bibleVerses)
            .where(
              and(
                eq(bibleVerses.versionCode, 'ACF'),
                eq(bibleVerses.book, bookId),
                eq(bibleVerses.chapter, chapterInt)
              )
            )
            .orderBy(bibleVerses.verse);
          
          if (verses && verses.length > 0) {
            fallbackUsed = true;
            fallbackFrom = requestedVersion;
            version = 'ACF';
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

  // Cache for Strong word mappings (definition word -> Strong number)
  // Loaded once on first request, avoids repeated 14k+ row queries
  let strongWordMappingCache: Map<string, string> | null = null;
  let strongCacheLoadTime: number = 0;
  const STRONG_CACHE_TTL = 3600000; // 1 hour in milliseconds

  async function getStrongWordMapping(): Promise<Map<string, string>> {
    const now = Date.now();
    if (strongWordMappingCache && (now - strongCacheLoadTime) < STRONG_CACHE_TTL) {
      return strongWordMappingCache;
    }

    console.log('[Strong Cache] Loading Strong word mappings...');
    const startTime = Date.now();
    
    const allStrongEntries = await db.select({
      strongNumber: strongEntries.strongNumber,
      portugueseDef: strongEntries.portugueseDef,
    }).from(strongEntries);

    const defWordsToStrong = new Map<string, string>();
    for (const entry of allStrongEntries) {
      if (entry.portugueseDef) {
        const words = entry.portugueseDef.toLowerCase()
          .split(/[,;.:\s\-—()'"]/g)
          .filter((w: string) => w.length >= 3);
        for (const word of words) {
          const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim();
          if (cleanWord.length >= 3 && !defWordsToStrong.has(cleanWord)) {
            defWordsToStrong.set(cleanWord, entry.strongNumber);
          }
        }
      }
    }

    strongWordMappingCache = defWordsToStrong;
    strongCacheLoadTime = now;
    console.log(`[Strong Cache] Loaded ${defWordsToStrong.size} word mappings in ${Date.now() - startTime}ms`);
    
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

      // STRATEGY 2: Fallback to heuristic matching when bible_words is empty
      // Uses cached Strong mappings for fast performance
      if (wordsWithStrong.length === 0) {
        try {
          // Get cached Strong word mappings (fast after first load)
          const defWordsToStrong = await getStrongWordMapping();

          // Get the chapter text to extract words
          const chapter = await getBookChapter(bookId.toLowerCase(), chapterInt);
          if (chapter && chapter.verses) {
            // Now match verse words against Strong definitions
            for (const verse of chapter.verses) {
              const verseWords = verse.text.toLowerCase()
                .split(/\s+/)
                .map((w: string) => w.replace(/[.,;:!?"'()]/g, '').trim())
                .filter((w: string) => w.length >= 3);

              for (const word of verseWords) {
                if (defWordsToStrong.has(word) && !verseWordsMap[verse.verse]?.includes(word)) {
                  if (!verseWordsMap[verse.verse]) {
                    verseWordsMap[verse.verse] = [];
                  }
                  verseWordsMap[verse.verse].push(word);
                }
              }
            }
          }
        } catch (fallbackError) {
          console.warn("Fallback Strong matching failed:", fallbackError);
          // Continue with empty result - don't crash
        }
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
  // Quota limits: Guest=2 total, Free=4 total (incl. guest), Gold=20/day, Premium=unlimited
  app.get("/api/strong/:number", async (req, res) => {
    const startTime = Date.now();
    try {
      const { number } = req.params;
      // Check both query param and header for deviceId (frontend may send via either)
      const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string) || undefined;
      const upperNumber = number.toUpperCase();
      
      // Strong quota limits (permanent for free tiers)
      const STRONG_GUEST_LIMIT = 2;      // 2 words total for guests
      const STRONG_FREE_LIMIT = 4;       // 4 words total for free users (incl. migrated guest)
      const STRONG_GOLD_DAILY_LIMIT = 20; // 20/day for Gold
      // Premium/Lifetime = unlimited
      
      let shouldIncrementQuota = true;
      let quotaInfo: { used: number; limit: number; type: 'guest' | 'free' | 'gold' | 'unlimited' } | null = null;
      
      // Check if authenticated user
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
          const user = await storage.getUser(decoded.userId);
          
          if (user) {
            const isAdmin = user.role === 'admin' || user.role === 'super_admin';
            const hasGold = await storage.hasActiveSubscription(decoded.userId, 'gold');
            const hasPremium = await storage.hasActiveSubscription(decoded.userId, 'premium');
            const hasLifetime = await storage.hasActiveSubscription(decoded.userId, 'strong_lifetime');
            const hasActiveBonus = await storage.hasActiveBonus(decoded.userId);
            
            // Premium, Lifetime, Bonus and Admin have unlimited access
            if (hasPremium || hasLifetime || hasActiveBonus || isAdmin) {
              shouldIncrementQuota = false;
              quotaInfo = { used: 0, limit: -1, type: 'unlimited' };
            } else if (hasGold) {
              // Gold users: 20 lookups per day
              const todayLookups = await storage.getTodayStrongLookups(decoded.userId);
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
              await storage.incrementStrongLookups(decoded.userId);
              shouldIncrementQuota = false;
            } else {
              // Free user: 4 total (permanent)
              const freeQuota = await storage.getFreeStrongQuota(decoded.userId);
              const used = freeQuota?.lookupsUsed || 0;
              
              if (used >= STRONG_FREE_LIMIT) {
                return res.status(429).json({
                  error: "Você usou suas 4 palavras Strong gratuitas. Assine Gold para 20 palavras/dia ou Premium para ilimitado.",
                  requiresSubscription: true,
                  subscriptionType: 'gold',
                  requiresLogin: false,
                  used: used,
                  limit: STRONG_FREE_LIMIT,
                });
              }
              quotaInfo = { used, limit: STRONG_FREE_LIMIT, type: 'free' };
              await storage.incrementFreeStrongQuota(decoded.userId);
              shouldIncrementQuota = false;
            }
          }
        } catch (tokenError) {
          // Invalid token, treat as guest
        }
      }
      
      // Guest user quota check
      if (shouldIncrementQuota) {
        if (deviceId) {
          const guestUsed = await storage.getGuestStrongQuota(deviceId);
          
          if (guestUsed >= STRONG_GUEST_LIMIT) {
            return res.status(429).json({
              error: "Você usou suas 2 palavras Strong gratuitas. Faça login para continuar (mais 2 palavras) ou assine para acesso completo.",
              requiresLogin: true,
              requiresSubscription: false,
              used: guestUsed,
              limit: STRONG_GUEST_LIMIT,
            });
          }
          quotaInfo = { used: guestUsed, limit: STRONG_GUEST_LIMIT, type: 'guest' };
          await storage.incrementGuestStrongQuota(deviceId);
        } else {
          // No deviceId provided - require login to proceed (prevents quota bypass)
          return res.status(400).json({
            error: "DeviceId necessário para acessar Strong. Recarregue a página ou faça login.",
            requiresLogin: true,
            requiresSubscription: false,
            used: 0,
            limit: STRONG_GUEST_LIMIT,
          });
        }
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
      
      if (!entry) {
        return res.status(404).json({ 
          error: "Entrada não encontrada",
          message: `Número Strong ${upperNumber} não encontrado`
        });
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
        language: entry.language,
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

  app.get("/api/strong/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const { book, chapter, verse, deviceId } = req.query as Record<string, string>;
      const lowerQuery = query.toLowerCase();
      
      // Strong lookup limit enforcement - tiered by plan
      const STRONG_FREE_DAILY_LIMIT = 3;
      const STRONG_GOLD_DAILY_LIMIT = 20;
      // Premium/Lifetime = unlimited
      
      let lookupInfo: { isLimited: boolean; remaining: number; total: number } | null = null;
      
      // Check if authenticated user
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
          const user = await storage.getUser(decoded.userId);
          
          if (user) {
            const isAdmin = user.role === 'admin' || user.role === 'super_admin';
            const trialActive = isTrialActive(user.trialStartDate);
            const hasGold = await storage.hasActiveSubscription(decoded.userId, 'gold');
            const hasPremium = await storage.hasActiveSubscription(decoded.userId, 'premium');
            const hasLifetime = await storage.hasActiveSubscription(decoded.userId, 'strong_lifetime');
            const hasActiveBonus = await storage.hasActiveBonus(decoded.userId);
            
            // Premium, Lifetime and Admin have unlimited access
            const hasUnlimitedAccess = hasPremium || hasLifetime || hasActiveBonus || isAdmin;
            // Gold and Trial have 20/day limit
            const hasGoldAccess = hasGold || trialActive;
            
            if (!hasUnlimitedAccess) {
              const todayStrongLookups = await storage.getTodayStrongLookups(decoded.userId);
              const dailyLimit = hasGoldAccess ? STRONG_GOLD_DAILY_LIMIT : STRONG_FREE_DAILY_LIMIT;
              
              if (todayStrongLookups >= dailyLimit) {
                const upgradeMsg = hasGoldAccess 
                  ? "Limite diário de 20 consultas Strong atingido. Assine Premium para acesso ilimitado, ou aguarde até amanhã."
                  : "Limite diário de 3 consultas Strong atingido. Assine Gold para 20 consultas/dia ou Premium para ilimitado.";
                return res.status(429).json({
                  error: upgradeMsg,
                  requiresSubscription: true,
                  subscriptionType: hasGoldAccess ? 'premium' : 'gold',
                  dailyLimit: dailyLimit,
                  usedToday: todayStrongLookups,
                  upgradeRequired: true
                });
              }
              
              lookupInfo = { isLimited: true, remaining: dailyLimit - todayStrongLookups - 1, total: dailyLimit };
              await storage.incrementStrongLookups(decoded.userId);
            }
          }
        } catch (tokenError) {
          // Invalid token, treat as guest
        }
      } else if (deviceId) {
        // Guest user - check guest trial and limits
        const guestTrialInfo = await storage.getGuestTrialInfo(deviceId);
        const guestTrialActive = guestTrialInfo?.active ?? true;
        
        // Guests with active trial get Gold-level access (20/day)
        const dailyLimit = guestTrialActive ? STRONG_GOLD_DAILY_LIMIT : STRONG_FREE_DAILY_LIMIT;
        const todayStrongLookups = await storage.getGuestTodayStrongLookups(deviceId);
        
        if (todayStrongLookups >= dailyLimit) {
          const upgradeMsg = guestTrialActive
            ? "Limite diário de 20 consultas Strong atingido. Aguarde até amanhã ou assine para acesso ilimitado."
            : "Limite diário de 3 consultas Strong atingido. Cadastre-se para continuar usando, ou aguarde até amanhã.";
          return res.status(429).json({
            error: upgradeMsg,
            requiresSubscription: true,
            dailyLimit: dailyLimit,
            usedToday: todayStrongLookups,
            upgradeRequired: true
          });
        }
        
        lookupInfo = { isLimited: true, remaining: dailyLimit - todayStrongLookups - 1, total: dailyLimit };
        await storage.incrementGuestStrongLookups(deviceId);
      }
      
      // STRATEGY 1: Try exact match from bible_words table (most accurate)
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
              return res.json({
                results: [{
                  number: e.strongNumber,
                  portugueseDefinition: e.portugueseDef || null,
                  word: e.lemma,
                  transliteration: e.translit || e.xlit || '',
                  pronunciation: e.pron || '',
                  definition: e.kjvDef || e.strongsDef || '',
                  language: e.language,
                }],
                total: 1,
                source: 'bible_words',
                exactMatch: true
              });
            }
          }
        }
      }
      
      // STRATEGY 2: Fallback to heuristic search in strong_entries
      const oldTestamentBooks = ['gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa', '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro', 'ecc', 'sng', 'isa', 'jer', 'lam', 'eze', 'dan', 'hos', 'joe', 'amo', 'oba', 'jon', 'mic', 'nah', 'hab', 'zep', 'hag', 'zec', 'mal'];
      const isOldTestament = oldTestamentBooks.includes(book?.toLowerCase() || '');
      const strongPrefix = isOldTestament ? 'H' : 'G';
      
      const allEntries = await db
        .select()
        .from(strongEntries)
        .limit(10000);
      
      const scored = allEntries
        .filter(e => e.strongNumber?.startsWith(strongPrefix))
        .map(e => {
          const ptDef = (e.portugueseDef || '').toLowerCase();
          const enDef = (e.kjvDef || '').toLowerCase();
          
          let score = 0;
          const wordRegex = new RegExp(`\\b${lowerQuery}\\b`);
          
          if (ptDef.startsWith(lowerQuery)) {
            score = 500;
          } else if (wordRegex.test(ptDef)) {
            score = 300;
          } else if (ptDef.includes(lowerQuery)) {
            const isProperNoun = /de um lugar|localidade|toponym|city|place|nome de/.test(ptDef);
            score = isProperNoun ? 10 : 100;
          } else if (wordRegex.test(enDef)) {
            score = 20;
          }
          
          return {
            number: e.strongNumber,
            portugueseDefinition: e.portugueseDef || null,
            word: e.lemma,
            transliteration: e.translit || e.xlit || '',
            pronunciation: e.pron || '',
            definition: e.kjvDef || e.strongsDef || '',
            language: e.language,
            _score: score,
          };
        })
        .filter(r => r._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 5);
      
      res.json({ 
        results: scored.map(({ _score, ...rest }) => rest),
        total: scored.length,
        source: 'heuristic',
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
        return res.status(404).json({ error: "Usuário não encontrado" });
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

  // Admin Bonuses - List active bonuses
  app.get("/api/admin/bonuses", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const activeBonuses = await storage.getActiveBonuses();
      res.json(activeBonuses);
    } catch (error) {
      console.error("Get bonuses error:", error);
      res.status(500).json({ error: "Erro ao buscar bônus" });
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

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}

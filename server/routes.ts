import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, ensureAdmin, ensureSuperAdmin, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "./auth";
import { sendPasswordResetEmail } from "./email";
import admin from "firebase-admin";
import crypto from "crypto";
import { askTheologicalQuestion } from "./openai";
import { insertUserSchema, insertSubscriptionSchema, insertBookmarkSchema, insertAnnotationSchema, insertAIHistorySchema, strongEntries, users, subscriptions, bonuses, bibleVersions, bibleVerses, userBiblePreferences, bibleWords } from "@shared/schema";
import { z } from "zod";
import { bibleBooks, getBookById } from "./bible-data/books";
import { getBookChapter } from "./bible-data/bible-index";
import { db } from "./db";
import { eq, or, like, sql, and } from "drizzle-orm";
import path from "path";
import fs from "fs";

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

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { deviceId, ...userData } = req.body;
      const validatedData = insertUserSchema.parse(userData);
      
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

      // Generate token
      const token = generateToken(user.id, user.email, user.role || 'user');

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
      const token = generateToken(user.id, user.email, user.role || 'user');
      const { password: _, ...userWithoutPassword } = user;
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
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

      // Generate reset token (valid for 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // Generate reset link
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
      
      // Send email with reset link
      const emailResult = await sendPasswordResetEmail(email, resetLink, user.name);

      res.json({ 
        message: emailResult.message,
        // For development: also include token so developers can test
        ...(process.env.NODE_ENV !== 'production' && { devToken: resetToken, devLink: resetLink })
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
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const trialActive = isTrialActive(user.trialStartDate);
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');

      res.json({
        hasPremium,
        hasGold,
        trialActive,
        userId: req.userId,
      });
    } catch (error) {
      console.error("Get subscription status error:", error);
      res.status(500).json({ error: "Erro ao buscar status de assinatura" });
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
      const { question, book, chapter, verse, mode = 'essential' } = req.body;

      // Validate input
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Pergunta é obrigatória" });
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

      // Essential/Professor mode requires trial, Gold, or Premium (admins bypass)
      if ((mode === 'essential' || mode === 'professor') && !trialActive && !hasGold && !hasPremium && !isAdmin) {
        return res.status(403).json({ 
          error: "Seu trial de 30 dias expirou. Assine um plano (Gold R$ 9,90/mês ou Premium R$ 19,90/mês) para continuar usando o Professor.",
          requiresSubscription: true,
          subscriptionType: 'gold'
        });
      }

      // Enforce rate limits BEFORE making OpenAI call (admins have no limit)
      const todayCount = await storage.getTodayUsageCount(req.userId!);
      const limit = isAdmin ? 999999 : (hasPremium ? 100 : (hasGold || trialActive) ? 30 : 0);

      if (todayCount >= limit && !isAdmin) {
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
      });

      // Only increment usage count after successful response
      await storage.incrementUsageCount(req.userId!);

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
      const { deviceId, eventType, eventData, userId } = req.body;
      
      if (!deviceId || !eventType) {
        return res.status(400).json({ error: "deviceId e eventType são obrigatórios" });
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
      const { deviceId, question, book, chapter, verse } = req.body;
      
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
  
  // Get all available versions
  app.get("/api/versions", async (req, res) => {
    try {
      const versions = await db.select().from(bibleVersions).where(eq(bibleVersions.isActive, true));
      res.json(versions);
    } catch (error) {
      console.error("Get versions error:", error);
      res.status(500).json({ error: "Erro ao buscar versões" });
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
    try {
      const { bookId, chapter: chapterNum } = req.params;
      const version = (req.query.version as string) || 'ACF';
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

      // Try to fetch from database first
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

      // If database has no verses for this version, fall back to hardcoded data
      if (!verses || verses.length === 0) {
        const fallbackChapterData = getBookChapter(bookId, chapterInt);
        if (!fallbackChapterData) {
          return res.status(404).json({ 
            error: "Capítulo não encontrado",
            message: `Nenhum dado disponível para ${book.name} ${chapterInt} na versão ${version}`
          });
        }
        
        // Return fallback data with version info
        res.json({ 
          book, 
          chapter: fallbackChapterData, 
          available: true, 
          version,
          source: 'fallback'
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
        source: 'database'
      });
    } catch (error) {
      console.error("Get chapter error:", error);
      res.status(500).json({ error: "Erro ao buscar capítulo" });
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

  // Strong's Dictionary routes (Database-driven)
  app.get("/api/strong/:number", async (req, res) => {
    try {
      const { number } = req.params;
      const upperNumber = number.toUpperCase();
      
      // Query database for Strong's entry
      const [entry] = await db
        .select()
        .from(strongEntries)
        .where(eq(strongEntries.strongNumber, upperNumber))
        .limit(1);
      
      if (!entry) {
        return res.status(404).json({ 
          error: "Entrada não encontrada",
          message: "Este número Strong ainda não está disponível no dicionário. Temos 60 termos principais no MVP."
        });
      }
      
      // Format response with ALL available fields for rich display
      res.json({
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
      });
    } catch (error) {
      console.error("Get Strong entry error:", error);
      res.status(500).json({ error: "Erro ao buscar entrada do dicionário" });
    }
  });

  app.get("/api/strong/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const { book, chapter, verse } = req.query as Record<string, string>;
      const lowerQuery = query.toLowerCase();
      
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
      const activeSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const recentUsers = allUsers.filter(u => new Date(u.createdAt) >= monthStart);

      const activeTrials = allUsers.filter(u => isTrialActive(u.trialStartDate)).length;
      const activeGold = activeSubscriptions.filter(s => s.planType === 'gold').length;
      const activePremium = activeSubscriptions.filter(s => s.planType === 'premium').length;
      const lifetimeStrong = activeSubscriptions.filter(s => s.planType === 'strong_lifetime').length;

      const monthlyRevenue = activeSubscriptions
        .filter(s => new Date(s.createdAt) >= monthStart)
        .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0)
        .toFixed(2);

      // Guest stats
      let totalGuests = 0;
      let activeGuestTrials = 0;
      let convertedGuests = 0;
      try {
        if (typeof storage.getGuestStats === 'function') {
          const guestStats = await storage.getGuestStats();
          totalGuests = guestStats.totalGuests || 0;
          activeGuestTrials = guestStats.guestsInTrial || 0;
          convertedGuests = guestStats.linkedToUsers || 0;
        }
      } catch (e) {
        console.warn('Erro ao buscar guest stats:', e);
      }

      res.json({
        totalUsers: totalCount,
        newUsersThisMonth: recentUsers.length,
        activeTrials,
        activeGoldSubscriptions: activeGold,
        activePremiumSubscriptions: activePremium,
        lifetimeStrong,
        estimatedMonthlyRevenue: monthlyRevenue,
        cancelledThisMonth: 0, // Would need subscription history
        totalGuests,
        activeGuestTrials,
        convertedGuests,
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
  
  // Get all study modules
  app.get("/api/study/modules", async (req, res) => {
    try {
      const modules = await storage.getStudyModules();
      
      // Get user/guest info for progress
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      // Add progress info to each module
      const modulesWithProgress = await Promise.all(modules.map(async (module) => {
        const progress = await storage.getModuleProgress(module.id, userId, deviceId);
        return { ...module, progress };
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
      const module = await storage.getStudyModuleById(id);
      
      if (!module) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }
      
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      const tracks = await storage.getModuleTracks(id);
      
      // Add lesson counts and progress to tracks
      const tracksWithDetails = await Promise.all(tracks.map(async (track) => {
        const lessons = await storage.getTrackLessons(track.id);
        const userProgress = await storage.getUserStudyProgress(userId, deviceId);
        const trackLessonIds = lessons.map(l => l.id);
        const completedLessons = userProgress.filter(p => 
          trackLessonIds.includes(p.lessonId) && p.completed
        ).length;
        
        return {
          ...track,
          totalLessons: lessons.length,
          completedLessons,
          percentage: lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0,
        };
      }));
      
      const overallProgress = await storage.getModuleProgress(id, userId, deviceId);
      
      res.json({ 
        module, 
        tracks: tracksWithDetails,
        progress: overallProgress,
      });
    } catch (error) {
      console.error("Get study module error:", error);
      res.status(500).json({ error: "Erro ao buscar módulo de estudo" });
    }
  });
  
  // Get track with lessons
  app.get("/api/study/tracks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lessons = await storage.getTrackLessons(id);
      
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      const userProgress = await storage.getUserStudyProgress(userId, deviceId);
      const lessonIds = lessons.map(l => l.id);
      
      const lessonsWithProgress = lessons.map(lesson => {
        const progress = userProgress.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          completed: progress?.completed || false,
          lastAccessAt: progress?.lastAccessAt || null,
        };
      });
      
      res.json({ lessons: lessonsWithProgress });
    } catch (error) {
      console.error("Get track lessons error:", error);
      res.status(500).json({ error: "Erro ao buscar lições da trilha" });
    }
  });
  
  // Get a specific lesson
  app.get("/api/study/lessons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lesson = await storage.getLessonById(id);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lição não encontrada" });
      }
      
      const userId = (req as any).userId || null;
      const deviceId = req.headers['x-device-id'] as string || null;
      
      // Mark as accessed
      if (userId || deviceId) {
        await storage.updateStudyProgress(userId, deviceId, id, false);
      }
      
      // Get progress info
      const userProgress = await storage.getUserStudyProgress(userId, deviceId);
      const progress = userProgress.find(p => p.lessonId === id);
      
      res.json({ 
        lesson,
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

  const httpServer = createServer(app);
  return httpServer;
}

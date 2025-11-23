import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, ensureAdmin, ensureSuperAdmin, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "./auth";
import crypto from "crypto";
import { askTheologicalQuestion } from "./openai";
import { insertUserSchema, insertSubscriptionSchema, insertBookmarkSchema, insertAnnotationSchema, insertAIHistorySchema, strongEntries, users, subscriptions, bonuses } from "@shared/schema";
import { z } from "zod";
import { bibleBooks, getBookById } from "./bible-data/books";
import { getBookChapter } from "./bible-data/bible-index";
import { db } from "./db";
import { eq, or, like, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const validatedData = insertUserSchema.parse(req.body);
      
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

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          error: "Email não cadastrado. Verifique o email ou crie uma nova conta.",
          errorType: "user_not_found"
        });
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: "Senha incorreta. Verifique e tente novamente.",
          errorType: "invalid_password"
        });
      }

      const token = generateToken(user.id, user.email, user.role || 'user');
      const { password: _, ...userWithoutPassword } = user;
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
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
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
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
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      // In development: Log and return token for testing
      // In production: Would send via email service
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Reset link for ${email}: ${resetLink}`);
        console.log(`[DEV] Reset token: ${resetToken}`);
      }

      // TODO: Implement email sending service (Nodemailer, SendGrid, etc.)
      // For now, return the reset link to frontend for development
      res.json({ 
        message: "Link de reset de senha gerado. Verifique o console ou use o link abaixo.",
        resetLink: resetLink,
        token: resetToken,
        // In development only, include token for direct testing
        ...(process.env.NODE_ENV !== 'production' && { devResetToken: resetToken })
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
      if (!currentUser?.isAdmin) {
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

      // Check trial or lifetime subscription
      const trialActive = isTrialActive(user.trialStartDate);
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'strong_lifetime');
      
      res.json({ 
        hasAccess: trialActive || hasLifetime,
        reason: trialActive ? 'trial' : hasLifetime ? 'subscription' : 'none',
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

      // Check trial (gives access to essential mode during 30 days)
      const trialActive = isTrialActive(user.trialStartDate);
      
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');

      let hasAccess = false;
      if (mode === 'essential') {
        // Trial grants access to essential mode
        hasAccess = trialActive || hasGold || hasPremium;
      } else if (mode === 'premium') {
        // Only premium subscription grants premium access
        hasAccess = hasPremium;
      }

      res.json({ 
        hasAccess,
        reason: trialActive ? 'trial' : hasPremium ? 'premium' : hasGold ? 'gold' : 'none'
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

      // Validate mode - only accept 'essential' or 'premium'
      if (mode !== 'essential' && mode !== 'premium') {
        return res.status(400).json({ error: "Modo inválido. Use 'essential' ou 'premium'." });
      }

      // Get user and check trial status
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const trialActive = isTrialActive(user.trialStartDate);
      
      // Check subscription status
      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium');

      // Enforce plan permissions BEFORE making OpenAI call
      if (mode === 'premium' && !hasPremium) {
        return res.status(403).json({ 
          error: "Acesso Premium necessário. Assine o plano Premium (R$ 29,90/mês) para acessar análises avançadas.",
          requiresSubscription: true,
          subscriptionType: 'premium'
        });
      }

      // Essential mode requires trial, Gold, or Premium
      if (mode === 'essential' && !trialActive && !hasGold && !hasPremium) {
        return res.status(403).json({ 
          error: "Seu trial de 30 dias expirou. Assine um plano (Gold R$ 19,90/mês ou Premium R$ 29,90/mês) para continuar usando o Professor.",
          requiresSubscription: true,
          subscriptionType: 'gold'
        });
      }

      // Enforce rate limits BEFORE making OpenAI call
      const todayCount = await storage.getTodayUsageCount(req.userId!);
      const limit = hasPremium ? 100 : (hasGold || trialActive) ? 30 : 0;

      if (todayCount >= limit) {
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

  app.get("/api/bible/:bookId/:chapter", async (req, res) => {
    try {
      const { bookId, chapter } = req.params;
      const book = getBookById(bookId);
      
      if (!book) {
        return res.status(404).json({ error: "Livro não encontrado" });
      }

      // Get chapter from centralized bible index (all 66 books)
      const chapterData = getBookChapter(bookId, parseInt(chapter));
      
      if (!chapterData) {
        return res.status(404).json({ 
          error: "Capítulo inválido",
          message: `O livro ${book.name} tem ${book.chapters} capítulos. Capítulo ${chapter} não existe.`
        });
      }
      
      res.json({ book, chapter: chapterData, available: true });
    } catch (error) {
      console.error("Get chapter error:", error);
      res.status(500).json({ error: "Erro ao buscar capítulo" });
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
      
      // Format response to match frontend expectations
      res.json({
        number: entry.strongNumber,
        word: entry.lemma,
        transliteration: entry.translit || entry.xlit || '',
        pronunciation: entry.pron || '',
        definition: entry.kjvDef || entry.strongsDef || '',
        portugueseDefinition: entry.portugueseDef || null, // NEW: Portuguese translation
        language: entry.language,
      });
    } catch (error) {
      console.error("Get Strong entry error:", error);
      res.status(500).json({ error: "Erro ao buscar entrada do dicionário" });
    }
  });

  app.get("/api/strong/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const lowerQuery = query.toLowerCase();
      
      // Search in database using Drizzle with proper LIKE syntax
      const results = await db
        .select()
        .from(strongEntries)
        .where(
          or(
            sql`LOWER(COALESCE(${strongEntries.portugueseDef}, '')) LIKE ${'%' + lowerQuery + '%'}`,
            sql`LOWER(COALESCE(${strongEntries.lemma}, '')) LIKE ${'%' + lowerQuery + '%'}`,
            sql`LOWER(COALESCE(${strongEntries.translit}, '')) LIKE ${'%' + lowerQuery + '%'}`,
            sql`LOWER(COALESCE(${strongEntries.kjvDef}, '')) LIKE ${'%' + lowerQuery + '%'}`
          )
        )
        .limit(50);
      
      // Format results to match frontend expectations
      const formattedResults = results.map(e => ({
        number: e.strongNumber,
        portugueseDefinition: e.portugueseDef || null,
        word: e.lemma,
        transliteration: e.translit || e.xlit || '',
        pronunciation: e.pron || '',
        definition: e.kjvDef || e.strongsDef || '',
        language: e.language,
      }));
      
      res.json({ results: formattedResults, total: formattedResults.length });
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
          amount: planType === 'gold' ? '19.90' : planType === 'premium' ? '29.90' : '189.90',
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
      const allUsers = await db.select().from(users);
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

      res.json({
        totalUsers: allUsers.length,
        newUsersThisMonth: recentUsers.length,
        activeTrials,
        activeGoldSubscriptions: activeGold,
        activePremiumSubscriptions: activePremium,
        lifetimeStrong,
        estimatedMonthlyRevenue: monthlyRevenue,
        cancelledThisMonth: 0, // Would need subscription history
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

  const httpServer = createServer(app);
  return httpServer;
}

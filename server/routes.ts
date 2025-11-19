import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "./auth";
import { askTheologicalQuestion } from "./openai";
import { insertUserSchema, insertSubscriptionSchema, insertBookmarkSchema, insertAnnotationSchema, insertAIHistorySchema, strongEntries } from "@shared/schema";
import { z } from "zod";
import { bibleBooks, getBookById } from "./bible-data/books";
import { getBookChapter } from "./bible-data/bible-index";
import { db } from "./db";
import { eq, or, like, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const token = generateToken(user.id, user.email);

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

      const token = generateToken(user.id, user.email);
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
      
      const hasEssential = await storage.hasActiveSubscription(req.userId!, 'ai_essential');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'ai_premium');

      let hasAccess = false;
      if (mode === 'essential') {
        // Trial grants access to essential mode
        hasAccess = trialActive || hasEssential || hasPremium;
      } else if (mode === 'premium') {
        // Only premium subscription grants premium access
        hasAccess = hasPremium;
      }

      res.json({ 
        hasAccess,
        reason: trialActive ? 'trial' : hasPremium ? 'premium' : hasEssential ? 'essential' : 'none'
      });
    } catch (error) {
      console.error("Check AI access error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso" });
    }
  });

  // AI Professor Teológico
  app.post("/api/ai/ask", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { question, book, chapter, verse, mode = 'essential' } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Pergunta é obrigatória" });
      }

      // Get user and check trial status
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const trialActive = isTrialActive(user.trialStartDate);
      
      // Check access
      const hasEssential = await storage.hasActiveSubscription(req.userId!, 'ai_essential');
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'ai_premium');

      if (mode === 'premium' && !hasPremium) {
        return res.status(403).json({ 
          error: "Acesso Premium necessário. Assine o plano IA Premium (R$ 49,90/mês) para acessar análises avançadas.",
          requiresSubscription: true,
          subscriptionType: 'ai_premium'
        });
      }

      // Trial grants access to essential mode
      if (mode === 'essential' && !trialActive && !hasEssential && !hasPremium) {
        return res.status(403).json({ 
          error: "Seu trial de 30 dias expirou. Assine um plano IA (Essencial R$ 19,90/mês ou Premium R$ 49,90/mês) para continuar usando o Professor Teológico.",
          requiresSubscription: true,
          subscriptionType: 'ai_essential'
        });
      }

      // Get AI response
      const response = await askTheologicalQuestion({
        question,
        verse,
        book,
        chapter,
        mode: mode as 'essential' | 'premium',
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

      res.json({ response });
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
  app.get("/api/strong/:number", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // Check if user has access to Strong's dictionary
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Check trial status and subscriptions
      const trialActive = isTrialActive(user.trialStartDate);
      const subscriptions = await storage.getUserSubscriptions(user.id);
      const hasStrongAccess = subscriptions.some(s => s.planType === 'strong_lifetime' && s.status === 'active');

      if (!trialActive && !hasStrongAccess) {
        return res.status(403).json({ 
          error: "Acesso negado",
          message: "Você precisa de uma assinatura Strong Vitalício (R$ 189,90) para acessar o dicionário de Hebraico e Grego.",
          requiresSubscription: true,
          subscriptionType: 'strong_lifetime'
        });
      }

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
      const searchQuery = `%${query.toLowerCase()}%`;
      
      // Search in database (lemma, transliteration, or definition)
      const results = await db
        .select()
        .from(strongEntries)
        .where(
          or(
            sql`LOWER(${strongEntries.lemma}) LIKE ${searchQuery}`,
            sql`LOWER(${strongEntries.translit}) LIKE ${searchQuery}`,
            sql`LOWER(${strongEntries.kjvDef}) LIKE ${searchQuery}`
          )
        )
        .limit(50);
      
      // Format results to match frontend expectations
      const formattedResults = results.map(e => ({
        number: e.strongNumber,
        portugueseDefinition: e.portugueseDef || null, // NEW: Portuguese translation
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

  const httpServer = createServer(app);
  return httpServer;
}

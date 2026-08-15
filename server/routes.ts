import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { subscriptions, strongEntries } from "@shared/schema";
import { STRONG_DATA } from "./strong-data-embedded";

// Shared helpers: plataforma, LRU cache Strong, Firebase Admin
import { initFirebaseAdmin } from "./routes/shared";

// Registradores de rotas por domínio
import { registerAuthRoutes }     from "./routes/auth";
import { registerBibleRoutes }    from "./routes/bible";
import { registerAiRoutes }       from "./routes/ai";
import { registerPaymentsRoutes } from "./routes/payments";
import { registerAdminRoutes }    from "./routes/admin";
import { registerStudyRoutes }    from "./routes/study";
import { registerLibraryRoutes }  from "./routes/library";

export async function registerRoutes(app: Express): Promise<Server> {
  // Inicializa Firebase Admin para login Google/Apple
  initFirebaseAdmin();

  // ── Cache control para arquivos estáticos (DEVE ser o primeiro middleware) ──
  app.use((req, res, next) => {
    const p = req.path;
    if (p === '/' || p === '/index.html' || p === '/manifest.json' || p === '/sw.js') {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('ETag', '');
    } else if (p.startsWith('/assets/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (p.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)) {
      res.set('Cache-Control', 'public, max-age=3600');
    }
    next();
  });

  // DEBUG: estado do Strong Data embutido
  app.get("/api/debug/strong-status", async (_req, res) => {
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
        database: { strongEntriesCount: Number(dbCount[0]?.count) || 0 },
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Internal bootstrap: garante que a conta do revisor existe com Premium ativo
  // Protegido por SESSION_SECRET para evitar abuso — idempotente.
  app.post("/api/internal/ensure-reviewer-premium", async (req, res) => {
    try {
      const token = req.header("x-bootstrap-token");
      if (!token || token !== process.env.SESSION_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const REVIEWER_EMAIL = process.env.REVIEWER_EMAIL ?? "reviewer@bibliainteligente.com";
      const REVIEWER_PASSWORD = process.env.REVIEWER_PASSWORD;
      const REVIEWER_NAME = process.env.REVIEWER_NAME ?? "Google Play Reviewer";
      if (!REVIEWER_PASSWORD) {
        console.error("[Bootstrap] REVIEWER_PASSWORD não configurado nos secrets do ambiente.");
        return res.status(500).json({ error: "REVIEWER_PASSWORD não configurado" });
      }
      let user = await storage.getUserByEmail(REVIEWER_EMAIL);
      if (!user) {
        const hashed = await hashPassword(REVIEWER_PASSWORD);
        user = await storage.createUser({
          email: REVIEWER_EMAIL, password: hashed, name: REVIEWER_NAME, preferredLanguage: "pt",
        } as any);
      }
      const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
      const hasActivePremium = existing.some(
        s => s.status === "active" && (s.planType === "premium" || s.planType === "strong_lifetime"),
      );
      if (!hasActivePremium) {
        await db.insert(subscriptions).values({
          userId: user.id, planType: "premium", status: "active", amount: "0.00",
          startDate: new Date(), endDate: new Date("2099-12-31T23:59:59Z"), source: "admin",
        });
      }
      return res.json({
        success: true, userId: user.id, email: user.email,
        premiumGranted: !hasActivePremium, message: "Reviewer account ready with active Premium.",
      });
    } catch (error: any) {
      console.error("Bootstrap reviewer error:", error);
      return res.status(500).json({ error: error?.message || "Internal error" });
    }
  });

  // ── Registra rotas por domínio ────────────────────────────────────────────
  registerAuthRoutes(app);     // /api/auth/*, /api/user/*, /api/bookmarks/*, /api/sync/*, /api/guest/*
  registerBibleRoutes(app);    // /api/bible/*, /api/reading-progress/*, /api/achievements/*
  registerAiRoutes(app);       // /api/subscriptions/*, /api/access/*, /api/ai/*, /api/strong/*
  registerPaymentsRoutes(app); // /api/iap/*, /api/coupons/*, /api/mp/*
  registerAdminRoutes(app);    // /api/admin/*, /api/debug/*, /api/cron/*, /api/telemetry/*
  registerStudyRoutes(app);    // /api/study/*, /api/reading-plans/*, /api/prayer/*, /api/sermons/*
  registerLibraryRoutes(app);  // /api/library/*, /api/admin/library/*

  const httpServer = createServer(app);
  return httpServer;
}

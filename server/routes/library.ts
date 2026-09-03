import type { Express } from "express";
import { db } from "../db";
import { eq, and, asc, sql } from "drizzle-orm";
import { ensureAuthenticated, ensureAdmin, optionalAuth, isTrialActive, type AuthRequest } from "../auth";
import { resolveLibraryAccess } from "../library-access";
import { storage } from "../storage";
import { getClientPlatform, getPlatformAllowedSources } from "./shared";
import {
  libraryBooks, libraryChapters, libraryReadingProgress,
  libraryHighlights, libraryPurchases,
} from "@shared/schema";

// ── Helpers ──────────────────────────────────────────────────────────────
const BOOK_LIBRARY_CATEGORIES = [
  "Devocionais", "Vida Cristã", "Ministério",
  "Estudo Bíblico e Teologia", "Família", "Clássicos",
] as const;

/**
 * Usa a mesma fonte canônica de entitlement do restante do app. Isso inclui
 * status válidos das lojas, expiração, origem permitida por plataforma,
 * bônus Premium e o período de degustação.
 */
async function getUserPlan(req: AuthRequest): Promise<string | null> {
  const userId = req.userId;
  if (!userId) return null;

  const allowedSources = getPlatformAllowedSources(getClientPlatform(req));
  const [hasLifetime, hasPremium] = await Promise.all([
    storage.hasActiveSubscription(userId, "strong_lifetime", allowedSources),
    storage.hasActiveSubscription(userId, "premium", allowedSources),
  ]);

  if (hasLifetime) return "strong_lifetime";
  if (hasPremium || isTrialActive(req.dbUser?.trialStartDate)) return "premium";
  return null;
}

/** Check if user purchased a book */
async function userHasPurchased(userId: string, bookId: string): Promise<boolean> {
  const rows = await db
    .select({ id: libraryPurchases.id })
    .from(libraryPurchases)
    .where(and(
      eq(libraryPurchases.userId, userId),
      eq(libraryPurchases.bookId, bookId),
      eq(libraryPurchases.status, "confirmed"),
    ))
    .limit(1);
  return rows.length > 0;
}

// ── Route registrar ───────────────────────────────────────────────────────
export function registerLibraryRoutes(app: Express): void {

  // ── GET /api/library/books ── public catalogue ──────────────────────────
  app.get("/api/library/books", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId ?? null;
      const userPlan = await getUserPlan(req);

      const books = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.publishStatus, "published"))
        .orderBy(asc(libraryBooks.category), asc(libraryBooks.createdAt));

      // Resolve per-book access
      const result = await Promise.all(books.map(async (b) => {
        const hasPurchased = userId ? await userHasPurchased(userId, b.id) : false;
        const accessState = resolveLibraryAccess({ userId, userPlan, hasPurchased, userRole: req.userRole ?? null });
        return { ...b, accessState };
      }));

      res.json(result);
    } catch (e) {
      console.error("[Library] GET books error:", e);
      res.status(500).json({ error: "Erro ao buscar livros" });
    }
  });

  // ── GET /api/library/books/:id ── single book detail ────────────────────
  app.get("/api/library/books/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId ?? null;
      const userPlan = await getUserPlan(req);

      const [book] = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.id, id))
        .limit(1);

      if (!book || book.publishStatus !== "published") {
        return res.status(404).json({ error: "Livro não encontrado" });
      }

      const hasPurchased = userId ? await userHasPurchased(userId, id) : false;
      const accessState = resolveLibraryAccess({ userId, userPlan, hasPurchased, userRole: req.userRole ?? null });

      // Reading progress
      let progress = null;
      if (userId) {
        const [p] = await db
          .select()
          .from(libraryReadingProgress)
          .where(and(
            eq(libraryReadingProgress.userId, userId),
            eq(libraryReadingProgress.bookId, id),
          ))
          .limit(1);
        progress = p ?? null;
      }

      res.json({ ...book, accessState, progress });
    } catch (e) {
      console.error("[Library] GET book detail error:", e);
      res.status(500).json({ error: "Erro ao buscar livro" });
    }
  });

  // ── GET /api/library/books/:id/chapters ── chapter list with access ──────
  app.get("/api/library/books/:id/chapters", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId ?? null;
      const userPlan = await getUserPlan(req);

      const [book] = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.id, id))
        .limit(1);

      if (!book || book.publishStatus !== "published") {
        return res.status(404).json({ error: "Livro não encontrado" });
      }

      const hasPurchased = userId ? await userHasPurchased(userId, id) : false;

      const chapters = await db
        .select({
          id: libraryChapters.id,
          bookId: libraryChapters.bookId,
          orderNum: libraryChapters.orderNum,
          title: libraryChapters.title,
          estimatedReadTime: libraryChapters.estimatedReadTime,
          isSample: libraryChapters.isSample,
        })
        .from(libraryChapters)
        .where(eq(libraryChapters.bookId, id))
        .orderBy(asc(libraryChapters.orderNum));

      const result = chapters.map((c) => {
        const access = resolveLibraryAccess({
          userId,
          userPlan,
          hasPurchased,
          chapterOrder: c.orderNum,
          chapterIsSample: c.isSample,
          userRole: req.userRole ?? null,
        });
        return { ...c, accessState: access };
      });

      res.json(result);
    } catch (e) {
      console.error("[Library] GET chapters error:", e);
      res.status(500).json({ error: "Erro ao buscar capítulos" });
    }
  });

  // ── GET /api/library/books/:id/chapters/:num ── chapter content ──────────
  app.get("/api/library/books/:id/chapters/:num", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id, num } = req.params;
      const orderNum = parseInt(num, 10);
      const userId = req.userId ?? null;
      const userPlan = await getUserPlan(req);

      const [book] = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.id, id))
        .limit(1);

      if (!book || book.publishStatus !== "published") {
        return res.status(404).json({ error: "Livro não encontrado" });
      }

      const hasPurchased = userId ? await userHasPurchased(userId, id) : false;

      const [chapter] = await db
        .select()
        .from(libraryChapters)
        .where(and(
          eq(libraryChapters.bookId, id),
          eq(libraryChapters.orderNum, orderNum),
        ))
        .limit(1);

      if (!chapter) return res.status(404).json({ error: "Capítulo não encontrado" });

      const access = resolveLibraryAccess({
        userId,
        userPlan,
        hasPurchased,
        chapterOrder: orderNum,
        chapterIsSample: chapter.isSample,
        userRole: req.userRole ?? null,
      });

      if (access === "locked") {
        return res.status(403).json({
          error: "Acesso bloqueado",
          locked: true,
          planRequired: "premium",
        });
      }

      // Total chapters count for nav
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(libraryChapters)
        .where(eq(libraryChapters.bookId, id));

      res.json({ ...chapter, totalChapters: total, accessState: access });
    } catch (e) {
      console.error("[Library] GET chapter content error:", e);
      res.status(500).json({ error: "Erro ao buscar capítulo" });
    }
  });

  // ── GET /api/library/progress/:bookId ── reading progress ───────────────
  app.get("/api/library/progress/:bookId", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;
      const userId = req.userId!;

      const [p] = await db
        .select()
        .from(libraryReadingProgress)
        .where(and(
          eq(libraryReadingProgress.userId, userId),
          eq(libraryReadingProgress.bookId, bookId),
        ))
        .limit(1);

      res.json(p ?? null);
    } catch (e) {
      res.status(500).json({ error: "Erro ao buscar progresso" });
    }
  });

  // ── POST /api/library/progress/:bookId ── save reading progress ──────────
  app.post("/api/library/progress/:bookId", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;
      const userId = req.userId!;
      const { currentChapter, scrollPosition, percentComplete } = req.body;

      // Upsert
      const [existing] = await db
        .select({ id: libraryReadingProgress.id })
        .from(libraryReadingProgress)
        .where(and(
          eq(libraryReadingProgress.userId, userId),
          eq(libraryReadingProgress.bookId, bookId),
        ))
        .limit(1);

      if (existing) {
        await db.update(libraryReadingProgress)
          .set({
            currentChapter,
            scrollPosition: scrollPosition ?? 0,
            percentComplete: percentComplete ?? 0,
            lastReadAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(libraryReadingProgress.id, existing.id));
      } else {
        await db.insert(libraryReadingProgress).values({
          userId,
          bookId,
          currentChapter: currentChapter ?? 1,
          scrollPosition: scrollPosition ?? 0,
          percentComplete: percentComplete ?? 0,
          lastReadAt: new Date(),
        });
      }

      res.json({ ok: true });
    } catch (e) {
      console.error("[Library] POST progress error:", e);
      res.status(500).json({ error: "Erro ao salvar progresso" });
    }
  });

  // ── GET /api/library/highlights ── all books (for unified caderno) ─────
  app.get("/api/library/highlights", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const rows = await db.execute(sql`
        SELECT
          h.id, h.book_id, h.chapter_id, h.selected_text, h.color, h.annotation,
          h.created_at, h.updated_at,
          b.title   AS book_title,
          c.order_num AS chapter_order_num,
          c.title   AS chapter_title
        FROM library_highlights h
        JOIN library_books    b ON b.id = h.book_id
        JOIN library_chapters c ON c.id = h.chapter_id
        WHERE h.user_id = ${userId}
        ORDER BY h.created_at DESC
      `);
      res.json(rows.rows);
    } catch (e) {
      console.error("[Library] GET all highlights error:", e);
      res.status(500).json({ error: "Erro ao buscar destaques" });
    }
  });

  // ── GET /api/library/highlights/:bookId ─────────────────────────────────
  app.get("/api/library/highlights/:bookId", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;
      const userId = req.userId!;
      const highlights = await db
        .select()
        .from(libraryHighlights)
        .where(and(
          eq(libraryHighlights.userId, userId),
          eq(libraryHighlights.bookId, bookId),
        ))
        .orderBy(asc(libraryHighlights.createdAt));
      res.json(highlights);
    } catch (e) {
      console.error("[Library] GET highlights by book error:", e);
      res.status(500).json({ error: "Erro ao buscar destaques" });
    }
  });

  // ── POST /api/library/highlights ────────────────────────────────────────
  app.post("/api/library/highlights", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { bookId, chapterId, selectedText, color, annotation } = req.body;

      if (!bookId || !chapterId || !selectedText) {
        return res.status(400).json({ error: "bookId, chapterId e selectedText são obrigatórios" });
      }

      const [h] = await db.insert(libraryHighlights).values({
        userId,
        bookId,
        chapterId,
        selectedText,
        color: color ?? "yellow",
        annotation: annotation ?? null,
      }).returning();

      res.json(h);
    } catch (e) {
      console.error("[Library] POST highlight error:", e);
      res.status(500).json({ error: "Erro ao salvar destaque" });
    }
  });

  // ── PATCH /api/library/highlights/:id ── update annotation/color ───────
  app.patch("/api/library/highlights/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { annotation, color } = req.body;

      const updates: Partial<{ annotation: string | null; color: string; updatedAt: Date }> = {
        updatedAt: new Date(),
      };
      if (annotation !== undefined) updates.annotation = annotation === "" ? null : annotation;
      if (color !== undefined) updates.color = color;

      const [updated] = await db.update(libraryHighlights)
        .set(updates)
        .where(and(eq(libraryHighlights.id, id), eq(libraryHighlights.userId, userId)))
        .returning();

      if (!updated) return res.status(404).json({ error: "Destaque não encontrado" });
      res.json(updated);
    } catch (e) {
      console.error("[Library] PATCH highlight error:", e);
      res.status(500).json({ error: "Erro ao atualizar destaque" });
    }
  });

  // ── DELETE /api/library/highlights/:id ──────────────────────────────────
  app.delete("/api/library/highlights/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await db.delete(libraryHighlights)
        .where(and(eq(libraryHighlights.id, id), eq(libraryHighlights.userId, userId)));
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao remover destaque" });
    }
  });

  // ── POST /api/library/purchase/:bookId ── create MP checkout ────────────
  app.post("/api/library/purchase/:bookId", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;
      const userId = req.userId!;

      const [book] = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.id, bookId))
        .limit(1);

      if (!book) return res.status(404).json({ error: "Livro não encontrado" });
      if (book.accessType !== "purchase") {
        return res.status(400).json({ error: "Este livro não é de compra avulsa" });
      }

      // Check if already purchased
      const already = await userHasPurchased(userId, bookId);
      if (already) return res.status(400).json({ error: "Livro já comprado" });

      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        return res.status(500).json({ error: "Pagamento não configurado" });
      }

      const { users } = await import("@shared/schema");
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      const priceNum = parseFloat(book.price ?? "0");
      const appUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",").find(d => d.endsWith(".replit.app")) ?? process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "https://localhost:5000";

      const mpBody = {
        items: [{
          id: book.id,
          title: book.title,
          description: `Bíblia Inteligente — ${book.title}`,
          quantity: 1,
          unit_price: priceNum,
          currency_id: "BRL",
        }],
        payer: user?.email ? { email: user.email } : undefined,
        external_reference: `library_${bookId}_${userId}`,
        back_urls: {
          success: `${appUrl}/pagamento/sucesso`,
          failure: `${appUrl}/pagamento/erro`,
          pending: `${appUrl}/pagamento/pendente`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/library/purchase/webhook`,
        metadata: { userId, bookId, productType: "library_book" },
      };

      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify(mpBody),
      });

      const mpData = await mpRes.json() as any;
      if (!mpRes.ok) {
        console.error("[Library] MP preference error:", mpData);
        return res.status(500).json({ error: "Erro ao criar preferência de pagamento" });
      }

      // Record pending purchase
      await db.insert(libraryPurchases).values({
        userId,
        bookId,
        amount: book.price ?? "0",
        paymentProvider: "mercadopago",
        externalPaymentId: mpData.id,
        status: "pending",
      });

      res.json({ checkoutUrl: mpData.init_point, preferenceId: mpData.id });
    } catch (e) {
      console.error("[Library] POST purchase error:", e);
      res.status(500).json({ error: "Erro ao criar compra" });
    }
  });

  // ── POST /api/library/purchase/webhook ── MP payment notification ────────
  app.post("/api/library/purchase/webhook", async (req, res) => {
    try {
      const { type, data } = req.body;
      if (type !== "payment" || !data?.id) return res.sendStatus(200);

      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) return res.sendStatus(200);

      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });
      const payment = await mpRes.json() as any;

      if (payment.status !== "approved") return res.sendStatus(200);

      const ref: string = payment.external_reference ?? "";
      if (!ref.startsWith("library_")) return res.sendStatus(200);

      const [, bookId, userId] = ref.split("_");
      if (!bookId || !userId) return res.sendStatus(200);

      // Update or create purchase as confirmed
      await db
        .update(libraryPurchases)
        .set({ status: "confirmed", paidAt: new Date(), updatedAt: new Date() })
        .where(and(
          eq(libraryPurchases.userId, userId),
          eq(libraryPurchases.bookId, bookId),
          eq(libraryPurchases.status, "pending"),
        ));

      console.log(`[Library] Book ${bookId} confirmed for user ${userId}`);
      res.sendStatus(200);
    } catch (e) {
      console.error("[Library] Webhook error:", e);
      res.sendStatus(200);
    }
  });

  // ── POST /api/library/purchase/:bookId/dev-confirm ── dev only ───────────
  app.post("/api/library/purchase/:bookId/dev-confirm", ensureAuthenticated, async (req: AuthRequest, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Não disponível em produção" });
    }
    try {
      const { bookId } = req.params;
      const userId = req.userId!;

      const [book] = await db.select().from(libraryBooks).where(eq(libraryBooks.id, bookId)).limit(1);
      if (!book) return res.status(404).json({ error: "Livro não encontrado" });

      // Upsert confirmed purchase
      const [existing] = await db
        .select({ id: libraryPurchases.id })
        .from(libraryPurchases)
        .where(and(eq(libraryPurchases.userId, userId), eq(libraryPurchases.bookId, bookId)))
        .limit(1);

      if (existing) {
        await db.update(libraryPurchases)
          .set({ status: "confirmed", paidAt: new Date(), updatedAt: new Date() })
          .where(eq(libraryPurchases.id, existing.id));
      } else {
        await db.insert(libraryPurchases).values({
          userId, bookId,
          amount: book.price ?? "0",
          paymentProvider: "dev",
          externalPaymentId: `dev_${Date.now()}`,
          status: "confirmed",
          paidAt: new Date(),
        });
      }

      res.json({ ok: true, message: "Compra confirmada (dev)" });
    } catch (e) {
      res.status(500).json({ error: "Erro ao confirmar compra dev" });
    }
  });

  // ══════════════════════════════════════════
  // ADMIN ROUTES
  // ══════════════════════════════════════════

  // ── GET /api/admin/library/books ─────────────────────────────────────────
  app.get("/api/admin/library/books", ensureAdmin, async (_req, res) => {
    try {
      const books = await db
        .select()
        .from(libraryBooks)
        .orderBy(asc(libraryBooks.category), asc(libraryBooks.createdAt));

      // Contagem de capítulos: total e com conteúdo
      const counts = await db
        .select({
          bookId: libraryChapters.bookId,
          total: sql<number>`count(*)::int`,
          filled: sql<number>`count(*) filter (where length(trim(${libraryChapters.content})) > 0)::int`,
        })
        .from(libraryChapters)
        .groupBy(libraryChapters.bookId);
      const countMap = new Map(counts.map(c => [c.bookId, c]));

      res.json(books.map(b => {
        const c = countMap.get(b.id);
        return {
          ...b,
          totalChapters: c?.total ?? 0,
          filledChapters: c?.filled ?? 0,
          emptyChapters: (c?.total ?? 0) - (c?.filled ?? 0),
        };
      }));
    } catch (e) {
      res.status(500).json({ error: "Erro ao listar livros" });
    }
  });

  // ── GET /api/admin/library/preview/:bookId ── book detail p/ pré-visualização
  app.get("/api/admin/library/preview/:bookId", ensureAdmin, async (req, res) => {
    try {
      const [book] = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.id, req.params.bookId))
        .limit(1);
      if (!book) return res.status(404).json({ error: "Livro não encontrado" });
      res.json(book);
    } catch (e) {
      res.status(500).json({ error: "Erro ao buscar livro" });
    }
  });

  // ── GET /api/admin/library/preview/:bookId/chapters/:num ── conteúdo p/ preview
  app.get("/api/admin/library/preview/:bookId/chapters/:num", ensureAdmin, async (req, res) => {
    try {
      const { bookId } = req.params;
      const orderNum = parseInt(req.params.num, 10);
      const [chapter] = await db
        .select()
        .from(libraryChapters)
        .where(and(
          eq(libraryChapters.bookId, bookId),
          eq(libraryChapters.orderNum, orderNum),
        ))
        .limit(1);
      if (!chapter) return res.status(404).json({ error: "Capítulo não encontrado" });

      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(libraryChapters)
        .where(eq(libraryChapters.bookId, bookId));

      res.json({ ...chapter, totalChapters: total, accessState: "unlocked" });
    } catch (e) {
      res.status(500).json({ error: "Erro ao buscar capítulo" });
    }
  });

  // ── POST /api/admin/library/books ────────────────────────────────────────
  app.post("/api/admin/library/books", ensureAdmin, async (req, res) => {
    try {
      const {
        title, subtitle, author, description, coverUrl, category,
        accessType, price, planRequired, estimatedReadTime, publishStatus, isNew,
      } = req.body;

      if (!title || !author || !category) {
        return res.status(400).json({ error: "title, author e category são obrigatórios" });
      }

      const { editionNote } = req.body;
      void accessType; void price; void planRequired; // modelo único: sempre Premium
      const [book] = await db.insert(libraryBooks).values({
        title, subtitle, author, description, coverUrl,
        category,
        accessType: "plan",
        price: null,
        planRequired: "premium",
        estimatedReadTime: estimatedReadTime ?? null,
        publishStatus: publishStatus ?? "draft",
        isNew: isNew ?? false,
        editionNote: editionNote ?? null,
      }).returning();

      res.json(book);
    } catch (e) {
      console.error("[Library Admin] POST book error:", e);
      res.status(500).json({ error: "Erro ao criar livro" });
    }
  });

  // ── PUT /api/admin/library/books/:id ─────────────────────────────────────
  app.put("/api/admin/library/books/:id", ensureAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates: any = { ...req.body, updatedAt: new Date() };
      delete updates.id;
      delete updates.createdAt;
      // Modelo único de acesso: todo livro é Premium — força os valores
      updates.accessType = "plan";
      updates.planRequired = "premium";
      updates.price = null;

      const [updated] = await db
        .update(libraryBooks)
        .set(updates)
        .where(eq(libraryBooks.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: "Livro não encontrado" });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Erro ao atualizar livro" });
    }
  });

  // ── DELETE /api/admin/library/books/:id ──────────────────────────────────
  app.delete("/api/admin/library/books/:id", ensureAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(libraryBooks).where(eq(libraryBooks.id, id));
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao excluir livro" });
    }
  });

  // ── GET /api/admin/library/chapters/:bookId ───────────────────────────────
  app.get("/api/admin/library/chapters/:bookId", ensureAdmin, async (req, res) => {
    try {
      const { bookId } = req.params;
      const chapters = await db
        .select()
        .from(libraryChapters)
        .where(eq(libraryChapters.bookId, bookId))
        .orderBy(asc(libraryChapters.orderNum));
      res.json(chapters);
    } catch (e) {
      res.status(500).json({ error: "Erro ao listar capítulos" });
    }
  });

  // ── POST /api/admin/library/chapters/:bookId ──────────────────────────────
  app.post("/api/admin/library/chapters/:bookId", ensureAdmin, async (req, res) => {
    try {
      const { bookId } = req.params;
      const { title, content, orderNum, estimatedReadTime, isSample } = req.body;

      if (!title) {
        return res.status(400).json({ error: "title é obrigatório" });
      }

      // Admin controls isSample freely; no forced rule
      const forcedSample = isSample ?? false;

      const [ch] = await db.insert(libraryChapters).values({
        bookId,
        orderNum: orderNum ?? 1,
        title,
        content: content ?? "",  // Stored as raw Markdown; empty string allowed for placeholder chapters
        estimatedReadTime: estimatedReadTime ?? null,
        isSample: forcedSample,
      }).returning();

      // Update chaptersCount on book
      await db.execute(sql`
        UPDATE library_books
        SET chapters_count = (SELECT COUNT(*) FROM library_chapters WHERE book_id = ${bookId}),
            updated_at = NOW()
        WHERE id = ${bookId}
      `);

      res.json(ch);
    } catch (e) {
      console.error("[Library Admin] POST chapter error:", e);
      res.status(500).json({ error: "Erro ao criar capítulo" });
    }
  });

  // ── PUT /api/admin/library/chapters/:bookId/:id ───────────────────────────
  app.put("/api/admin/library/chapters/:bookId/:id", ensureAdmin, async (req, res) => {
    try {
      const { id, bookId } = req.params;
      const updates: any = { ...req.body, updatedAt: new Date() };
      delete updates.id; delete updates.createdAt; delete updates.bookId;

      // isSample is set by admin freely — no forced rule

      const [updated] = await db
        .update(libraryChapters)
        .set(updates)
        .where(and(eq(libraryChapters.id, id), eq(libraryChapters.bookId, bookId)))
        .returning();

      if (!updated) return res.status(404).json({ error: "Capítulo não encontrado" });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Erro ao atualizar capítulo" });
    }
  });

  // ── PATCH /api/admin/library/chapters/:bookId/reorder ─────────────────────
  // body: { order: Array<{ id: string; orderNum: number }> }
  app.patch("/api/admin/library/chapters/:bookId/reorder", ensureAdmin, async (req, res) => {
    try {
      const { bookId } = req.params;
      const { order } = req.body as { order: Array<{ id: string; orderNum: number }> };
      if (!Array.isArray(order)) return res.status(400).json({ error: "order deve ser array" });

      // Update each chapter's orderNum in a transaction-like serial loop
      for (const { id, orderNum } of order) {
        await db
          .update(libraryChapters)
          .set({ orderNum, updatedAt: new Date() })
          .where(and(eq(libraryChapters.id, id), eq(libraryChapters.bookId, bookId)));
      }
      res.json({ ok: true });
    } catch (e) {
      console.error("[Library Admin] PATCH reorder error:", e);
      res.status(500).json({ error: "Erro ao reordenar capítulos" });
    }
  });

  // ── DELETE /api/admin/library/chapters/:bookId/:id ────────────────────────
  app.delete("/api/admin/library/chapters/:bookId/:id", ensureAdmin, async (req, res) => {
    try {
      const { id, bookId } = req.params;
      await db.delete(libraryChapters)
        .where(and(eq(libraryChapters.id, id), eq(libraryChapters.bookId, bookId)));

      // Update chaptersCount
      await db.execute(sql`
        UPDATE library_books
        SET chapters_count = (SELECT COUNT(*) FROM library_chapters WHERE book_id = ${bookId}),
            updated_at = NOW()
        WHERE id = ${bookId}
      `);

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao excluir capítulo" });
    }
  });
}

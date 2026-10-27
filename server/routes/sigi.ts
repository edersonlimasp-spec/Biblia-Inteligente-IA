/**
 * Módulo SIGI — emite um "ingresso" de uso único para abrir o SIGI já logado.
 *
 *   POST /api/sigi/ticket  (usuário logado)  ->  { url }
 *
 * O ingresso vale 2 minutos e é assinado com SIGI_SSO_SECRET (o mesmo valor
 * precisa estar nos Secrets do SIGI). Não envia nenhum dado de leitura,
 * assinatura ou pagamento — só id, e-mail e se o e-mail é confiável.
 * O SIGI decide o acesso pelas permissões cadastradas lá.
 */
import type { Express, Response } from "express";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "@shared/schema";
import { ensureAuthenticated, type AuthRequest } from "../auth";

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function registerSigiRoutes(app: Express) {
  app.post("/api/sigi/ticket", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    const secret = process.env.SIGI_SSO_SECRET;
    if (!secret || secret.length < 32) {
      return res.status(503).json({ error: "Módulo SIGI ainda não configurado" });
    }
    try {
      const user =
        req.dbUser ??
        (req.userId ? (await db.select().from(users).where(eq(users.id, req.userId)).limit(1))[0] : undefined);
      if (!user?.email) return res.status(401).json({ error: "Unauthorized", requiresLogin: true });

      const payload = {
        sub: user.id,
        email: user.email.trim().toLowerCase(),
        // Login Google/Apple (sem senha local) = e-mail confirmado pelo provedor
        ev: !!user.googleId || !user.password,
        exp: Math.floor(Date.now() / 1000) + 120,
        n: crypto.randomBytes(12).toString("hex"),
      };
      const body = b64url(JSON.stringify(payload));
      const sig = b64url(crypto.createHmac("sha256", secret).update(body).digest());
      const base = (process.env.SIGI_URL ?? "https://church-management-hub.replit.app").replace(/\/$/, "");
      return res.json({ url: `${base}/entrar-biblia#ticket=${body}.${sig}` });
    } catch (err) {
      console.error("[sigi] ticket error", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  });
}

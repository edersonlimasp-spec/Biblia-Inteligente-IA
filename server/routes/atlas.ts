import type { Express, Response } from "express";
import { optionalAuth, type AuthRequest } from "../auth";
import { hasAtlasFullAccess } from "../atlas/access";
import { AtlasError, atlasSummary, getAtlasItem, loadAtlasCatalog, readAtlasSvg } from "../atlas/catalog";

export function sendAtlasError(res: Response, error: unknown) {
  if (error instanceof AtlasError) {
    return res.status(error.status).json({
      error: error.message, code: error.code,
      ...(error.status === 403 ? { needsSubscription: true, requiresSubscription: true } : {}),
    });
  }
  console.error("Atlas error:", error);
  return res.status(500).json({ error: "Erro ao carregar o Atlas.", code: "ATLAS_UNAVAILABLE" });
}

export function registerAtlasRoutes(app: Express): void {
  app.use("/api/atlas", (_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Vary", "Authorization, Cookie, X-Client-Platform");
    next();
  });
  app.get("/api/atlas/catalog", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const fullAccess = await hasAtlasFullAccess(req);
      res.json({ items: (await loadAtlasCatalog()).map(item => atlasSummary(item, fullAccess)), fullAccess });
    } catch (error) { sendAtlasError(res, error); }
  });
  app.get("/api/atlas/items/:id", optionalAuth, async (req: AuthRequest, res) => {
    try { res.json(await getAtlasItem(req.params.id, await hasAtlasFullAccess(req))); }
    catch (error) { sendAtlasError(res, error); }
  });
  app.get("/api/atlas/items/:id/svg", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const svg = await readAtlasSvg(req.params.id, await hasAtlasFullAccess(req), typeof req.query.view === "string" ? req.query.view : undefined);
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.type("image/svg+xml").send(svg);
    } catch (error) { sendAtlasError(res, error); }
  });
}
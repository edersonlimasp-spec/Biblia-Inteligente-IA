import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { registerRoutes } from "./routes";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prevent transient errors (Neon DB outages, async failures in background jobs)
// from crashing the production server and causing white screens in the apps.
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ unhandledRejection (server still running):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ uncaughtException (server still running):', err);
});

// ========== ENVIRONMENT DIAGNOSTICS ==========
function logEnvironmentDiagnostics() {
  const diagnostics = {
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT || 'undefined',
    REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN || 'undefined',
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS || 'undefined',
    DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[MISSING]',
    PORT: process.env.PORT || '5000',
    BUILD_ID: 'runtime-check-below'
  };
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║             🔍 ENVIRONMENT DIAGNOSTICS                       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  Object.entries(diagnostics).forEach(([key, value]) => {
    console.log(`║  ${key.padEnd(22)} = ${String(value).slice(0, 35).padEnd(35)} ║`);
  });
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Try to load build-info.json
  try {
    const buildInfoPath = path.resolve(__dirname, '..', 'build-info.json');
    if (fs.existsSync(buildInfoPath)) {
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
      console.log(`📌 BUILD_ID: ${buildInfo.buildId}`);
      console.log(`📌 BUILD_TIMESTAMP: ${buildInfo.timestamp}`);
      console.log(`📌 BUILD_ENV: ${buildInfo.env}`);
    } else {
      console.log('📌 BUILD_ID: development (no build-info.json)');
    }
  } catch (e) {
    console.log('📌 BUILD_ID: error reading build-info.json');
  }
  console.log('');
}

// SYNC: Ensure frontend files are available for production serving
// This runs before Express starts, verifying files are in the right place
function ensureFrontendFilesReady() {
  if (process.env.NODE_ENV === "production") {
    const possibleLocations = [
      path.resolve(__dirname, "public"),                    // Primary: server/public
      path.resolve(__dirname, "..", "dist", "public"),     // Secondary: dist/public
      path.resolve(__dirname, "..", "client", "dist", "public"), // Tertiary: client/dist/public
    ];

    // Find where the files actually are
    let sourceDir: string | null = null;
    for (const location of possibleLocations) {
      if (fs.existsSync(location) && fs.readdirSync(location).length > 0) {
        sourceDir = location;
        log(`Found frontend files at: ${location}`, "sync");
        break;
      }
    }

    // If source found but it's not in server/public, copy it there
    if (sourceDir && sourceDir !== possibleLocations[0]) {
      const targetDir = possibleLocations[0];
      try {
        // Create target if doesn't exist
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Clear and copy files
        const existingFiles = fs.readdirSync(targetDir);
        for (const file of existingFiles) {
          const filePath = path.join(targetDir, file);
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }

        // Copy from source to target
        fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
        log(`Frontend files synced to server/public`, "sync");
      } catch (error: any) {
        log(`Warning: Could not sync frontend files: ${error.message}`, "sync");
        // Don't fail startup - server can still run
      }
    }

    // Verify final location has files
    const finalLocation = possibleLocations[0];
    if (!fs.existsSync(finalLocation) || fs.readdirSync(finalLocation).length === 0) {
      log(`Warning: No frontend files found in ${finalLocation}`, "sync");
    }
  }
}

const app = express();
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Only Capacitor WebViews need cross-origin API access. Browser requests are
// same-origin and must not receive reflective credentialed CORS headers.
const ALLOWED_MOBILE_ORIGINS = new Set([
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
]);
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    callback(null, Boolean(origin && ALLOWED_MOBILE_ORIGINS.has(origin)));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'x-device-id',
    'x-client-platform',
    'x-bootstrap-token',
  ],
  maxAge: 86400,
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
// Guarda do webhook RTDN ANTES do parser global de 50mb: token, rate limit e
// tamanho máximo são checados antes de qualquer parsing de corpo, evitando
// que chamadas não autenticadas consumam memória/CPU com payloads grandes.
const rtdnGuard = { windowStart: 0, count: 0 };
app.use('/api/iap/rtdn/google', (req, res, next) => {
  const nowMs = Date.now();
  if (nowMs - rtdnGuard.windowStart > 60_000) {
    rtdnGuard.windowStart = nowMs;
    rtdnGuard.count = 0;
  }
  if (++rtdnGuard.count > 120) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  const expectedToken = process.env.GOOGLE_RTDN_TOKEN;
  if (!expectedToken) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'RTDN not configured' });
    }
  } else if (req.query.token !== expectedToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const len = parseInt(String(req.headers['content-length'] || '0'), 10);
  if (!Number.isFinite(len) || len <= 0 || len > 64 * 1024) {
    return res.status(413).json({ error: 'Payload too large' });
  }
  next();
});

app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// CRITICAL: Set no-cache headers for index.html to prevent mobile caching issues
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || req.path.endsWith('.html')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
  }
  // Favicons & PWA icons: short cache so embedded/car browsers refresh quickly when we rename
  if (
    req.path === '/favicon.ico' ||
    req.path === '/favicon.png' ||
    req.path.startsWith('/favicon-') ||
    req.path.startsWith('/pwa-icons/')
  ) {
    res.set({
      'Cache-Control': 'no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
  }
  next();
});

// Serve static files from public folder (for .well-known, etc.)
app.use(express.static(path.join(process.cwd(), "public")));

// Explicit route for Digital Asset Links (Google Play domain verification)
app.get("/.well-known/assetlinks.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile(path.join(process.cwd(), "public", ".well-known", "assetlinks.json"));
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Log environment diagnostics on startup
  logEnvironmentDiagnostics();
  
  // Ensure frontend files are in correct location before starting server
  ensureFrontendFilesReady();

  // ── Rate limiting: camada adicional de proteção por IP ──────────────────
  // Endpoints de autenticação: 10 tentativas por IP a cada 15 min (anti brute-force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // Endpoints de IA: 40 req/min por IP (camada adicional às quotas por usuário)
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Limite de requisições por minuto atingido. Aguarde um momento.' },
  });
  app.use('/api/ai/', aiLimiter);
  // ────────────────────────────────────────────────────────────────────────

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error with stack so it's still visible, but DO NOT re-throw:
    // re-throwing here turns every route error into an uncaughtException, which
    // would kill the process (or, with our safety handler, mask real bugs).
    console.error('[express error]', status, message, err?.stack || err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);

    // Initialize database AFTER server is listening, so port opens immediately.
    // This prevents transient Neon errors (Control plane request failed) from
    // blocking deployment health checks and causing white screens in production.
    initializeDatabase()
      .then(() => log('✅ Database initialization completed'))
      .catch((err) => {
        console.error('❌ Database initialization failed (server still running):', err);
      });

    // Re-verify Google renewals, then mark expired subscriptions — on startup and every 6 hours.
    // Order matters: refreshing first prevents auto-renewed Google subscriptions
    // from being wrongly marked expired when only the old endDate is stored.
    const runMarkExpired = () => {
      Promise.all([
        import('./payments/google').then(({ refreshGoogleSubscriptions }) => refreshGoogleSubscriptions()),
        import('./payments/apple').then(({ refreshAppleSubscriptions }) => refreshAppleSubscriptions()),
      ])
        .then(([google, apple]) => {
          const failures = google.failed + apple.failed;
          if (failures > 0) {
            // Falhas transitórias de verificação: não expire ninguém neste
            // ciclo — o assinante pode já ter renovado na loja.
            console.warn(`⚠️ ${failures} verificação(ões) de renovação falharam; expiração adiada para o próximo ciclo`);
            return 0;
          }
          return storage.markExpiredSubscriptions();
        })
        .then(count => { if (count > 0) log(`✅ ${count} assinatura(s) marcadas como expiradas`); })
        .catch(err => {
          // Se a rechecagem no Google falhar, NÃO rode o expirador neste ciclo:
          // expirar sem verificar revogaria assinantes renovados automaticamente.
          console.error('❌ Erro na varredura de assinaturas (expiração adiada para o próximo ciclo):', err);
        });
    };
    setTimeout(runMarkExpired, 5000); // 5s após iniciar
    setInterval(runMarkExpired, 6 * 60 * 60 * 1000); // a cada 6h
  });
})();

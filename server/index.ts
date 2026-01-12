import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CRITICAL: Set no-cache headers for index.html to prevent mobile caching issues
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || req.path.endsWith('.html')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
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

  // Initialize database with seed data if needed
  await initializeDatabase();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
  });
})();

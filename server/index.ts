import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SYNC: Ensure frontend files are available for production serving
// This runs before Express starts, synchronizing dist/public -> server/public if needed
function syncFrontendFiles() {
  if (process.env.NODE_ENV === "production") {
    const sourceDir = path.resolve(__dirname, "..", "dist", "public");
    const targetDir = path.resolve(__dirname, "public");

    if (fs.existsSync(sourceDir)) {
      try {
        // Create target if it doesn't exist
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Check if sync is needed (source has newer files)
        const sourceFiles = fs.readdirSync(sourceDir);
        if (sourceFiles.length > 0) {
          // Copy files from dist/public to server/public
          fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
          log(`Frontend files synced from dist/public to server/public`, "sync");
        }
      } catch (error: any) {
        log(`Warning: Could not sync frontend files: ${error.message}`, "sync");
        // Don't fail startup - this may happen in some environments
      }
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
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

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
  // Sync frontend files before initializing anything
  syncFrontendFiles();

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

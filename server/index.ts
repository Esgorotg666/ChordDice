import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      
      // Only log response body for non-sensitive endpoints and error responses
      if (capturedJsonResponse && res.statusCode >= 400) {
        // For errors, only log the message field to avoid sensitive data exposure
        const safeResponse = capturedJsonResponse.message ? { message: capturedJsonResponse.message } : {};
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
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
    // Production static serving fix: serve from dist/public (actual build output)
    // instead of server/public to fix SPA routing for published app
    const path = await import("path");
    const fs = await import("fs");
    
    const distPublicPath = path.resolve(process.cwd(), "dist/public");
    const serverPublicPath = path.resolve(import.meta.dirname, "public");
    
    // Use dist/public if it exists (actual build output), fallback to server/public
    const staticDir = fs.existsSync(distPublicPath) ? distPublicPath : serverPublicPath;
    
    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir));
      // SPA fallback: serve index.html for all unmatched routes
      app.use("*", (_req, res) => {
        res.sendFile(path.join(staticDir, "index.html"));
      });
    }
    
    // Keep original serveStatic as backup (will be no-op if we handled it above)
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

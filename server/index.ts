import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { validateEnv } from "./env";
import { createServer, type IncomingMessage, type ServerResponse, type RequestListener } from "http";

// Validate environment variables at startup
const env = validateEnv();

const app = express();
const httpServer = createServer(app);
const isVercel = !!env.VERCEL;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

const setupPromise = (async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Don't expose internal errors in production
    let message: string;
    if (env.NODE_ENV === "production" && status === 500) {
      message = "Internal Server Error";
    } else {
      message = err.message || "Internal Server Error";
    }
    
    // Log full error for debugging
    if (status === 500) {
      console.error("Unhandled server error:", err);
    }
    
    res.status(status).json({ message });
  });

  // only setup static assets in production when we control the filesystem
  if (process.env.NODE_ENV === "production" && !isVercel) {
    serveStatic(app);
  } else if (!isVercel) {
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }
})();

async function startServer() {
  await setupPromise;

  if (isVercel) return;

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = env.PORT;
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
}

startServer();

const vercelRequestListener: RequestListener = (req, res) => {
  app(req as unknown as Request, res as unknown as Response, (err?: unknown) => {
    if (err) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await setupPromise;
  return vercelRequestListener(req, res);
}

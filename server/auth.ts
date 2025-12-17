import type { Express, Request, RequestHandler } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { z } from "zod";
import { mongoUrl } from "./mongo";
import { createUser, findUserByEmail, findUserById, sanitizeUser } from "./users";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
// Basic in-memory throttle; replace with a shared store (e.g., Redis) in production multi-instance deployments.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function consumeLoginAttempt(key: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (record && record.resetAt <= now) {
    loginAttempts.delete(key);
  }

  const current = loginAttempts.get(key);
  if (current && current.count >= LOGIN_MAX_ATTEMPTS) {
    return false;
  }

  loginAttempts.set(key, {
    count: (current?.count ?? 0) + 1,
    resetAt: current?.resetAt ?? now + LOGIN_WINDOW_MS,
  });

  return true;
}

function hashPassword(password: string, salt?: string) {
  const safeSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, safeSalt, 64).toString("hex");
  return `${safeSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set for session authentication.");
  }

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl,
        collectionName: "sessions",
        stringify: false,
        ttl: SESSION_TTL / 1000,
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL,
      },
    })
  );
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const getSessionUserId = (req: Request) => req.session?.userId;

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/login", async (req, res) => {
    const clientKey = req.ip || "unknown";
    if (!consumeLoginAttempt(clientKey)) {
      return res.status(429).json({ message: "Too many login attempts. Please try again soon." });
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
    }

    const { email, password, firstName, lastName } = parsed.data;
    const existing = await findUserByEmail(email);

    if (existing) {
      if (!existing.passwordHash || !verifyPassword(password, existing.passwordHash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = existing.id;
      return res.json(sanitizeUser(existing)!);
    }

    const newUser = await createUser({
      email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      passwordHash: hashPassword(password),
    });
    req.session.userId = newUser.id;
    res.status(201).json(sanitizeUser(newUser)!);
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const user = await findUserById(req.session.userId!);
    if (!user) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session after missing user:", err);
        }
      });
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(sanitizeUser(user)!);
  });

  app.get("/api/login", (_req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session on logout:", err);
      }
      res.redirect("/");
    });
  });
}

import type { Express, Request, RequestHandler } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { mongoUrl, getCollection } from "./mongo";
import { getEnv } from "./env";
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
  profileImageUrl: z.string().url().max(500).optional(),
  verificationCode: z.string().length(6).optional(),
});

const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_ATTEMPTS,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

interface VerificationCode {
  _id: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

async function getVerificationCodeCollection() {
  const collection = await getCollection<VerificationCode>("verification_codes");
  // Ensure TTL index exists for auto-cleanup
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  return collection;
}

function generateVerificationCode() {
  return randomInt(100000, 1000000).toString();
}

export function hashPassword(password: string, salt?: string) {
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
  const env = getEnv();

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: env.SESSION_SECRET,
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
        secure: env.NODE_ENV === "production",
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
  app.post("/api/auth/send-code", loginLimiter, async (req, res) => {
    try {
      const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Valid email required" });
      }

      const email = parsed.data.email.toLowerCase();
      const existing = await findUserByEmail(email);

      if (existing) {
        return res.json({
          message: "Account already exists. You can sign in without a verification code.",
          alreadyExists: true,
        });
      }

      const code = generateVerificationCode();
      const collection = await getVerificationCodeCollection();
      
      await collection.updateOne(
        { _id: email },
        {
          $set: {
            _id: email,
            code,
            expiresAt: Date.now() + VERIFICATION_TTL_MS,
            attempts: 0,
          },
        },
        { upsert: true }
      );

      const logMessage = `Verification code requested for ${email}`;
      if (process.env.NODE_ENV !== "production") {
        console.log(`${logMessage}: ${code}`);
      } else {
        console.log(logMessage);
      }

      return res.json({
        message: "Verification code sent. Check the server logs or your email provider.",
        previewCode: process.env.NODE_ENV !== "production" ? code : undefined,
        expiresInMs: VERIFICATION_TTL_MS,
      });
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
    }

    const { email, password, firstName, lastName, profileImageUrl, verificationCode } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);

    if (existing) {
      if (!existing.passwordHash || !verifyPassword(password, existing.passwordHash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = existing.id;
      return res.json(sanitizeUser(existing)!);
    }

    if (!verificationCode) {
      return res.status(400).json({ message: "Verification code required to create an account." });
    }
    
    const collection = await getVerificationCodeCollection();
    const codeRecord = await collection.findOne({ _id: normalizedEmail });
    
    if (!codeRecord || codeRecord.expiresAt < Date.now()) {
      if (codeRecord) {
        await collection.deleteOne({ _id: normalizedEmail });
      }
      return res.status(400).json({ message: "Verification code expired or missing. Request a new one." });
    }
    if (codeRecord.code !== verificationCode) {
      const attempts = codeRecord.attempts + 1;
      if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
        await collection.deleteOne({ _id: normalizedEmail });
      } else {
        await collection.updateOne({ _id: normalizedEmail }, { $set: { attempts } });
      }
      return res.status(400).json({ message: "Invalid verification code. Please try again." });
    }
    
    await collection.deleteOne({ _id: normalizedEmail });

    const newUser = await createUser({
      email: normalizedEmail,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      profileImageUrl: profileImageUrl ?? null,
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

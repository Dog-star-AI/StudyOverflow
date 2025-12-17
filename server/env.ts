import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .url("MONGODB_URI must be a valid URL")
    .min(1, "MONGODB_URI is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters long for security")
    .describe("Generate with: openssl rand -hex 32"),
  MONGODB_DB: z.string().default("studyoverflow"),
  NODE_ENV: z
    .enum(["production", "development", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, "PORT must be between 1 and 65535")
    .default("5000"),
  VERCEL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment Variable Validation Failed:");
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        console.error(`  ${path}: ${err.message}`);
      });
      console.error(
        "\n📝 To fix, ensure these variables are set in your .env or environment:"
      );
      console.error("  - MONGODB_URI (required)");
      console.error("  - SESSION_SECRET (required, min 32 chars)");
      console.error("  - MONGODB_DB (optional, defaults to 'studyoverflow')");
      console.error("  - NODE_ENV (optional, defaults to 'development')");
      console.error("  - PORT (optional, defaults to 5000)");
      process.exit(1);
    }
    throw error;
  }
}

export function validateEnv() {
  const env = getEnv();
  console.log(`✅ Environment validated for ${env.NODE_ENV.toUpperCase()}`);
  if (env.NODE_ENV !== "production") {
    console.log(`🚀 Database: ${env.MONGODB_DB}`);
  }
  return env;
}

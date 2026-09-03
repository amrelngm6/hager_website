import { SessionOptions } from 'express-session';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();



// ---------------------------------------------------------------------------
// Schema — every env var the app needs, validated at startup.
// If any required var is missing the process exits with a clear message.
// ---------------------------------------------------------------------------
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3005),

  // MySQL pool
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DB_POOL_MAX: z.coerce.number().int().positive().default(20),

  // CORS / Socket
  // CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().url().default('http://localhost:8081'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
    .join('\n');

  console.error(
    `\n[Config] ❌  Missing or invalid environment variables:\n${formatted}\n` +
    `  → Check your .env file and compare against .env.example\n`,
  );
  process.exit(1);
}

/** Typed, validated configuration object. Import this everywhere instead of process.env. */
const config = parsed.data;

export default config;



export const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'mcpanel.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1_000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
};

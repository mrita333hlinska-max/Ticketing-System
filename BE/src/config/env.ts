/**
 * Environment configuration — the single source of truth for runtime settings
 * (PROJECT_RULES §2). Values are validated with Zod at startup so the process
 * fails fast on a missing/invalid variable instead of misbehaving later.
 *
 * No secrets live in code: everything comes from the environment (or a local,
 * gitignored `.env`, loaded here for developer convenience).
 */
import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required.'),

  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required.'),
  COOKIE_SECURE: booleanFromString.default('false'),

  APP_BASE_URL: z.string().url().default('http://localhost'),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: booleanFromString.default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('no-reply@ticketing.local'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
export type Env = typeof env;

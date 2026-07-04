/**
 * Database client — Postgres (Neon or local).
 *
 * Production: Neon serverless driver (HTTPS-based, works on Vercel edge)
 * Local dev:    same driver pointing at a local Postgres or Neon dev branch
 *
 * Why Neon serverless:
 *   - HTTPS-based — works in Vercel edge + serverless without connection pooling issues
 *   - 0.5 GB free tier
 *   - Postgres-compatible (full SQL, drizzle-orm works)
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not set. Add it to .env or Vercel env vars.");
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export type DB = ReturnType<typeof getDb>;
export { schema };

/**
 * Standard env vars every route may need. Reads from process.env (Vercel
 * automatically populates these from the dashboard).
 */
export interface Env {
  DATABASE_URL: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  GOOGLE_OAUTH_CLIENT_ID?: string;
  GOOGLE_OAUTH_CLIENT_SECRET?: string;
  GITHUB_OAUTH_CLIENT_ID?: string;
  GITHUB_OAUTH_CLIENT_SECRET?: string;
  REDIS_URL?: string;
  FRONTEND_URL: string;
  COOKIE_DOMAIN?: string;
  COOKIE_SECURE: string;
  ENVIRONMENT: string;
}

export function getEnv(): Env {
  const env = process.env;
  return {
    DATABASE_URL: env.DATABASE_URL ?? "",
    ENCRYPTION_KEY: env.ENCRYPTION_KEY ?? "",
    SESSION_SECRET: env.SESSION_SECRET ?? "",
    RESEND_API_KEY: env.RESEND_API_KEY,
    EMAIL_FROM: env.EMAIL_FROM,
    GOOGLE_OAUTH_CLIENT_ID: env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: env.GOOGLE_OAUTH_CLIENT_SECRET,
    GITHUB_OAUTH_CLIENT_ID: env.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: env.GITHUB_OAUTH_CLIENT_SECRET,
    REDIS_URL: env.REDIS_URL,
    FRONTEND_URL: env.FRONTEND_URL ?? "http://localhost:3001",
    COOKIE_DOMAIN: env.COOKIE_DOMAIN,
    COOKIE_SECURE: env.COOKIE_SECURE ?? "false",
    ENVIRONMENT: env.ENVIRONMENT ?? "development",
  };
}
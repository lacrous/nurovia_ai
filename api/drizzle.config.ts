/**
 * Drizzle ORM config — for `drizzle-kit push`, `drizzle-kit studio`, etc.
 *
 * Connection: reads DATABASE_URL from process.env.
 *
 * Usage:
 *   npm run db:push       # apply schema to DB (creates tables)
 *   npm run db:studio     # open GUI at https://local.drizzle.studio
 *   npm run db:generate   # generate migrations (rare — for prod migrations)
 */
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set.\n" +
      "  • locally:  set it in api/.env (copy from .env.example)\n" +
      "  • prod:     vercel env pull .env.local && npx drizzle-kit push\n"
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
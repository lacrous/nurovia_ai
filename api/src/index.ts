/**
 * Nurovia AI backend — Hono app on Vercel.
 *
 * Exports both:
 *   - `default app` for Vercel's Node serverless runtime (api/index.ts)
 *   - `app` for local dev (`tsx watch src/index.ts`)
 *
 * Routes:
 *   POST   /api/auth/signup
 *   POST   /api/auth/signin
 *   POST   /api/auth/signout
 *   GET    /api/auth/me
 *   POST   /api/auth/forgot
 *   POST   /api/auth/reset
 *   GET    /api/auth/verify
 *
 *   GET    /api/auth/oauth/google
 *   GET    /api/auth/oauth/google/callback
 *   GET    /api/auth/oauth/github
 *   GET    /api/auth/oauth/github/callback
 *
 *   GET    /api/auth/2fa/status
 *   POST   /api/auth/2fa/enroll
 *   POST   /api/auth/2fa/enable
 *   POST   /api/auth/2fa/verify
 *   POST   /api/auth/2fa/disable
 *
 *   GET    /api/chat/sessions
 *   POST   /api/chat/sessions
 *   PATCH  /api/chat/sessions/:id
 *   DELETE /api/chat/sessions/:id
 *   POST   /api/chat/sessions/clear
 *   GET    /api/chat/sessions/:id/messages
 *   POST   /api/chat/sessions/:id/messages
 *   PATCH  /api/chat/messages/:id
 *   DELETE /api/chat/messages/:id
 *
 *   POST   /api/chat/relay
 *
 *   GET    /api/keys
 *   POST   /api/keys
 *   DELETE /api/keys/:id
 *
 *   GET    /health
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import auth from "./routes/auth";
import chat from "./routes/chat";
import chatRelay from "./routes/chat-relay";
import keys from "./routes/keys";
import oauth from "./routes/oauth";
import totp from "./routes/totp";

const app = new Hono();

app.use("*", logger());

// CORS — allow the frontend origin
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.FRONTEND_URL || "http://localhost:3001",
        "https://nurovia.ai",
        "https://www.nurovia.ai",
        "https://*.vercel.app",
        "https://*.space.minimax.io",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
      ];
      if (!origin) return allowed[0]!;
      for (const a of allowed) {
        if (a.includes("*")) {
          const re = new RegExp("^" + a.replace(/\*/g, "[a-z0-9-]+") + "$");
          if (re.test(origin)) return origin;
        } else if (a === origin) return origin;
      }
      return null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

app.use(
  "*",
  secureHeaders({
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    referrerPolicy: "strict-origin-when-cross-origin",
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    xDnsPrefetchControl: "off",
  })
);

app.get("/health", (c) =>
  c.json({ ok: true, env: process.env.ENVIRONMENT || "development", ts: new Date().toISOString() })
);

app.route("/api/auth", auth);
app.route("/api/auth/oauth", oauth);
app.route("/api/auth/2fa", totp);
app.route("/api/chat", chat);
app.route("/api/chat/relay", chatRelay);
app.route("/api/keys", keys);

app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404));

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: { code: "INTERNAL", message: err.message || "Internal server error" } }, 500);
});

export default app;

// Local dev entry — run with `tsx src/index.ts`
if (process.env.NODE_ENV !== "production" && process.argv[1]?.endsWith("index.ts")) {
  const { serve } = await import("@hono/node-server");
  const port = Number(process.env.PORT) || 3001;
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`[api] listening on http://localhost:${info.port}`);
  });
}
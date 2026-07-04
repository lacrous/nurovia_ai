/**
 * Nurovia AI — production server.
 *
 * Single Node process that serves:
 *   /            → static frontend (web/dist/)
 *   /api/*       → backend (api/dist/index.js — the Hono app)
 *   /assets/*    → frontend assets
 *
 * Works on any host: Railway, Fly.io, Render, Hetzner, AWS App Runner,
 * Cloud Run, plain VPS. No vendor lock-in.
 *
 * Required env:
 *   DATABASE_URL    — postgres://...
 *   ENCRYPTION_KEY  — base64 32-byte key
 *   FRONTEND_URL    — https://yourdomain.com (for CORS)
 *   PORT            — defaults to 3000
 *
 * Optional env:
 *   COOKIE_SECURE   — "true" in prod
 *   RESEND_API_KEY  — for emails
 *   REDIS_URL       — for rate limiting
 *   GOOGLE_* / GITHUB_* — OAuth
 */
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const WEB_DIST = join(__dirname, "web", "dist");
const API_DIST = join(__dirname, "api", "dist", "src", "index.js");

// dynamically import compiled backend
const apiApp = (await import(API_DIST)).default;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico":  "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt":  "text/plain; charset=utf-8",
  ".xml":  "application/xml",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
};

async function serveFrontend(path) {
  // try exact match, then 404.html fallback for SPA routing
  const filePath = join(WEB_DIST, path);
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    return new Response(data, {
      headers: { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    // SPA fallback — serve index.html so React Router handles the route
    try {
      const data = await readFile(join(WEB_DIST, "index.html"));
      return new Response(data, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
      });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  }
}

const server = serve(
  {
    port: parseInt(process.env.PORT || "3000", 10),
    fetch: async (req) => {
      const url = new URL(req.url);

      // health check
      if (url.pathname === "/health") {
        return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // api → backend
      if (url.pathname.startsWith("/api/")) {
        return apiApp.fetch(req);
      }

      // static frontend
      return serveFrontend(url.pathname === "/" ? "index.html" : url.pathname);
    },
  },
  (info) => {
    console.log(`🚀 Nurovia AI listening on http://localhost:${info.port}`);
    console.log(`   health: http://localhost:${info.port}/health`);
    console.log(`   api:    http://localhost:${info.port}/api/*`);
    console.log(`   app:    http://localhost:${info.port}/`);
  }
);

// graceful shutdown for k8s / Docker
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`\n${sig} received, shutting down...`);
    server.close();
    process.exit(0);
  });
}
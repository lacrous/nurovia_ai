# Nurovia AI — Monorepo

> Multi-provider AI council chat. Frontend (web/) + Backend (api/) in one repo, deployed to Vercel.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

**[live demo](https://nurovia-ai.vercel.app)** · **[docs](./DEPLOY.md)** · **[issues](https://github.com/lacrous/nurovia_ai/issues)**

Nurovia AI is a real-time, multi-provider AI chat platform. Users add their own LLM API keys (BYOK) and the app queries them in parallel — a "council" of models votes on the answer.

This is a **monorepo** designed to deploy to **Vercel** as a single project:
- **`web/`** — Vite + React 19 frontend (static build)
- **`api/`** — Hono backend running as Vercel serverless functions
- **`vercel.json`** — routes config (frontend serves the app, `/api/*` goes to the backend)

---

## what this is

| layer | stack | runs on |
|---|---|---|
| frontend | Vite + React 19 + TypeScript + Tailwind | Vercel static hosting (CDN) |
| backend | Hono + Lucia + Drizzle ORM | Vercel Node serverless |
| database | Vercel Postgres (Neon) | serverless HTTP driver |
| rate limit | Upstash Redis | (optional, falls back to in-memory) |
| email | Resend | transactional (optional) |
| OAuth | Arctic (Google + GitHub) | optional |

**frontend** ↔ **backend**: the frontend calls `/api/*` (same origin, no CORS issues).

---

## quick start (local dev)

### 1. install dependencies

```bash
cd nurovia
npm install
```

### 2. set up the database

```bash
# create a free Neon Postgres database
# https://neon.tech → new project → copy the DATABASE_URL

# create api/.env
cat > api/.env <<EOF
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
ENCRYPTION_KEY=$(openssl rand -base64 32)
FRONTEND_URL=http://localhost:3001
COOKIE_SECURE=false
ENVIRONMENT=development
EOF

# apply schema to your DB
cd api
npm run db:push
```

### 3. start both servers

```bash
# from project root
npm run dev
```

this runs:
- web on `http://localhost:3001` (Vite dev server)
- api on `http://localhost:3001/api/*` (Hono server, picked up via Vite proxy)

### 4. open http://localhost:3001

- click "Sign up" → create an account
- click "Sign in with Google" / "Sign in with GitHub" (if you set OAuth secrets)
- go to Settings → API Keys → paste an OpenAI/Anthropic key
- start chatting

---

## deploy to Vercel

### 1. push to GitHub

```bash
git init
git add .
git commit -m "Initial Nurovia AI monorepo"
# create an empty repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/nurovia-ai.git
git branch -M main
git push -u origin main
```

### 2. import in Vercel

1. go to https://vercel.com → Add New Project
2. import your GitHub repo
3. framework preset: **Other** (we use our own `vercel.json`)
4. root directory: `./` (the monorepo root)
5. click Deploy

Vercel will:
- run `npm install --workspaces`
- run `cd web && npm run build` (from `vercel.json`)
- output to `web/dist` (the static frontend)
- detect `api/index.ts` as a serverless function

### 3. add a Postgres database

in Vercel dashboard → Storage → Create Database → Postgres (powered by Neon):
1. click "Create Database"
2. name it `nurovia-db`
3. region: pick one close to your users
4. click "Create"

Vercel automatically adds `DATABASE_URL` to your project env vars.

### 4. add the other env vars

Vercel dashboard → Settings → Environment Variables:

| name | value |
|---|---|
| `ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `FRONTEND_URL` | your Vercel URL (e.g. `https://nurovia-ai.vercel.app`) |
| `COOKIE_SECURE` | `true` (production) |
| `ENVIRONMENT` | `production` |
| `RESEND_API_KEY` | (optional) for password reset + email verification |
| `EMAIL_FROM` | (optional) `"Nurovia AI <noreply@yourdomain.com>"` |
| `GOOGLE_OAUTH_CLIENT_ID` | (optional) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | (optional) |
| `GITHUB_OAUTH_CLIENT_ID` | (optional) |
| `GITHUB_OAUTH_CLIENT_SECRET` | (optional) |
| `REDIS_URL` | (optional) Upstash Redis for production rate limiting |

### 5. apply the database schema

```bash
# locally, with the Vercel DATABASE_URL
cd api
DATABASE_URL="postgresql://..." npm run db:push

# or via Vercel CLI:
vercel env pull .env.local
npm run db:push
```

### 6. deploy

```bash
# Vercel auto-deploys on git push
git push

# or manual deploy:
vercel --prod
```

🎉 your app is now live at `https://nurovia-ai.vercel.app`.

---

## project structure

```
nurovia/
├── web/                          ← frontend (Vite + React)
│   ├── src/
│   │   ├── contexts/AuthContext.tsx   (calls /api/auth/*)
│   │   ├── pages/                     (chat, signup, dashboard, etc.)
│   │   ├── components/
│   │   ├── services/api.ts            (LLM streaming)
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── api/                          ← backend (Hono + serverless)
│   ├── src/
│   │   ├── index.ts                  (Hono app)
│   │   ├── db/
│   │   │   ├── schema.ts              (Drizzle, Postgres)
│   │   │   └── client.ts
│   │   ├── lib/
│   │   │   ├── password.ts            (PBKDF2)
│   │   │   ├── encryption.ts          (AES-256-GCM)
│   │   │   ├── tokens.ts
│   │   │   ├── rate-limit.ts          (Redis + memory fallback)
│   │   │   └── audit.ts
│   │   ├── services/
│   │   │   ├── auth.ts                (signup/signin/reset)
│   │   │   ├── email.ts              (Resend)
│   │   │   ├── oauth.ts               (Google + GitHub)
│   │   │   ├── totp.ts                (2FA)
│   │   │   ├── vault.ts               (encrypted API keys)
│   │   │   └── llm.ts                 (SSE relay to upstream)
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── oauth.ts
│   │   │   ├── totp.ts
│   │   │   ├── chat.ts
│   │   │   ├── chat-relay.ts
│   │   │   └── keys.ts
│   │   ├── middleware/auth.ts
│   │   └── types/lucia.d.ts
│   ├── tests/                          (11 unit tests)
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   └── index.ts                        (Vercel serverless entry)
│
├── vercel.json                       (Vercel build config)
├── package.json                      (workspaces root)
├── .env.example
├── README.md
└── DEPLOY.md                         (detailed deploy guide)
```

---

## architecture

```
Browser  ──https──▶  Vercel Edge
                      │
                      ├──▶ /api/*  ──▶  api/index.ts (Node serverless)
                      │                  │
                      │                  ├──▶ Vercel Postgres (Neon)
                      │                  ├──▶ Upstash Redis (rate limit)
                      │                  ├──▶ Resend (email)
                      │                  └──▶ Upstream LLM providers
                      │
                      └──▶ /* (everything else)  ──▶  web/dist (static)
```

**key design choices:**
- **httpOnly cookies** — session token never reaches JS, immune to XSS exfiltration
- **PBKDF2 + AES-256-GCM** — passwords and API keys encrypted at rest
- **rate limiting + lockout** — 3 signups/hr, 5 signins/15min, 10 failures → 15min lock
- **account linking** — OAuth email matches → auto-link to existing user
- **encrypted API key vault** — users store their LLM keys server-side, encrypted

---

## API reference

### auth

| method | path | body | response |
|---|---|---|---|
| `POST` | `/api/auth/signup` | `{ email, name, password }` | `201 { user }` + session cookie |
| `POST` | `/api/auth/signin` | `{ email, password }` | `200 { user, needs2fa }` + session cookie |
| `POST` | `/api/auth/signout` | — | `200 { ok: true }` |
| `GET`  | `/api/auth/me` | — | `200 { user }` |
| `POST` | `/api/auth/forgot` | `{ email }` | `200 { ok: true }` (always 200) |
| `POST` | `/api/auth/reset` | `{ token, password }` | `200 { ok: true }` |
| `GET`  | `/api/auth/verify?token=...` | — | `200 { ok: true }` |
| `GET`  | `/api/auth/oauth/google` | — | `302` to Google |
| `GET`  | `/api/auth/oauth/github` | — | `302` to GitHub |
| `POST` | `/api/auth/2fa/enroll` | — | `200 { secret, otpauthUrl }` |
| `POST` | `/api/auth/2fa/enable` | `{ code }` | `200 { backupCodes }` |

### chat sessions + messages

full CRUD replacing `localStorage[nurovia-ai-chat-sessions]`

### LLM relay (SSE)

```
POST /api/chat/relay
Content-Type: application/json
Cookie: nurovia_session=...

{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "messages": [{ "role": "user", "content": "hello" }]
}
```

returns `text/event-stream` with `token`, `usage`, `done` events.

### API key vault

CRUD for encrypted LLM provider keys per user.

---

## security

- **passwords** — PBKDF2-SHA-256, 100k iters, 16-byte salt
- **sessions** — Lucia-signed httpOnly + Secure + SameSite=Lax cookie, 30-day TTL
- **rate limiting** — 3 signups/hr, 5 signins/15min, 3 forgot/hr (per IP)
- **account lockout** — 10 failed signins → 15min lock
- **constant-time** password comparison
- **API keys** — AES-256-GCM at rest, never sent to client
- **CORS** — strict allowlist (your frontend origin only)
- **CSP, HSTS, X-Frame-Options** — set via `secureHeaders()` middleware

---

## testing

```bash
# all tests
npm test

# just frontend
cd web && npx vitest run

# just backend
cd api && npx vitest run
```

current coverage:
- backend: 11/11 unit tests (tokens, password, LLM events)
- frontend: 11/11 unit tests (SSE parsing, tool call extraction)

---

## what's next

once deployed, future work:

- [ ] council mode backend (parallel LLM calls + judge synthesis)
- [ ] server-side tools (run_python in Docker, web_search via SerpAPI)
- [ ] RAG over user docs (embeddings + pgvector)
- [ ] Stripe billing
- [ ] 2FA hardware key (WebAuthn)

---

## license

MIT
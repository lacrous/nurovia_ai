# Nurovia AI

> Autonomous coding intelligence that debates bugs across a council of LLMs before touching your code.

Nurovia AI is a real-time, multi-provider AI chat platform built for individual developers and small teams. It runs in the browser (BYOK — bring your own keys) and ships with native iOS/Android wrappers, PWA support, and a council mode where multiple models vote and a judge synthesizes the final answer.

---

## Table of contents

1. [What is Nurovia AI](#what-is-nurovia-ai)
2. [Features](#features)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Quick start](#quick-start)
6. [Configuration](#configuration)
7. [Supported LLM providers](#supported-llm-providers)
8. [Built-in tools](#built-in-tools)
9. [Architecture](#architecture)
10. [Theming](#theming)
11. [PWA & native wrappers](#pwa--native-wrappers)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Roadmap to backend](#roadmap-to-backend)
15. [Contributing](#contributing)
16. [License](#license)

---

## What is Nurovia AI

A single-page application that:

- Connects to **12 LLM providers** directly from the browser (BYOK)
- Runs a **council of models** in parallel and synthesizes the best answer
- Streams responses in real time (SSE / fetch streams)
- Provides **per-message tools** (run Python, web search, calculator, datetime)
- Stores sessions, memory facts, custom personas, slash commands, and docs in `localStorage`
- Ships as a PWA + iOS + Android wrapper (Capacitor)
- Has zero backend — fully functional with just an API key

**Tagline.** _"Show the bug to 5 models. Pick the best fix."_

**Target user.** Solo devs, indie hackers, security researchers, and small teams who want a fast, opinionated AI dev assistant without lock-in to a single vendor.

---

## Features

### Chat core
- **Streaming** responses (token-by-token) for OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, Qwen, Moonshot, NVIDIA NIM, Grok, Mistral, and any OpenAI-compatible endpoint
- **Council mode** — query N providers in parallel, see each vote, judge synthesizes final answer
- **Agent mode** — model can call tools (run Python, web search, calculate) mid-stream; tool calls show as collapsible cards with results
- **Inline citations** from web search
- **Inline diff view** when regenerating a response
- **Voice input** (Web Speech API) and **TTS playback** of assistant replies
- **Slash commands** (`/help`, `/clear`, `/python`, etc.) — fully extensible from Settings
- **Cross-session memory** — pin facts the council should always remember

### Provider & settings
- **12 providers** with real brand logos (SVG) and model detection
- **Per-provider advanced settings**: temperature, top-p, presence/frequency penalty, max tokens, reasoning effort, seed, JSON mode, custom headers, system prompt override, rotation, cooldown
- **Multi-test panel** — Ping / Light / Heavy / Tool probes per provider with latency histogram
- **Cost calculator** — per-call + 100/1k/10k msgs/day projections
- **Request inspector** with redacted body (key masked)

### UX
- **4-step onboarding** wizard
- **⌘K command palette** — fuzzy search across sessions
- **15 help articles** with instant search at `/help`
- **Animated empty states** with custom SVG illustrations
- **Toast system** with action buttons (8s undo on `Clear all chats`)
- **Keyboard shortcuts** — `⌘B` toggle sidebar, `⌘/` search, `⌘,` settings, `↑` edit last, `Enter` send
- **Starred sessions** filter
- **Drag-and-drop** session reordering
- **Share session URL** (encoded snapshot) + fork
- **ChatGPT import** (paste JSON export)
- **Autosave drafts** (in-progress input persisted)
- **Swipe gestures** on mobile

### Pages
- **Landing** (`/`) — Hero, Trust, Features, How, Pricing, FAQ, Footer
- **Sign In** (`/signin`) — split-panel
- **Sign Up** (`/signup`) — split-panel with password strength
- **Onboarding** (`/onboarding`) — 4-step wizard
- **Chat** (`/chat`) — main app
- **Dashboard** (`/dashboard`) — usage, sessions, agents
- **Docs** (`/docs`) — 3D-illustrated reference
- **About** (`/about`) — team, story, Orbit3D demo
- **Pricing** (`/pricing`) — 3 plans + comparison
- **Privacy** (`/privacy`) — tabbed (Overview / Data / Cookies / Contact)
- **Terms** (`/terms`) — tabbed (Service / Acceptable / IP / Liability / Changes)
- **Changelog** (`/changelog`) — versioned release notes
- **Status** (`/status`) — provider health + incidents
- **Admin** (`/admin`) — KPI cards, MRR line, donut, signup bars, provider health, top users
- **Help** (`/help`) — 15 articles, fuzzy search
- **Share** (`/share/:encoded`) — read-only shared session
- **404** (`*`) — animated not-found

### Mobile & PWA
- **Capacitor** iOS / Android wrappers
- **Haptics** integration (impact on key actions)
- **PWA install prompt** component
- **Service worker** v9 — network-only, no stale cache, force-reload on activate
- **Manifest** with `display: standalone`, theme color, maskable icons
- **Adaptive sidebar** — collapses to drawer on mobile with hamburger

### Accessibility & DX
- **Skip-link** to main content
- **`role="main"`** landmark
- **Focus ring** with custom outline
- **`prefers-reduced-motion`** — disables animations
- **High-contrast** mode support via `data-theme`
- **Lazy-loaded** routes, markdown, 3D libs
- **Code theme picker** (6 themes: VS Dark, Light, Dracula, GitHub, Nord, Solarized)
- **Light + dark + system** theme toggle
- **5 accent palettes** (gold, blue, emerald, purple, rose) + custom color picker

---

## Tech stack

| layer | choice | why |
|---|---|---|
| framework | **React 19** + **TypeScript** (strict) | type safety + concurrent features |
| build | **Vite 5** | sub-second HMR, ESM, Rollup chunks |
| styling | **Tailwind CSS 3** + custom `nu` palette | utility-first, design tokens via CSS vars |
| motion | **Framer Motion** | layout animations, gestures, AnimatePresence |
| 3D | **three.js** + **@react-three/fiber** (lazy) | avatar orb on landing / about |
| routing | **react-router v7** | nested routes, animated transitions |
| icons | **lucide-react** | tree-shakable, consistent stroke |
| auth | **Web Crypto** PBKDF2 + HMAC | password hash + signed session token |
| storage | `localStorage` (no backend) | BYOK design |
| tests | **Vitest** | 11 unit tests for stream parsing + extraction |
| PWA | custom **sw.js** v9 | network-only for same-origin, no cache |
| mobile | **Capacitor** | iOS + Android wrappers with haptics |

---

## Project structure

```
nurovia-ai/
├── public/
│   ├── sw.js                  service worker (v9, network-only)
│   ├── manifest.webmanifest   PWA manifest
│   ├── logo-icon.svg          brand mark
│   ├── logo-512.png           PWA icon
│   └── logos/                 real brand SVGs (12 providers)
├── resources/                 Capacitor native resources
├── scripts/
│   └── strip-three-preload.cjs  post-build script to drop <link rel="preload"> for three.js
├── src/
│   ├── App.tsx                landing page
│   ├── main.tsx               router + providers (Toast, Auth, ErrorBoundary, ThemeBootstrap)
│   ├── index.css              tailwind + theme CSS variables
│   ├── contexts/
│   │   └── AuthContext.tsx    PBKDF2 + HMAC session, useAuth()
│   ├── hooks/
│   │   └── useTheme.ts        light/dark/system + accent picker
│   ├── data/
│   │   ├── admin.ts           admin dashboard mock data
│   │   ├── customProviders.ts user-defined provider endpoints
│   │   ├── docs.ts            RAG over user-uploaded documents
│   │   ├── memory.ts          cross-session memory facts
│   │   ├── modelCapabilities.ts registry + heuristic detection
│   │   ├── personas.ts        built-in + custom personas
│   │   ├── providerAdvanced.ts per-provider sampling params + cost tracking
│   │   ├── providerHealth.ts  latency + success rate history
│   │   ├── slashCommands.ts   custom slash commands
│   │   └── workspaces.ts      multi-workspace switcher
│   ├── pages/
│   │   ├── Chat.tsx           main chat (2200+ lines, all the features)
│   │   ├── SignIn.tsx         split-panel
│   │   ├── SignUp.tsx         split-panel with password strength
│   │   ├── Dashboard.tsx      usage + session list
│   │   ├── Docs.tsx           reference
│   │   ├── About.tsx          team + Orbit3D
│   │   ├── Pricing.tsx        plans + comparison
│   │   ├── Privacy.tsx        tabbed
│   │   ├── Terms.tsx          tabbed
│   │   ├── Changelog.tsx      release notes
│   │   ├── Status.tsx         provider health
│   │   ├── Admin.tsx          admin dashboard
│   │   ├── Help.tsx           15 articles + fuzzy search
│   │   ├── Onboarding.tsx     4-step wizard
│   │   ├── Share.tsx          read-only shared session
│   │   └── NotFound.tsx       404
│   ├── services/
│   │   ├── api.ts             streamOpenAICompatible, streamAnthropic, extractToolCalls
│   │   ├── tools.ts           tool registry
│   │   └── tools/
│   │       ├── index.ts       run_python, web_search, calculate, current_datetime
│   │       └── python.ts      Pyodide loader
│   ├── components/
│   │   ├── Layout.tsx         navbar + footer + ErrorBoundary
│   │   ├── AnimatedBackground.tsx   canvas particles (with --accent-rgb safe fallback)
│   │   ├── Avatar3D.tsx       R3F scene (lazy)
│   │   ├── AvatarOrb.tsx      gold icosahedron
│   │   ├── CommandPalette.tsx ⌘K
│   │   ├── ErrorBoundary.tsx
│   │   ├── FileUpload.tsx     paperclip + drop zone + inline mode
│   │   ├── GlobalSettings.tsx
│   │   ├── Illustrations.tsx  AnimatedEmpty SVGs
│   │   ├── LazyMarkdown.tsx   lazy code/markdown chunk
│   │   ├── Markdown.tsx       react-markdown + syntax highlight
│   │   ├── PwaInstallPrompt.tsx
│   │   ├── SEO.tsx
│   │   ├── ShortcutsModal.tsx
│   │   ├── ThemeBootstrap.tsx applies accent on first paint
│   │   ├── ThemeToggle.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── apply/             ApplyDiffModal, ApplyPrModal
│   │   ├── agent/             AgentPlanPreview, AgentStepTracker, ToolCallCard
│   │   ├── settings/          AdvancedProviderCard, ProviderDetailSheet,
│   │   │                      ProviderIconTile, providerLogos
│   │   ├── chat/              ChatMessage, ChatInput, MessageList, ReactionBar, ...
│   │   ├── landing/           Hero, Trust, Features, How, Pricing, FAQ, Footer
│   │   ├── legal/             LegalLayout, LegalSection, PrivacyTabs, TermsTabs
│   │   └── ui/                Button, Input, Textarea, Card, Badge, Skeleton,
│   │                          Tooltip, Toast, ToastContext
├── tests/
│   └── api.test.ts            11 unit tests
├── capacitor.config.ts
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js         `gold` color uses `hsl(var(--accent-h) var(--accent-s) var(--accent-l) / <alpha-value>)`
├── tsconfig.json              strict mode on
├── vite.config.ts             manual chunks: react, three, markdown
├── vitest.config.ts
└── README.md
```

---

## Quick start

```bash
# clone
git clone <repo> nurovia-ai
cd nurovia-ai

# install
npm install

# dev (http://localhost:3001)
npm run dev

# build (type-check + production bundle to ./dist)
npm run build

# preview the production build locally
npm run preview

# run unit tests
npx vitest run
```

Requires **Node 18+** and **npm 9+**.

---

## Configuration

No `.env` file is needed for the BYOK flow. Users add their own API keys via the Settings modal (gear icon in the chat header). Keys are stored in `localStorage` under `nurovia-ai-provider-keys`.

### Custom providers

Add a custom OpenAI-compatible endpoint from **Settings → Providers → + Add custom**:

```ts
{
  id: "my-internal-llm",
  name: "Internal LLM Gateway",
  baseUrl: "https://llm.internal.company.com/v1",
  apiKey: "<user-supplied>",
  models: ["mixtral-8x22b", "qwen-72b"]
}
```

### Theme

`localStorage` keys:

| key | values | default |
|---|---|---|
| `nurovia-ai-theme` | `light` / `dark` / `system` | `system` |
| `nurovia-ai-accent` | `gold` / `blue` / `emerald` / `purple` / `rose` / `custom` | `gold` |
| `nurovia-ai-accent-custom-h/s/l` | HSL numbers | — |
| `nurovia-ai-code-theme` | `vsDark` / `github` / `dracula` / `nord` / `solarized` / `oneLight` | `vsDark` |
| `nurovia-ai-sidebar-collapsed` | `true` / `false` | `true` |
| `nurovia-ai-active-persona` | persona id | `default` |
| `nurovia-ai-council-mode` | `true` / `false` | `true` |
| `nurovia-ai-provider-keys` | JSON map | `{}` |

---

## Supported LLM providers

All providers are streamed directly from the browser. No backend required.

| provider | base URL | models | auth | notes |
|---|---|---|---|---|
| **OpenAI** | `https://api.openai.com/v1` | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o1-preview, o1-mini | Bearer | reasoning via `reasoning_effort` |
| **Anthropic** | `https://api.anthropic.com` | claude-3.5-sonnet, claude-3.5-haiku, claude-3-opus | `x-api-key` | extended thinking |
| **Google Gemini** | `https://generativelanguage.googleapis.com` | gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash-exp | `?key=` | system_instruction |
| **DeepSeek** | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-reasoner | Bearer | reasoning model |
| **OpenRouter** | `https://openrouter.ai/api/v1` | any model id | Bearer | meta-prompt headers |
| **Qwen** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-max, qwen-plus, qwen-turbo | Bearer | Alibaba |
| **Moonshot** | `https://api.moonshot.cn/v1` | moonshot-v1-128k, kimi-k2-0905-preview | Bearer | long context |
| **NVIDIA NIM** | `https://integrate.api.nvidia.com/v1` | any NIM catalog model | Bearer | free tier |
| **Grok** | `https://api.x.ai/v1` | grok-2, grok-2-mini, grok-beta | Bearer | xAI |
| **Mistral** | `https://api.mistral.ai/v1` | mistral-large, mistral-small, codestral | Bearer | open weights |
| **MiniMax** | `https://api.MiniMax.chat/v1` | placeholder | Bearer | _awaiting real endpoint_ |
| **Custom** | user-supplied | any | user | OpenAI-compatible |

Brand SVGs sourced from [simple-icons](https://simpleicons.org) + [lobe-icons](https://github.com/lobehub/lobe-icons) (MIT) and stored in `public/logos/`.

---

## Built-in tools

The agent can call these mid-stream. Tool calls show as collapsible cards in the chat UI.

| tool | description | implementation |
|---|---|---|
| `run_python` | Execute Python code in a sandboxed interpreter | Pyodide (in-browser WASM) |
| `web_search` | Search the public web, return top 5 results | DuckDuckGo HTML scrape |
| `calculate` | Evaluate a math expression | `Function()` with `Math.*` namespace mapping |
| `current_datetime` | Return current UTC time + ISO 8601 + timezone | `Intl.DateTimeFormat` |

Tools are registered on app boot in `src/services/tools/index.ts` and exposed to the model as a JSON-schema system-prompt block when **Agent mode** is enabled.

---

## Architecture

### data flow — single chat message

```
User types "why is my FastAPI returning 422"
  ↓
Chat.tsx → setInput → onSubmit
  ↓
buildPrompt(sessions, persona, memory, docs, customSystemPrompts)
  ↓
streamChat({ provider, model, messages, agentMode, advanced })
  ↓
fetch() to LLM with SSE
  ↓
parseSSE → tokens → onToken
  ↓
if agentMode: regex extract \`\`\`json {"tool":"...","arguments":{...}} \`\`\`
  ↓
if toolCall: executeTool() → tool_call event → ToolCallCard renders
  ↓
after stream ends: persist messages, usage, cost
```

### data flow — council mode (≥2 providers)

```
User message
  ↓
streamCouncil({ providers, messages })
  ↓
for each provider: streamChat() in parallel
  ↓
collect N streamed responses
  ↓
streamJudge({ prompt: synthesize(responses), provider: chair })
  ↓
final tokens → onToken
```

### storage

All state lives in `localStorage`:

| key | shape | size budget |
|---|---|---|
| `nurovia-ai-auth-db` | `{records: UserRecord[]}` (PBKDF2 hashes) | < 1 KB per user |
| `nurovia-ai-session-token` | `{userId, issuedAt, expiresAt, signature}` (HMAC-SHA256) | < 200 B |
| `nurovia-ai-chat-sessions` | `Session[]` (id, title, messages, updatedAt, starred) | < 1 MB typical |
| `nurovia-ai-provider-keys` | `{[providerId]: apiKey}` | < 4 KB |
| `nurovia-ai-advanced-providers` | `{[providerId]: {temperature, topP, ...}}` | < 4 KB |
| `nurovia-ai-memory` | `MemoryFact[]` | < 100 KB |
| `nurovia-ai-personas` | `Persona[]` | < 50 KB |
| `nurovia-ai-slash-commands` | `CustomSlashCommand[]` | < 50 KB |
| `nurovia-ai-docs` | `UserDoc[]` (chunked, keyword-indexed) | < 500 KB |
| `nurovia-ai-workspaces` | `Workspace[]` | < 10 KB |
| `nurovia-ai-custom-providers` | `CustomProvider[]` | < 10 KB |
| `nurovia-ai-theme`, `nurovia-ai-accent`, ... | misc UI prefs | < 5 KB |

A single user with active usage consumes ~2–3 MB of `localStorage`. Browsers cap at 5–10 MB per origin, so the budget is ~5 MB of free headroom.

### auth

- **Sign-up** — password is hashed with PBKDF2 (SHA-256, 100k iterations, 16-byte salt). Result stored in `nurovia-ai-auth-db`.
- **Sign-in** — re-derives hash with the stored salt, constant-time compare.
- **Session token** — `{userId.issuedAt.expiresAt}` is HMAC-SHA256-signed with `SESSION_SECRET` and stored in `localStorage`. 30-day TTL.
- **Limitation** — the secret is in the bundle, so this is a UX layer, not real security. **Will be replaced by httpOnly cookies + server-side auth in the next phase.**

---

## Theming

CSS variables defined in `src/index.css`:

```css
:root {
  --accent-h: 45;
  --accent-s: 65%;
  --accent-l: 52%;
  --accent: hsl(45 65% 52%);
  --accent-rgb: 212 175 55;
  --background: 40 33% 97%;
  --foreground: 220 22% 10%;
  --panel: 40 25% 94%;
  /* ... */
}
```

Tailwind config maps `gold` to `hsl(var(--accent-h) var(--accent-s) var(--accent-l) / <alpha-value>)` so `bg-gold/10` etc. work natively. Switching the `[data-accent]` attribute on `<html>` re-themes every component instantly.

5 built-in palettes + custom color picker via `data-accent-custom` attributes.

---

## PWA & native wrappers

### PWA

- `public/manifest.webmanifest` — name, icons, `display: standalone`, theme color matches accent
- `public/sw.js` v9 — network-only for same-origin, no caching, force-reloads every open tab on `activate` via `clients.claim() + clients.matchAll().navigate()`. Never intercepts LLM API hosts.
- `PwaInstallPrompt` component — auto-shows when `beforeinstallprompt` fires (skipped if user dismissed within 30 days)

### Capacitor (iOS / Android)

- `capacitor.config.ts` — `appId: ai.nurovia.app`, `appName: Nurovia AI`
- `resources/` — `icon.png` (1024×1024) + `splash.png` (2732×2732)
- Haptics integration in mobile-only flows

To regenerate native projects:
```bash
npx cap add ios
npx cap add android
npx cap sync
```

---

## Testing

```bash
npx vitest run
```

11 unit tests in `tests/api.test.ts` covering:

- SSE chunk parsing
- `extractToolCalls` regex (agent mode JSON blocks)
- `stripToolJson` (remove tool blocks from user-visible stream)
- `effectiveParams` merging
- Token counting

Manual QA flow: open `/chat`, type a message, switch providers, toggle council mode, send a Python request.

---

## Deployment

### static hosting (current)

```bash
npm run build
# upload ./dist to any static host:
#   - Cloudflare Pages
#   - Vercel (static)
#   - Netlify
#   - GitHub Pages
```

Service worker is at `/sw.js` and must be served from root with `Service-Worker-Allowed: /` header.

### CI/CD

Suggested GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy
on: [push]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: nurovia-ai
          directory: ./dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

## Roadmap to backend

The frontend is **BYOK-first**. To run a managed-keys model, you need a backend.

### minimal viable backend

- `POST /api/auth/signup` `/signin` `/signout` — Lucia + httpOnly cookies
- `GET/POST /api/sessions` `/api/messages` — replace localStorage
- `POST /api/chat` — SSE relay to upstream LLM with key from vault
- `GET/POST /api/keys` — encrypted API-key vault per user

### council backend

- `POST /api/council/start` — BullMQ fan-out (one job per provider)
- judge worker (waits for all N) → SSE merger → client
- server-side vote aggregation

### tools backend

- `POST /api/tools/run_python` — Docker sandbox or Pyodide-on-Node
- `POST /api/tools/web_search` — SerpAPI / Bing / Brave (avoid DDG scraping)
- rate-limit by user + plan

### RAG + embeddings

- chunking pipeline (overlap, semantic boundaries)
- embeddings via `text-embedding-3-small`
- vector store (Pinecone / Supabase / pgvector)
- hybrid search (BM25 + cosine)

### billing

- Stripe checkout + webhook
- plan enforcement (Pro / Team / Enterprise)
- usage meter + monthly invoice

### recommended stack (when you start)

| layer | pick |
|---|---|
| runtime | **Cloudflare Workers** (free tier, global) or Fly.io (long SSE) |
| framework | **Hono** (tiny, edge-friendly) |
| DB | **Postgres on Neon** (serverless, free tier) |
| ORM | **Drizzle** (edge-compatible, fast) |
| cache + queue | **Redis on Upstash** (BullMQ) |
| auth | **Lucia** (httpOnly cookies, CSRF) |
| validation | **Zod** |
| hosting | Cloudflare + Neon + Upstash → ~$0–25/mo at 1k users |

See `docs/backend-roadmap.md` (TBD) for the full design doc.

---

## Contributing

```bash
git clone <repo>
cd nurovia-ai
npm install
npm run dev
# open http://localhost:3001
git checkout -b feat/my-change
# ... make changes ...
npm run build    # ensure type-check passes
npx vitest run   # ensure tests pass
git commit -m "feat: ..."
git push origin feat/my-change
```

### conventions

- TypeScript strict mode. No `any` unless wrapping an external SDK.
- `import type { ... }` for type-only imports (verbatimModuleSyntax).
- Tailwind for all styling. No inline `style={}` except for dynamic CSS vars.
- File-level components < 300 lines. Split early.
- One `motion.*` per visual transition. No nested motion within motion.
- localStorage keys prefixed `nurovia-ai-`.
- `try/catch` around every `JSON.parse` + `localStorage.getItem`.
- Provide fallback UI for every `undefined` data shape (see `loadSessions` for the pattern).

### commit format

```
feat: add tool call inspector
fix: prevent crash on empty sessions
refactor: extract provider config to data/
docs: update README with deployment steps
test: add SSE parser unit tests
```

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Credits

- Brand SVGs — [simple-icons](https://simpleicons.org) (CC0) + [lobe-icons](https://github.com/lobehub/lobe-icons) (MIT)
- Icons — [lucide](https://lucide.dev) (ISC)
- 3D — [three.js](https://threejs.org) (MIT) + [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) (MIT)
- Code highlighting — [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) (MIT)
- Python in browser — [Pyodide](https://pyodide.org) (MPL-2.0)
- Markdown — [react-markdown](https://github.com/remarkjs/react-markdown) (MIT) + [remark-gfm](https://github.com/remarkjs/remark-gfm) (MIT)

---

**Nurovia AI** — built by Hassan El-Deghidy and the Nurovia team. © 2026.

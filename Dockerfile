# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────
# Nurovia AI — production Dockerfile (host-agnostic)
# ──────────────────────────────────────────────────────────────
#
# Builds both frontend + backend into one image.
# Works on: Railway, Fly.io, Render, AWS App Runner, Hetzner, DO.
#
# Image layout:
#   /app/web/dist/         ← static frontend (nginx serves it)
#   /app/api/dist/         ← compiled Node backend (Express-served)
#   /app/server.js         ← production server: serves frontend + /api/*
#
# Run: docker run -p 3000:3000 -e DATABASE_URL=... -e ENCRYPTION_KEY=... nurovia
# ──────────────────────────────────────────────────────────────

# ── stage 1: install all deps (with workspaces) ───────────────
FROM node:20-alpine AS deps
WORKDIR /app

# libc6-compat for sharp, etc.
RUN apk add --no-cache libc6-compat

# copy workspace manifests first (cache-friendly)
COPY package.json package-lock.json* ./
COPY web/package.json ./web/
COPY api/package.json ./api/

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

# ── stage 2: build frontend ──────────────────────────────────
FROM node:20-alpine AS web-build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web ./web
RUN npm --prefix web run build

# ── stage 3: build backend ───────────────────────────────────
FROM node:20-alpine AS api-build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY api ./api
RUN npm --prefix api run build

# ── stage 4: production runtime ──────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# install only production deps for api
COPY api/package.json ./api/
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules

# compiled backend
COPY --from=api-build /app/api/dist ./api/dist
COPY api/drizzle.config.ts ./api/
COPY api/src/db/schema.ts ./api/src/db/

# static frontend
COPY --from=web-build /app/web/dist ./web/dist

# production server that serves both
COPY server.js ./
COPY public ./public

# non-root user
RUN addgroup -S nurovia && adduser -S nurovia -G nurovia
USER nurovia

EXPOSE 3000

# healthcheck for k8s/Railway/Fly
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
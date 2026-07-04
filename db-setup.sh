#!/bin/bash
# Nurovia AI — DB setup helper.
#
# One-command path for: link your project, pull env, push schema.
#
# Usage:
#   ./db-setup.sh
#
# Pre-req: you've already deployed to Vercel at least once.
# Pre-req: you've created a Postgres DB in Vercel → Storage tab.

set -e

echo "🚀 Nurovia AI — DB setup"
echo ""

# 1. install workspace deps (safe to run multiple times)
if [ ! -d "node_modules" ] || [ ! -d "api/node_modules" ]; then
  echo "📦 installing workspace deps..."
  npm install --workspaces --include-workspace-root --no-audit --no-fund
fi

# 2. link to vercel project
echo ""
echo "🔗 linking to Vercel project (browser may open)..."
npx vercel link --yes

# 3. pull env vars
echo ""
echo "📥 pulling env vars to .env.local..."
npx vercel env pull .env.local

# 4. also create api/.env from .env.local (drizzle reads from cwd)
echo ""
echo "📋 copying env to api/.env..."
mkdir -p api
if [ -f .env.local ]; then
  cp .env.local api/.env
fi

# 5. apply schema
echo ""
echo "🗄️  applying database schema..."
cd api
npm run db:push

# 6. done
echo ""
echo "✅ DB schema applied!"
echo ""
echo "→ verify schema:  npm run db:studio  (opens https://local.drizzle.studio)"
echo "→ trigger redeploy: git commit --allow-empty -m \"trigger redeploy\" && git push"
echo "→ test signup:    open your Vercel URL → /signup"

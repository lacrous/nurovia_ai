#!/bin/bash
# Nurovia AI — first-time setup
#
# Run this once after cloning the repo to get a working dev environment.
# Requires: Node 20+, npm 10+, git
#
# Usage:
#   ./setup.sh

set -e

echo "🚀 Setting up Nurovia AI monorepo..."

# ---- 1. install root deps (concurrently) ----
echo ""
echo "📦 Installing root dev deps..."
npm install --no-audit --no-fund

# ---- 2. install workspace deps via npm workspaces ----
echo ""
echo "📦 Installing web/ + api/ workspace deps (handled by npm workspaces)..."

# ---- 3. create env file from example ----
if [ ! -f api/.env ]; then
  echo ""
  echo "🔧 Creating api/.env from .env.example..."
  cp api/.env.example api/.env
  echo ""
  echo "⚠️  Edit api/.env and fill in DATABASE_URL + ENCRYPTION_KEY before continuing."
  echo ""
  echo "   DATABASE_URL — get a free one from https://neon.tech"
  echo "   ENCRYPTION_KEY — run: openssl rand -base64 32"
  echo ""
  exit 1
fi

# ---- 4. apply schema ----
echo ""
read -p "Apply database schema now? (y/n) " answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  echo "🗄️  Pushing schema to database..."
  cd api && npm run db:push && cd ..
fi

# ---- 5. done ----
echo ""
echo "✅ Setup complete!"
echo ""
echo "→ start dev server: npm run dev"
echo "→ runs at: http://localhost:3001"
echo ""
echo "📖 for deploy: see DEPLOY.md"
echo "📖 for more info: see README.md"

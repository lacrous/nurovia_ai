#!/bin/bash
# Push Nurovia AI to GitHub (lacrous/nurovia_ai.git)
#
# Run this AFTER creating the empty repo on github.com.
#
# Usage:
#   ./push-to-github.sh

set -e

REPO_URL="https://github.com/lacrous/nurovia_ai.git"
DEFAULT_BRANCH="main"

echo "📤 Pushing to $REPO_URL on branch '$DEFAULT_BRANCH'..."

# init git if not already
if [ ! -d .git ]; then
  echo ""
  echo "📝 Initializing git..."
  git init
  git checkout -b "$DEFAULT_BRANCH" 2>/dev/null || git checkout "$DEFAULT_BRANCH"
  git config user.name "Nurovia" 2>/dev/null || true
  git config user.email "nurovia@nurovia.ai" 2>/dev/null || true
fi

# add remote if missing
if ! git remote get-url origin > /dev/null 2>&1; then
  echo "🔗 Adding remote origin..."
  git remote add origin "$REPO_URL"
fi

# stage everything
echo ""
echo "📂 Staging files..."
git add .

# status
echo ""
echo "📋 Files to be committed (first 30):"
git status --short | head -30
echo ""
TOTAL=$(git status --short | wc -l)
echo "  ... $TOTAL total changed files"
echo ""

# commit
echo "💾 Committing..."
git commit -m "feat: initial Nurovia AI monorepo — frontend + backend + auth" || echo "(nothing to commit)"

# push
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin "$DEFAULT_BRANCH" --force

echo ""
echo "✅ Done!"
echo ""
echo "→ repo: $REPO_URL"
echo "→ next: import in Vercel (https://vercel.com/new)"
echo "→ set environment variables (DATABASE_URL, ENCRYPTION_KEY, FRONTEND_URL, COOKIE_SECURE)"
echo "→ redeploy → your app is live"

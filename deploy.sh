#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/RhinoCan/MoneyTracker.git"
GH_BRANCH="gh-pages"
DIST_DIR="dist"

echo "==============================================="
echo "   MoneyTracker Ultra-Safe Deployment Script"
echo "==============================================="

### 1. Ensure we are inside a Git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Error: This directory is not a git repository."
  exit 1
fi

### 2. Ensure we are on MAIN
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "❌ You are on branch '$BRANCH' — you must be on 'main'."
  exit 1
fi
echo "✔ On main branch."

### 3. Warn if working tree is not clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "⚠️ Warning: You have uncommitted changes."
  echo "   They won't be deployed, but it's safer to commit first."
  read -p "Continue anyway? (y/N): " yn
  [[ $yn == [Yy]* ]] || exit 1
fi

### 4. Validate vite.config.js base
# Accepts: base: '/MoneyTracker/'   OR   base: "/MoneyTracker/"
# Ensure Vite base path is correctly set
if ! grep -q 'base: "/MoneyTracker/"' vite.config.ts && \
   ! grep -q "base: '/MoneyTracker/'" vite.config.ts; then
  echo "❌ Error: vite.config.ts does NOT contain the required base path:"
  echo "    base: '/MoneyTracker/',"
  echo "Please fix vite.config.ts before deploying."
  exit 1
fi

echo "✔ Correct base path found in vite.config.ts."

### 5. Install & build
echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building project..."
npm run build

### 6. Ensure dist/ exists
if [[ ! -d "$DIST_DIR" ]]; then
  echo "❌ Error: Build failed — dist/ folder not found."
  exit 1
fi
echo "✔ dist/ folder exists."

### 7. Confirm GitHub remote exists
if ! git ls-remote "$REPO_URL" &>/dev/null; then
  echo "❌ Error: Cannot reach GitHub repo: $REPO_URL"
  exit 1
fi
echo "✔ GitHub remote reachable."

echo "-----------------------------------------------"
echo "About to deploy the contents of dist/ → gh-pages"
echo "Repo: $REPO_URL"
echo "Branch: $GH_BRANCH"
echo "-----------------------------------------------"

read -p "Proceed with deployment? (y/N): " confirm
[[ $confirm == [Yy]* ]] || exit 1

### 8. Deploy using isolated git repo inside dist/
echo "🚀 Deploying..."

pushd "$DIST_DIR" >/dev/null

git init
git add -A
git commit -m "Deploy to GitHub Pages"

git branch -M main
git remote add origin "$REPO_URL"

# Force push main → gh-pages
git push -f origin main:$GH_BRANCH

popd >/dev/null

### 9. Cleanup
rm -rf "$DIST_DIR/.git"

echo "==============================================="
echo "🎉 Deployment completed successfully!"
echo "Your site should be live at:"
echo "    https://rhinocan.github.io/MoneyTracker/"
echo "==============================================="

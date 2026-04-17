#!/bin/bash
# deploy.sh — Build and deploy ama-listing-creator on VPS
# Usage: bash deploy.sh
# Each run backs up the previous build before deploying the new one.

set -e

APP_DIR="/opt/portal-system/apps/ama-listing-creator"
BACKUP_DIR="$APP_DIR/backups"

cd "$APP_DIR"

# ── 1. Backup current build ──────────────────────────────────────────────
CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "untagged")
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BACKUP_NAME="${CURRENT_TAG}-${CURRENT_COMMIT}"

if [ -d ".next/standalone" ]; then
  mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
  cp -r .next/standalone "$BACKUP_DIR/$BACKUP_NAME/"
  echo "✓ 已备份当前版本 → backups/$BACKUP_NAME"
else
  echo "  (没有找到旧构建，跳过备份)"
fi

# Keep only last 5 backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 5 ]; then
  ls -t "$BACKUP_DIR" | tail -n +6 | while read OLD; do
    rm -rf "$BACKUP_DIR/$OLD"
    echo "  已清理旧备份: $OLD"
  done
fi

# ── 2. Pull latest code ──────────────────────────────────────────────────
echo "── git pull ────────────────────────────────"
git pull

# ── 3. Install dependencies ──────────────────────────────────────────────
echo "── npm install ─────────────────────────────"
npm install

# ── 4. Build ─────────────────────────────────────────────────────────────
echo "── npm run build ───────────────────────────"
npm run build

# ── 5. Copy static assets into standalone bundle ─────────────────────────
# Next.js `output: "standalone"` does NOT copy .next/static or public.
# Without this step, HTML loads but CSS/JS chunks 404.
echo "── copying .next/static → .next/standalone/.next/static ──"
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
if [ -d public ]; then
  echo "── copying public/ → .next/standalone/public ──"
  cp -r public .next/standalone/public
fi

# NOTE: We no longer copy `data/` into `.next/standalone/data`. The systemd
# unit sets AMA_LISTING_DATA_ROOT to the project-level data directory, so the
# app reads/writes persistent data outside the standalone bundle that is
# rebuilt on every deploy.

# ── 6. Restart service ───────────────────────────────────────────────────
echo "── restarting service ──────────────────────"
sudo systemctl restart ama-listing.service

# ── 7. Health check ──────────────────────────────────────────────────────
sleep 3
HTML_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/apps/listing)
echo "ama-listing HTTP: ${HTML_CODE}"
echo "${HTML_CODE}" | grep -qE "^(200|302|307)$" || \
  { echo "ERROR: expected 200/302/307, got ${HTML_CODE}"; exit 1; }

HTML_BODY=$(curl -s http://127.0.0.1:3002/apps/listing)
ASSET=$(echo "$HTML_BODY" | grep -oE "/apps/listing/_next/static/[^\"]+\.(css|js)" | head -1)
if [ -z "$ASSET" ]; then
  ASSET=$(echo "$HTML_BODY" | grep -oE "/_next/static/[^\"]+\.(css|js)" | head -1)
fi
if [ -n "$ASSET" ]; then
  ASSET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3002${ASSET}")
  echo "static asset ${ASSET}: ${ASSET_CODE}"
  [ "$ASSET_CODE" = "200" ] || \
    { echo "ERROR: static asset ${ASSET} returned ${ASSET_CODE}"; exit 1; }
else
  echo "WARN: no /_next/static/* reference found in HTML — cannot verify static assets"
fi

NEW_TAG=$(git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD)
echo ""
echo "✅ 部署完成  →  $NEW_TAG"
echo "   备份目录：$BACKUP_DIR"
echo "   已保留备份数量：$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)"

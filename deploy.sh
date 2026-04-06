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

# ── 5. Copy data into standalone ─────────────────────────────────────────
echo "── copying data/ ───────────────────────────"
cp -r data .next/standalone/

# ── 6. Restart service ───────────────────────────────────────────────────
echo "── restarting service ──────────────────────"
sudo systemctl restart ama-listing.service

NEW_TAG=$(git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD)
echo ""
echo "✅ 部署完成  →  $NEW_TAG"
echo "   备份目录：$BACKUP_DIR"
echo "   已保留备份数量：$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)"

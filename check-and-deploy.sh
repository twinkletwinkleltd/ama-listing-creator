#!/bin/bash
# check-and-deploy.sh — 由 cron 每 5 分钟调用一次
# 检测远端是否有新提交，有则自动备份 + 部署

APP_DIR="/opt/portal-system/apps/ama-listing-creator"
LOG="$APP_DIR/deploy.log"

cd "$APP_DIR" || exit 1

# 拉取远端最新状态（不合并）
git fetch origin main --quiet 2>/dev/null

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0   # 没有新提交，退出
fi

echo "──────────────────────────────────────────" >> "$LOG"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检测到新提交，开始自动部署…" >> "$LOG"
echo "  旧: $LOCAL  →  新: $REMOTE" >> "$LOG"

bash "$APP_DIR/deploy.sh" >> "$LOG" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 自动部署完成" >> "$LOG"

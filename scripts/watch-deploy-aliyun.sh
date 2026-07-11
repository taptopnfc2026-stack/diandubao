#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v fswatch >/dev/null 2>&1; then
  echo "未安装 fswatch。可先执行：brew install fswatch"
  exit 1
fi

: "${WATCH_DEBOUNCE_SECONDS:=3}"

echo "开始监听本地改动，变更后自动部署。按 Ctrl+C 停止。"
echo "监听目录：src miniprogram server/thinkphp/application/api/controller"

fswatch -0 src miniprogram server/thinkphp/application/api/controller \
  --exclude '(^|/)\\.DS_Store$' \
  --exclude '(^|/)project\\.private\\.config\\.json$' \
  --exclude '(^|/)\\.cloudbase(/|$)' |
while IFS= read -r -d '' _; do
  sleep "$WATCH_DEBOUNCE_SECONDS"
  while IFS= read -r -d '' -t 0.2 _extra; do :; done
  echo "检测到改动，开始自动部署..."
  SKIP_TESTS=1 NO_BACKUP="${NO_BACKUP:-1}" "$ROOT_DIR/scripts/deploy-aliyun.sh" || {
    echo "自动部署失败，请检查上面的错误。"
  }
done

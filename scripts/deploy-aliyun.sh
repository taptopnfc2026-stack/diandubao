#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

: "${ALIYUN_HOST:?请先设置 ALIYUN_HOST，例如：export ALIYUN_HOST=你的服务器IP或域名}"
: "${ALIYUN_USER:=root}"
: "${ALIYUN_PORT:=22}"
: "${REMOTE_ROOT:=/www/wwwroot/diandu}"
: "${PHP_FPM_SERVICE:=php-fpm-72.service}"
: "${DEPLOY_CONTROLLERS:=1}"
: "${SKIP_TESTS:=0}"
: "${NO_BACKUP:=0}"

SSH_TARGET="${ALIYUN_USER}@${ALIYUN_HOST}"
SSH_OPTS=(-p "$ALIYUN_PORT")
RSYNC_SSH="ssh -p ${ALIYUN_PORT}"
STAMP="$(date +%Y%m%d_%H%M%S)"

echo "==> 本地验证"
if [[ "$SKIP_TESTS" != "1" ]]; then
  npm test
fi
npm run build:h5

echo "==> 检查服务器目录"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "test -d '$REMOTE_ROOT/public' && test -d '$REMOTE_ROOT/application/api/controller'"

if [[ "$NO_BACKUP" != "1" ]]; then
  echo "==> 服务器备份：$REMOTE_ROOT/backup/deploy_$STAMP"
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
    set -e
    backup='$REMOTE_ROOT/backup/deploy_$STAMP'
    mkdir -p \"\$backup\"
    cp -a '$REMOTE_ROOT/public' \"\$backup/public\"
    mkdir -p \"\$backup/controller\"
    cp -a '$REMOTE_ROOT/application/api/controller/AdminDashboard.php' \"\$backup/controller/AdminDashboard.php\" 2>/dev/null || true
    cp -a '$REMOTE_ROOT/application/api/controller/TenantAdmin.php' \"\$backup/controller/TenantAdmin.php\" 2>/dev/null || true
  "
fi

echo "==> 同步 H5/后台静态文件到 public"
rsync -az --exclude='uploads/' -e "$RSYNC_SSH" dist/ "$SSH_TARGET:$REMOTE_ROOT/public/"

if [[ "$DEPLOY_CONTROLLERS" == "1" ]]; then
  echo "==> 同步 ThinkPHP 控制器"
  rsync -az -e "$RSYNC_SSH" \
    server/thinkphp/application/api/controller/AdminDashboard.php \
    server/thinkphp/application/api/controller/TenantAdmin.php \
    "$SSH_TARGET:$REMOTE_ROOT/application/api/controller/"

  echo "==> 服务器 PHP 语法检查"
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
    set -e
    php -l '$REMOTE_ROOT/application/api/controller/AdminDashboard.php'
    php -l '$REMOTE_ROOT/application/api/controller/TenantAdmin.php'
  "

  echo "==> 重启 PHP-FPM"
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "systemctl restart '$PHP_FPM_SERVICE'"
fi

echo "==> 线上入口检查"
curl -fsSI "https://diandu.xiongmaoxiazai.com/" >/dev/null
curl -fsSI "https://diandu.xiongmaoxiazai.com/admin.html" >/dev/null
curl -fsSI "https://diandu.xiongmaoxiazai.com/saas.html" >/dev/null
curl -fsSI "https://diandu.xiongmaoxiazai.com/tenant.html" >/dev/null

echo "部署完成：$(date '+%Y-%m-%d %H:%M:%S')"

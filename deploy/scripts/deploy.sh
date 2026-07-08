# ================================================================
# WebChat 一键部署脚本
# 适用于裸机/VPS 环境，CentOS 7+ / Ubuntu 20.04+
# 用法:
#   chmod +x deploy.sh
#   sudo ./deploy.sh
# ================================================================
set -euo pipefail

# ---- 颜色 ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ---- 检测系统 ----
OS="$(uname -s)"
ARCH="$(uname -m)"
APP_DIR="/opt/webchat"
BACKEND_JAR="app.jar"

# ---- 前置检查 ----
[ "$EUID" -eq 0 ] || err "请以 root 身份运行（sudo ./deploy.sh）"
command -v curl  >/dev/null 2>&1 || apt-get install -y curl
command -v java  >/dev/null 2>&1 || warn "Java 未安装，将自动安装"

# ---- 1. 安装依赖 ----
log "安装系统依赖..."
if command -v apt-get &>/dev/null; then
    apt-get update -qq
    apt-get install -y -qq curl wget git nginx certbot python3-certbot-nginx openjdk-21-jre mysql-server mongodb-mongosh redis-server
elif command -v yum &>/dev/null; then
    yum install -y epel-release
    yum install -y curl wget git nginx certbot python3-certbot-nginx java-21-openjdk mysql-server mongodb-mongosh redis
fi

# ---- 2. 创建用户 ----
id -u webchat &>/dev/null || useradd -r -s /sbin/nologin -d "$APP_DIR" webchat

# ---- 3. 创建目录 ----
mkdir -p "$APP_DIR"/{logs,frontend/dist}
chown -R webchat:webchat "$APP_DIR"

# ---- 4. 启动数据库 ----
log "启动数据库服务..."
systemctl enable --now mysql  2>/dev/null || service mysql start  2>/dev/null || warn "MySQL 启动失败，请手动检查"
systemctl enable --now mongod 2>/dev/null || service mongod start 2>/dev/null || warn "MongoDB 启动失败，请手动检查"
systemctl enable --now redis  2>/dev/null || service redis start  2>/dev/null || warn "Redis 启动失败，请手动检查"

# ---- 5. 初始化 MySQL ----
log "初始化 MySQL 数据库..."
mysql -u root -e "
    CREATE DATABASE IF NOT EXISTS webchat DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ALTER USER 'root'@'localhost' IDENTIFIED BY 'webchat2026';
    FLUSH PRIVILEGES;
" 2>/dev/null || warn "MySQL 初始化失败，请手动执行 SQL"

# ---- 6. 下载/构建后端 ----
if [ -f "${APP_DIR}/${BACKEND_JAR}" ]; then
    log "后端 JAR 已存在，跳过构建"
else
    log "请手动将 app.jar 放置到 ${APP_DIR}/${BACKEND_JAR}"
    log "构建命令: cd webchat && mvn clean package -DskipTests && cp target/*.jar /opt/webchat/app.jar"
fi

# ---- 7. 安装 Systemd 服务 ----
log "安装 Systemd 服务..."
cp "$(dirname "$0")/../systemd/webchat.service" /etc/systemd/system/webchat.service
systemctl daemon-reload

# ---- 8. 部署 Nginx 配置 ----
log "部署 Nginx 配置..."
cp "$(dirname "$0")/../nginx/webchat.conf" /etc/nginx/sites-available/webchat.conf
ln -sf /etc/nginx/sites-available/webchat.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx || warn "Nginx 配置检查失败"

# ---- 9. 部署前端 ----
if [ -d "$APP_DIR/frontend/dist" ] && [ -n "$(ls -A "$APP_DIR/frontend/dist")" ]; then
    log "前端文件已存在"
else
    log "请将前端构建产物放到 ${APP_DIR}/frontend/dist/"
    log "构建命令: cd webchat/frontend && npm install && npm run build && cp -r dist/* /opt/webchat/frontend/dist/"
fi

# ---- 10. 启动后端 ----
log "启动后端服务..."
systemctl enable --now webchat || warn "后端启动失败，请 journalctl -u webchat 查看日志"

# ---- 完成 ----
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WebChat 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  前端地址:   http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "  API 地址:   http://localhost:8080"
echo ""
echo "  管理命令:"
echo "    systemctl status webchat    # 查看后端状态"
echo "    journalctl -u webchat -f    # 实时查看日志"
echo "    systemctl restart webchat   # 重启后端"
echo ""
echo "  配置 HTTPS: sudo certbot --nginx -d chat.yourdomain.com"
echo ""

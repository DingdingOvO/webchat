#!/bin/bash
# WebChat 生产启动脚本（单端口 3000）
#
# 用法：
#   ./scripts/run_prod.sh
#
# 前置：先执行 `make build-all` 产出后端 JAR 与前端 dist。
# 需要 JDK 26（与 pom.xml 的 java.version 保持一致）。若本机 JDK 装在别处，
# 通过 JAVA_HOME 环境变量覆盖即可，脚本不再硬编码任何机器专有路径。
set -euo pipefail

# 仓库根目录（脚本位于 scripts/ 下）
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# JDK：优先用调用方传入的 JAVA_HOME，否则用 PATH 里的 java
if [ -n "${JAVA_HOME:-}" ]; then
    export PATH="$JAVA_HOME/bin:$PATH"
fi
if ! command -v java >/dev/null 2>&1; then
    echo "错误：未找到 java。请安装 JDK 26 或设置 JAVA_HOME。" >&2
    exit 1
fi

LOG_DIR="${WEBCHAT_LOG_DIR:-/tmp}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
WEB_PORT="${WEB_PORT:-3000}"

JAR="$(ls packages/server/target/webchat-server-*.jar 2>/dev/null | head -n 1 || true)"
if [ -z "$JAR" ]; then
    echo "错误：未找到后端 JAR，请先执行 make build-backend。" >&2
    exit 1
fi
if [ ! -d packages/frontend/dist ]; then
    echo "错误：未找到 packages/frontend/dist，请先执行 make build-frontend。" >&2
    exit 1
fi

# 1) 后端：仅监听本机，由下面的单端口服务统一对外
nohup java -jar "$JAR" --server.port="$BACKEND_PORT" \
    > "${LOG_DIR}/webchat-backend.log" 2>&1 &
echo "backend pid=$! (port ${BACKEND_PORT})"

# 2) 单端口服务：前端静态产物 + /api 与 /ws/chat 反向代理
#    serve.py 通过环境变量取端口：PORT（对外）、BACKEND_PORT（上游）
sleep 6
PORT="$WEB_PORT" BACKEND_PORT="$BACKEND_PORT" \
    nohup python3 scripts/serve.py packages/frontend/dist \
    > "${LOG_DIR}/webchat-web.log" 2>&1 &
echo "web pid=$! (port ${WEB_PORT})"

echo "启动完成。日志：${LOG_DIR}/webchat-backend.log、${LOG_DIR}/webchat-web.log"

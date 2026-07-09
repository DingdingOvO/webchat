# ============================================================
# Frontend Dockerfile — Nginx 独立运行
# Railway 多服务部署时使用此镜像
# 构建上下文必须为仓库根（见 docker-compose.yaml 的 build.context: .），
# 否则 COPY 无法访问上层的 docs/，导致 webpack 解析 @docs/* 失败。
# ============================================================

# Stage 1: Node 构建前端
FROM node:22-alpine AS build
# 构建上下文改为仓库根后，所有 COPY 源路径相对仓库根解析，
# 且 @docs alias (../docs) 在 WORKDIR=/app/frontend 时指向 /app/docs。
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# 把仓库根 docs/ 复制到 /app/docs，匹配 DocsPage.tsx 中 @docs (../docs) 的解析位置。
# 不复制则 webpack 报 "Can't resolve '@docs/...'" 而使整个前端构建失败。
COPY docs /app/docs

RUN npm run build

# Stage 2: Nginx 运行（支持环境变量动态后端地址）
FROM nginx:alpine

# 安装 envsubst 用于替换 nginx 配置中的环境变量
RUN apk add --no-cache gettext

# 复制构建产物
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# nginx 配置模板（含 $BACKEND_URL 占位符）
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf.template

# 启动脚本：先替换环境变量，再启动 nginx
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export BACKEND_URL=${BACKEND_URL:-http://backend:8080}' >> /docker-entrypoint.sh && \
    echo 'envsubst '\''$BACKEND_URL'\'' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q http://localhost/ -O /dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]

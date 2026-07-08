# ============================================================
# Frontend Dockerfile — Nginx 独立运行
# Railway 多服务部署时使用此镜像
# ============================================================

# Stage 1: Node 构建前端
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Nginx 运行（支持环境变量动态后端地址）
FROM nginx:alpine

# 安装 envsubst 用于替换 nginx 配置中的环境变量
RUN apk add --no-cache gettext

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# nginx 配置模板（含 $BACKEND_URL 占位符）
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

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

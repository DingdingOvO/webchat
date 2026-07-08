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

# Stage 2: Nginx 运行
FROM nginx:alpine

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 自定义 Nginx 配置（反向代理 /api 和 /ws 到后端）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q http://localhost/ -O /dev/null || exit 1

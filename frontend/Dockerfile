# ============================================================
# Stage 1: Node 构建前端
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

# 先装依赖，利用 Docker 缓存
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Nginx 运行
# ============================================================
FROM nginx:alpine

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 自定义 Nginx 配置（反向代理 /api 和 /ws 到后端）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

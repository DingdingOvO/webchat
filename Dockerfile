# ============================================================
# Dockerfile — WebChat 统一构建（前端 + 后端）
# 适用于 Railway / Fly.io / 单容器部署
# ============================================================

# ---- Stage 1: 构建前端 ----
FROM node:22-alpine AS frontend-build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend
COPY docs/ ./docs

RUN cd frontend && npm run build

# ---- Stage 2: 构建后端 ----
FROM maven:3.9-eclipse-temurin-26 AS backend-build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src

# 将前端构建产物嵌入 JAR 内（Spring Boot 从 classpath:/static/ 读取）
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

RUN mvn clean package -DskipTests

# ---- Stage 3: 运行 ----
FROM eclipse-temurin:26-jre
WORKDIR /app

# 从后端构建阶段复制 JAR
COPY --from=backend-build /app/target/*.jar app.jar

# Spring Boot 默认端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -s http://localhost:8080/api/auth/me > /dev/null 2>&1 || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY packages/frontend/package.json packages/frontend/package-lock.json ./packages/frontend/
RUN cd packages/frontend && npm ci
COPY packages/frontend/ ./packages/frontend
COPY docs/ ./docs
RUN cd packages/frontend && npm run build

FROM maven:3.9-eclipse-temurin-26 AS backend-build
WORKDIR /app
COPY packages/server/pom.xml ./packages/server/pom.xml
RUN cd packages/server && mvn dependency:go-offline -B
COPY packages/server/src ./packages/server/src
COPY --from=frontend-build /app/packages/frontend/dist ./packages/server/src/main/resources/static
RUN cd packages/server && mvn clean package -DskipTests

FROM eclipse-temurin:26-jre
WORKDIR /app
# 健康检查需要 HTTP 客户端，temurin 基础镜像不自带 curl/wget，显式安装。
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=backend-build /app/packages/server/target/*.jar app.jar
EXPOSE 8080
# 健康检查必须用无需鉴权的端点：/api/auth/me 会强制校验 token，
# 不带 token 恒定返回 401，健康检查将永远失败并触发无限重启。
# start-period 给 Spring Boot 冷启动留出时间，避免刚启动就被判定失败。
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD curl -fsS http://localhost:8080/actuator/health > /dev/null || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]

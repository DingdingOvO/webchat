# ============================================================
# Stage 1: Maven 构建
# ============================================================
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# 先拉依赖层，利用 Docker 缓存
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源码并构建
COPY src ./src
RUN mvn clean package -DskipTests

# ============================================================
# Stage 2: JRE 运行
# ============================================================
FROM eclipse-temurin:21-jre
WORKDIR /app

# 从 build 阶段复制可执行 JAR（Spring Boot repackage 产物）
COPY --from=build /app/target/*.jar app.jar

# 数据库连接通过环境变量配置（参见 application.properties）
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

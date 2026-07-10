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
COPY --from=backend-build /app/packages/server/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -s http://localhost:8080/api/auth/me > /dev/null 2>&1 || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]

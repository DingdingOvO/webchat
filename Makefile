SHELL := /bin/bash
.PHONY: help build-backend build-frontend build-all run-backend run-frontend clean

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build-backend: ## 构建后端 JAR
	cd packages/server && mvn clean package -DskipTests
build-frontend: ## 构建前端
	cd packages/frontend && npm ci && npm run build
build-all: build-backend build-frontend
run-backend:
	java -Xms256m -Xmx512m -jar packages/server/target/webchat-server-*.jar
run-frontend:
	cd packages/frontend && npm run dev
preview:
	python3 server_spa.py 8000 packages/frontend/dist
clean:
	cd packages/server && mvn clean; rm -rf packages/frontend/dist packages/frontend/node_modules packages/server/target

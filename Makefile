SHELL := /bin/bash
.PHONY: help build-backend build-frontend build-all run-backend run-frontend preview run-prod clean

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build-backend: ## 构建后端 JAR
	cd packages/server && mvn clean package -DskipTests
build-frontend: ## 构建前端
	cd packages/frontend && npm ci && npm run build
build-all: build-backend build-frontend
run-backend: ## 仅启动后端（8080）
	java -Xms256m -Xmx512m -jar packages/server/target/webchat-server-*.jar
run-frontend: ## 仅启动前端开发服务器
	cd packages/frontend && npm run dev
preview: ## 单端口预览已构建的前端产物（默认 3000，后端指向 8080）
	PORT=$${PORT:-3000} BACKEND_PORT=$${BACKEND_PORT:-8080} \
		python3 scripts/serve.py packages/frontend/dist
run-prod: ## 生产模式：后端 + 单端口前端与代理
	./scripts/run_prod.sh
clean:
	cd packages/server && mvn clean; rm -rf packages/frontend/dist packages/frontend/node_modules packages/server/target

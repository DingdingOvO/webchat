# ================================================================
# WebChat — Makefile 构建管理
# 用法: make <target>
# ================================================================

SHELL := /bin/bash
.PHONY: help build-backend build-frontend build-all run-backend run-frontend run-all clean deploy docker-build docker-push

help: ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ---- 构建 ----
build-backend: ## 构建后端 JAR
	mvn clean package -DskipTests

build-frontend: ## 构建前端
	cd frontend && npm ci && npm run build

build-all: build-backend build-frontend ## 构建全部

# ---- 本地运行 ----
run-backend: ## 运行后端（需先启动数据库）
	java -Xms256m -Xmx512m -jar target/webchat-server-*.jar

run-frontend: ## 运行前端开发服务器
	cd frontend && npm run dev

run-all: ## 同时运行前后端
	@echo "请在两个终端分别执行 make run-backend 和 make run-frontend"

run-docker: ## 通过 Docker Compose 运行全部服务
	docker compose up -d --build

# ---- 测试 ----
test: ## 运行后端测试
	mvn test

test-e2e: ## 运行端到端测试
	bash test.sh

# ---- Docker ----
docker-build: ## 构建 Docker 镜像
	docker compose build

docker-push: ## 推送 Docker 镜像
	docker compose push

docker-clean: ## 清理 Docker 资源
	docker compose down -v

# ---- 部署 ----
deploy-local: ## 部署到本地 Systemd
	sudo cp deploy/systemd/webchat.service /etc/systemd/system/
	sudo systemctl daemon-reload
	sudo systemctl restart webchat
	sudo systemctl status webchat

deploy-stack: ## 部署到 Docker Swarm
	docker stack deploy -c deploy/swarm/docker-stack.yaml webchat

deploy-helm: ## 部署到 Kubernetes (Helm)
	helm upgrade --install webchat deploy/helm/webchat --namespace webchat --create-namespace

deploy-kubectl: ## 部署到 Kubernetes (kubectl)
	kubectl apply -k deploy/kubernetes/

# ---- 清理 ----
clean: ## 清理构建产物
	mvn clean
	rm -rf frontend/dist frontend/node_modules
	rm -rf target

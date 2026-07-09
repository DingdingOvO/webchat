# ================================================================
# WebChat — Makefile 构建管理
# 用法: make <target>
# ================================================================

SHELL := /bin/bash
.PHONY: help build-backend build-frontend build-all run-backend run-frontend run-all clean deploy docker-build docker-push lint format format-check typecheck stylelint spell quality

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

# ================================================================
# Quality Gates — 零容忍质量门禁
# ================================================================

# ---- 前端质量 ----
lint: ## 前端 ESLint 检查
        cd frontend && npx eslint . --max-warnings 0

lint-fix: ## 前端 ESLint 自动修复
        cd frontend && npx eslint . --fix

typecheck: ## 前端 TypeScript 类型检查
        cd frontend && npx tsc --noEmit

format: ## 自动格式化全仓（前端 Prettier + 后端 Spotless）
        cd frontend && npx prettier --write .
        mvn spotless:apply -q

format-check: ## 检查格式化是否符合规范
        cd frontend && npx prettier --check .
        mvn spotless:check -q

stylelint: ## 前端 CSS Lint
        cd frontend && npx stylelint "**/*.css" --allow-empty-input

spell: ## 前端拼写检查
        cd frontend && npx cspell "**/*.{ts,tsx,js,jsx,md}" --no-progress

# ---- 后端质量 ----
checkstyle: ## 后端 Checkstyle 检查
        mvn checkstyle:check -q

pmd: ## 后端 PMD 检查
        mvn pmd:check -q

spotbugs: ## 后端 SpotBugs 检查
        mvn spotbugs:check -q

# ---- 全栈门禁 ----
quality: ## 双栈全量质量门禁（CI 等价）
        @echo "=== Frontend Quality ==="
        cd frontend && npx tsc --noEmit
        cd frontend && npx eslint . --max-warnings 0
        cd frontend && npx prettier --check .
        cd frontend && npx stylelint "**/*.css" --allow-empty-input
        cd frontend && npx cspell "**/*.{ts,tsx,js,jsx,md}" --no-progress
        @echo "=== Backend Quality ==="
        mvn spotless:check -q
        mvn checkstyle:check -q
        mvn pmd:check -q
        mvn spotbugs:check -q
        mvn verify -q
        @echo "=== All quality gates passed ==="

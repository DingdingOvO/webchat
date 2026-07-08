# WebChat 部署指南

> **技术栈**: Spring Boot 3.4.5 (Java 21) + React 19 + Webpack + MySQL 8.0 + MongoDB 7 + Redis 7

本文档涵盖 **16 种不同的部署方式**，从本地开发到生产级集群全覆盖。

---

## 目录

1. [Docker Compose（全量）](#1-docker-compose全量)
2. [Docker Compose（仅数据库 + 本地开发）](#2-docker-compose仅数据库--本地开发)
3. [Docker Compose（生产优化版）](#3-docker-compose生产优化版)
4. [Docker Swarm](#4-docker-swarm)
5. [Kubernetes + Kustomize](#5-kubernetes--kustomize)
6. [Helm Chart](#6-helm-chart)
7. [裸机/VPS 一键脚本](#7-裸机vps-一键脚本)
8. [Systemd 服务管理](#8-systemd-服务管理)
9. [Supervisor 进程管理](#9-supervisor-进程管理)
10. [Ansible 自动化部署](#10-ansible-自动化部署)
11. [Makefile 构建管理](#11-makefile-构建管理)
12. [DevContainer（VS Code）](#12-devcontainervs-code)
13. [GitHub Actions CI/CD](#13-github-actions-cicd)
14. [Fly.io](#14-flyio)
15. [Railway](#15-railway)
16. [Render](#16-render)
17. [Zeabur](#17-zeabur)
18. [Heroku](#18-heroku)
19. [Nginx 反向代理 + SSL](#19-nginx-反向代理--ssl)

---

## 1. Docker Compose（全量）

项目根目录已有 `docker-compose.yaml`，一键启动全部服务：

```bash
# 启动（后台）
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止
docker compose down

# 停止并删除数据卷
docker compose down -v
```

**架构**: MySQL + MongoDB + Redis + Backend + Frontend（共 5 个容器）

---

## 2. Docker Compose（仅数据库 + 本地开发）

适合本地开发：宿主机运行 Spring Boot，容器只跑数据库：

```bash
# 启动数据库
docker compose -f deploy/scripts/docker-db-only.yaml up -d

# 宿主机运行后端（自动连接 127.0.0.1 上的数据库）
mvn spring-boot:run

# 宿主机运行前端开发服务器
cd frontend && npm run dev
```

---

## 3. Docker Compose（生产优化版）

相比根目录的基础版，增加了资源限制、健康检查、日志轮转、网络隔离：

```bash
docker compose -f deploy/scripts/docker-compose-prod.yaml up -d
```

**增强功能**:
- 所有服务 `restart: unless-stopped` + 健康检查依赖
- 内存上限: Backend 1G, MySQL 1G, MongoDB 512M, Redis 256M, Frontend 256M
- 日志轮转: 每文件 10MB，保留 3 个
- 独立 bridge 网络 `webchat-net`
- Backend 端口绑定 `127.0.0.1`，不对外暴露
- 支持 `.env` 文件自定义密码

---

## 4. Docker Swarm

适合多节点 Docker Swarm 集群：

```bash
# 初始化 Swarm（仅集群管理器执行）
docker swarm init

# 部署
docker stack deploy -c deploy/swarm/docker-stack.yaml webchat

# 查看服务
docker stack services webchat

# 查看日志
docker service logs webchat_backend

# 滚动更新
docker service update --image ghcr.io/dingdingovo/webchat-backend:latest webchat_backend

# 移除
docker stack rm webchat
```

**特性**: 2 副本后端/前端、滚动更新策略、回滚策略、资源限制、overlay 网络

---

## 5. Kubernetes + Kustomize

```bash
# 使用 Kustomize 一键部署
kubectl apply -k deploy/kubernetes/

# 或手动分步部署
kubectl apply -f deploy/kubernetes/namespace.yaml
kubectl apply -f deploy/kubernetes/configmap.yaml
kubectl apply -f deploy/kubernetes/mysql.yaml
kubectl apply -f deploy/kubernetes/mongodb.yaml
kubectl apply -f deploy/kubernetes/redis.yaml
kubectl apply -f deploy/kubernetes/backend.yaml
kubectl apply -f deploy/kubernetes/frontend.yaml

# 查看状态
kubectl get all -n webchat
kubectl rollout status deployment/webchat-backend -n webchat

# 端口转发（本地访问）
kubectl port-forward svc/webchat-frontend -n webchat 3000:80
kubectl port-forward svc/webchat-backend -n webchat 8080:8080

# 卸载
kubectl delete ns webchat
```

**特性**: StatefulSet + PVC 持久化、Ingress + TLS、Liveness/Readiness 探针、HPA 自动扩缩（backend）

---

## 6. Helm Chart

```bash
# 直接安装
helm upgrade --install webchat deploy/helm/webchat \
  --namespace webchat --create-namespace

# 自定义配置安装
helm upgrade --install webchat deploy/helm/webchat \
  --namespace webchat --create-namespace \
  --set replicaCount=3 \
  --set domain=chat.mydomain.com \
  --set secrets.mysqlPassword=MyStr0ng!Pass \
  --set secrets.jwtSecret=super-secret-jwt-key

# 使用自定义 values 文件
helm upgrade --install webchat deploy/helm/webchat \
  --namespace webchat --create-namespace \
  -f my-values.yaml

# 查看已部署的 values
helm get values webchat -n webchat

# 回滚
helm rollback webchat 1 -n webchat

# 卸载
helm uninstall webchat -n webchat
```

---

## 7. 裸机/VPS 一键脚本

适用于干净的 Ubuntu 20.04+ / CentOS 7+：

```bash
# 下载项目
git clone https://github.com/DingdingOvO/webchat.git
cd webchat

# 运行一键部署脚本
sudo bash deploy/scripts/deploy.sh
```

**脚本自动完成**:
1. 安装 Java 21、MySQL、MongoDB、Redis、Nginx、Certbot
2. 创建 `webchat` 用户和 `/opt/webchat` 目录
3. 初始化数据库和表
4. 安装 Systemd 服务
5. 配置 Nginx 反向代理
6. 启动所有服务

> **注意**: 脚本需要你手动将构建好的 `app.jar` 和前端 `dist/` 放到对应目录。

---

## 8. Systemd 服务管理

适合已手动部署后端的场景：

```bash
# 安装服务
sudo cp deploy/systemd/webchat.service /etc/systemd/system/

# 修改配置文件中的数据库连接和路径
sudo vim /etc/systemd/system/webchat.service

# 重新加载并启动
sudo systemctl daemon-reload
sudo systemctl enable --now webchat

# 管理命令
sudo systemctl status webchat      # 查看状态
sudo journalctl -u webchat -f      # 实时日志
sudo systemctl restart webchat     # 重启
sudo systemctl stop webchat        # 停止
```

---

## 9. Supervisor 进程管理

适合容器环境或无 Systemd 的系统：

```bash
# 安装 Supervisor
sudo apt install supervisor    # Ubuntu/Debian
sudo yum install supervisor    # CentOS/RHEL

# 复制配置
sudo cp deploy/scripts/supervisor.conf /etc/supervisor/conf.d/webchat.conf

# 加载并启动
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start webchat

# 管理
sudo supervisorctl status webchat
sudo supervisorctl restart webchat
sudo supervisorctl tail -f webchat stdout
```

---

## 10. Ansible 自动化部署

适合多台服务器的批量部署：

```bash
# 安装 Ansible
sudo apt install ansible

# 修改 inventory 中的服务器地址
vim deploy/ansible/inventory/hosts.ini

# 执行部署
ansible-playbook -i deploy/ansible/inventory/hosts.ini deploy/ansible/site.yml
```

**Playbook 结构**:
- `common` — 系统依赖、Java 21、系统用户
- `databases` — MySQL、MongoDB、Redis 安装与初始化
- `backend` — 构建 JAR、Systemd 服务配置
- `frontend` — 构建前端、Nginx 配置

---

## 11. Makefile 构建管理

常用构建命令：

```bash
make help              # 显示所有命令
make build-backend     # 构建后端
make build-frontend    # 构建前端
make build-all         # 构建全部
make test              # 运行后端测试
make run-docker        # Docker Compose 启动
make deploy-helm       # Helm 部署
make deploy-kubectl    # Kubectl 部署
make deploy-stack      # Swarm 部署
make clean             # 清理构建产物
```

---

## 12. DevContainer（VS Code）

在 VS Code 中打开后自动提供完整开发环境：

```bash
# 前提: VS Code + Dev Containers 扩展
# 在项目根目录创建 .devcontainer 软链接
ln -sf deploy/devcontainer/devcontainer.json .devcontainer.json

# VS Code → Ctrl+Shift+P → "Reopen in Container"
```

**容器内预装**: Java 扩展包、Spring Boot Dashboard、ESLint、Prettier、Docker、SQLTools

---

## 13. GitHub Actions CI/CD

提交代码到 main 分支时自动触发完整 CI/CD 流水线。

**工作流文件**: `.github/workflows/ci-cd.yml`

**自动完成**:
1. 构建后端（Maven + Java 21）
2. 构建前端（Node.js 22 + Webpack）
3. 构建 Docker 镜像并推送到 GHCR
4. 通过 SSH 部署到生产服务器
5. 通过 kubectl 部署到 K8s 集群

**仓库 Secrets 设置**:
| Secret | 说明 |
|--------|------|
| `SSH_HOST` | 部署服务器地址 |
| `SSH_USER` | SSH 用户名 |
| `SSH_PRIVATE_KEY` | SSH 私钥 |
| `KUBE_CONFIG` | K8s kubeconfig（base64） |

---

## 14. Fly.io

```bash
# 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 部署
fly launch --copy-config --name webchat-app
fly deploy

# 创建托管数据库
fly postgres create --name webchat-pg
fly redis create --name webchat-redis
fly mongo create --name webchat-mongo

# 设置 secrets
fly secrets set JWT_SECRET=your-secret

# 查看
fly open
fly logs
```

**配置**: `deploy/cloud/fly.toml`

---

## 15. Railway

1. 登录 [Railway](https://railway.app)
2. 创建项目 → Deploy from GitHub repo → 选择 `DingdingOvO/webchat`
3. 添加插件: **MySQL**、**MongoDB**、**Redis**
4. 设置环境变量: `JWT_SECRET`
5. Railway 自动使用 `deploy/cloud/railway.json` 配置构建

**配置**: `deploy/cloud/railway.json`

---

## 16. Render

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. New Blueprint → 连接 GitHub 仓库
3. Render 自动读取 `deploy/cloud/render.yaml`
4. 一键部署全部服务（前端 + 后端 + MySQL + MongoDB + Redis）

**配置**: `deploy/cloud/render.yaml`

---

## 17. Zeabur

1. 登录 [Zeabur](https://zeabur.com)
2. 创建项目 → 添加服务 → 从 GitHub 导入 → 选择 `webchat` 仓库
3. Zeabur 自动检测 `Dockerfile` 构建
4. 添加 MySQL / MongoDB / Redis 模板服务
5. 在 backend 环境变量中关联数据库地址

---

## 18. Heroku

```bash
# 安装 Heroku CLI
brew install heroku     # macOS
# 或 curl https://cli-assets.heroku.com/install.sh | sh

# 登录
heroku login

# 创建应用（使用容器栈）
heroku create webchat-app --stack container

# 添加数据库插件
heroku addons:create jawsdb:kitefin        # MySQL
heroku addons:create mongodbye:free         # MongoDB
heroku addons:create rediscloud:30          # Redis

# 配置环境变量
heroku config:set JWT_SECRET=your-secret

# 部署
heroku container:push web
heroku container:release web

# 打开
heroku open
```

---

## 19. Nginx 反向代理 + SSL

适用于独立服务器部署，提供完整的 SSL/TLS + HTTP/2 支持：

```bash
# 复制配置
sudo cp deploy/nginx/webchat.conf /etc/nginx/sites-available/webchat

# 启用站点
sudo ln -sf /etc/nginx/sites-available/webchat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 检查配置
sudo nginx -t

# 配置 SSL（使用 Let's Encrypt）
sudo certbot --nginx -d chat.yourdomain.com

# 重启
sudo systemctl restart nginx
```

**配置特性**:
- HTTP → HTTPS 301 重定向
- HTTP/2 + TLS 1.2/1.3
- 安全响应头（HSTS、X-Content-Type-Options、X-Frame-Options）
- 静态资源 1 年缓存
- WebSocket 长连接支持（3600s 超时）
- 后端负载均衡（支持多实例）

---

## 部署方式速查表

| # | 方式 | 适用场景 | 复杂度 | 生产可用 |
|---|------|---------|--------|---------|
| 1 | Docker Compose（基础版） | 本地测试、小团队 | ⭐ | ✅ |
| 2 | Docker Compose（仅 DB） | 本地开发 | ⭐ | ❌ |
| 3 | Docker Compose（生产版） | 单机生产 | ⭐⭐ | ✅ |
| 4 | Docker Swarm | 多节点容器集群 | ⭐⭐⭐ | ✅ |
| 5 | Kubernetes + Kustomize | K8s 集群生产部署 | ⭐⭐⭐⭐ | ✅ |
| 6 | Helm Chart | K8s 集群（需配置化） | ⭐⭐⭐⭐ | ✅ |
| 7 | VPS 一键脚本 | 裸机/VPS 快速部署 | ⭐ | ✅ |
| 8 | Systemd | 手动管理的 Linux 服务器 | ⭐⭐ | ✅ |
| 9 | Supervisor | 容器/无 systemd 环境 | ⭐⭐ | ✅ |
| 10 | Ansible | 批量服务器部署 | ⭐⭐⭐ | ✅ |
| 11 | Makefile | 本地构建管理 | ⭐ | ❌ |
| 12 | DevContainer | VS Code 远程开发 | ⭐ | ❌ |
| 13 | GitHub Actions | CI/CD 自动化 | ⭐⭐⭐ | ✅ |
| 14 | Fly.io | 全球边缘部署 | ⭐⭐ | ✅ |
| 15 | Railway | 快速托管 | ⭐ | ✅ |
| 16 | Render | 基础设施即代码 | ⭐⭐ | ✅ |
| 17 | Zeabur | 国内友好托管 | ⭐ | ✅ |
| 18 | Heroku | 传统 PaaS | ⭐⭐ | ✅ |
| 19 | Nginx + SSL | 独立服务器前段 | ⭐⭐ | ✅ |

---

## 推荐部署流程

**开发环境**: Docker Compose（仅 DB）+ 本地运行前后端
**小团队生产**: Docker Compose（生产优化版）
**正式生产**: Kubernetes + Helm（或 Docker Swarm）
**CI/CD**: GitHub Actions → Docker → SSH/K8s 自动部署

> 有问题请提交 [GitHub Issues](https://github.com/DingdingOvO/webchat/issues)

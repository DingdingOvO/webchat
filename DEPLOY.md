# WebChat 部署指南

> **技术栈**：Spring Boot 3.5（Java 26）+ React 19 + Webpack 5 + MySQL 8.4 + MongoDB 8.3 + Redis 7.4

本文档覆盖**官方支持的三类主流部署方式**：Docker Compose（单机）、Kubernetes（集群）、云平台（托管）。
每种方式都配有仓库内可直接使用的配置文件。

---

## 目录

| # | 方式 | 适用场景 | 配置位置 |
| --- | --- | --- | --- |
| 1 | [Docker Compose（全量）](#1-docker-compose全量) | 单机生产 / 本地完整体验 | `docker-compose.yaml` |
| 2 | [Docker Compose（仅数据库）](#2-docker-compose仅数据库) | 本地开发，前后端跑在宿主机 | `deploy/scripts/docker-db-only.yaml` |
| 3 | [Kubernetes + Kustomize](#3-kubernetes--kustomize) | K8s 集群 | `deploy/kubernetes/` |
| 4 | [云平台托管](#4-云平台托管) | 不想自己运维 | `deploy/cloud/` |
| 5 | [GitHub Actions CI/CD](#5-github-actions-cicd) | 自动构建与部署 | `.github/workflows/` |
| 6 | [Makefile 快捷命令](#6-makefile-快捷命令) | 日常开发 | `Makefile` |

> 需要 Nginx 反向代理、SSL 证书等，见文末 [附录](#附录nginx--ssl)。

---

## 1. Docker Compose（全量）

项目根目录的 `docker-compose.yaml` 一键拉起**全部服务**（MySQL + MongoDB + Redis + 后端 + 前端）：

```bash
docker compose up -d --build   # 构建并启动
docker compose ps              # 查看状态
docker compose logs -f         # 跟踪日志
docker compose down            # 停止
docker compose down -v         # 停止并删除数据卷（清空数据）
```

启动后访问 <http://localhost:3000>。

**生产环境注意事项**

| 项 | 说明 |
| --- | --- |
| `JWT_SECRET` | 必须替换为强随机值，不要使用 compose 中的默认值 |
| 数据库口令 | 同理，通过环境变量或 `.env` 注入，不要硬编码 |
| 健康检查 | 后端暴露 `/actuator/health`，compose 已配置探针 |

---

## 2. Docker Compose（仅数据库）

本地开发时只启动中间件，前后端跑在宿主机，改代码即时生效：

```bash
docker compose -f deploy/scripts/docker-db-only.yaml up -d
```

随后：

```bash
# 后端（默认 :8080）
cd packages/server && ./mvnw spring-boot:run

# 前端（默认 :3000，代理到后端）
cd packages/frontend && npm install && npm run dev
```

---

## 3. Kubernetes + Kustomize

`deploy/kubernetes/` 包含完整清单：`namespace` / `configmap` / `mysql` / `mongodb` / `redis` / `backend` / `frontend`。

```bash
# 一键部署
kubectl apply -k deploy/kubernetes/

# 查看状态
kubectl get pods -n webchat
kubectl rollout status deployment/webchat-backend -n webchat --timeout=180s

# 本地访问
kubectl port-forward -n webchat svc/webchat-frontend 3000:80

# 卸载
kubectl delete -k deploy/kubernetes/
```

> 生产环境请将 `configmap.yaml` 中的口令与密钥替换为 Secret（`kubectl create secret`），
> 或接入外部密钥管理。CI 部署见 [第 5 节](#5-github-actions-cicd)。

---

## 4. 云平台托管

各平台的配置模板都在 `deploy/cloud/`：

| 平台 | 配置文件 | 说明 |
| --- | --- | --- |
| **Railway** | `deploy/cloud/railway.toml` | Docker 构建，推荐只部署 backend（Dockerfile 已含前端）+ 三个数据库插件 |
| **Fly.io** | `deploy/cloud/fly.toml` | `fly launch --copy-config` 后 `fly deploy` |
| **Render** | `deploy/cloud/render.yaml` | 基础设施即代码，前后端分服务 |
| **Zeabur** | `deploy/cloud/zeabur.md` | 自动检测 Dockerfile，国内访问友好 |
| **Heroku** | `deploy/cloud/heroku.md` | 传统 PaaS（容器化部署） |
| **通用 PaaS** | `deploy/cloud/nixpacks.toml` | Nixpacks 构建：前端产物并入后端 JAR，单镜像启动 |

**Railway 快速开始**

```bash
# 在 Railway Dashboard 新建项目，连接本仓库
# 添加 MySQL / MongoDB / Redis 插件
# Railway 会自动读取 deploy/cloud/railway.toml
```

> ⚠️ Railway 在仓库根目录读取 `railway.toml`。若你的项目结构不同，
> 请在 Dashboard 中指定配置路径为 `deploy/cloud/railway.toml`。

---

## 5. GitHub Actions CI/CD

仓库内置两个工作流，职责分离：

| 工作流 | 职责 | 触发 |
| --- | --- | --- |
| `Quality Gate` | 代码检查：TypeCheck / Biome / Stylelint / 拼写 / 后端 verify / CodeQL / 密钥扫描 | push、PR |
| `Build & Deploy` | 出制品 + 构建推送镜像 + 部署 | push main/master/develop、tag、PR |

**启用自动部署**：在仓库 **Settings → Secrets and variables → Actions** 配置以下密钥，
未配置时对应部署任务会自动跳过（不会让流水线失败）：

| 目标 | 需要的 Secret |
| --- | --- |
| SSH（Docker Compose 主机） | `SSH_HOST`、`SSH_USER`、`SSH_PRIVATE_KEY` |
| Kubernetes | `KUBE_CONFIG`（base64 编码的 kubeconfig） |

镜像推送到 GitHub Container Registry（`ghcr.io/<owner>/<repo>-backend` / `-frontend`）。

---

## 6. Makefile 快捷命令

```bash
make help            # 列出全部命令
make build-all       # 构建后端 JAR + 前端产物
make run-backend     # 仅启动后端
make run-frontend    # 仅启动前端开发服务器
make preview         # 单端口预览已构建的前端（默认 3000）
make run-prod        # 生产模式：后端 + 单端口前端与代理
make clean           # 清理构建产物
```

---

## 附录：Nginx + SSL

若在前面加一层 Nginx 做反向代理与 HTTPS 终结，配置要点：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 升级
    location /ws/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

证书签发：

```bash
sudo certbot --nginx -d your-domain.com
```

> **注意**：应用自定义使用 `X-Auth-Token` 头传递认证信息
> （部分部署平台网关会覆盖 `Authorization`）。Nginx 默认透传所有自定义头，
> 但若你配置了白名单，请确保放行 `X-Auth-Token`。

---

## 相关文档

- [docs/quickstart](docs/quickstart/README.md) —— 环境准备与本地启动
- [docs/DEPLOY_NOTES.md](docs/DEPLOY_NOTES.md) —— 生产环境踩坑记录与故障排查
- [README.md](README.md) —— 项目总览

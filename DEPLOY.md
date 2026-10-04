# WebChat 部署指南

> **技术栈**：Spring Boot 3.5.16 (Java 26) + React 19 + Webpack 5 + MySQL 8.4 + MongoDB 8.3 + Redis 7.4

WebChat 只提供**三类**部署方式。每一类都有仓库里真实存在的配置文件对应，
不写「看起来很全但跑不起来」的选项。

| 方式 | 适用场景 | 配置文件 |
| --- | --- | --- |
| **Docker Compose** | 单机 / 小团队，最省事 | [`docker-compose.yaml`](docker-compose.yaml)、[`deploy/scripts/docker-db-only.yaml`](deploy/scripts/docker-db-only.yaml) |
| **Kubernetes** | 已有 K8s 集群，要扩缩容 | [`deploy/kubernetes/`](deploy/kubernetes/) |
| **云平台** | 不想管服务器，托管部署 | [`deploy/cloud/`](deploy/cloud/) |

---

## 目录

1. [前置条件](#1-前置条件)
2. [方式一：Docker Compose](#2-方式一docker-compose)
3. [方式二：Kubernetes](#3-方式二kubernetes)
4. [方式三：云平台](#4-方式三云平台)
5. [本地开发](#5-本地开发)
6. [配置项参考](#6-配置项参考)
7. [反向代理与 HTTPS](#7-反向代理与-https)

---

## 1. 前置条件

| 组件 | 版本 | 说明 |
| --- | --- | --- |
| Docker | 24+ | 含 `docker compose` v2 |
| JDK | 26 | 仅本地编译后端需要 |
| Node.js | 22+ | 仅本地编译前端需要 |
| kubectl | 1.28+ | 仅 K8s 部署需要 |

生产环境需要准备三个数据服务的连接信息：MySQL、MongoDB、Redis。

---

## 2. 方式一：Docker Compose

### 2.1 一键起全栈

```bash
# 构建并后台启动（前端 + 后端 + MySQL + MongoDB + Redis）
docker compose up -d --build

# 查看状态
docker compose ps

# 看日志
docker compose logs -f backend

# 停止
docker compose down
```

启动完成后访问 `http://localhost:8080`。

### 2.2 只起数据库（本地开发用）

只跑中间件，前后端在自己机器上跑，方便热重载与调试：

```bash
docker compose -f deploy/scripts/docker-db-only.yaml up -d
```

| 服务 | 端口 | 账号 |
| --- | --- | --- |
| MySQL | 3306 | `webchat` / `webchat123` |
| MongoDB | 27017 | 无认证（仅开发） |
| Redis | 6379 | 无密码（仅开发） |

> **注意**：这只是给本地开发用的便利配置，数据库端口直接暴露且无密码，
> **不要**用在任何能公网访问的机器上。

### 2.3 注入演示数据

```bash
python3 scripts/seed_demo.py
```

会创建 `demo/demo1234`、`alice/1234`、`bob/1234` 三个账号和一个群组，并把脚本可重复执行。

---

## 3. 方式二：Kubernetes

清单在 [`deploy/kubernetes/`](deploy/kubernetes/)，用 Kustomize 组织，改完镜像地址即可用。

```bash
# 改镜像地址
$EDITOR deploy/kubernetes/kustomization.yaml

# 部署
kubectl apply -k deploy/kubernetes/

# 查看
kubectl -n webchat get pods,svc

# 回滚
kubectl -n webchat delete -k deploy/kubernetes/
```

包含的资源：

| 文件 | 内容 |
| --- | --- |
| `namespace.yaml` | `webchat` 命名空间 |
| `configmap.yaml` | 非敏感配置 |
| `backend.yaml` | 后端 Deployment + Service |
| `frontend.yaml` | 前端 Deployment + Service |
| `mysql.yaml` / `mongodb.yaml` / `redis.yaml` | 数据服务（开发/测试用） |

> **生产提醒**：自带的 `mysql.yaml` / `mongodb.yaml` 使用单副本 + 空 `emptyDir`，
> 只适合验证。正式环境请替换为云厂商的托管数据库，或改用 StatefulSet + PVC。

---

## 4. 方式三：云平台

[`deploy/cloud/`](deploy/cloud/) 下是针对各平台的配置，按平台文档放置即可：

| 平台 | 配置文件 | 放置位置 |
| --- | --- | --- |
| Railway | `deploy/cloud/railway.toml` | 仓库根目录 |
| Nixpacks（Railway / Zeabur 等） | `deploy/cloud/nixpacks.toml` | 仓库根目录 |
| Render | `deploy/cloud/render.yaml` | 仓库根目录 |
| Fly.io | `deploy/cloud/fly.toml` | 仓库根目录 |
| Heroku | `deploy/cloud/heroku.md` | 见文档内步骤 |
| Zeabur | `deploy/cloud/zeabur.md` | 见文档内步骤 |

这些平台配置都指向同一个入口：[`Dockerfile`](Dockerfile)。

**单端口要求**：多数平台只暴露一个端口，因此仓库用
[`scripts/serve.py`](scripts/serve.py) 把前端静态产物与后端 `/api`、`/ws/chat`
合并到同一端口。平台侧的启动命令应指向它，而不是单独起前端和后端。

平台需要注入的环境变量见[第 6 节](#6-配置项参考)。

---

## 5. 本地开发

### 5.1 起中间件

```bash
docker compose -f deploy/scripts/docker-db-only.yaml up -d
```

### 5.2 后端

```bash
cd packages/server
./mvnw spring-boot:run
```

健康检查：`curl http://localhost:8080/actuator/health` 应返回 `{"status":"UP",...}`。

> 若端口被环境变量占用，用 `--server.port=8080` 显式指定。
> Spring Boot 的宽松绑定会把 `SERVER__PORT` 这类环境变量映射到 `server.port`，容易和预期不一致。

### 5.3 前端

```bash
cd packages/frontend
npm install
npm run dev          # 开发服务器，带热更新
```

### 5.4 质量检查

```bash
# 后端：Spotless / Checkstyle / PMD / SpotBugs / JaCoCo / 单测
cd packages/server && ./mvnw verify

# 前端：TypeScript / Biome / Stylelint / 拼写
cd packages/frontend && npm run quality
```

---

## 6. 配置项参考

后端通过环境变量注入配置（Spring Boot 宽松绑定，`webchat.mysql.host` 对应 `WEBCHAT__MYSQL__HOST`）。

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `WEBCHAT__MYSQL__HOST` | `localhost` | MySQL 地址 |
| `WEBCHAT__MYSQL__PORT` | `3306` | MySQL 端口 |
| `WEBCHAT__MYSQL__USERNAME` | `webchat` | MySQL 用户 |
| `WEBCHAT__MYSQL__PASSWORD` | — | MySQL 密码 |
| `WEBCHAT__MONGODB__URI` | `mongodb://localhost:27017/webchat` | MongoDB 连接串 |
| `WEBCHAT__REDIS__HOST` | `localhost` | Redis 地址 |
| `WEBCHAT__REDIS__PORT` | `6379` | Redis 端口 |
| `SERVER__PORT` | `8080` | 后端监听端口 |
| `WEBCHAT__JWT__SECRET` | — | JWT 签名密钥，**生产必须改** |
| `PORT` | `3000` | `scripts/serve.py` 的监听端口 |

完整配置见 [`packages/server/src/main/resources/application.yml`](packages/server/src/main/resources/application.yml)。

---

## 7. 反向代理与 HTTPS

仓库里**不附带** Nginx 配置文件 —— 反代方式各环境差异太大，给一份「通用」的反而误导。
下面是一份可直接改用的最小配置，重点是两处容易漏的地方：`/api` 转发和 WebSocket 升级头。

```nginx
server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate     /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 必须显式放行 Upgrade，否则长连接建立不起来，表现为「消息发不出去」
    location /ws/chat {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

> **注意**：部分部署平台的网关会用它自己的 JWT 覆盖 `Authorization` 头，
> 因此后端同时支持读取 `X-Auth-Token`，且优先使用后者。
> 前端已在请求里同时带上两个头，自建反代时无需额外处理。

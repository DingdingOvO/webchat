# 部署指南

WebChat 支持 19 种部署方式，从本地开发到生产级集群全覆盖。本文档概览主要方式，完整部署细节见 [DEPLOY.md](https://github.com/DingdingOvO/webchat/blob/main/DEPLOY.md)。

---

## 部署方式总览

| 类别 | 方式 | 适用场景 | 复杂度 |
|------|------|---------|--------|
| **容器** | Docker Compose | 本地测试 / 单机生产 | ⭐ |
| **容器** | Docker Swarm | 多节点容器集群 | ⭐⭐⭐ |
| **容器** | Kubernetes + Helm | K8s 集群生产部署 | ⭐⭐⭐⭐ |
| **VPS** | 一键部署脚本 | 裸机/VPS 快速部署 | ⭐ |
| **VPS** | Systemd | Linux 服务管理 | ⭐⭐ |
| **VPS** | Ansible | 批量自动化部署 | ⭐⭐⭐ |
| **云平台** | Fly.io | 全球边缘部署 | ⭐⭐ |
| **云平台** | Railway | 快速托管 | ⭐ |
| **云平台** | Render | 基础设施即代码 | ⭐⭐ |
| **云平台** | Zeabur | 国内友好托管 | ⭐ |
| **云平台** | Heroku | 传统 PaaS | ⭐⭐ |
| **CI/CD** | GitHub Actions | 自动构建 + 部署 | ⭐⭐⭐ |

---

## Docker Compose 部署

推荐用于开发和单机生产。

```bash
# 标准部署（前后端 + 3 数据库）
docker compose up -d --build

# 生产优化版（资源限制 + 日志轮转 + 健康检查）
docker compose -f deploy/scripts/docker-compose-prod.yaml up -d

# 仅启动数据库（本地开发前端时用）
docker compose -f deploy/scripts/docker-db-only.yaml up -d
```

### 架构

```
nginx:80 ← 前端静态文件
                ↓ /api/*, /ws/*
         Spring Boot:8080 (Java 26)
         ┌──────┬──────┬──────┐
      MySQL   MongoDB   Redis
       8.4      8.3      7.4
```

---

## Kubernetes 部署

### Kustomize

```bash
kubectl apply -k deploy/kubernetes/
```

### Helm

```bash
helm upgrade --install webchat deploy/helm/webchat \
  --namespace webchat --create-namespace
```

Helm Chart 支持自定义：
```bash
# 自定义副本数和资源限制
helm upgrade --install webchat deploy/helm/webchat \
  --set backend.replicas=3 \
  --set backend.resources.limits.memory=2Gi \
  --set mongodb.enabled=true
```

---

## VPS 部署

适用于 Ubuntu 20.04+ / CentOS 7+。

```bash
git clone https://github.com/DingdingOvO/webchat.git
cd webchat
sudo bash deploy/scripts/deploy.sh
```

一键脚本自动完成：
1. 安装 Java 26（Eclipse Temurin）
2. 安装并配置 MySQL 8.4 + MongoDB 8.3 + Redis 7.4
3. 创建 `webchat` 用户和 `/opt/webchat` 目录
4. 初始化数据库和表结构
5. 安装 Systemd 服务（webchat-backend、webchat-frontend）
6. 配置 Nginx 反向代理 + Let's Encrypt SSL
7. 启动所有服务

### Systemd 手动管理

```bash
# 查看服务状态
systemctl status webchat-backend
systemctl status webchat-frontend

# 重启
systemctl restart webchat-backend

# 查看日志
journalctl -u webchat-backend -f
```

---

## 云平台

### Fly.io

```bash
fly launch --copy-config --name webchat-app
fly deploy
# 创建托管数据库（可选）
fly postgres create --name webchat-pg
fly redis create --name webchat-redis
```

### Railway / Render / Zeabur / Heroku

各平台配置文件见 `deploy/cloud/` 目录：

| 平台 | 配置文件 |
|------|---------|
| Railway | `deploy/cloud/railway.json` |
| Render | `deploy/cloud/render.yaml` |
| Zeabur | `deploy/cloud/zeabur.json` |
| Heroku | `deploy/cloud/heroku.yml` |

---

## 环境变量参考

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MYSQL_HOST` | `localhost` | MySQL 地址 |
| `MYSQL_PORT` | `3306` | MySQL 端口 |
| `MYSQL_USER` | `root` | MySQL 用户名 |
| `MYSQL_PASSWORD` | `webchat2026` | MySQL 密码 |
| `MONGO_HOST` | `localhost` | MongoDB 地址 |
| `MONGO_PORT` | `27017` | MongoDB 端口 |
| `REDIS_HOST` | `localhost` | Redis 地址 |
| `REDIS_PORT` | `6379` | Redis 端口 |
| `JWT_SECRET` | `WebChat2026SecretKey...` | JWT 签名密钥（生产环境务必修改） |
| `SERVER_PORT` | `8080` | 后端端口 |

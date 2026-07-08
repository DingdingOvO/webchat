# 部署指南

WebChat 提供了 **19 种部署方式**，从本地开发到生产级集群全覆盖。
完整文档见 [DEPLOY.md](https://github.com/DingdingOvO/webchat/blob/main/DEPLOY.md)。

---

## 部署方式总览

| 类别 | 方式 | 适用场景 | 复杂度 |
|------|------|---------|--------|
| 容器编排 | Docker Compose | 本地测试、单机生产 | ⭐ |
| 容器编排 | Docker Swarm | 多节点容器集群 | ⭐⭐⭐ |
| 容器编排 | Kubernetes + Helm | K8s 集群生产部署 | ⭐⭐⭐⭐ |
| 物理机/VPS | 一键部署脚本 | 裸机/VPS 快速部署 | ⭐ |
| 物理机/VPS | Systemd | Linux 服务管理 | ⭐⭐ |
| 物理机/VPS | Ansible | 批量自动化部署 | ⭐⭐⭐ |
| 云平台 | Fly.io | 全球边缘部署 | ⭐⭐ |
| 云平台 | Railway | 快速托管 | ⭐ |
| 云平台 | Render | 基础设施即代码 | ⭐⭐ |
| 云平台 | Zeabur | 国内友好托管 | ⭐ |
| 云平台 | Heroku | 传统 PaaS | ⭐⭐ |
| CI/CD | GitHub Actions | 自动构建+部署 | ⭐⭐⭐ |

---

## Docker 部署

### 单机 Docker Compose

```bash
# 标准部署
docker compose up -d --build

# 生产优化版（资源限制 + 日志轮转 + 健康检查）
docker compose -f deploy/scripts/docker-compose-prod.yaml up -d

# 仅数据库（本地开发）
docker compose -f deploy/scripts/docker-db-only.yaml up -d
```

### Docker Swarm 多节点

```bash
docker swarm init
docker stack deploy -c deploy/swarm/docker-stack.yaml webchat
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

---

## VPS 部署

适用于 Ubuntu 20.04+ / CentOS 7+ 裸机或 VPS：

```bash
git clone https://github.com/DingdingOvO/webchat.git
cd webchat
sudo bash deploy/scripts/deploy.sh
```

脚本自动完成：
1. 安装 Java 21、MySQL、MongoDB、Redis、Nginx、Certbot
2. 创建 `webchat` 用户和 `/opt/webchat` 目录
3. 初始化数据库和表
4. 安装 Systemd 服务
5. 配置 Nginx 反向代理 + SSL
6. 启动所有服务

---

## 云平台

### Fly.io

```bash
fly launch --copy-config --name webchat-app
fly deploy
fly postgres create --name webchat-pg
fly redis create --name webchat-redis
```

### Railway / Render / Zeabur / Heroku

详见 `deploy/cloud/` 目录下的对应配置文件。

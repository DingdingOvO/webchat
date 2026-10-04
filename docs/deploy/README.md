# 部署指南

WebChat 官方支持**三类主流部署方式**，完整操作步骤见仓库根目录的 [DEPLOY.md](../../DEPLOY.md)。

---

## 方式总览

| 类别 | 方式 | 适用场景 | 配置位置 |
| --- | --- | --- | --- |
| 单机容器 | Docker Compose | 本地完整体验 / 单机生产 | `docker-compose.yaml` |
| 单机容器 | Docker Compose（仅数据库） | 本地开发 | `deploy/scripts/docker-db-only.yaml` |
| 集群 | Kubernetes + Kustomize | K8s 集群 | `deploy/kubernetes/` |
| 云平台 | Railway / Fly.io / Render / Zeabur / Heroku | 托管，免运维 | `deploy/cloud/` |
| CI/CD | GitHub Actions | 自动构建与部署 | `.github/workflows/` |

---

## Docker Compose

```bash
# 全量启动（MySQL + MongoDB + Redis + 后端 + 前端）
docker compose up -d --build

# 仅数据库（本地开发）
docker compose -f deploy/scripts/docker-db-only.yaml up -d
```

## Kubernetes

```bash
kubectl apply -k deploy/kubernetes/
kubectl rollout status deployment/webchat-backend -n webchat --timeout=180s
```

## 云平台

各平台配置模板位于 `deploy/cloud/`，详细步骤见 [DEPLOY.md](../../DEPLOY.md)。

---

## 相关文档

- [DEPLOY.md](../../DEPLOY.md) —— 完整部署指南（含 Nginx + SSL 配置）
- [DEPLOY_NOTES.md](../DEPLOY_NOTES.md) —— 生产环境故障排查记录

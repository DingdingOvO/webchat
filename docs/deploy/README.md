# 部署指南

本页只是索引。**完整、可执行的部署文档在根目录的 [DEPLOY.md](../../DEPLOY.md)**，
请以那里为准 —— 本页不重复内容，避免两处描述不一致。

---

## 三类部署方式

| 方式 | 适用场景 | 配置文件 |
| --- | --- | --- |
| **Docker Compose** | 单机 / 小团队，最省事 | [`docker-compose.yaml`](../../docker-compose.yaml)、[`deploy/scripts/docker-db-only.yaml`](../../deploy/scripts/docker-db-only.yaml) |
| **Kubernetes** | 已有 K8s 集群 | [`deploy/kubernetes/`](../../deploy/kubernetes/) |
| **云平台** | 托管部署，不管服务器 | [`deploy/cloud/`](../../deploy/cloud/) |

---

## 快速命令

```bash
# 全栈一键起（前端 + 后端 + MySQL + MongoDB + Redis）
docker compose up -d --build

# 只起数据库（本地开发）
docker compose -f deploy/scripts/docker-db-only.yaml up -d

# Kubernetes
kubectl apply -k deploy/kubernetes/
```

---

## 目录说明

```
deploy/
├── cloud/           云平台配置（Railway / Render / Fly.io / Heroku / Zeabur / Nixpacks）
├── kubernetes/      K8s 清单（Kustomize 组织）
└── scripts/
    └── docker-db-only.yaml   仅中间件，供本地开发使用
```

## 相关文档

- [DEPLOY.md](../../DEPLOY.md) —— 部署方式详解、环境变量、反向代理与 HTTPS
- [docs/quickstart/](../quickstart/) —— 本地开发上手

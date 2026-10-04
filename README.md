<div align="center">

# WebChat

**和在意的人，随时说上话。**

一个打开浏览器就能用的即时通讯应用 —— 不用下载，不用填一堆信息。

[![CI/CD](https://github.com/DingdingOvO/webchat/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/DingdingOvO/webchat/actions/workflows/ci-cd.yml)
[![Quality Gate](https://github.com/DingdingOvO/webchat/actions/workflows/quality.yml/badge.svg)](https://github.com/DingdingOvO/webchat/actions/workflows/quality.yml)

[功能](#功能) · [快速开始](#快速开始) · [技术栈](#技术栈) · [项目结构](#项目结构) · [文档](#文档)

</div>

---

## 这是什么

WebChat 是一套全栈即时通讯系统。前端 React 19，后端 Spring Boot，消息通过 WebSocket 实时投递，
历史记录分级存储。目标很简单：**让「找人聊天」这件事本身不成为障碍。**

| 能力 | 说明 |
| --- | --- |
| 💬 实时私聊 | WebSocket 长连接，消息即发即达，无需刷新 |
| 👥 群组聊天 | 建群、拉人，群消息通过 Redis Pub/Sub 广播，多实例部署也能保持同步 |
| 🔍 好友管理 | 搜昵称加好友，好友列表实时同步在线状态 |
| 🟢 在线状态 | 连接即上线，断线即离线，状态一眼可见 |
| ✏️ 输入提示 | 对方「正在输入」实时可见 |
| 📦 消息不丢 | 热消息驻留 Redis，冷消息落盘 MongoDB，换设备打开记录仍在 |

## 快速开始

### 方式一：Docker Compose（推荐）

只需要 Docker，一条命令拉起全部依赖：

```bash
git clone https://github.com/DingdingOvO/webchat.git
cd webchat
docker compose up -d
```

打开 <http://localhost:8080> 即可。

### 方式二：本地开发

前置：**JDK 26**、**Node.js 22**、**MySQL 8.4 / MongoDB 8.3 / Redis 7.4**（或用 `deploy/scripts/docker-db-only.yaml` 只起数据库）。

```bash
# 1. 只启动依赖服务
docker compose -f deploy/scripts/docker-db-only.yaml up -d

# 2. 后端（默认 :8080）
cd packages/server && ./mvnw spring-boot:run

# 3. 前端（热更新，默认 :3000，代理到后端）
cd packages/frontend && npm install && npm run dev
```

> 环境变量与详细配置见 [docs/quickstart](docs/quickstart/README.md)。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | React 19 · TypeScript 5 · Webpack 5 · React Router 6 · CSS Modules · Biome |
| 后端 | Java 26 · Spring Boot 3.5 · Spring Security (JWT) · WebSocket · Maven |
| 存储 | MySQL 8.4（用户/好友/群组） · MongoDB 8.3（消息本体） · Redis 7.4（热缓存/在线状态/Pub-Sub） |
| 质量 | Spotless · Checkstyle · PMD · SpotBugs+FindSecBugs · JaCoCo · CodeQL · Gitleaks |
| 交付 | GitHub Actions · Docker · Kubernetes · GHCR |

## 项目结构

```
webchat/
├── packages/
│   ├── frontend/            # React 19 + TypeScript + Webpack
│   │   ├── src/
│   │   │   ├── pages/       # 落地页 / 登录注册 / 聊天 / 设置 / 文档 / 反馈
│   │   │   ├── components/  # 通用组件与图标
│   │   │   ├── api/         # 后端接口封装
│   │   │   └── global.css   # 设计令牌（唯一色值来源）
│   │   └── Dockerfile
│   └── server/              # Spring Boot 3.5 后端
│       └── src/main/java/com/webchat/
├── deploy/                  # 部署资产（Kubernetes / 云平台 / 数据库脚本）
├── docs/                    # 多页文档（概览 / 快速开始 / API / 设计 / 技术 / 部署）
├── Dockerfile               # 后端镜像
├── docker-compose.yaml      # 一键启动（推荐入口）
└── DEPLOY.md                # 权威部署文档
```

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/overview](docs/overview/README.md) | 项目介绍、核心功能、系统架构 |
| [docs/quickstart](docs/quickstart/README.md) | 环境准备、启动方式、第一次聊天 |
| [docs/api](docs/api/README.md) | 认证、用户、好友、群组、消息、WebSocket、错误码 |
| [docs/design](docs/design/README.md) | 设计语言「清明 v3」—— 色板、排版、间距、组件规范 |
| [docs/tech](docs/tech/README.md) | 前后端技术、存储层、数据流 |
| [DEPLOY.md](DEPLOY.md) | 生产部署完整指南 |

## 开发约定

- **提交信息**遵循 [Conventional Commits](https://www.conventionalcommits.org/)（`feat:` / `fix:` / `chore:` …），由 `lefthook` + `commitlint` 在本地拦截。
- **代码风格**：前端由 Biome 统一格式化与检查；后端由 Spotless(google-java-format) 约束。
- **设计改动**必须先查阅 [`docs/design/DESIGN-LANGUAGE.md`](docs/design/DESIGN-LANGUAGE.md)，禁止硬编码色值与间距。
- **主分支受保护**：所有改动须经 Pull Request，并通过全部必需状态检查后方可合并。

## 许可证

本项目为学习与演示用途。许可证信息见仓库设置。

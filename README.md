<div align="center">

# WebChat

**打开浏览器就能用的聊天工具 —— 不用下载，不用注册一堆信息。**

私聊、群聊、历史记录，都在一个地方。

[![Quality](https://github.com/DingdingOvO/webchat/actions/workflows/quality.yml/badge.svg)](https://github.com/DingdingOvO/webchat/actions/workflows/quality.yml)
[![Build & Deploy](https://github.com/DingdingOvO/webchat/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/DingdingOvO/webchat/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[功能](#功能) · [快速开始](#快速开始) · [技术栈](#技术栈) · [项目结构](#项目结构) · [文档](#文档)

</div>

---

## 功能

| 功能 | 说明 |
| --- | --- |
| **实时消息** | WebSocket 长连接，消息即发即到，不用刷新页面 |
| **私聊与群聊** | 两种会话在同一列表里，切换不用找 |
| **历史记录** | 消息落库持久化，换设备打开也还在，可往回翻 |
| **好友系统** | 按昵称搜索、发好友申请、同意或拒绝 |
| **在线状态** | 谁在线一眼可见，基于 Redis 维护状态与心跳 |
| **多端一致** | 深色 / 浅色主题、响应式布局，桌面与手机都能用 |

---

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
git clone https://github.com/DingdingOvO/webchat.git
cd webchat
docker compose up -d --build
```

访问 <http://localhost:8080> 即可。

写入演示数据（可选）：

```bash
python3 scripts/seed_demo.py
# 创建 demo/demo1234、alice/1234、bob/1234 三个账号
```

### 方式二：本地开发

前置条件：**JDK 26**、**Node.js 22+**、**Docker**。

```bash
# 1. 只起中间件（MySQL / MongoDB / Redis）
docker compose -f deploy/scripts/docker-db-only.yaml up -d

# 2. 起后端（:8080）
cd packages/server && ./mvnw spring-boot:run

# 3. 起前端（:3000，带热更新）
cd packages/frontend && npm install && npm run dev
```

### 方式三：部署到服务器

见 [DEPLOY.md](DEPLOY.md) —— 覆盖 Docker Compose、Kubernetes、云平台（Railway / Render / Fly.io / Heroku / Zeabur）三类方式。

---

## 技术栈

| 层 | 技术 | 说明 |
| --- | --- | --- |
| **前端** | React 19 · TypeScript · Webpack 5 | 路由级代码分割，CSS Modules + 设计令牌 |
| **后端** | Spring Boot 3.5 · Java 26 | WebSocket 实时通信，REST API |
| **元数据** | MySQL 8.4 | 用户、好友关系、群组 |
| **消息存储** | MongoDB 8.3 | 聊天消息，按会话分片 |
| **缓存 / 状态** | Redis 7.4 | 热点缓存、在线状态、Pub/Sub 跨实例广播 |

**质量门禁**

| 范围 | 工具 |
| --- | --- |
| 后端 | Spotless · Checkstyle · PMD · SpotBugs(+FindSecBugs) · JaCoCo · JUnit |
| 前端 | TypeScript · Biome · Stylelint · typos（拼写） |
| 仓库 | Gitleaks（密钥扫描）· CodeQL（SAST）· Commitlint |

以上检查全部绑定到 CI，`main` 分支受保护：需通过全部检查 + 1 人评审。

---

## 项目结构

```
webchat/
├── packages/
│   ├── frontend/           React 前端
│   │   └── src/
│   │       ├── api/        统一 API 客户端（含鉴权头）
│   │       ├── components/ 可复用组件
│   │       ├── context/    Auth / Theme 全局状态
│   │       ├── pages/      页面组件
│   │       └── global.css  设计令牌（浅色 + 深色）
│   └── server/             Spring Boot 后端
│       └── src/main/java/.../
│           ├── controller/ REST 接口
│           ├── service/    业务逻辑
│           ├── repository/ MySQL 访问
│           ├── document/   MongoDB 文档模型
│           └── websocket/  实时通信
├── deploy/
│   ├── cloud/              云平台配置
│   ├── kubernetes/         K8s 清单
│   └── scripts/            仅中间件的 Compose 配置
├── docs/                   文档（见下）
├── scripts/                辅助脚本（单端口服务、演示数据）
├── docker-compose.yaml     全栈一键启动
├── Dockerfile
└── DEPLOY.md               部署指南
```

---

## 文档

| 文档 | 内容 |
| --- | --- |
| [DEPLOY.md](DEPLOY.md) | 三类部署方式详解、环境变量、反向代理与 HTTPS |
| [docs/quickstart](docs/quickstart/README.md) | 本地开发上手 |
| [docs/design](docs/design/README.md) | 设计语言：色板、字体、间距、组件规范 |
| [docs/tech](docs/tech/README.md) | 前后端技术、存储层、数据流 |
| [docs/deploy](docs/deploy/README.md) | 部署方式索引 |

---

## 开发约定

- **提交信息**遵循 [Conventional Commits](https://www.conventionalcommits.org/)，由 Commitlint 校验
- **改代码前先跑质量检查**，别把问题留给 CI：

  ```bash
  cd packages/server   && ./mvnw verify        # 后端
  cd packages/frontend && npm run quality      # 前端
  ```

- **前端请求一律走 `src/api/`**，不要在组件里直接 `fetch` —— 鉴权头与错误处理统一在那里
- **颜色一律用 CSS 变量**（`var(--bg)` 等），不要写字面值，否则深色模式会错
- **不要提交密钥**，Gitleaks 会拦截

---

## 许可证

[MIT](LICENSE)

# 概览

WebChat 是一个全栈即时通讯系统，基于 **Java 26 + Spring Boot 3.5** 后端与 **React 19 + TypeScript** 前端构建。采用 **MySQL + MongoDB + Redis** 三层存储架构，支持实时私聊、群组聊天、好友管理、在线状态同步等核心通讯功能。

---

## 什么是 WebChat

WebChat 的定位是**可自托管的轻量级即时通讯方案**。适合技术团队内部沟通、开源项目嵌入、或个人学习全栈架构的参考实现。

| 指标 | 数值 |
|------|------|
| 存储引擎 | 3 (MySQL + MongoDB + Redis) |
| API 端点 | 15+ REST + 4 WebSocket 事件 |
| 消息延迟 | < 50ms (同级网络) |
| 认证方式 | JWT (HS512) |
| 前端体积 | ~442 KB (gzip ~120 KB) |

### 项目结构

```
webchat/
├── packages/
│   ├── frontend/        # React 19 + TypeScript 前端
│   │   ├── src/
│   │   │   ├── pages/        # 页面级组件
│   │   │   ├── components/   # 可复用组件
│   │   │   ├── context/      # React Context (Auth, WebSocket)
│   │   │   ├── hooks/        # 自定义 Hooks
│   │   │   ├── types/        # TypeScript 类型定义
│   │   │   └── utils/        # 工具函数
│   │   └── dist/             # 构建产物
│   └── server/              # Java Spring Boot 后端
│       └── src/main/java/com/webchat/
│           ├── controller/   # REST 控制器
│           ├── service/      # 业务逻辑层
│           ├── repository/   # 数据访问层
│           ├── model/        # JPA 实体
│           ├── dto/          # 数据传输对象
│           ├── config/       # Spring 配置
│           ├── websocket/    # WebSocket 处理
│           └── util/         # 工具类 (JWT, 异常)
├── docs/                   # 文档
└── deploy/                 # 部署脚本
```

---

## 核心功能

### 💬 实时私聊
WebSocket 长连接，消息毫秒级推送。按对话键（conversationKey）聚合消息，支持历史消息回拉。

**技术实现**：
- 前端建立 WebSocket 连接后持久化维护
- 消息通过 JSON 协议传输，自动去重（message ID + 时间戳兜底）
- 发送时乐观渲染，不等待服务端确认

### 👥 群组聊天
创建群组、邀请成员（继承好友关系），群内消息通过 Redis Pub/Sub 实时广播。

**技术实现**：
- 群成员列表存储在 MySQL（`chat_group_members` 表）
- 群消息发送时，后端通过 `RedisPubSubConfig` 广播到该群所有在线成员
- 群组消息的 conversationKey 格式为 `group:{groupId}`

### 🔍 好友管理
搜索用户 → 发送好友请求 → 接受/拒绝 → 好友列表。好友请求状态持久化在 MySQL。

**完整流程**：
1. 搜索用户：`GET /api/users/search?q=关键字`
2. 发送请求：`POST /api/users/friend-request { "userId": 2 }`
3. 对方查看待处理请求：`GET /api/users/friend-requests/pending`
4. 接受/拒绝：`POST /api/users/friend-requests/{id}/accept|reject`
5. 建立好友关系后：`GET /api/users/friends` 获取列表

### 📦 热冷分级存储
消息同时写入 Redis（热缓存）和 MongoDB（持久层）。查询时优先读 Redis，未命中回源 MongoDB。

**存储策略**：
| 层级 | 存储 | TTL | 容量 |
|------|------|-----|------|
| 热 | Redis List | 7 天 | 每会话 100 条 |
| 冷 | MongoDB (conversationKey 索引) | 永久 | 无上限 |

### 🟢 在线状态
WebSocket 连接后自动广播上线，断线（`onclose`）自动标记离线。状态存储在 Redis 中。

**状态流转**：
```
连接建立 → Redis SET user:{id}:online → 广播 online:true
连接断开 → Redis DEL  → 广播 online:false
```

### ✏️ 输入状态
对方正在输入实时提示。利用 Redis 5 秒 TTL 临时缓存 + WebSocket 推送。

**实现细节**：
- 输入时每 3 秒发送一次 typing 事件（防抖）
- Redis 写入 `user:{id}:typing:{convKey}` TTL 5 秒
- 接收方收到事件后展示"正在输入..."，5 秒无更新自动消失

---

## 系统架构

```
┌────────────────────────────────────────────────────────┐
│                    表示层 (React)                       │
│  Pages: Landing · Login/Register · Chat · Docs         │
│  Components: Sidebar · Panel · MessageList · Modal     │
│  State: AuthContext · WebSocketContext · Hooks         │
└──────────────┬─────────────────────────────────────────┘
               │ HTTP REST (JSON)    │ WebSocket (JSON)
               ▼                     ▼
┌────────────────────────────────────────────────────────┐
│                  服务层 (Spring Boot)                    │
│  Controllers: Auth · Chat · Group · User · Settings    │
│  Services:    AuthService · ChatService                │
│               GroupService · UserService               │
│  WebSocket:   ChatWebSocketHandler · SessionManager    │
│  Security:    JWT Filter · BCrypt · CORS               │
└────┬──────────────┬─────────────────────┬──────────────┘
     │ JDBC         │ Mongo Driver        │ Lettuce (Redis)
     ▼              ▼                     ▼
┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐
│ MySQL 8.4 │ │Mongo 8.3 │ │       Redis 7.4              │
│ 用户      │ │ 消息冷存 │ │ 热消息 · 在线状态 · Pub/Sub    │
│ 好友关系  │ │ 持久化   │ │ 输入状态 · 未读计数            │
│ 群组      │ │          │ │                              │
└──────────┘ └──────────┘ └──────────────────────────────┘
```

### 各层职责

| 层 | 技术 | 职责 |
|----|------|------|
| 表示层 | React 19 + HashRouter | UI 渲染、状态管理、WebSocket 客户端 |
| 服务层 | Spring Boot 3.5 + Java 26 | REST API、WebSocket 处理、业务逻辑、JWT 认证 |
| 元数据存储 | MySQL 8.4 | 用户账号、好友关系、群组信息、群成员 |
| 消息存储 | MongoDB 8.3 | 所有历史消息持久化（按 conversationKey 索引） |
| 热缓存 | Redis 7.4 | 热消息队列、在线状态位图、输入状态 TTL、未读计数、Pub/Sub 消息广播 |

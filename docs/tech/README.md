# 技术栈

WebChat 的技术选型围绕三个目标：**实时性**（WebSocket）、**可靠性**（三层存储）、**可维护性**（类型安全 + 分层架构）。

---

## 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架、并发渲染 |
| TypeScript | 5.5 | 类型安全、IDE 智能提示 |
| Webpack | 5.108 | 构建打包、CSS Modules、HMR |
| React Router | 6 | HashRouter 客户端路由 |
| Fluent UI Icons | — | 自绘 SVG 图标（Fluent Design 风格） |
| marked | 18 | Markdown 渲染（文档页） |
| CSS Modules | — | 样式隔离（.module.css） |

### 架构要点

- **HashRouter**：使用 hash-based 路由，避免预览环境丢 query params
- **patchFetch**：全局 fetch 拦截，自动追加 sandbox 代理参数
- **CSS Modules**：每个组件独立样式，无全局污染
- **Context + Hooks**：Auth / WebSocket 状态通过 React Context 传递

---

## 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 26 | 运行时 |
| Spring Boot | 3.5.16 | 应用框架（REST + WebSocket + JPA） |
| Hibernate | 6.6 | MySQL ORM |
| Spring Data MongoDB | — | MongoDB 消息存取 |
| Spring Data Redis | — | 热消息缓存 + Pub/Sub |
| JWT (jjwt) | 0.12.6 | Token 认证 (HS512) |
| BCrypt (Spring Security Crypto) | — | 密码加密 |
| Maven | 3.9 | 构建、依赖管理 |

### 包结构

```
com.webchat
├── config/        # 全局配置 (CORS, WebSocket, Redis, Jackson)
├── controller/    # 5 个 REST 控制器
├── service/       # 4 个业务服务
├── repository/    # 5 个 JPA/MongoDB Repository
├── model/         # 5 个 JPA 实体
├── dto/           # 7 个数据传输对象
├── websocket/     # WebSocket 处理器 + Session 管理器
├── kvstore/       # Redis 状态存储抽象
└── util/          # JWT 工具、业务异常
```

---

## 存储层

### 三级存储架构

```
消息发送 → 并行写入
           ├── Redis (热消息)   TTL 7 天，每会话 100 条
           └── MongoDB (持久化)  永久存储，conversationKey 索引
消息读取 → 优先 Redis → 未命中 → 回源 MongoDB → 回填 Redis
```

| 数据库 | 版本 | 角色 | 存储内容 |
|--------|------|------|---------|
| MySQL | 8.4 | 元数据 | 用户、好友关系、群组、群成员 |
| MongoDB | 8.3 | 消息冷存 | 全部历史消息（按 `conversationKey` 索引） |
| Redis | 7.4 | 热缓存 + 实时 | 热消息、在线状态、输入状态、未读计数、Pub/Sub |

### 消息分级存储策略详解

**为什么不用单一数据库？**

| 方案 | 问题 |
|------|------|
| 全放 MySQL | 消息量大时写入压力大，历史查询慢 |
| 全放 MongoDB | 热消息读频繁，延迟敏感 |
| 全放 Redis | 内存成本高，数据量受限 |

**三级存储解决**：
- Redis：毫秒级读写，覆盖 99% 的日常消息查询（最近 7 天）
- MongoDB：无上限持久化，索引优化后查询平均 < 50ms
- MySQL：只存结构化元数据，数据量小，关系查询方便

---

## 数据流

### 私聊消息流

```
发送方 ── WebSocket ──→ Spring Boot
                           │
                     并行写入 Redis + MongoDB
                           │
                     查找接收方 WebSocket Session
                           │
                     直接推送 ──→ 接收方
```

### 群聊消息流

```
发送方 ── WebSocket ──→ Spring Boot
                           │
                     并行写入 Redis + MongoDB
                           │
                     Redis Pub/Sub (channel: group:{id})
                           │
                     订阅该频道的所有实例
                           │
                     推送至群成员 WebSocket ──→ 各接收方
```

### 在线状态流

```
用户 WebSocket 连接
       │
  Redis SET user:{id}:online
       │
  广播 online:true → 好友接收
       │
  用户断开 WebSocket
       │
  Redis DEL user:{id}:online
       │
  广播 online:false → 好友接收
```

---

## 主要依赖版本约束

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Java | 26 | pom.xml `<release>26</release>` |
| Spring Boot | 3.5.16 | parent POM 锁定 |
| MySQL | 8.4 | 驱动兼容 8.x |
| MongoDB | 8.3 | 驱动兼容 8.x |
| Redis | 7.4 | Lettuce 客户端 |
| Node.js | 22 | Webpack 5 构建要求 |
| npm | 10 | lockfile v3 |

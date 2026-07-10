# 技术栈

---

## 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5.5 | 类型安全 |
| Webpack | 5.108 | 构建 + HMR + CSS Modules |
| React Router | 6 | 客户端路由 |
| Fluent UI Icons | — | 图标库 |

---

## 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 26 | 运行时 |
| Spring Boot | 3.5.16 | REST + WebSocket + JPA |
| JPA / Hibernate | — | MySQL ORM |
| Spring Data MongoDB | — | MongoDB 消息存储 |
| Spring Data Redis | — | 热缓存 + Pub/Sub |
| JWT (jjwt) | 0.12.6 | 登录认证 |
| Spring Security Crypto | — | BCrypt 密码加密 |
| Maven | 3.9 | 构建工具 |

---

## 存储层

| 数据库 | 角色 | 数据 |
|--------|------|------|
| MySQL 8.4 | 元数据 | 用户、好友关系、群组、群成员 |
| MongoDB 8.3 | 消息冷存 | 聊天记录（带 conversationKey 索引） |
| Redis 7.4 | 热缓存 + 实时 | 热消息（每会话 100 条）、在线状态、输入状态、未读计数、Pub/Sub |

**消息分级存储策略**：发送消息时同时写入 Redis（热）和 MongoDB（持久）。查询历史时优先读取 Redis，未命中则回源 MongoDB 并回填缓存。

---

## 数据流

```
用户发送消息
  │
  ├── React 前端 ──→ WebSocket ──→ Spring Boot
  │
  └── 并行写入
        │
        ├── Redis（热缓存）
        └── MongoDB（持久化）
  │
  └── Redis Pub/Sub ──→ 接收方前端
```

- **私聊消息**：通过 `WebSocketSessionManager` 直接推送到目标用户的 WebSocket 连接
- **群聊消息**：通过 Redis Pub/Sub 广播到所有群成员实例

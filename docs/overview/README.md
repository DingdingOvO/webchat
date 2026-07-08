# WebChat 文档

WebChat 是一款基于 Web 的即时通讯系统，支持实时私聊、群组聊天、好友管理、在线状态同步和消息分级存储。

- **前端**: React 19 + TypeScript + Webpack 5
- **后端**: Java 26 + Spring Boot 3.5
- **存储**: MySQL 8.4 + MongoDB 8.3 + Redis 7.4

---

## 什么是 WebChat

WebChat 是一个全栈即时通讯应用，前端使用 React 19 + TypeScript + Webpack 5，后端基于 Java 26 + Spring Boot 3.5，数据存储采用 MySQL + MongoDB + Redis 三层架构。支持实时私聊、群组聊天、好友管理、在线状态同步等核心功能。

| 指标 | 数值 |
|------|------|
| 存储引擎 | 3 (MySQL + MongoDB + Redis) |
| API 模块 | 7 |
| 消息延迟 | < 50ms |

---

## 核心功能

### 💬 实时私聊
WebSocket 长连接，消息毫秒级推送。支持文字消息，按会话键聚合。

### 👥 群组聊天
创建群组、邀请成员，群内消息通过 Redis Pub/Sub 实时广播。

### 🔍 好友管理
搜索用户、发送好友请求、接受/拒绝，好友列表实时同步在线状态。

### 📦 热冷分级存储
最近 100 条消息在 Redis 热缓存，历史消息持久化到 MongoDB，查询秒级回源。

### 🟢 在线状态
WebSocket 连接后自动广播在线状态，断线自动标记离线，Redis 持久化状态。

### ✏️ 输入状态
对方正在输入实时提示，通过 Redis 临时缓存 + WebSocket 推送。

---

## 系统架构

```
┌─────────────────────────────────────────┐
│             表示层                       │
│  React 19 │ CSS Modules │ WebSocket     │
│  React Router                            │
└──────────────┬──────────────────────────┘
               ↓ HTTP / WebSocket
┌──────────────┴──────────────────────────┐
│             服务层                       │
│  Spring Boot 3.5 │ REST API │ WebSocket │
│  JWT Auth │ Redis Pub/Sub               │
└──────────────┬──────────────────────────┘
               ↓ JDBC / Mongo Driver / Redis
┌──────────────┴──────────────────────────┐
│             存储层                       │
│  MySQL 8.4 │ MongoDB 8.3 │ Redis 7.4        │
└─────────────────────────────────────────┘
```

各层职责明确：
- **MySQL**: 存储用户、好友关系、群组等元数据
- **MongoDB**: 持久化消息本体
- **Redis**: 热消息缓存、在线状态、输入状态、未读计数、Pub/Sub 实时推送

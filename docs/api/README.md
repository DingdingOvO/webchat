# API 参考

所有 API（除注册/登录外）需要在 HTTP Header 中携带 JWT token：

```
Authorization: Bearer <token>
```

---

## 认证

### 注册

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "alice",      // 必填，3-50 字符
  "password": "1234",        // 必填，4-100 字符
  "nickname": "爱丽丝"       // 可选
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "userId": 1,
  "username": "alice",
  "nickname": "爱丽丝"
}
```

### 登录

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "alice",
  "password": "1234"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "userId": 1,
  "username": "alice",
  "nickname": "爱丽丝"
}
```

### 当前用户信息

```
GET /api/auth/me
```

**Response 200:**
```json
{
  "id": 1,
  "username": "alice",
  "nickname": "爱丽丝",
  "avatar": ""
}
```

---

## 用户与好友

### 搜索用户

```
GET /api/users/search?q=关键字
```

**Response 200:**
```json
[
  {
    "id": 2,
    "username": "bob",
    "nickname": "鲍勃",
    "online": true,
    "avatar": null
  }
]
```

### 好友列表

```
GET /api/users/friends
```

### 发送好友请求

```
POST /api/users/friend-request
```

```json
{ "userId": 2 }
```

### 查看待处理请求

```
GET /api/users/friend-requests/pending
```

### 接受好友请求

```
POST /api/users/friend-requests/{id}/accept
```

### 拒绝好友请求

```
POST /api/users/friend-requests/{id}/reject
```

### 最近联系人

```
GET /api/users/contacts
```

返回最近交互过的联系人 ID 集合（上限 50 条）。

---

## 群组

### 创建群组

```
POST /api/groups
```

```json
{
  "name": "技术部群聊",
  "memberIds": [1, 2, 3]
}
```

**Response 200:**
```json
{
  "id": 1,
  "name": "技术部群聊",
  "ownerId": 1,
  "createdAt": "2026-07-07T12:00:00Z"
}
```

### 我的群组列表

```
GET /api/groups
```

### 群成员列表

```
GET /api/groups/{id}/members
```

---

## 消息

### 获取历史消息

```
GET /api/chat/messages?convKey=X
```

`convKey` 是会话键，格式为：
- `P2P:{minUserId}-{maxUserId}` — 私聊
- `GROUP:{groupId}` — 群聊

消息优先从 Redis 热缓存读取，未命中则回源 MongoDB。

**Response 200:**
```json
[
  {
    "id": "66f1a...",
    "senderId": 1,
    "senderName": "爱丽丝",
    "receiverId": 2,
    "type": "P2P",
    "content": "你好",
    "conversationKey": "P2P:1-2",
    "createdAt": "2026-07-07T12:00:00Z"
  }
]
```

---

## 设置

### 修改用户名

```
PUT /api/users/profile/username
```

```json
{ "username": "new-alice" }
```

### 上传头像

```
POST /api/users/profile/avatar
```

```json
{ "avatar": "data:image/png;base64,..." }
```

base64 编码图像，大小限制 512KB。

### 修改密码

```
PUT /api/users/profile/password
```

```json
{
  "oldPassword": "1234",
  "newPassword": "5678"
}
```

---

## WebSocket

### 连接

```
ws://host:port/ws/chat?token=<jwt_token>
```

### 发送消息（Client → Server）

```json
// 私聊
{ "type": "p2p",  "receiverId": 2, "content": "你好" }

// 群聊
{ "type": "group", "receiverId": 1, "content": "大家好" }

// 输入状态
{ "type": "typing", "receiverId": 2 }

// 已读回执
{ "type": "read", "conversationKey": "P2P:1-2" }
```

### 接收消息（Server → Client）

```json
// 新消息
{
  "action": "message",
  "data": {
    "senderId": 1, "senderName": "爱丽丝",
    "receiverId": 2, "type": "P2P",
    "content": "你好", "conversationKey": "P2P:1-2",
    "createdAt": "2026-07-07T12:00:00Z"
  }
}

// 在线状态变更
{ "action": "online", "userId": 2, "nickname": "鲍勃", "online": true }

// 正在输入
{ "action": "typing", "userId": 2, "conversationKey": "P2P:1-2" }
```

### WebSocket 事件汇总

| 方向 | Action/Type | 说明 |
|------|-------------|------|
| C→S | `p2p` | 发送私聊消息 |
| C→S | `group` | 发送群聊消息 |
| C→S | `typing` | 输入状态提示 |
| C→S | `read` | 已读回执 |
| S→C | `message` | 新消息推送 |
| S→C | `online` | 好友在线/离线通知 |
| S→C | `typing` | 对方正在输入 |

---

## 错误处理

| 状态码 | 含义 | 说明 |
|--------|------|------|
| `200` | 成功 | 请求正常处理 |
| `400` | 请求参数错误 | 缺少字段、格式错误、用户名重复等 |
| `401` | 未授权 | Token 缺失或无效 |
| `404` | 资源不存在 | 用户/群组/好友请求不存在 |
| `409` | 冲突 | 已发送好友请求、已是好友等 |
| `500` | 服务器内部错误 | 请查看后端日志 |

错误响应体格式：

```json
{ "error": "用户名已被使用" }
```

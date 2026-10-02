# WebChat 外网部署说明

## 分享链接

https://afaa6b138c1465e70.app.workbuddy.host

## 测试账号

| 用户名 | 密码 | 昵称 |
| --- | --- | --- |
| demo | demo1234 | 演示用户 |
| alice | 1234 | 爱丽丝 |
| bob | 1234 | 鲍勃 |

预置群组：**产品讨论组**（3 人）

## 架构

单端口部署，`scripts/serve.py` 在 **3000** 端口同时承担三件事：

| 路径 | 行为 |
| --- | --- |
| `/` 其余路径 | 托管 `packages/frontend/dist` 静态产物，未知路径回退 `index.html`（SPA 路由） |
| `/api/*` | HTTP 反向代理到后端 `127.0.0.1:8080` |
| `/ws/chat` | 原始 socket 双向隧道到后端 8080（WebSocket 升级） |

后端 Spring Boot 跑在 **8080**（仅本机），由 `scripts/serve.py` 统一对外。

## 关键修复：网关改写 Authorization

部署平台（CloudStudio）网关会用自己的 JWT **覆盖**请求里的 `Authorization` 头，
导致应用自身签发的 token 永远到不了后端 —— 表现为本地一切正常、公网全部 401。

解决方式是改用应用自定义头：

- 后端所有受保护接口接收 `X-Auth-Token`，优先于 `Authorization` 解析
  （`extractToken(xAuth, auth)`，见各 Controller）。
- 前端 14 处请求同时发送 `Authorization: Bearer <token>` 与 `X-Auth-Token: <token>`。
- `scripts/serve.py` 的 HTTP 代理**必须透传** `X-Auth-Token`，否则修复失效。

> 后续若新增受保护接口或新的 fetch 调用，记得同样带上 `X-Auth-Token`。

## 关键修复：代理的 HTTP 分帧（「网络连接失败」根因）

**症状**：公网偶发 500，前端表现为「网络连接失败」。本地 `curl` 与本地浏览器都复现不了。

**根因**：`scripts/serve.py` 早期继承了 `BaseHTTPRequestHandler` 默认的 `protocol_version = "HTTP/1.0"`，
它会隐式补 `Connection: close`。而部署平台网关**复用长连接**，当下一个响应字节到达时，
网关把残留字节判定为非法帧并抛错：

```
Parse Error: Data after `Connection: close`
```

之所以只在公网、只在最大的那个响应（`convKey=group:1`，5 条消息）上出现：
小响应恰好能被网关容错，大响应越过缓冲边界就暴露了。

**修复**（`scripts/serve.py`）：

1. 显式声明 `protocol_version = "HTTP/1.1"`，配合已发送的 `Content-Length` 构成合法 keep-alive 帧；
2. `_is_websocket()` 收紧为「路径以 `/ws/chat` 开头 **且** `Upgrade: websocket`
   **且** `Connection` 含 `upgrade`」，避免网关在 `/api` 请求上带的 `Upgrade` 头把普通请求劫持进隧道；
3. 隧道走完后置 `self.close_connection = True`，因为该连接已被独占，不能再回到 keep-alive 复用；
4. 响应写完 `self.wfile.flush()`，明确禁止残留字节。

> 判断技巧：这类「本地好、公网坏」且带不定时性的问题，**优先怀疑代理的 HTTP 分帧**，
> 而不是后端逻辑。用浏览器抓 500 的 **response body**，网关的报错文本会直接写在里面。

## 本地启动

```bash
./scripts/run_prod.sh          # 后端 8080 + 单端口 3000
```

依赖中间件（MySQL 3306 / MongoDB 27017 / Redis 6379）需先启动。

## 已验证项（公网端到端）

- [x] 首页 / 静态资源 / SPA 路由回退
- [x] 注册、登录、`/api/auth/me`
- [x] 好友列表、群列表、pending 好友请求
- [x] 历史消息读取（Redis 热缓存 → MongoDB 回源）
- [x] 浏览器登录 → 会话列表渲染 → 打开群会话 → 发送消息
- [x] WebSocket `wss://` 经网关建立
- [x] P2P 实时投递（demo → alice）
- [x] 消息持久化（接口回读确认）
- [x] 浏览器控制台零错误

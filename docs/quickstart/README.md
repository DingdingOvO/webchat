# 快速开始

两种启动方式：**Docker Compose 一键启动**（推荐）或 **手动启动各组件**。

---

## 环境准备

### Docker 方式（推荐）

```bash
docker --version              # >= 24.0
docker compose version        # >= 2.20
```

满足即可，无需安装任何运行时。

### 手动方式

```bash
java -version                 # >= 26 (建议用 sdkman 或直接下载)
mvn --version                 # >= 3.9 (Maven)
node --version                # >= 22
npm --version                 # >= 10
redis-server --version        # >= 7.4
mysql --version               # >= 8.4
mongod --version              # >= 8.3
```

---

## Docker Compose 一键启动

```bash
git clone https://github.com/DingdingOvO/webchat.git
cd webchat

# 构建并启动所有服务（后端 + 前端 + MySQL + MongoDB + Redis）
docker compose up -d --build

# 查看运行状态
docker compose ps
# 预期输出示例：
# NAME                STATUS
# webchat-mysql       healthy
# webchat-mongodb     running
# webchat-redis       running
# webchat-backend     running
# webchat-frontend    running

# 查看实时日志
docker compose logs -f

# 打开浏览器
open http://localhost:3000
```

首次启动会拉取镜像并构建，耗时约 2-5 分钟（取决于网络）。

### Docker Compose 文件说明

| 文件 | 用途 |
|------|------|
| `docker-compose.yaml` | 标准部署（前后端 + 3 数据库） |
| `deploy/scripts/docker-db-only.yaml` | 仅启动数据库（用于本地开发） |

---

## 手动启动

### 1. 启动数据库

```bash
# 方式 A：Docker 只跑数据库（省事）
docker compose -f deploy/scripts/docker-db-only.yaml up -d

# 方式 B：本地安装（已安装的情况下）
redis-server --daemonize yes
sudo service mysql start
sudo mongod --dbpath /data/db --fork --logpath /tmp/mongod.log
```

### 2. 编译后端

```bash
cd webchat/server

# 编译（跳过测试和代码检查）
mvn clean package -DskipTests -Dcheckstyle.skip -Dpmd.skip -Dspotbugs.skip

# 运行（终端 1）
java -jar target/webchat-server-1.0.0.jar
# → http://localhost:8080
```

后端会启动 Spring Boot 并自动执行 JPA DDL 建表。

### 3. 编译前端

```bash
cd webchat/packages/frontend

npm install
npm run build    # 生产构建，输出到 dist/

# 或开发模式（带 HMR）
npm run dev      # → http://localhost:3000
```

开发模式下前端会 proxy API 请求到 `localhost:8080`（见 `webpack.config.cjs` proxy 配置）。

### 4. 部署前端产物

后端会自动服务前端构建产物：

```bash
# 将前端 dist 复制到后端静态资源目录
cp -r packages/frontend/dist/* packages/server/src/main/resources/static/

# 然后打包并启动后端
cd packages/server
mvn clean package -DskipTests
java -jar target/webchat-server-1.0.0.jar
```

或者直接通过 `server_spa.py` 快速预览：

```bash
# 需要前端 dist 已构建
python3 server_spa.py 8000 packages/frontend/dist
# → http://localhost:8000
```

---

## 第一次聊天

以下流程需要至少两个账号才能体验完整功能。

### 步骤 1：注册账号

1. 打开浏览器访问 `http://localhost:3000`（Docker）或 `http://localhost:8080`（手动）
2. 点击右上角「开始使用」或导航栏「登录」
3. 填写 **用户名 + 密码**，邮箱可选
4. 点���注册，自动跳转到聊天界面

### 步骤 2：添加好友

1. 点击侧栏顶部搜索图标 🔍
2. 输入另一个用户的用户名（需要先注册第二个账号）
3. 搜索结果中点击「加好友」
4. 另一个用户登录后会在顶部看到好友请求横幅
5. 点击 ✓ 接受请求

### 步骤 3：开始聊天

1. 好友接受后，在「消息」标签页可以看到新会话
2. 点击会话进入聊天
3. 底部输入框输入文字，按 Enter 发送
4. 消息会实时出现在对方聊天窗口

### 步骤 4：创建群组

1. 点击侧栏顶部「建群」按钮 ➕
2. 输入群组名称
3. 从好友列表中勾选成员
4. 创建后在「联系人」标签页可以看到群组
5. 点击群组开始群聊

### 步骤 5：设置个人资料

1. 点击侧栏顶部的用户头像或昵称进入设置页
2. 可以修改用户名、头像（base64）、密码

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 启动失败 `端口被占用` | 8080/3000 端口已被其他进程使用 | `lsof -ti:8080 \| xargs kill -9` |
| 注册返回 `用户名已存在` | 已注册过同名用户 | 换个用户名 |
| WebSocket 连接失败 | 后端未启动或端口不对 | 确认 `java -jar` 已在运行 |
| 前端页面白屏 | 构建产物未更新 | `npm run build` 重新构建 |

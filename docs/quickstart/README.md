# 快速开始

推荐使用 Docker Compose 一键启动全部服务，也可以手动启动各组件。

---

## 环境准备

### Docker 方式（推荐）

```bash
docker --version              # >= 24.0
docker compose version        # >= 2.20
```

### 手动方式

```bash
redis-server --version        # >= 7.0
mysql --version               # >= 8.0
mongod --version              # >= 7.0
java -version                 # >= 26 (JVM)
mvn --version                 # >= 3.9 (Maven)
node --version                # >= 22 (前端构建)
npm --version                 # >= 10
```

---

## Docker 一键启动

无需安装任何运行时依赖，只需要 Docker：

```bash
git clone https://github.com/DingdingOvO/webchat.git
cd webchat

# 构建并启动所有服务（后端 + 前端 + MySQL + MongoDB + Redis）
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 打开浏览器
open http://localhost:3000
```

更多部署方式（Kubernetes、Helm、Swarm、Ansible、VPS 等 19 种）见 [DEPLOY.md](https://github.com/DingdingOvO/webchat/blob/main/DEPLOY.md)。

---

## 手动启动

### 1. 启动数据库

```bash
# 方式 A：Docker 只跑数据库（推荐）
docker compose -f deploy/scripts/docker-db-only.yaml up -d

# 方式 B：本地安装
redis-server --daemonize yes
sudo service mysql start
sudo mongod --dbpath /data/db --fork --logpath /tmp/mongod.log
```

### 2. 启动后端（终端 1）

```bash
cd webchat
mvn clean compile -q
mvn spring-boot:run
# → http://localhost:8080
```

### 3. 启动前端（终端 2）

```bash
cd webchat/frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 第一次聊天

1. 打开浏览器访问 `http://localhost:3000`
2. 点击「免费开始使用」注册账号（或使用测试账号 `alice / 1234`）
3. 登录后进入聊天界面，点击搜索按钮 🔍 搜索另一用户
4. 发送好友请求 → 对方接受 → 点击好友开始聊天
5. 也可以点击「创建群组」填入成员开始群聊

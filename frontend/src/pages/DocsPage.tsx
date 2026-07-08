import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './DocsPage.module.css';

const SECTIONS = [
  { id: 'overview',         title: '概览', children: [
    { id: 'what-is-webchat', title: '什么是 WebChat' },
    { id: 'features',        title: '核心功能' },
    { id: 'architecture',    title: '系统架构' },
  ]},
  { id: 'quickstart',       title: '快速开始', children: [
    { id: 'setup',           title: '环境准备' },
    { id: 'docker-deploy',   title: 'Docker 一键启动' },
    { id: 'manual-start',    title: '手动启动' },
    { id: 'first-chat',      title: '第一次聊天' },
  ]},
  { id: 'api',              title: 'API 参考', children: [
    { id: 'api-auth',        title: '认证' },
    { id: 'api-users',       title: '用户与好友' },
    { id: 'api-groups',      title: '群组' },
    { id: 'api-messages',    title: '消息' },
    { id: 'api-settings',    title: '设置' },
    { id: 'api-ws',          title: 'WebSocket' },
    { id: 'api-errors',      title: '错误处理' },
  ]},
  { id: 'design',           title: '设计语言', children: [
    { id: 'design-philosophy', title: '一、设计原则' },
    { id: 'design-colors',     title: '二、色板' },
    { id: 'design-typography', title: '三、字体' },
    { id: 'design-spacing',    title: '四、间距与布局' },
    { id: 'design-components', title: '五、组件规范' },
    { id: 'design-specs',      title: '六、设计稿尺寸' },
  ]},
  { id: 'tech',             title: '技术栈', children: [
    { id: 'tech-frontend',   title: '前端' },
    { id: 'tech-backend',    title: '后端' },
    { id: 'tech-storage',    title: '存储层' },
    { id: 'tech-arch',       title: '数据流' },
  ]},
  { id: 'deploy',           title: '部署指南', children: [
    { id: 'deploy-summary',  title: '部署方式总览' },
    { id: 'deploy-docker',   title: 'Docker 部署' },
    { id: 'deploy-k8s',      title: 'Kubernetes 部署' },
    { id: 'deploy-vps',      title: 'VPS 部署' },
  ]},
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('what-is-webchat');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      {/* =============== Topbar =============== */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link to="/" className={styles.topbarBrand}>
            <span className={styles.topbarLogo}>W</span>
            <span className={styles.topbarTitle}>WebChat</span>
            <span className={styles.topbarBadge}>文档 v1.0</span>
          </Link>
          <nav className={styles.topbarNav}>
            <Link to="/" className={styles.topbarLink}>首页</Link>
            <span className={styles.topbarLinkActive}>文档</span>
            <Link to="/login" className={styles.topbarLink}>登录</Link>
          </nav>
        </div>
      </header>

      <div className={styles.layout}>
        {/* =============== Left sidebar =============== */}
        <aside className={styles.sidebar}>
          <nav className={styles.sidebarNav}>
            {SECTIONS.map((section) => (
              <div key={section.id} className={styles.sidebarGroup}>
                <span className={styles.sidebarGroupTitle}>{section.title}</span>
                {section.children.map((child) => (
                  <a
                    key={child.id}
                    href={`#${child.id}`}
                    className={`${styles.sidebarItem} ${activeSection === child.id ? styles.sidebarItemActive : ''}`}
                    onClick={(e) => { e.preventDefault(); scrollTo(child.id); }}
                  >
                    {child.title}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* =============== Main content =============== */}
        <main className={styles.content}>
          <article className={styles.article}>

            {/* ============================================= */}
            {/* 概览                                          */}
            {/* ============================================= */}
            <section id="overview" className={styles.section}>
              <h1 className={styles.h1}>WebChat 文档</h1>
              <p className={styles.lead}>
                WebChat 是一款基于 Web 的即时通讯系统，支持实时私聊、群组聊天、
                好友管理、在线状态同步和消息分级存储。本文档涵盖架构说明、
                快速上手、API 参考、设计语言规范及技术栈详情。
              </p>
            </section>

            <section id="what-is-webchat" className={styles.section}>
              <h2 className={styles.h2}>什么是 WebChat</h2>
              <p className={styles.p}>
                WebChat 是一个全栈即时通讯应用，前端使用 React 19 + TypeScript + Webpack 5，
                后端基于 Java 21 + Spring Boot 3.4，数据存储采用 MySQL + MongoDB + Redis
                三层架构。支持实时私聊、群组聊天、好友管理、在线状态同步等核心功能。
              </p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>3</span>
                  <span className={styles.statLabel}>存储引擎</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>7</span>
                  <span className={styles.statLabel}>API 模块</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>50</span>
                  <span className={styles.statLabel}>ms 延迟</span>
                </div>
              </div>
            </section>

            <section id="features" className={styles.section}>
              <h2 className={styles.h2}>核心功能</h2>
              <div className={styles.featureGrid}>
                <div className={styles.fcard}>
                  <div className={styles.fcardIcon}>💬</div>
                  <h3 className={styles.fcardTitle}>实时私聊</h3>
                  <p className={styles.fcardDesc}>WebSocket 长连接，消息毫秒级推送。支持文字消息，按会话键聚合。</p>
                </div>
                <div className={styles.fcard}>
                  <div className={styles.fcardIcon}>👥</div>
                  <h3 className={styles.fcardTitle}>群组聊天</h3>
                  <p className={styles.fcardDesc}>创建群组、邀请成员，群内消息通过 Redis Pub/Sub 实时广播。</p>
                </div>
                <div className={styles.fcard}>
                  <div className={styles.fcardIcon}>🔍</div>
                  <h3 className={styles.fcardTitle}>好友管理</h3>
                  <p className={styles.fcardDesc}>搜索用户、发送好友请求、接受/拒绝，好友列表实时同步在线状态。</p>
                </div>
                <div className={styles.fcard}>
                  <div className={styles.fcardIcon}>📦</div>
                  <h3 className={styles.fcardTitle}>热冷分级存储</h3>
                  <p className={styles.fcardDesc}>最近 100 条消息在 Redis 热缓存，历史消息持久化到 MongoDB，查询秒级回源。</p>
                </div>
                <div className={styles.fcard}>
                  <div className={styles.fcardIcon}>🟢</div>
                  <h3 className={styles.fcardTitle}>在线状态</h3>
                  <p className={styles.fcardDesc}>WebSocket 连接后自动广播在线状态，断线自动标记离线，Redis 持久化状态。</p>
                </div>
                <div className={styles.fcard}>
                  <div className={styles.fcardIcon}>✏️</div>
                  <h3 className={styles.fcardTitle}>输入状态</h3>
                  <p className={styles.fcardDesc}>对方正在输入实时提示，通过 Redis 临时缓存 + WebSocket 推送。</p>
                </div>
              </div>
            </section>

            <section id="architecture" className={styles.section}>
              <h2 className={styles.h2}>系统架构</h2>
              <div className={styles.arch}>
                <div className={styles.archLayer}>
                  <div className={styles.archLabel}>表示层</div>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox}>React 19</span>
                    <span className={styles.archBox}>CSS Modules</span>
                    <span className={styles.archBox}>WebSocket</span>
                    <span className={styles.archBox}>React Router</span>
                  </div>
                </div>
                <div className={styles.archArrow}>↓ HTTP / WebSocket</div>
                <div className={styles.archLayer}>
                  <div className={styles.archLabel}>服务层</div>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox}>Spring Boot 3.4</span>
                    <span className={styles.archBox}>REST API</span>
                    <span className={styles.archBox}>WebSocket</span>
                    <span className={styles.archBox}>JWT Auth</span>
                    <span className={styles.archBox}>Redis Pub/Sub</span>
                  </div>
                </div>
                <div className={styles.archArrow}>↓ JDBC / Mongo Driver / Redis</div>
                <div className={styles.archLayer}>
                  <div className={styles.archLabel}>存储层</div>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox}>MySQL 8.0</span>
                    <span className={styles.archBox}>MongoDB 7</span>
                    <span className={styles.archBox}>Redis 7</span>
                  </div>
                </div>
              </div>
              <p className={styles.p}>
                各层职责明确：MySQL 存储用户、好友关系、群组等元数据；MongoDB 持久化消息本体；
                Redis 承载热消息缓存、在线状态、输入状态、未读计数及 Pub/Sub 实时推送。
              </p>
            </section>

            {/* ============================================= */}
            {/* 快速开始                                      */}
            {/* ============================================= */}
            <section id="quickstart" className={styles.section}>
              <h2 className={styles.h2}>快速开始</h2>
              <p className={styles.p}>
                推荐使用 Docker Compose 一键启动全部服务，也可以手动启动各组件。
              </p>
            </section>

            <section id="setup" className={styles.section}>
              <h3 className={styles.h3}>环境准备</h3>
              <p className={styles.p}>确保机器上安装以下依赖：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>依赖检查</div>
                <pre className={styles.code}><code>{`# Docker 方式（推荐）
docker --version              # >= 24.0
docker compose version        # >= 2.20

# 手动方式
redis-server --version        # >= 7.0
mysql --version               # >= 8.0
mongod --version              # >= 7.0
java -version                 # >= 21 (JVM)
mvn --version                 # >= 3.9 (Maven)
node --version                # >= 22 (前端构建)
npm --version                 # >= 10`}</code></pre>
              </div>
            </section>

            <section id="docker-deploy" className={styles.section}>
              <h3 className={styles.h3}>Docker 一键启动</h3>
              <p className={styles.p}>无需安装任何运行时依赖，只需要 Docker：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>启动</div>
                <pre className={styles.code}><code>{`git clone https://github.com/DingdingOvO/webchat.git
cd webchat

# 构建并启动所有服务（后端 + 前端 + MySQL + MongoDB + Redis）
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 打开浏览器
open http://localhost:3000`}</code></pre>
              </div>
              <p className={styles.p}>
                更多部署方式（Kubernetes、Helm、Swarm、Ansible、VPS 等 19 种）见{'\u00A0'}
                <a href="https://github.com/DingdingOvO/webchat/blob/main/DEPLOY.md" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>DEPLOY.md</a>
                。
              </p>
            </section>

            <section id="manual-start" className={styles.section}>
              <h3 className={styles.h3}>手动启动</h3>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>1. 启动数据库</div>
                <pre className={styles.code}><code>{`# 方式 A：Docker 只跑数据库（推荐）
docker compose -f deploy/scripts/docker-db-only.yaml up -d

# 方式 B：本地安装
redis-server --daemonize yes
sudo service mysql start
sudo mongod --dbpath /data/db --fork --logpath /tmp/mongod.log`}</code></pre>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>2. 启动后端（终端 1）</div>
                <pre className={styles.code}><code>{`cd webchat
mvn clean compile -q
mvn spring-boot:run
# → http://localhost:8080`}</code></pre>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>3. 启动前端（终端 2）</div>
                <pre className={styles.code}><code>{`cd webchat/frontend
npm install
npm run dev
# → http://localhost:3000`}</code></pre>
              </div>
            </section>

            <section id="first-chat" className={styles.section}>
              <h3 className={styles.h3}>第一次聊天</h3>
              <ol className={styles.steps}>
                <li>打开浏览器访问 <code className={styles.inlineCode}>http://localhost:3000</code></li>
                <li>点击「免费开始使用」注册账号（或使用测试账号 <code className={styles.inlineCode}>alice / 1234</code>）</li>
                <li>登录后进入聊天界面，点击搜索按钮 🔍 搜索另一用户</li>
                <li>发送好友请求 → 对方接受 → 点击好友开始聊天</li>
                <li>也可以点击「创建群组」填入成员开始群聊</li>
              </ol>
            </section>

            {/* ============================================= */}
            {/* API 参考                                      */}
            {/* ============================================= */}
            <section id="api" className={styles.section}>
              <h2 className={styles.h2}>API 参考</h2>
              <p className={styles.p}>
                所有 API（除注册/登录外）需要在 HTTP Header 中携带 JWT token：
              </p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>请求头格式</div>
                <pre className={styles.code}><code>{'Authorization: Bearer <token>'}</code></pre>
              </div>
            </section>

            {/* ---- 认证 ---- */}
            <section id="api-auth" className={styles.section}>
              <h3 className={styles.h3}>认证</h3>

              <h4 className={styles.h4}>注册</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/auth/register</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Request Body</div>
                <pre className={styles.code}><code>{`{
  "username": "alice",      // 必填，3-50 字符
  "password": "1234",        // 必填，4-100 字符
  "nickname": "爱丽丝"       // 可选
}`}</code></pre>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Response 200</div>
                <pre className={styles.code}><code>{`{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "userId": 1,
  "username": "alice",
  "nickname": "爱丽丝"
}`}</code></pre>
              </div>

              <h4 className={styles.h4}>登录</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/auth/login</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Request Body</div>
                <pre className={styles.code}><code>{`{
  "username": "alice",
  "password": "1234"
}`}</code></pre>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Response 200</div>
                <pre className={styles.code}><code>{`{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "userId": 1,
  "username": "alice",
  "nickname": "爱丽丝"
}`}</code></pre>
              </div>

              <h4 className={styles.h4}>当前用户信息</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/auth/me</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Response 200</div>
                <pre className={styles.code}><code>{`{
  "id": 1,
  "username": "alice",
  "nickname": "爱丽丝",
  "avatar": ""
}`}</code></pre>
              </div>
            </section>

            {/* ---- 用户与好友 ---- */}
            <section id="api-users" className={styles.section}>
              <h3 className={styles.h3}>用户与好友</h3>

              <h4 className={styles.h4}>搜索用户</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/users/search?q=关键字</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Response 200</div>
                <pre className={styles.code}><code>{`[
  {
    "id": 2,
    "username": "bob",
    "nickname": "鲍勃",
    "online": true,
    "avatar": null
  }
]`}</code></pre>
              </div>

              <h4 className={styles.h4}>好友列表</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/users/friends</span>
              </div>

              <h4 className={styles.h4}>发送好友请求</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/users/friend-request</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Body</div>
                <pre className={styles.code}><code>{`{ "userId": 2 }`}</code></pre>
              </div>

              <h4 className={styles.h4}>查看待处理请求</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/users/friend-requests/pending</span>
              </div>

              <h4 className={styles.h4}>接受好友请求</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/users/friend-requests/{'{id}'}/accept</span>
              </div>

              <h4 className={styles.h4}>拒绝好友请求</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/users/friend-requests/{'{id}'}/reject</span>
              </div>

              <h4 className={styles.h4}>最近联系人</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/users/contacts</span>
              </div>
              <p className={styles.p}>返回最近交互过的联系人 ID 集合（上限 50 条）。</p>
            </section>

            {/* ---- 群组 ---- */}
            <section id="api-groups" className={styles.section}>
              <h3 className={styles.h3}>群组</h3>

              <h4 className={styles.h4}>创建群组</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/groups</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Request Body</div>
                <pre className={styles.code}><code>{`{
  "name": "技术部群聊",
  "memberIds": [1, 2, 3]   // 可选，初始成员 ID 列表
}`}</code></pre>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Response 200</div>
                <pre className={styles.code}><code>{`{
  "id": 1,
  "name": "技术部群聊",
  "ownerId": 1,
  "createdAt": "2026-07-07T12:00:00Z"
}`}</code></pre>
              </div>

              <h4 className={styles.h4}>我的群组列表</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/groups</span>
              </div>

              <h4 className={styles.h4}>群成员列表</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/groups/{'{id}'}/members</span>
              </div>
            </section>

            {/* ---- 消息 ---- */}
            <section id="api-messages" className={styles.section}>
              <h3 className={styles.h3}>消息</h3>

              <h4 className={styles.h4}>获取历史消息</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>GET</span>
                <span className={styles.endpointPath}>/api/chat/messages?convKey=X</span>
              </div>
              <p className={styles.p}>
                <code className={styles.inlineCode}>convKey</code> 是会话键，格式为
                <code className={styles.inlineCode}>P2P:{'{minUserId}'}-{'{maxUserId}'}</code>
                或 <code className={styles.inlineCode}>GROUP:{'{groupId}'}</code>。
                消息优先从 Redis 热缓存读取，未命中则回源 MongoDB。
              </p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Response 200</div>
                <pre className={styles.code}><code>{`[
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
]`}</code></pre>
              </div>
            </section>

            {/* ---- 设置 ---- */}
            <section id="api-settings" className={styles.section}>
              <h3 className={styles.h3}>设置</h3>

              <h4 className={styles.h4}>修改用户名</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>PUT</span>
                <span className={styles.endpointPath}>/api/users/profile/username</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Body</div>
                <pre className={styles.code}><code>{`{ "username": "new-alice" }`}</code></pre>
              </div>

              <h4 className={styles.h4}>上传头像</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/users/profile/avatar</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Body</div>
                <pre className={styles.code}><code>{`{ "avatar": "data:image/png;base64,..." }`}</code></pre>
              </div>
              <p className={styles.p}>base64 编码图像，大小限制 512KB。</p>

              <h4 className={styles.h4}>修改密码</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>PUT</span>
                <span className={styles.endpointPath}>/api/users/profile/password</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Body</div>
                <pre className={styles.code}><code>{`{
  "oldPassword": "1234",
  "newPassword": "5678"
}`}</code></pre>
              </div>
            </section>

            {/* ---- WebSocket ---- */}
            <section id="api-ws" className={styles.section}>
              <h3 className={styles.h3}>WebSocket</h3>
              <p className={styles.p}>WebSocket 连接地址，token 通过查询参数传递：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>连接</div>
                <pre className={styles.code}><code>{`ws://host:port/ws/chat?token=<jwt_token>`}</code></pre>
              </div>

              <h4 className={styles.h4}>发送消息（Client → Server）</h4>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Send JSON</div>
                <pre className={styles.code}><code>{`// 私聊
{ "type": "p2p",  "receiverId": 2, "content": "你好" }

// 群聊
{ "type": "group", "receiverId": 1, "content": "大家好" }

// 输入状态
{ "type": "typing", "receiverId": 2 }

// 已读回执
{ "type": "read", "conversationKey": "P2P:1-2" }`}</code></pre>
              </div>

              <h4 className={styles.h4}>接收消息（Server → Client）</h4>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Receive JSON</div>
                <pre className={styles.code}><code>{`// 新消息
{
  "action": "message",
  "data": {
    "senderId": 1,
    "senderName": "爱丽丝",
    "receiverId": 2,
    "type": "P2P",
    "content": "你好",
    "conversationKey": "P2P:1-2",
    "createdAt": "2026-07-07T12:00:00Z"
  }
}

// 在线状态变更
{
  "action": "online",
  "userId": 2,
  "nickname": "鲍勃",
  "online": true
}

// 正在输入
{
  "action": "typing",
  "userId": 2,
  "conversationKey": "P2P:1-2"
}`}</code></pre>
              </div>

              <h4 className={styles.h4}>WebSocket 事件汇总</h4>
              <table className={styles.table}>
                <thead><tr><th>方向</th><th>Action/Type</th><th>说明</th></tr></thead>
                <tbody>
                  <tr><td>C→S</td><td><code>p2p</code></td><td>发送私聊消息</td></tr>
                  <tr><td>C→S</td><td><code>group</code></td><td>发送群聊消息</td></tr>
                  <tr><td>C→S</td><td><code>typing</code></td><td>输入状态提示</td></tr>
                  <tr><td>C→S</td><td><code>read</code></td><td>已读回执</td></tr>
                  <tr><td>S→C</td><td><code>message</code></td><td>新消息推送</td></tr>
                  <tr><td>S→C</td><td><code>online</code></td><td>好友在线/离线通知</td></tr>
                  <tr><td>S→C</td><td><code>typing</code></td><td>对方正在输入</td></tr>
                </tbody>
              </table>
            </section>

            {/* ---- 错误处理 ---- */}
            <section id="api-errors" className={styles.section}>
              <h3 className={styles.h3}>错误处理</h3>
              <p className={styles.p}>API 使用 HTTP 状态码表示操作结果：</p>
              <table className={styles.table}>
                <thead><tr><th>状态码</th><th>含义</th><th>说明</th></tr></thead>
                <tbody>
                  <tr><td><code className={styles.inlineCode}>200</code></td><td>成功</td><td>请求正常处理</td></tr>
                  <tr><td><code className={styles.inlineCode}>400</code></td><td>请求参数错误</td><td>缺少字段、格式错误、用户名重复等</td></tr>
                  <tr><td><code className={styles.inlineCode}>401</code></td><td>未授权</td><td>Token 缺失或无效</td></tr>
                  <tr><td><code className={styles.inlineCode}>404</code></td><td>资源不存在</td><td>用户/群组/好友请求不存在</td></tr>
                  <tr><td><code className={styles.inlineCode}>409</code></td><td>冲突</td><td>已发送好友请求、已是好友等</td></tr>
                  <tr><td><code className={styles.inlineCode}>500</code></td><td>服务器内部错误</td><td>请查看后端日志</td></tr>
                </tbody>
              </table>
              <p className={styles.p}>错误响应体格式：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Error Response</div>
                <pre className={styles.code}><code>{`{
  "error": "用户名已被使用"
}`}</code></pre>
              </div>
            </section>

            {/* ============================================= */}
            {/* 设计语言                                      */}
            {/* ============================================= */}
            <section id="design" className={styles.section}>
              <h2 className={styles.h2}>设计语言</h2>
              <p className={styles.p}>
                <b>Aero Design System</b> 是 WebChat 的设计语言，核心理念是<b>简洁、可靠、有节奏</b>。
                本规范定义了颜色、字体、间距、组件等设计基础，供开发者遵循一致的界面标准。
              </p>
            </section>

            <section id="design-philosophy" className={styles.section}>
              <h3 className={styles.h3}>一、设计原则</h3>
              <div className={styles.principleGrid}>
                <div className={styles.principleCard}>
                  <span className={styles.principleNum}>1</span>
                  <h4 className={styles.principleTitle}>内容优先</h4>
                  <p className={styles.principleDesc}>每个页面有明确的重点，避免无关元素干扰用户目标。消息列表专注聊天，侧栏专注联系人。</p>
                </div>
                <div className={styles.principleCard}>
                  <span className={styles.principleNum}>2</span>
                  <h4 className={styles.principleTitle}>清晰导航</h4>
                  <p className={styles.principleDesc}>用户始终知道身在何处、可往何处。侧栏联系人分区、聊天头部标识当前会话。</p>
                </div>
                <div className={styles.principleCard}>
                  <span className={styles.principleNum}>3</span>
                  <h4 className={styles.principleTitle}>反馈及时</h4>
                  <p className={styles.principleDesc}>消息发送即时展示（乐观更新），操作按钮有 hover/active 状态，加载有过渡动画。</p>
                </div>
                <div className={styles.principleCard}>
                  <span className={styles.principleNum}>4</span>
                  <h4 className={styles.principleTitle}>一致统一</h4>
                  <p className={styles.principleDesc}>所有页面使用相同的颜色、字体、间距、圆角体系，每个组件在不同页面表现一致。</p>
                </div>
              </div>
            </section>

            <section id="design-colors" className={styles.section}>
              <h3 className={styles.h3}>二、色板</h3>
              <table className={styles.table}>
                <thead><tr><th>色值</th><th>CSS 变量</th><th>用途</th></tr></thead>
                <tbody>
                  <tr><td><span className={styles.colorDot} style={{background:'#2563eb'}} /> #2563eb</td><td><code>--primary</code></td><td>主色 — 按钮、链接、选中态</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#1d4ed8'}} /> #1d4ed8</td><td><code>--primary-hover</code></td><td>主色悬停</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#eff6ff'}} /> #eff6ff</td><td><code>--primary-light</code></td><td>主色浅色背景 — 选中项、通知条</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#212529'}} /> #212529</td><td><code>--text</code></td><td>正文颜色</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#868e96'}} /> #868e96</td><td><code>--text-secondary</code></td><td>辅助文字 — 描述、时间戳</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#adb5bd'}} /> #adb5bd</td><td><code>--text-tertiary</code></td><td>禁用文字、占位符</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#e9ecef'}} /> #e9ecef</td><td><code>--border</code></td><td>边框 — 输入框、分割线</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#f1f3f5'}} /> #f1f3f5</td><td><code>--border-light</code></td><td>浅色边框 — 卡片、列表间隔</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#10b981'}} /> #10b981</td><td><code>--green</code></td><td>在线状态、成功提示</td></tr>
                  <tr><td><span className={styles.colorDot} style={{background:'#ef4444'}} /> #ef4444</td><td><code>--red</code></td><td>错误提示、未读徽标</td></tr>
                </tbody>
              </table>
            </section>

            <section id="design-typography" className={styles.section}>
              <h3 className={styles.h3}>三、字体</h3>
              <p className={styles.p}>字体使用系统字体栈，保证各平台最优渲染：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>字体栈</div>
                <pre className={styles.code}><code>{`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif`}</code></pre>
              </div>
              <table className={styles.table}>
                <thead><tr><th>字号</th><th>CSS</th><th>行高</th><th>使用场景</th></tr></thead>
                <tbody>
                  <tr><td style={{fontSize:28}}>28</td><td><code>--text-2xl</code></td><td>1.25</td><td>页面标题</td></tr>
                  <tr><td style={{fontSize:20}}>20</td><td><code>--text-lg</code></td><td>1.25</td><td>弹窗标题、分组标题</td></tr>
                  <tr><td style={{fontSize:17}}>17</td><td><code>--text-md</code></td><td>1.5</td><td>联系人名称</td></tr>
                  <tr><td style={{fontSize:15}}>15</td><td><code>--text-base</code></td><td>1.5</td><td>正文、消息文本、按钮</td></tr>
                  <tr><td style={{fontSize:13}}>13</td><td><code>--text-sm</code></td><td>1.5</td><td>辅助文字、导航、元信息</td></tr>
                  <tr><td style={{fontSize:11}}>11</td><td><code>--text-xs</code></td><td>1.5</td><td>时间戳、徽标、角标</td></tr>
                </tbody>
              </table>
            </section>

            <section id="design-spacing" className={styles.section}>
              <h3 className={styles.h3}>四、间距与布局</h3>
              <p className={styles.p}>
                采用 <b>4px 基线网格</b>，所有边距、间隔、内边距均为 4 的倍数。
                页面内容区与屏幕边缘保持至少 <b>16px 安全边距</b>（Apple HIG 标准），
                阅读类页面内容宽度不超过 <b>720px</b>。
              </p>
              <table className={styles.table}>
                <thead><tr><th>Token</th><th>值</th><th>使用场景</th></tr></thead>
                <tbody>
                  <tr><td><code>--space-4</code></td><td>16px</td><td>内容安全边距、卡片内边距</td></tr>
                  <tr><td><code>--space-5</code></td><td>20px</td><td>列表项内边距、表单字段间距</td></tr>
                  <tr><td><code>--space-6</code></td><td>24px</td><td>区块间隔、消息气泡间距</td></tr>
                  <tr><td><code>--space-8</code></td><td>32px</td><td>页面分区间隔</td></tr>
                  <tr><td><code>--space-10</code></td><td>40px</td><td>大段内容间隔</td></tr>
                </tbody>
              </table>
            </section>

            <section id="design-components" className={styles.section}>
              <h3 className={styles.h3}>五、组件规范</h3>

              <h4 className={styles.h4}>5.1 按钮</h4>
              <table className={styles.table}>
                <thead><tr><th>类型</th><th>高度</th><th>圆角</th><th>背景</th><th>文字</th></tr></thead>
                <tbody>
                  <tr><td>主要按钮</td><td>40px</td><td>8px</td><td>主色 <code>#2563eb</code></td><td>白色 15px 中粗</td></tr>
                  <tr><td>次要按钮</td><td>40px</td><td>8px</td><td>透明，有边框</td><td>正文色 15px</td></tr>
                  <tr><td>图标按钮</td><td>32px</td><td>6px</td><td>透明 hover 变灰</td><td>16px icon</td></tr>
                </tbody>
              </table>

              <h4 className={styles.h4}>5.2 输入框</h4>
              <table className={styles.table}>
                <thead><tr><th>状态</th><th>边框</th><th>背景</th><th>圆角</th></tr></thead>
                <tbody>
                  <tr><td>默认</td><td>1.5px <code>--border</code></td><td><code>--gray-50</code></td><td>8px</td></tr>
                  <tr><td>聚焦</td><td>1.5px <code>--primary</code></td><td>白色</td><td>8px + 3px glow</td></tr>
                  <tr><td>禁用</td><td>1.5px <code>--border</code></td><td><code>--gray-100</code></td><td>8px</td></tr>
                </tbody>
              </table>

              <h4 className={styles.h4}>5.3 消息气泡</h4>
              <table className={styles.table}>
                <thead><tr><th>类型</th><th>背景</th><th>文字</th><th>圆角</th><th>阴影</th></tr></thead>
                <tbody>
                  <tr><td>自己发送</td><td>蓝色渐变</td><td>白色</td><td>12px 右下 6px</td><td>0 2px 8px rgba(37,99,235,.25)</td></tr>
                  <tr><td>对方发送</td><td>白色</td><td>正文色</td><td>12px 左下 6px</td><td>0 1px 3px rgba(0,0,0,.06)</td></tr>
                </tbody>
              </table>

              <h4 className={styles.h4}>5.4 联系人列表</h4>
              <ul className={styles.specList}>
                <li>头像尺寸：40px × 40px，圆形裁剪</li>
                <li>列表项高度：52px（含 8px 上下内边距）</li>
                <li>选中态：浅蓝背景 <code>--primary-light (#eff6ff)</code></li>
                <li>在线指示器：10px 绿色圆点，位于头像右下角</li>
                <li>未读徽标：红色圆角标签，右上角定位</li>
              </ul>

              <h4 className={styles.h4}>5.5 图标</h4>
              <p className={styles.p}>所有图标为自绘 SVG 路径，统一 20×20 viewBox，颜色继承当前文字色。不使用 emoji 或图片。</p>

              <h4 className={styles.h4}>5.6 弹窗</h4>
              <table className={styles.table}>
                <thead><tr><th>属性</th><th>值</th></tr></thead>
                <tbody>
                  <tr><td>背景遮罩</td><td>rgba(0,0,0,0.4)</td></tr>
                  <tr><td>弹窗宽度</td><td>360px</td></tr>
                  <tr><td>弹窗圆角</td><td>12px</td></tr>
                  <tr><td>动画</td><td>fadeIn 0.15s + scale(0.95→1)</td></tr>
                </tbody>
              </table>
            </section>

            <section id="design-specs" className={styles.section}>
              <h3 className={styles.h3}>六、设计稿尺寸</h3>
              <p className={styles.p}>
                桌面端设计以 <b>1200px</b> 为内容最大宽度（聊天布局），
                侧栏 320px，聊天区自适应剩余空间。
                文档阅读页内容区最大 720px，保持舒适阅读宽度。
              </p>
              <table className={styles.table}>
                <thead><tr><th>布局</th><th>宽度</th></tr></thead>
                <tbody>
                  <tr><td>聊天布局最大宽度</td><td>1200px</td></tr>
                  <tr><td>侧栏 (联系人/群组)</td><td>320px</td></tr>
                  <tr><td>聊天消息区</td><td>自适应剩余空间</td></tr>
                  <tr><td>文档阅读区</td><td>720px max</td></tr>
                  <tr><td>浮动弹窗</td><td>360px</td></tr>
                </tbody>
              </table>
            </section>

            {/* ============================================= */}
            {/* 技术栈                                        */}
            {/* ============================================= */}
            <section id="tech" className={styles.section}>
              <h2 className={styles.h2}>技术栈</h2>
            </section>

            <section id="tech-frontend" className={styles.section}>
              <h3 className={styles.h3}>前端</h3>
              <table className={styles.table}>
                <thead><tr><th>技术</th><th>版本</th><th>用途</th></tr></thead>
                <tbody>
                  <tr><td>React</td><td>19</td><td>UI 框架</td></tr>
                  <tr><td>TypeScript</td><td>5.5</td><td>类型安全</td></tr>
                  <tr><td>Webpack</td><td>5.108</td><td>构建 + HMR + CSS Modules</td></tr>
                  <tr><td>React Router</td><td>6</td><td>客户端路由</td></tr>
                  <tr><td>Fluent UI Icons</td><td>—</td><td>图标库</td></tr>
                </tbody>
              </table>
            </section>

            <section id="tech-backend" className={styles.section}>
              <h3 className={styles.h3}>后端</h3>
              <table className={styles.table}>
                <thead><tr><th>技术</th><th>版本</th><th>用途</th></tr></thead>
                <tbody>
                  <tr><td>Java</td><td>21</td><td>运行时 (LTS)</td></tr>
                  <tr><td>Spring Boot</td><td>3.4.5</td><td>REST + WebSocket + JPA</td></tr>
                  <tr><td>JPA / Hibernate</td><td>—</td><td>MySQL ORM</td></tr>
                  <tr><td>Spring Data MongoDB</td><td>—</td><td>MongoDB 消息存储</td></tr>
                  <tr><td>Spring Data Redis</td><td>—</td><td>热缓存 + Pub/Sub</td></tr>
                  <tr><td>JWT (jjwt)</td><td>0.12.6</td><td>登录认证</td></tr>
                  <tr><td>Spring Security Crypto</td><td>—</td><td>BCrypt 密码加密</td></tr>
                  <tr><td>Maven</td><td>3.9</td><td>构建工具</td></tr>
                </tbody>
              </table>
            </section>

            <section id="tech-storage" className={styles.section}>
              <h3 className={styles.h3}>存储层</h3>
              <table className={styles.table}>
                <thead><tr><th>数据库</th><th>角色</th><th>数据</th></tr></thead>
                <tbody>
                  <tr><td>MySQL 8.0</td><td>元数据</td><td>用户、好友关系、群组、群成员</td></tr>
                  <tr><td>MongoDB 7.0</td><td>消息冷存</td><td>聊天记录（带 conversationKey 索引）</td></tr>
                  <tr><td>Redis 7.x</td><td>热缓存 + 实时</td><td>热消息（每会话 100 条）、在线状态、输入状态、未读计数、Pub/Sub</td></tr>
                </tbody>
              </table>
              <p className={styles.p}>
                <b>消息分级存储策略</b>：发送消息时同时写入 Redis（热）和 MongoDB（持久）。
                查询历史时优先读取 Redis，未命中则回源 MongoDB 并回填缓存。
              </p>
            </section>

            <section id="tech-arch" className={styles.section}>
              <h3 className={styles.h3}>数据流</h3>
              <div className={styles.arch} style={{gap:'var(--p3)'}}>
                <div className={styles.archLayer}>
                  <div className={styles.archLabel}>用户发送消息</div>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox}>React 前端</span>
                    <span className={styles.archBox} style={{borderColor:'var(--green)'}}>WebSocket</span>
                    <span className={styles.archBox}>Spring Boot</span>
                  </div>
                </div>
                <div className={styles.archArrow}>↓ 并行写入</div>
                <div className={styles.archLayer}>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox} style={{borderColor:'#f59e0b'}}>Redis（热）</span>
                    <span className={styles.archBox} style={{borderColor:'#22c55e'}}>MongoDB（持久）</span>
                  </div>
                </div>
                <div className={styles.archArrow}>↓ Redis Pub/Sub</div>
                <div className={styles.archLayer}>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox} style={{borderColor:'var(--primary)'}}>接收方前端</span>
                  </div>
                </div>
              </div>
              <p className={styles.p}>
                私聊消息通过 <code className={styles.inlineCode}>WebSocketSessionManager</code> 直接推送到目标用户的 WebSocket 连接；
                群聊消息通过 Redis Pub/Sub 广播到所有群成员实例。
              </p>
            </section>

            {/* ============================================= */}
            {/* 部署指南                                      */}
            {/* ============================================= */}
            <section id="deploy" className={styles.section}>
              <h2 className={styles.h2}>部署指南</h2>
              <p className={styles.p}>
                WebChat 提供了 <b>19 种部署方式</b>，从本地开发到生产级集群全覆盖。
                完整文档见 <a href="https://github.com/DingdingOvO/webchat/blob/main/DEPLOY.md" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>DEPLOY.md</a>。
              </p>
            </section>

            <section id="deploy-summary" className={styles.section}>
              <h3 className={styles.h3}>部署方式总览</h3>
              <table className={styles.table}>
                <thead><tr><th>类别</th><th>方式</th><th>适用场景</th><th>复杂度</th></tr></thead>
                <tbody>
                  <tr><td rowSpan={3}>容器编排</td><td>Docker Compose</td><td>本地测试、单机生产</td><td>⭐</td></tr>
                  <tr><td>Docker Swarm</td><td>多节点容器集群</td><td>⭐⭐⭐</td></tr>
                  <tr><td>Kubernetes + Helm</td><td>K8s 集群生产部署</td><td>⭐⭐⭐⭐</td></tr>
                  <tr><td rowSpan={3}>物理机/VPS</td><td>一键部署脚本</td><td>裸机/VPS 快速部署</td><td>⭐</td></tr>
                  <tr><td>Systemd</td><td>Linux 服务管理</td><td>⭐⭐</td></tr>
                  <tr><td>Ansible</td><td>批量自动化部署</td><td>⭐⭐⭐</td></tr>
                  <tr><td rowSpan={5}>云平台</td><td>Fly.io</td><td>全球边缘部署</td><td>⭐⭐</td></tr>
                  <tr><td>Railway</td><td>快速托管</td><td>⭐</td></tr>
                  <tr><td>Render</td><td>基础设施即代码</td><td>⭐⭐</td></tr>
                  <tr><td>Zeabur</td><td>国内友好托管</td><td>⭐</td></tr>
                  <tr><td>Heroku</td><td>传统 PaaS</td><td>⭐⭐</td></tr>
                  <tr><td>CI/CD</td><td>GitHub Actions</td><td>自动构建+部署</td><td>⭐⭐⭐</td></tr>
                </tbody>
              </table>
            </section>

            <section id="deploy-docker" className={styles.section}>
              <h3 className={styles.h3}>Docker 部署</h3>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>单机 Docker Compose</div>
                <pre className={styles.code}><code>{`# 标准部署
docker compose up -d --build

# 生产优化版（资源限制 + 日志轮转 + 健康检查）
docker compose -f deploy/scripts/docker-compose-prod.yaml up -d

# Swarm 多节点
docker stack deploy -c deploy/swarm/docker-stack.yaml webchat`}</code></pre>
              </div>
            </section>

            <section id="deploy-k8s" className={styles.section}>
              <h3 className={styles.h3}>Kubernetes 部署</h3>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Kustomize</div>
                <pre className={styles.code}><code>{`kubectl apply -k deploy/kubernetes/`}</code></pre>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Helm</div>
                <pre className={styles.code}><code>{`helm upgrade --install webchat deploy/helm/webchat \\
  --namespace webchat --create-namespace`}</code></pre>
              </div>
            </section>

            <section id="deploy-vps" className={styles.section}>
              <h3 className={styles.h3}>VPS 部署</h3>
              <p className={styles.p}>适用于 Ubuntu 20.04+ / CentOS 7+ 裸机或 VPS：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>一键脚本</div>
                <pre className={styles.code}><code>{`git clone https://github.com/DingdingOvO/webchat.git
cd webchat
sudo bash deploy/scripts/deploy.sh`}</code></pre>
              </div>
              <p className={styles.p}>
                脚本自动安装 Java 21、MySQL、MongoDB、Redis、Nginx、Certbot，
                初始化数据库，配置 Systemd 服务和 Nginx 反向代理。
                详细文档见 <a href="https://github.com/DingdingOvO/webchat/blob/main/DEPLOY.md" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>DEPLOY.md</a>。
              </p>
            </section>

            {/* Footer */}
            <div className={styles.docFooter}>
              <Link to="/register" className={styles.ctaBtn}>开始使用 WebChat</Link>
              <Link to="/" className={styles.ctaLink}>返回首页</Link>
              <a href="https://github.com/DingdingOvO/webchat" target="_blank" rel="noopener noreferrer" className={styles.ctaLink}>GitHub</a>
            </div>
          </article>

          {/* =============== Right sidebar =============== */}
          <aside className={styles.onThisPage}>
            <span className={styles.onThisPageTitle}>本页内容</span>
            {SECTIONS.flatMap(s => s.children).map(c => (
              <a key={c.id} href={`#${c.id}`}
                className={`${styles.onThisPageItem} ${activeSection === c.id ? styles.onThisPageItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo(c.id); }}
              >
                {c.title}
              </a>
            ))}
          </aside>
        </main>
      </div>
    </div>
  );
}

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
    { id: 'running',         title: '启动项目' },
    { id: 'first-chat',      title: '第一次聊天' },
  ]},
  { id: 'design',           title: '设计语言', children: [
    { id: 'design-philosophy', title: '一、设计原则' },
    { id: 'design-colors',     title: '二、色板' },
    { id: 'design-typography', title: '三、字体' },
    { id: 'design-spacing',    title: '四、间距与布局' },
    { id: 'design-components', title: '五、组件规范' },
    { id: 'design-specs',      title: '六、设计稿尺寸' },
  ]},
  { id: 'api',              title: 'API 参考', children: [
    { id: 'api-auth',        title: '认证' },
    { id: 'api-users',       title: '用户与好友' },
    { id: 'api-groups',      title: '群组' },
    { id: 'api-chat',        title: '聊天' },
    { id: 'api-ws',          title: 'WebSocket' },
  ]},
  { id: 'tech',             title: '技术栈', children: [
    { id: 'tech-frontend',   title: '前端' },
    { id: 'tech-backend',    title: '后端' },
    { id: 'tech-storage',    title: '存储层' },
  ]},
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('what-is-webchat');

  return (
    <div className={styles.page}>
      {/* Top nav */}
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
        {/* Left sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSearch}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{flexShrink:0}}>
              <path d="M8.5 3a5.5 5.5 0 0 1 4.23 9.02l4.12 4.13a.5.5 0 0 1-.7.7l-4.13-4.12A5.5 5.5 0 1 1 8.5 3Zm0 1a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/>
            </svg>
            <input className={styles.sidebarSearchInput} type="text" placeholder="搜索文档..." readOnly />
          </div>
          <nav className={styles.sidebarNav}>
            {SECTIONS.map((section) => (
              <div key={section.id} className={styles.sidebarGroup}>
                <span className={styles.sidebarGroupTitle}>{section.title}</span>
                {section.children.map((child) => (
                  <a
                    key={child.id}
                    href={`#${child.id}`}
                    className={`${styles.sidebarItem} ${activeSection === child.id ? styles.sidebarItemActive : ''}`}
                    onClick={(e) => { e.preventDefault(); setActiveSection(child.id); document.getElementById(child.id)?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    {child.title}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className={styles.content}>
          <article className={styles.article}>
            {/* ============= Overview ============= */}
            <section id="overview" className={styles.section}>
              <h1 className={styles.h1}>WebChat 文档</h1>
              <p className={styles.lead}>
                WebChat 是一款基于 Web 的即时通讯系统。本文档涵盖架构说明、快速上手、
                设计语言规范、API 参考及技术栈详情。
              </p>
            </section>

            <section id="what-is-webchat" className={styles.section}>
              <h2 className={styles.h2}>什么是 WebChat</h2>
              <p className={styles.p}>
                WebChat 是一个全栈即时通讯应用，前端使用 React 19 + TypeScript + Webpack 5，
                后端基于 Java 26 + Spring Boot 3.4，数据存储采用 MySQL + MongoDB + Redis
                三层架构。支持实时私聊、群组聊天、好友管理、在线状态同步等核心功能。
              </p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>3</span>
                  <span className={styles.statLabel}>存储引擎</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>6</span>
                  <span className={styles.statLabel}>API 模块</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>100</span>
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
                  <p className={styles.fcardDesc}>最近 100 条消息在 Redis，历史消息持久化 MongoDB，查詢秒級回源。</p>
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
                  </div>
                </div>
                <div className={styles.archArrow}>↓ HTTP / WS</div>
                <div className={styles.archLayer}>
                  <div className={styles.archLabel}>服务层</div>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox}>Spring Boot</span>
                    <span className={styles.archBox}>REST API</span>
                    <span className={styles.archBox}>JWT Auth</span>
                  </div>
                </div>
                <div className={styles.archArrow}>↓ JDBC / Mongo Driver / Redis</div>
                <div className={styles.archLayer}>
                  <div className={styles.archLabel}>存储层</div>
                  <div className={styles.archBoxes}>
                    <span className={styles.archBox}>MySQL</span>
                    <span className={styles.archBox}>MongoDB</span>
                    <span className={styles.archBox}>Redis</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ============= Quickstart ============= */}
            <section id="quickstart" className={styles.section}>
              <h2 className={styles.h2}>快速开始</h2>
            </section>

            <section id="setup" className={styles.section}>
              <h3 className={styles.h3}>环境准备</h3>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>依赖</div>
                <pre className={styles.code}><code>{`# 确保已安装以下服务
redis-server --version    # >= 7.0
mysql --version           # >= 8.0
mongod --version          # >= 7.0
java -version             # >= 21
mvn --version             # >= 3.9`}</code></pre>
              </div>
            </section>

            <section id="running" className={styles.section}>
              <h3 className={styles.h3}>启动项目</h3>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>启动后端</div>
                <pre className={styles.code}><code>{`# 1. 启动数据库
redis-server --daemonize yes
service mysql start
mongod --dbpath /data/db --fork --logpath /tmp/mongod.log

# 2. 编译 & 运行
cd webchat
mvn clean compile
JAVA_HOME=/path/to/jdk-26 java -cp "target/classes:$(cat /tmp/cp.txt)" com.webchat.WebChatApplication`}</code></pre>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>启动前端</div>
                <pre className={styles.code}><code>{`cd frontend
npm install
npm run dev    # 开发模式, localhost:3000
npm run build  # 生产构建, 输出 dist/`}</code></pre>
              </div>
            </section>

            <section id="first-chat" className={styles.section}>
              <h3 className={styles.h3}>第一次聊天</h3>
              <ol className={styles.steps}>
                <li>打开浏览器访问 <code className={styles.inlineCode}>http://localhost:3000</code>，进入介绍页</li>
                <li>点击「免费开始使用」注册账号（或使用测试账号 <code className={styles.inlineCode}>alice / 1234</code>）</li>
                <li>登录后自动进入聊天界面</li>
                <li>点击侧栏搜索按钮 🔍，搜索另一用户并加好友</li>
                <li>点击好友开始聊天</li>
              </ol>
            </section>

            {/* ============= Design Language ============= */}
            <section id="design" className={styles.section}>
              <h2 className={styles.h2}>设计语言</h2>
              <p className={styles.p}>
                Aero Design System 是 WebChat 的设计语言，核心理念是<b>简洁、可靠、有节奏</b>。
                本规范定义了颜色、字体、间距、组件等设计基础，供开发者遵循一致的界面标准。
              </p>
            </section>

            {/* 一、设计原则 */}
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

            {/* 二、色板 */}
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

            {/* 三、字体 */}
            <section id="design-typography" className={styles.section}>
              <h3 className={styles.h3}>三、字体</h3>
              <p className={styles.p}>字体使用系统字体栈，保证各平台最优渲染。常用字号如下：</p>
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

            {/* 四、间距与布局 */}
            <section id="design-spacing" className={styles.section}>
              <h3 className={styles.h3}>四、间距与布局</h3>
              <p className={styles.p}>
                采用 <b>4px 基线网格</b>，所有边距、间隔、内边距均为 4 的倍数。
                页面内容区与屏幕边缘保持至少 <b>16px 安全边距</b>（Apple HIG 标准），
                阅读类页面内容宽度不超过 <b>680px</b>。
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

            {/* 五、组件规范 */}
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
            </section>

            {/* 六、设计稿尺寸 */}
            <section id="design-specs" className={styles.section}>
              <h3 className={styles.h3}>六、设计稿尺寸</h3>
              <p className={styles.p}>
                桌面端设计以 <b>1200px</b> 为内容最大宽度（聊天布局），
                侧栏 320px，聊天区自适应剩余空间。
                文档阅读页内容区最大 680px，保持舒适阅读宽度。
              </p>
            </section>

            {/* ============= API Reference ============= */}
            <section id="api" className={styles.section}>
              <h2 className={styles.h2}>API 参考</h2>
            </section>

            <section id="api-auth" className={styles.section}>
              <h3 className={styles.h3}>认证</h3>
              <p className={styles.p}>所有 API 需要在 Header 中携带 JWT token：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Header 格式</div>
                <pre className={styles.code}><code>{`Authorization: Bearer &lt;token&gt;`}</code></pre>
              </div>

              <h4 className={styles.h4}>注册</h4>
              <div className={styles.endpoint}>
                <span className={styles.endpointMethod}>POST</span>
                <span className={styles.endpointPath}>/api/auth/register</span>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Request</div>
                <pre className={styles.code}><code>{`{
  "username": "alice",
  "password": "1234",
  "nickname": "爱丽丝"   // optional
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
                <div className={styles.codeHeader}>Request</div>
                <pre className={styles.code}><code>{`{
  "username": "alice",
  "password": "1234"
}`}</code></pre>
              </div>
            </section>

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
  { "id": 2, "username": "bob", "nickname": "鲍勃", "online": true, ... }
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
            </section>

            <section id="api-ws" className={styles.section}>
              <h3 className={styles.h3}>WebSocket</h3>
              <p className={styles.p}>WebSocket 连接地址：</p>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>连接</div>
                <pre className={styles.code}><code>{`ws://host:port/ws/chat?token=&lt;jwt_token&gt;`}</code></pre>
              </div>

              <h4 className={styles.h4}>发送消息</h4>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Send (JSON)</div>
                <pre className={styles.code}><code>{`// 私聊
{ "type": "p2p",  "receiverId": 2, "content": "你好" }

// 群聊
{ "type": "group", "receiverId": 1, "content": "大家好" }`}</code></pre>
              </div>

              <h4 className={styles.h4}>接收消息</h4>
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Receive (JSON)</div>
                <pre className={styles.code}><code>{`{
  "action": "message",
  "data": {
    "senderId": 1,
    "senderName": "爱丽丝",
    "receiverId": 2,
    "type": "P2P",
    "content": "你好",
    "createdAt": "2026-07-07T12:00:00Z"
  }
}`}</code></pre>
              </div>
            </section>

            {/* ============= Tech Stack ============= */}
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
                  <tr><td>React Router</td><td>6</td><td>路由</td></tr>
                </tbody>
              </table>
            </section>

            <section id="tech-backend" className={styles.section}>
              <h3 className={styles.h3}>后端</h3>
              <table className={styles.table}>
                <thead><tr><th>技术</th><th>版本</th><th>用途</th></tr></thead>
                <tbody>
                  <tr><td>Java</td><td>26</td><td>运行时</td></tr>
                  <tr><td>Spring Boot</td><td>3.4.5</td><td>REST + WebSocket</td></tr>
                  <tr><td>JPA / Hibernate</td><td>—</td><td>MySQL ORM</td></tr>
                  <tr><td>Spring Data MongoDB</td><td>—</td><td>MongoDB 消息存储</td></tr>
                  <tr><td>Spring Data Redis</td><td>—</td><td>热缓存 + Pub/Sub</td></tr>
                  <tr><td>JWT (jjwt)</td><td>0.12.6</td><td>登录认证</td></tr>
                </tbody>
              </table>
            </section>

            <section id="tech-storage" className={styles.section}>
              <h3 className={styles.h3}>存储层</h3>
              <table className={styles.table}>
                <thead><tr><th>数据库</th><th>角色</th><th>数据</th></tr></thead>
                <tbody>
                  <tr><td>MySQL 8.0</td><td>元数据</td><td>用户、好友、群组、关系链</td></tr>
                  <tr><td>MongoDB 7.0</td><td>消息冷存</td><td>聊天记录（带 conversationKey 索引）</td></tr>
                  <tr><td>Redis 7.x</td><td>热缓存 + 实时</td><td>热消息、在线状态、未读计数、Pub/Sub</td></tr>
                </tbody>
              </table>
            </section>

            {/* Footer */}
            <div className={styles.docFooter}>
              <Link to="/register" className={styles.ctaBtn}>开始使用 WebChat</Link>
              <Link to="/" className={styles.ctaLink}>返回首页</Link>
            </div>
          </article>

          {/* Right sidebar — on this page */}
          <aside className={styles.onThisPage}>
            <span className={styles.onThisPageTitle}>本页内容</span>
            {SECTIONS.flatMap(s => s.children).map(c => (
              <a key={c.id} href={`#${c.id}`}
                className={`${styles.onThisPageItem} ${activeSection === c.id ? styles.onThisPageItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveSection(c.id); document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' }); }}
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

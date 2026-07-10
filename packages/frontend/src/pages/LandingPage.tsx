import { Link } from 'react-router-dom';
import { ChatIcon, HomeIcon, DocsIcon, FeedbackIcon, GitHubIcon, PersonIcon } from '../components/Icons';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logoText}>WebChat</span>
          <div className={styles.navLinks}>
            <Link to="/" className={styles.navLink}>
              <HomeIcon size={18} />
              <span className={styles.navLabel}>首页</span>
            </Link>
            <Link to="/docs" className={styles.navLink}>
              <DocsIcon size={18} />
              <span className={styles.navLabel}>文档</span>
            </Link>
            <Link to="/feedback" className={styles.navLink}>
              <FeedbackIcon size={18} />
              <span className={styles.navLabel}>反馈</span>
            </Link>
            <a href="https://github.com/DingdingOvO/webchat" target="_blank" rel="noreferrer noopener" className={styles.navLink}>
              <GitHubIcon size={18} />
              <span className={styles.navLabel}>源代码</span>
            </a>
            <Link to="/login" className={styles.navLink}>
              <PersonIcon size={18} />
              <span className={styles.navLabel}>登录</span>
            </Link>
            <Link to="/register" className={styles.navBtn}>
              开始使用
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            简洁 · 快速 · 安全
            <br />
            <span className={styles.heroHighlight}>新一代即时通讯</span>
          </h1>
          <p className={styles.heroDesc}>
            WebChat 是一款基于 Web 的即时通讯工具，支持实时私聊、群组聊天、 好友管理，数据加密传输，开箱即用。
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.primaryBtn}>
              免费开始使用
            </Link>
            <Link to="/login" className={styles.secondaryBtn}>
              登录
            </Link>
          </div>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            当前在线 · 实时通讯
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <ChatIcon size={28} />
            </div>
            <h3 className={styles.featureTitle}>实时聊天</h3>
            <p className={styles.featureDesc}>WebSocket 长连接，消息毫秒级送达，支持私聊与群组。</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <PersonIcon size={28} />
            </div>
            <h3 className={styles.featureTitle}>好友与群组</h3>
            <p className={styles.featureDesc}>搜索添加好友，创建群组，管理联系人列表。</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM9 5.5a1 1 0 1 1 2 0V9h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V5.5Z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>技术栈</h3>
            <p className={styles.featureDesc}>Java 26 + Spring Boot 3.5 + MySQL + MongoDB + Redis + React 19。</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLinks}>
            <Link to="/docs" className={styles.footerLink}>
              文档
            </Link>
            <span className={styles.footerDot}>·</span>
            <Link to="/feedback" className={styles.footerLink}>
              反馈
            </Link>
            <span className={styles.footerDot}>·</span>
            <a href="https://github.com/DingdingOvO/webchat" target="_blank" rel="noreferrer noopener" className={styles.footerLink}>
              源代码
            </a>
            <span className={styles.footerDot}>·</span>
            <Link to="/login" className={styles.footerLink}>
              登录
            </Link>
            <span className={styles.footerDot}>·</span>
            <Link to="/register" className={styles.footerLink}>
              注册
            </Link>
          </div>
          <p className={styles.footerText}>WebChat · 基于 Fluent Design + WeChat 设计语言</p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './FeedbackPage.module.css';

const FEEDBACK_URL =
  'https://forms.office.com/Pages/ResponsePage.aspx' +
  '?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAANAAW1mMnJUOTlNNFVTSVEzS0Q0UzZUTTNXNUJDQzY0Vy4u';

/**
 * 反馈页。
 *
 * 旧实现是 useEffect 里 `window.location.href = FEEDBACK_URL` 直接整页跳走：
 * 用户会被甩到一个英文、绿蓝配色的 Microsoft Forms 页面，与全站设计语言完全割裂，
 * 且返回后丢失 WebChat 上下文。这里改为「保留 WebChat 顶栏 + 内嵌表单 iframe」：
 * 跳转前先看清这是什么页面，顶栏始终可返回，表单加载失败也有兜底链接。
 */
export default function FeedbackPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link to="/" className={styles.topbarBrand}>
            <span className={styles.topbarLogo}>W</span>
            <span className={styles.topbarTitle}>WebChat</span>
            <span className={styles.topbarBadge}>反馈</span>
          </Link>
          <nav className={styles.topbarNav}>
            <Link to="/" className={styles.topbarLink}>
              首页
            </Link>
            <Link to="/docs" className={styles.topbarLink}>
              文档
            </Link>
            <span className={styles.topbarLinkActive}>反馈</span>
            <Link to="/login" className={styles.topbarLink}>
              登录
            </Link>
          </nav>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.intro}>
          <h1 className={styles.introTitle}>问题反馈 · 建议征集</h1>
          <p className={styles.introDesc}>
            使用 WebChat 时遇到 Bug，或有功能建议与体验改进想法，都欢迎告诉我们。 提交的内容会同步给维护团队。
          </p>
        </div>

        <div className={styles.frameWrap}>
          {!loaded && <div className={styles.loading}>正在加载反馈表单…</div>}
          <iframe
            className={styles.frame}
            src={FEEDBACK_URL}
            title="WebChat 反馈表单"
            onLoad={() => setLoaded(true)}
            allow="fullscreen"
          />
        </div>

        <p className={styles.fallback}>
          表单无法加载？直接{' '}
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer noopener">
            在新标签页打开反馈表单
          </a>
          。
        </p>
      </div>
    </div>
  );
}

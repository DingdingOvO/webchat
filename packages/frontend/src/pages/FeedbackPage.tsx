import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './FeedbackPage.module.css';

const FEEDBACK_URL =
  'https://forms.office.com/Pages/ResponsePage.aspx' +
  '?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAANAAW1mMnJUOTlNNFVTSVEzS0Q0UzZUTTNXNUJDQzY0Vy4u';

export default function FeedbackPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={styles.page}>
      {/* Top bar — WebChat 顶部栏始终可见 */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link to="/" className={styles.topbarBrand}>
            <span className={styles.topbarLogo}>W</span>
            <span className={styles.topbarTitle}>WebChat</span>
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
            <a
              className={styles.topbarExternal}
              href={FEEDBACK_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              在新窗口打开 ↗
            </a>
          </nav>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.intro}>
          <h1 className={styles.introTitle}>问题反馈 · 建议征集</h1>
          <p className={styles.introDesc}>
            如果你在使用 WebChat 时遇到 Bug，或者有功能建议与体验改进想法，告诉我们吧。
            提交的内容会直接同步到 GitHub Issues 团队。
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
          表单无法加载？直接 <a href={FEEDBACK_URL} target="_blank" rel="noreferrer noopener">访问 Microsoft Forms</a>。
        </p>
      </div>
    </div>
  );
}

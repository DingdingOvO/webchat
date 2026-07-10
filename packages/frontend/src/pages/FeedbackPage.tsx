import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, DocsIcon, FeedbackIcon, GitHubIcon, PersonIcon, ExternalIcon } from '../components/Icons';
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
              <HomeIcon size={18} />
              <span className={styles.navLabel}>首页</span>
            </Link>
            <Link to="/docs" className={styles.topbarLink}>
              <DocsIcon size={18} />
              <span className={styles.navLabel}>文档</span>
            </Link>
            <span className={styles.topbarLinkActive}>
              <FeedbackIcon size={18} />
              <span className={styles.navLabel}>反馈</span>
            </span>
            <a href="https://github.com/DingdingOvO/webchat" target="_blank" rel="noreferrer noopener" className={styles.topbarLink}>
              <GitHubIcon size={18} />
              <span className={styles.navLabel}>源代码</span>
            </a>
            <Link to="/login" className={styles.topbarLink}>
              <PersonIcon size={18} />
              <span className={styles.navLabel}>登录</span>
            </Link>
            <a
              className={styles.topbarExternal}
              href={FEEDBACK_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              <ExternalIcon size={16} />
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

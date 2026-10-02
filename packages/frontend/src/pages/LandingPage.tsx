import { Link } from 'react-router-dom';
import { ChatIcon, PeopleIcon, SendIcon } from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';
import styles from './LandingPage.module.css';

/**
 * 首页文案面向「普通用户」，不写技术实现。
 * 旧版讲 Redis / MongoDB / 多实例部署，是写给工程师看的，与访客无关。
 */
const FEATURES = [
  {
    Icon: ChatIcon,
    title: '聊得畅快',
    desc: '消息即发即到，不用刷新页面。私聊和群聊都在同一个地方，切换不用找。',
  },
  {
    Icon: PeopleIcon,
    title: '找得到人',
    desc: '搜昵称就能加好友，拉个群也只要几秒。谁在线一眼就知道。',
  },
  {
    Icon: SendIcon,
    title: '记录不丢',
    desc: '聊天历史自动保存，换台设备打开也还在，随时往回翻。',
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.brand}>
            <div className={styles.logo}>W</div>
            <span className={styles.wordmark}>WebChat</span>
          </Link>
          {/* 导航分两组：左侧是「去哪看看」的内容入口，右侧是「我要做什么」的操作。
              旧版把 5 个元素平铺在同一层，主题切换夹在链接中间，读起来是一坨名字。 */}
          <div className={styles.navLinks}>
            <div className={styles.navGroup}>
              <Link to="/docs" className={styles.navLink}>
                使用说明
              </Link>
              <Link to="/feedback" className={styles.navLink}>
                反馈
              </Link>
            </div>
            <div className={styles.navActions}>
              <ThemeToggle />
              <Link to="/login" className={styles.navLink}>
                登录
              </Link>
              <Link to="/register" className={styles.navCta}>
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            和在意的人，
            <br />
            随时说上话
          </h1>
          <p className={styles.heroLede}>
            WebChat 是一个简单好用的聊天工具。 打开浏览器就能用，不用下载，不用注册一堆信息。
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.btnPrimary}>
              开始使用
            </Link>
            <Link to="/login" className={styles.btnGhost}>
              我已有账号
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresInner}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className={styles.feature}>
              <div className={styles.featureIcon}>
                <Icon size={22} />
              </div>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLinks}>
            <Link to="/docs" className={styles.footerLink}>
              使用说明
            </Link>
            <Link to="/feedback" className={styles.footerLink}>
              反馈
            </Link>
            <Link to="/login" className={styles.footerLink}>
              登录
            </Link>
            <Link to="/register" className={styles.footerLink}>
              注册
            </Link>
          </div>
          <p className={styles.footerNote}>WebChat</p>
        </div>
      </footer>
    </div>
  );
}

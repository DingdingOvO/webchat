import apiMd from '@docs/api/README.md';
import deployMd from '@docs/deploy/README.md';
import designMd from '@docs/design/README.md';
// 导入 docs.config.json
import docsConfig from '@docs/docs.config.json';
// 导入 markdown 文件（webpack asset/source 会导入为字符串）
import overviewMd from '@docs/overview/README.md';
import quickstartMd from '@docs/quickstart/README.md';
import techMd from '@docs/tech/README.md';
import { Marked, Renderer } from 'marked';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, DocsIcon, FeedbackIcon, GitHubIcon, PersonIcon } from '../components/Icons';
import type { DocsConfig, Section } from '../types/docs';
import styles from './DocsPage.module.css';

const config = docsConfig as DocsConfig;

const mdMap: Record<string, string> = {
  overview: overviewMd,
  quickstart: quickstartMd,
  api: apiMd,
  design: designMd,
  tech: techMd,
  deploy: deployMd,
};

// 简单但够用的锚点 slug
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '');
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  // 创建带自定义 heading 渲染的 marked 实例
  const marked = useMemo(() => {
    const renderer = new Renderer();
    renderer.heading = ({ tokens, depth }: { tokens: any; depth: number }) => {
      const text = tokens.map((t: any) => t.text || t.raw || '').join('');
      const id = slugify(text);
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    };
    const m = new Marked({
      gfm: true,
      breaks: true,
      renderer,
    });
    return m;
  }, []);

  // 渲染当前章节
  const currentMd = mdMap[activeSection];
  const html = useMemo(() => {
    if (!currentMd) return '<p>加载中...</p>';
    try {
      return marked.parse(currentMd) as string;
    } catch {
      return '<p>渲染失败</p>';
    }
  }, [currentMd, marked]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    // 等 React 渲染完再滚动
    requestAnimationFrame(() => {
      // 尝试找 anchor — 从 md 内容里找
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // fallback: 滚动到顶部
        document.querySelector(`.${styles.content}`)?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
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
            <Link to="/" className={styles.topbarLink}>
              <HomeIcon size={18} />
              <span className={styles.navLabel}>首页</span>
            </Link>
            <span className={styles.topbarLinkActive}>
              <DocsIcon size={18} />
              <span className={styles.navLabel}>文档</span>
            </span>
            <Link to="/feedback" className={styles.topbarLink}>
              <FeedbackIcon size={18} />
              <span className={styles.navLabel}>反馈</span>
            </Link>
            <a href="https://github.com/DingdingOvO/webchat" target="_blank" rel="noreferrer noopener" className={styles.topbarLink}>
              <GitHubIcon size={18} />
              <span className={styles.navLabel}>源代码</span>
            </a>
            <Link to="/login" className={styles.topbarLink}>
              <PersonIcon size={18} />
              <span className={styles.navLabel}>登录</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className={styles.layout}>
        {/* =============== Left sidebar =============== */}
        <aside className={styles.sidebar}>
          <nav className={styles.sidebarNav}>
            {config.sections.map((section: Section) => (
              <div key={section.id} className={styles.sidebarGroup}>
                <span className={styles.sidebarGroupTitle}>{section.title}</span>
                {section.children.map((child) => (
                  <a
                    key={child.id}
                    href={`#${child.id}`}
                    className={`${styles.sidebarItem} ${activeSection === section.id ? styles.sidebarItemActive : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(child.id);
                    }}
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
          <article className={styles.article} dangerouslySetInnerHTML={{ __html: html }} />

          {/* =============== Right sidebar =============== */}
          <aside className={styles.onThisPage}>
            <span className={styles.onThisPageTitle}>本页内容</span>
            <div className={styles.onThisPageList}>
              {config.sections
                .find((s) => s.id === activeSection)
                ?.children.map((child) => (
                  <a
                    key={child.id}
                    href={`#${child.id}`}
                    className={styles.onThisPageItem}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(child.id);
                    }}
                  >
                    {child.title}
                  </a>
                ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

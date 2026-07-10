import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/DingdingOvO/webchat';

export default function SourcePage() {
  useEffect(() => {
    window.location.href = GITHUB_URL;
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-faint)',
        fontSize: 'var(--text-base)',
        gap: 'var(--p4)',
      }}
    >
      <span style={{ fontSize: 32 }}>&#128279;</span>
      <span>正在跳转到 GitHub 源代码仓库...</span>
      <Link to={GITHUB_URL} style={{ color: 'var(--primary)', fontSize: 'var(--text-sm)' }}>
        如果未自动跳转，请点击此处
      </Link>
    </div>
  );
}

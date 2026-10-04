import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '登录失败');
        setLoading(false);
        return;
      }
      setAuth(data);
      navigate('/app');
    } catch {
      setError('网络连接失败');
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.themeSlot}>
        <Link to="/" className={styles.backHome}>
          返回首页
        </Link>
        <ThemeToggle />
      </div>

      <div className={styles.panel}>
        <div className={styles.brand}>
          <div className={styles.logo}>W</div>
          <div className={styles.brandText}>
            <span className={styles.wordmark}>WebChat</span>
            <span className={styles.wordmarkSub}>即时通讯</span>
          </div>
        </div>

        <div className={styles.heading}>
          <h1 className={styles.title}>欢迎回来</h1>
          <p className={styles.subtitle}>登录你的账号，继续之前的对话</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-username">
              用户名
            </label>
            <input
              id="login-username"
              className={styles.input}
              type="text"
              placeholder="输入用户名"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              密码
            </label>
            <input
              id="login-password"
              className={styles.input}
              type="password"
              placeholder="输入密码"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <p className={styles.footer}>
          还没有账号？<Link to="/register">注册一个</Link>
        </p>

        <p className={styles.hint}>
          演示账号 <code>demo</code> / <code>demo1234</code>
        </p>
      </div>
    </div>
  );
}

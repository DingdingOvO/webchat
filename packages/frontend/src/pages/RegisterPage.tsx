import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, authApi } from '../api';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.register({ username, password, nickname: nickname || undefined });
      setAuth(data);
      navigate('/app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '网络连接失败');
    } finally {
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
          <h1 className={styles.title}>创建账号</h1>
          <p className={styles.subtitle}>几步之内开始你的第一段对话</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-username">
              用户名
            </label>
            <input
              id="reg-username"
              className={styles.input}
              type="text"
              placeholder="3 ~ 50 个字符"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-nickname">
              昵称 <span className={styles.optional}>(可选)</span>
            </label>
            <input
              id="reg-nickname"
              className={styles.input}
              type="text"
              placeholder="默认使用用户名"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-password">
              密码
            </label>
            <input
              id="reg-password"
              className={styles.input}
              type="password"
              placeholder="至少 4 个字符"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? '注册中…' : '创建账号'}
          </button>
        </form>

        <p className={styles.footer}>
          已有账号？<Link to="/login">直接登录</Link>
        </p>
      </div>
    </div>
  );
}

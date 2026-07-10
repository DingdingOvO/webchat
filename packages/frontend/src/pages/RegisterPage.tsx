import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname: nickname || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '注册失败');
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
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>W</div>
        <h1 className={styles.title}>创建账号</h1>
        <p className={styles.subtitle}>加入 WebChat，开始即时通讯</p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>用户名</label>
            <input
              className={styles.input}
              type="text"
              placeholder="3~50 个字符"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>昵称</label>
            <input
              className={styles.input}
              type="text"
              placeholder="可选，默认使用用户名"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>密码</label>
            <input
              className={styles.input}
              type="password"
              placeholder="至少 4 个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </div>
        <p className={styles.footer}>
          已有账号？<Link to="/login">登录</Link>
        </p>
      </form>
    </div>
  );
}

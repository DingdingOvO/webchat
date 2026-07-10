import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(auth?.username || '');
  const [avatar, setAvatar] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.avatar) setAvatar(d.avatar);
      })
      .catch(() => {});
  }, [auth]);

  async function handleUsername() {
    if (!auth || !username.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/users/profile/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error });
        setLoading(false);
        return;
      }
      setAuth({ ...auth, username: data.username });
      setMsg({ type: 'ok', text: '用户名已更新' });
      setLoading(false);
    } catch {
      setMsg({ type: 'error', text: '网络错误' });
      setLoading(false);
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !auth) return;
    if (file.size > 500_000) {
      setMsg({ type: 'error', text: '图片过大，请选择 500KB 以内的图片' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLoading(true);
      setMsg(null);
      try {
        const res = await fetch('/api/users/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ avatar: base64 }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMsg({ type: 'error', text: data.error });
        } else {
          setAvatar(base64);
          setMsg({ type: 'ok', text: '头像已更新' });
        }
        setLoading(false);
      } catch {
        setMsg({ type: 'error', text: '上传失败' });
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handlePassword() {
    if (!auth) return;
    if (newPw.length < 4) {
      setMsg({ type: 'error', text: '新密码至少 4 个字符' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/users/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error });
      } else {
        setMsg({ type: 'ok', text: '密码已更新' });
        setOldPw('');
        setNewPw('');
      }
      setLoading(false);
    } catch {
      setMsg({ type: 'error', text: '网络错误' });
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/app/chat')}>
          <ArrowLeftIcon />
        </button>
        <h1 className={styles.title}>设置</h1>
      </header>

      {msg && <div className={`${styles.msg} ${msg.type === 'ok' ? styles.msgOk : styles.msgErr}`}>{msg.text}</div>}

      <div className={styles.body}>
        {/* 头像 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>头像</h2>
          <div className={styles.avatarRow}>
            <div className={styles.avatarPreview} onClick={() => fileInput.current?.click()}>
              {avatar ? (
                <img src={avatar} alt="avatar" className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarLetter}>{auth?.username?.charAt(0).toUpperCase()}</span>
              )}
              <div className={styles.avatarOverlay}>更换</div>
            </div>
            <input ref={fileInput} type="file" accept="image/*" onChange={handleAvatar} hidden />
            <p className={styles.hint}>点击头像更换，支持 JPEG/PNG，最大 500KB</p>
          </div>
        </section>

        {/* 用户名 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>用户名</h2>
          <div className={styles.fieldRow}>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
            />
            <button className={styles.btn} onClick={handleUsername} disabled={loading || !username.trim()}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </section>

        {/* 密码 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>修改密码</h2>
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              placeholder="原密码"
            />
            <input
              className={styles.input}
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="新密码（至少 4 位）"
            />
            <button className={styles.btn} onClick={handlePassword} disabled={loading || !oldPw || !newPw}>
              {loading ? '保存中...' : '修改密码'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

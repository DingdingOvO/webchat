import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { GroupDTO, UserDTO } from '../types';
import { DismissIcon } from './Icons';
import styles from './CreateGroupModal.module.css';

interface Props {
  readonly friends: UserDTO[];
  readonly onClose: () => void;
  readonly onCreated: (g: GroupDTO) => void;
}

export default function CreateGroupModal({ friends, onClose, onCreated }: Props) {
  const { auth } = useAuth();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggle(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function handleCreate() {
    if (!name.trim() || !auth) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
          'X-Auth-Token': auth.token,
        },
        body: JSON.stringify({ name: name.trim(), memberIds: [...selected] }),
      });
      if (!res.ok) {
        const data: Record<string, string> = await res.json().catch(() => ({}));
        setError(data.error || '创建失败');
        return;
      }
      onCreated(await res.json());
      onClose();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  const displayName = (f: UserDTO) => f.nickname || f.username;

  return (
    <div className={styles.scrim} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="创建群组"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>创建群组</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <DismissIcon size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <label className={styles.label} htmlFor="group-name">
            群组名称
          </label>
          <input
            id="group-name"
            className={styles.input}
            type="text"
            placeholder="例如：产品讨论组"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) handleCreate();
            }}
          />

          <div className={styles.memberHead}>
            <span className={styles.label}>选择成员</span>
            <span className={styles.counter}>已选 {selected.size}</span>
          </div>

          <div className={styles.memberList}>
            {friends.length === 0 && <p className={styles.empty}>还没有好友，先去添加吧。</p>}
            {friends.map((f) => (
              <label key={f.id} className={styles.member}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selected.has(f.id)}
                  onChange={() => toggle(f.id)}
                />
                <span className={styles.memberAvatar}>{displayName(f).charAt(0).toUpperCase()}</span>
                <span className={styles.memberName}>{displayName(f)}</span>
              </label>
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <footer className={styles.footer}>
          <button className={styles.btnGhost} onClick={onClose}>
            取消
          </button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? '创建中…' : '创建群组'}
          </button>
        </footer>
      </div>
    </div>
  );
}

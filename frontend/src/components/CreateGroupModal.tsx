import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserDTO, GroupDTO } from '../types';

interface Props {
  friends: UserDTO[];
  onClose: () => void;
  onCreated: (g: GroupDTO) => void;
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
      if (n.has(id)) n.delete(id); else n.add(id);
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ name: name.trim(), memberIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '创建失败');
        return;
      }
      onCreated(await res.json());
      onClose();
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 380, background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-xl)', padding: 'var(--p5) var(--p6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, marginBottom: 'var(--p4)' }}>
          创建群组
        </h2>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--p3)' }}>
            {error}
          </p>
        )}

        <input
          style={{
            width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-md)', fontSize: 'var(--fs-base)', marginBottom: 'var(--p4)',
            outline: 'none', boxSizing: 'border-box',
          }}
          type="text" placeholder="群组名称" value={name}
          onChange={(e) => setName(e.target.value)} autoFocus
        />

        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 'var(--p4)' }}>
          {friends.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 'var(--fs-sm)' }}>暂无好友</p>
          )}
          {friends.map((f) => (
            <label
              key={f.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--p2)',
                padding: 'var(--p1) 0', cursor: 'pointer', fontSize: 'var(--fs-sm)',
              }}
            >
              <input
                type="checkbox" checked={selected.has(f.id)}
                onChange={() => toggle(f.id)} style={{ accentColor: 'var(--primary)' }}
              />
              {f.nickname || f.username}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--p2)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-md)', background: 'transparent', cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            style={{
              padding: '8px 20px', background: 'var(--primary)', color: 'var(--white)',
              border: 'none', borderRadius: 'var(--r-md)', cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}

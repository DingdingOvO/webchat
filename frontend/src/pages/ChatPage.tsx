import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WebSocketProvider, useWs } from '../context/WebSocketContext';
import { MessageList } from '../components/MessageList';
import { buildConversations } from '../components/conversations';
import CreateGroupModal from '../components/CreateGroupModal';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  SearchIcon, SignOutIcon, ChatIcon, SendIcon,
  CheckmarkIcon, DismissIcon, ArrowLeftIcon,
} from '../components/Icons';
import type { UserDTO, MessageDTO, GroupDTO, Contact } from '../types';
import styles from './ChatPage.module.css';

/* ============ Inner (with WebSocket) ============ */

interface PendingRequest {
  id: number;
  fromUserId: number;
  status: string;
}

function ChatPageInner() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { connected, subscribe, send: wsSend } = useWs();
  const userId = auth?.userId ?? 0;
  const isMobile = useIsMobile();

  /* state */
  const [friends, setFriends] = useState<UserDTO[]>([]);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [convMessages, setConvMessages] = useState<Map<string, MessageDTO[]>>(new Map());
  const [unreadMap, setUnreadMap] = useState<Map<string, number>>(new Map());
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [tab, setTab] = useState<'消息' | '联系人'>('消息');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDTO[]>([]);
  const [searchError, setSearchError] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [activeConvKey, setActiveConvKey] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  /* ---- load initial data ---- */
  useEffect(() => {
    if (!auth) return;
    (async () => {
      setDataLoading(true);
      try {
        const [fRes, gRes, pRes] = await Promise.all([
          fetch('/api/users/friends', { headers: { Authorization: `Bearer ${auth.token}` } }),
          fetch('/api/groups', { headers: { Authorization: `Bearer ${auth.token}` } }),
          fetch('/api/users/friend-requests/pending', { headers: { Authorization: `Bearer ${auth.token}` } }),
        ]);
        if (!fRes.ok || !gRes.ok) return;
        const fData: UserDTO[] = await fRes.json();
        const gData: GroupDTO[] = await gRes.json();
        const pData: PendingRequest[] = await (pRes.ok ? pRes.json() : []);
        setFriends(fData);
        setGroups(gData);
        setPendingRequests(pData);
        setContacts([
          ...fData.map((u) => ({
            key: `p2p:${Math.min(userId, u.id)}:${Math.max(userId, u.id)}`,
            type: 'p2p' as const,
            name: u.nickname || u.username,
            user: u,
          })),
          ...gData.map((g) => ({
            key: `group:${g.id}`,
            type: 'group' as const,
            name: g.name,
            group: g,
          })),
        ]);
      } catch (err) {
        console.error('加载初始数据失败', err);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [auth, userId]);

  /* ---- load messages ---- */
  const loadMessages = useCallback(async (convKey: string) => {
    if (!auth) return;
    setMessageLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?convKey=${encodeURIComponent(convKey)}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!res.ok) {
        console.warn('加载消息失败', res.status);
        return;
      }
      const text = await res.text();
      let data: MessageDTO[];
      try { data = JSON.parse(text); } catch {
        console.warn('消息数据解析失败');
        return;
      }
      setConvMessages((prev) => {
        const n = new Map(prev);
        n.set(convKey, data);
        return n;
      });
    } catch (err) {
      console.error('加载消息异常', err);
    } finally {
      setMessageLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    if (activeConvKey) {
      loadMessages(activeConvKey);
      setUnreadMap((prev) => {
        const n = new Map(prev);
        n.set(activeConvKey, 0);
        return n;
      });
      wsSend({ type: 'read', conversationKey: activeConvKey });
    }
  }, [activeConvKey, loadMessages, wsSend]);

  /* ---- WebSocket subscriptions ---- */
  useEffect(() => {
    const unsub1 = subscribe('message', (msg) => {
      try {
        const data = msg.data as MessageDTO;
        if (!data || typeof data.senderId !== 'number') return;
        const convKey = data.type === 'P2P'
          ? `p2p:${Math.min(data.senderId, data.receiverId!)}:${Math.max(data.senderId, data.receiverId!)}`
          : `group:${data.receiverId}`;
        setConvMessages((prev) => {
          const n = new Map(prev);
          const ex = n.get(convKey) || [];
          // 用 message id 去重
          if (data.id && ex.some((m) => m.id === data.id)) return prev;
          // 兜底：用时间+内容去重
          if (ex.some((m) => m.createdAt === data.createdAt && m.senderId === data.senderId && m.content === data.content)) return prev;
          n.set(convKey, [...ex, data]);
          return n;
        });
        if (convKey !== activeConvKey) {
          setUnreadMap((prev) => {
            const n = new Map(prev);
            n.set(convKey, (n.get(convKey) || 0) + 1);
            return n;
          });
        }
      } catch (err) {
        console.error('处理 WS 消息失败', err);
      }
    });

    const unsub2 = subscribe('online', (msg) => {
      try {
        const uid = msg.userId as number;
        const online = msg.online as boolean;
        setFriends((prev) => prev.map((f) => f.id === uid ? { ...f, online } : f));
        setContacts((prev) => prev.map((c) => {
          if (c.user?.id === uid) return { ...c, user: { ...c.user, online } };
          return c;
        }));
      } catch (err) {
        console.error('处理在线状态失败', err);
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [subscribe, activeConvKey]);

  /* ---- search ---- */
  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim() || !auth) { setSearchResults([]); setSearchError(''); return; }
    setSearchError('');
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) setSearchResults(await res.json());
      else setSearchError('搜索失败');
    } catch (err) {
      console.error('搜索异常', err);
      setSearchResults([]);
      setSearchError('网络错误');
    }
  }

  async function addFriend(uid: number) {
    if (!auth) return;
    try {
      const res = await fetch('/api/users/friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ userId: uid }),
      });
      if (!res.ok) console.warn('添加好友失败', res.status);
    } catch (err) {
      console.error('添加好友异常', err);
    }
  }

  async function handleRequestAction(id: number, action: 'accept' | 'reject') {
    if (!auth) return;
    try {
      const res = await fetch(`/api/users/friend-requests/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
        const fRes = await fetch('/api/users/friends', { headers: { Authorization: `Bearer ${auth.token}` } });
        if (fRes.ok) setFriends(await fRes.json());
      }
    } catch (err) {
      console.error('处理好友请求失败', err);
    }
  }

  /* ---- send message ---- */
  function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed || !auth || !activeConvKey) return;
    const isGroup = activeConvKey.startsWith('group:');
    const receiverId = isGroup
      ? parseInt(activeConvKey.replace('group:', ''), 10)
      : activeConvKey.replace('p2p:', '').split(':').map(Number).find((id) => id !== userId)!;
    wsSend({ type: isGroup ? 'group' : 'p2p', receiverId, content: trimmed });
    setInputText('');
  }

  /* ---- derived ---- */
  const conversations = useMemo(
    () => buildConversations(convMessages, contacts, unreadMap),
    [convMessages, contacts, unreadMap],
  );

  const activeContact = contacts.find((c) => c.key === activeConvKey);
  const activeMessages = activeConvKey ? convMessages.get(activeConvKey) || [] : [];

  function selectConv(key: string) {
    setActiveConvKey(key);
    if (isMobile) setShowChat(true);
  }

  function goBack() { setShowChat(false); }

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => a.username.localeCompare(b.username));
  }, [friends]);

  /* ---- render ---- */
  return (
    <div className={styles.layout}>
      {/* ===== LEFT PANEL ===== */}
      <aside className={`${styles.leftPanel} ${isMobile && showChat ? styles.leftPanelHidden : ''}`}>
        {/* top bar */}
        <div className={styles.topbar}>
          <div className={styles.userInfo} onClick={() => navigate('/app/settings')}>
            <div className={styles.userAvatar}>
              {auth?.nickname?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className={styles.userName}>{auth?.nickname || auth?.username}</span>
            {!connected && <span className={styles.offlineBadge}>未连接</span>}
          </div>
          <div className={styles.toolbar}>
            <button className={styles.iconBtn} onClick={() => setShowSearch(!showSearch)} title="搜索"><SearchIcon /></button>
            <button className={styles.iconBtn} onClick={() => setShowGroupModal(true)} title="建群">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.5a.5.5 0 0 0-1 0V9H2.5a.5.5 0 0 0 0 1H9v6.5a.5.5 0 0 0 1 0V10h6.5a.5.5 0 0 0 0-1H10V2.5Z"/></svg>
            </button>
            <button className={styles.iconBtn} onClick={() => navigate('/app/settings')} title="设置">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM9 5.5a1 1 0 1 1 2 0V9h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V5.5Z"/></svg>
            </button>
            <button className={styles.iconBtn} onClick={() => { logout(); navigate('/'); }} title="退出"><SignOutIcon /></button>
          </div>
        </div>

        {/* pending friend requests */}
        {pendingRequests.length > 0 && (
          <div className={styles.requestBanner}>
            <span className={styles.requestBannerTitle}>{pendingRequests.length} 条好友请求</span>
            <div className={styles.requestActions}>
              {pendingRequests.map((r) => (
                <div key={r.id} className={styles.requestItem}>
                  <span>用户 #{r.fromUserId}</span>
                  <button className={styles.requestAccept} onClick={() => handleRequestAction(r.id, 'accept')}>
                    <CheckmarkIcon size={14} />
                  </button>
                  <button className={styles.requestReject} onClick={() => handleRequestAction(r.id, 'reject')}>
                    <DismissIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* tabs */}
        <div className={styles.tabBar}>
          <button className={`${styles.tab} ${tab === '消息' ? styles.tabActive : ''}`} onClick={() => setTab('消息')}>消息</button>
          <button className={`${styles.tab} ${tab === '联系人' ? styles.tabActive : ''}`} onClick={() => setTab('联系人')}>联系人</button>
        </div>

        {/* search */}
        {showSearch && (
          <div className={styles.searchBox}>
            <div className={styles.searchInputWrap}>
              <span className={styles.searchIcon}><SearchIcon size={16} /></span>
              <input className={styles.searchInput} type="text" placeholder="搜索用户..."
                value={searchQuery} onChange={(e) => handleSearch(e.target.value)} autoFocus />
            </div>
            {searchError && <p style={{ color: 'var(--red)', padding: 'var(--p2)' }}>{searchError}</p>}
            {searchResults.map((u) => (
              <div key={u.id} className={styles.searchResultItem}>
                <span className={styles.searchResultAvatar}>{u.nickname?.charAt(0).toUpperCase()}</span>
                <span className={styles.searchResultName}>{u.nickname || u.username}</span>
                <button className={styles.addBtn} onClick={() => addFriend(u.id)}>加好友</button>
              </div>
            ))}
          </div>
        )}

        {/* list area */}
        {dataLoading ? (
          <div className={styles.loadingState}>加载中...</div>
        ) : (
          <div className={styles.list}>
            {tab === '消息' && (
              conversations.length === 0 ? (
                <div className={styles.emptyState}>暂无消息</div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.key}
                    className={`${styles.convItem} ${conv.key === activeConvKey ? styles.convItemActive : ''}`}
                    onClick={() => selectConv(conv.key)}>
                    <div className={styles.convAvatar}>{conv.name.charAt(0).toUpperCase()}</div>
                    <div className={styles.convInfo}>
                      <div className={styles.convTop}>
                        <span className={styles.convName}>{conv.name}</span>
                        <span className={styles.convTime}>
                          {new Date(conv.lastTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={styles.convBottom}>
                        <span className={styles.convLast}>{conv.lastMessage}</span>
                        {conv.unread > 0 && <span className={styles.convBadge}>{conv.unread > 99 ? '99+' : conv.unread}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {tab === '联系人' && (
              <>
                {sortedFriends.length > 0 && (
                  <>
                    <div className={styles.sectionHeader}>好友 A-Z</div>
                    {sortedFriends.map((f) => {
                      const ck = `p2p:${Math.min(userId, f.id)}:${Math.max(userId, f.id)}`;
                      return (
                        <div key={f.id} className={`${styles.contactItem} ${ck === activeConvKey ? styles.contactItemActive : ''}`}
                          onClick={() => selectConv(ck)}>
                          <div className={styles.contactAvatar}>
                            {f.nickname?.charAt(0).toUpperCase()}
                            <span className={`${styles.statusDot} ${f.online ? styles.statusOnline : styles.statusOffline}`} />
                          </div>
                          <span className={styles.contactName}>{f.nickname || f.username}</span>
                        </div>
                      );
                    })}
                  </>
                )}
                {groups.length > 0 && (
                  <>
                    <div className={styles.sectionHeader}>群组 #</div>
                    {groups.map((g) => {
                      const ck = `group:${g.id}`;
                      return (
                        <div key={g.id} className={`${styles.contactItem} ${ck === activeConvKey ? styles.contactItemActive : ''}`}
                          onClick={() => selectConv(ck)}>
                          <div className={`${styles.contactAvatar} ${styles.groupAvatar}`}>
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                          <span className={styles.contactName}>{g.name}</span>
                        </div>
                      );
                    })}
                  </>
                )}
                {friends.length === 0 && groups.length === 0 && (
                  <div className={styles.emptyState}>暂无联系人</div>
                )}
              </>
            )}
          </div>
        )}
      </aside>

      {/* ===== RIGHT PANEL ===== */}
      <main className={`${styles.rightPanel} ${isMobile && !showChat ? styles.rightPanelHidden : ''}`}>
        {activeContact ? (
          <>
            <header className={styles.chatHeader}>
              {isMobile && (
                <button className={styles.chatBackBtn} onClick={goBack}><ArrowLeftIcon /></button>
              )}
              <div className={styles.chatAvatar}>{activeContact.name.charAt(0).toUpperCase()}</div>
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{activeContact.name}</div>
                <div className={styles.chatMeta}>
                  {activeContact.type === 'p2p'
                    ? (activeContact.user?.online ? '在线' : '离线')
                    : `群组 · ${activeContact.group?.memberCount || '?'} 人`}
                </div>
              </div>
            </header>
            <div className={styles.messages}>
              {messageLoading && activeMessages.length === 0 ? (
                <div className={styles.loadingState}>加载消息中...</div>
              ) : (
                <MessageList messages={activeMessages} userId={userId} contactType={activeContact.type} />
              )}
            </div>
            <div className={styles.inputArea}>
              <input className={styles.inputField} type="text" placeholder="输入消息..."
                value={inputText} onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} />
              <button className={styles.sendBtn} onClick={handleSend} disabled={!inputText.trim()}>
                <SendIcon size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <ChatIcon size={64} />
            <span>选择一个对话开始聊天</span>
          </div>
        )}
      </main>

      {showGroupModal && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowGroupModal(false)}
          onCreated={(g) => {
            setGroups((prev) => [...prev, g]);
            setContacts((prev) => [...prev, {
              key: `group:${g.id}`, type: 'group' as const, name: g.name, group: g,
            }]);
          }}
        />
      )}
    </div>
  );
}

/* ============ Outer ============ */

export default function ChatPage() {
  const { auth } = useAuth();
  if (!auth) return null;
  return (
    <WebSocketProvider>
      <ChatPageInner />
    </WebSocketProvider>
  );
}

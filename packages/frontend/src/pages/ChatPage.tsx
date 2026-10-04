import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, chatApi, groupApi, type PendingRequest, userApi } from '../api';
import { hueIndex } from '../components/avatarHue';
import CreateGroupModal from '../components/CreateGroupModal';
import { buildConversations } from '../components/conversations';
import {
  AddIcon,
  ArrowLeftIcon,
  ChatIcon,
  CheckmarkIcon,
  DismissIcon,
  SearchIcon,
  SendIcon,
  SignOutIcon,
} from '../components/Icons';
import { MessageList } from '../components/MessageList';
import ThemeToggle from '../components/ThemeToggle';
import { formatTime, toMillis } from '../components/time';
import { useAuth } from '../context/AuthContext';
import { useWs, WebSocketProvider } from '../context/WebSocketContext';
import { useIsMobile } from '../hooks/useIsMobile';
import type { Contact, GroupDTO, MessageDTO, UserDTO } from '../types';
import styles from './ChatPage.module.css';

/* ============ Inner (with WebSocket) ============ */

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDTO[]>([]);
  const [searchError, setSearchError] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [activeConvKey, setActiveConvKey] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  /* 「对方正在输入」：后端已完整实现 typing 的接收/存储/转发，
     但前端此前既不上报也不展示，导致该能力形同虚设。此处补全。 */
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  /* ---- load initial data ---- */
  useEffect(() => {
    if (!auth) return;
    (async () => {
      setDataLoading(true);
      try {
        const [fData, gData, pData] = await Promise.all([
          userApi.friends(),
          groupApi.list(),
          // 待处理请求失败不应拖垮首屏，降级为空列表
          userApi.pendingRequests().catch(() => [] as PendingRequest[]),
        ]);
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
      } catch (_err) {
        /* 首屏加载失败时保持空列表，不阻塞界面 */
      } finally {
        setDataLoading(false);
      }
    })();
  }, [auth, userId]);

  /* ---- prefetch conversation list ----
     会话列表由「已加载消息」派生，但初始不会预取任何历史消息，
     导致进入应用后「消息」标签始终为空（联系人/群组明明存在）。
     这里在拿到联系人与群组后，批量拉取各会话最近消息，填充列表。 */
  useEffect(() => {
    if (!auth || contacts.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        contacts.map(async (c) => {
          try {
            const data = await chatApi.messages(c.key);
            return [c.key, data] as const;
          } catch {
            return [c.key, [] as MessageDTO[]] as const;
          }
        }),
      );
      if (cancelled) return;
      setConvMessages((prev) => {
        const n = new Map(prev);
        for (const [key, fetched] of results) {
          if (fetched.length === 0) continue;
          const existing = n.get(key) || [];
          /* 按 id 去重合并，再按时间排序。
             旧写法用 `msgs.length >= existing.length` 做门槛并直接把 fetched 放前面，
             有两个问题：
             1) 若期间 WebSocket 已推来更多消息（existing 更长），整个合并会被跳过，
                拉到的历史被丢弃；
             2) 拼接顺序不保证时间序，可能出现较新消息排在较旧消息之前。 */
          const byId = new Map<string, MessageDTO>();
          for (const m of fetched) if (m?.id) byId.set(m.id, m);
          for (const m of existing) if (m?.id) byId.set(m.id, m);
          const merged = [...byId.values()].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
          n.set(key, merged);
        }
        return n;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, contacts]);

  /* ---- load messages ---- */
  const loadMessages = useCallback(
    async (convKey: string) => {
      if (!auth) return;
      setMessageLoading(true);
      try {
        const data = await chatApi.messages(convKey);
        setConvMessages((prev) => {
          const n = new Map(prev);
          /* 同样按 id 合并而不是直接覆盖：
             拉取期间 WebSocket 可能已推来新消息，直接 set 会把它们冲掉。 */
          const existing = n.get(convKey) || [];
          const byId = new Map<string, MessageDTO>();
          for (const m of data) if (m?.id) byId.set(m.id, m);
          for (const m of existing) if (m?.id) byId.set(m.id, m);
          n.set(
            convKey,
            [...byId.values()].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)),
          );
          return n;
        });
      } catch (_err) {
        /* 拉取失败保持原内容 */
      } finally {
        setMessageLoading(false);
      }
    },
    [auth],
  );

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
        const convKey =
          data.type === 'P2P'
            ? `p2p:${Math.min(data.senderId, data.receiverId!)}:${Math.max(data.senderId, data.receiverId!)}`
            : `group:${data.receiverId}`;
        setConvMessages((prev) => {
          const n = new Map(prev);
          const list = n.get(convKey) || [];
          if (!list.some((m) => m.id === data.id)) n.set(convKey, [...list, data]);
          return n;
        });
        if (convKey !== activeConvKey && data.senderId !== userId) {
          setUnreadMap((prev) => {
            const n = new Map(prev);
            n.set(convKey, (n.get(convKey) || 0) + 1);
            return n;
          });
        }
      } catch (_err) {
        /* 忽略格式异常的消息 */
      }
    });

    /* 后端广播的 action 是 'online'，且 payload 是「扁平」的
       （userId / nickname / online 直接挂在顶层，不套 data），
       与 'message' 的 { action, data } 结构不同，这里必须按真实契约解析。
       旧代码订阅的 action 名是 'presence'、又从 msg.data 取值，
       两处都对不上，导致好友在线状态永远不刷新。 */
    const unsub2 = subscribe('online', (msg) => {
      const userId2 = msg.userId as number | undefined;
      const online = msg.online as boolean | undefined;
      if (typeof userId2 !== 'number' || typeof online !== 'boolean') return;
      setFriends((prev) => prev.map((f) => (f.id === userId2 ? { ...f, online } : f)));
    });

    /* 后端 typing 事件同样是扁平结构：{ action:'typing', userId, conversationKey }。
       收到后加入 typingUsers，3 秒无新事件自动移除（对方停手后不该一直显示）。 */
    const unsub3 = subscribe('typing', (msg) => {
      const who = msg.userId as number | undefined;
      if (typeof who !== 'number') return;
      setTypingUsers((prev) => {
        const n = new Set(prev);
        n.add(who);
        return n;
      });
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [subscribe, activeConvKey, userId]);

  /* ---- 发送「正在输入」节流 ----
     输入框每次按键都发 WS 会打爆连接，这里限制为「每 2 秒最多发一次」。
     仅在当前是 P2P 会话时上报：群聊的多方 typing 状态较复杂，后端也只按 P2P 计算会话键。 */
  const lastTypingSent = useRef(0);
  function notifyTyping() {
    if (!activeConvKey || !activeConvKey.startsWith('p2p:')) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    const peer =
      activeConvKey
        .replace('p2p:', '')
        .split(':')
        .map(Number)
        .find((id) => id !== userId) ?? 0;
    if (peer) wsSend({ type: 'typing', receiverId: peer });
  }

  /* ---- typing 指示自动过期 ----
     后端只在「有按键」时推送 typing，没有显式的「停止」事件。
     这里给每个用户设 3 秒倒计时，期间没有新事件就把他从 typingUsers 里移除。 */
  useEffect(() => {
    if (typingUsers.size === 0) return;
    const t = setTimeout(() => setTypingUsers(new Set()), 3000);
    return () => clearTimeout(t);
  }, [typingUsers]);

  /* ---- actions ---- */
  async function handleSearch(q: string) {
    setSearchQuery(q);
    setSearchError('');
    if (!q.trim() || !auth) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await userApi.search(q.trim());
      setSearchResults(data.filter((u) => u.id !== userId));
    } catch {
      setSearchResults([]);
    }
  }

  async function addFriend(id: number) {
    if (!auth) return;
    try {
      await userApi.sendFriendRequest(id);
      setSearchResults((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : '网络错误');
    }
  }

  async function handleRequestAction(id: number, action: 'accept' | 'reject') {
    if (!auth) return;
    try {
      if (action === 'accept') await userApi.acceptFriendRequest(id);
      else await userApi.rejectFriendRequest(id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      // 接受后好友列表会变化，重新拉取
      setFriends(await userApi.friends());
    } catch (_err) {
      /* 忽略 */
    }
  }

  /* ---- send message ---- */
  function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed || !auth || !activeConvKey) return;
    const isGroup = activeConvKey.startsWith('group:');
    const receiverId = isGroup
      ? parseInt(activeConvKey.replace('group:', ''), 10)
      : activeConvKey
          .replace('p2p:', '')
          .split(':')
          .map(Number)
          .find((id) => id !== userId)!;
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

  /* 当前会话里谁正在输入。P2P 只可能有一位对端；群聊则多人。
     注意排除自己：typingUsers 只应包含对端，但保险起见仍过滤 userId。 */
  const othersTyping = [...typingUsers].filter((id) => id !== userId);
  const peerTyping = activeConvKey?.startsWith('p2p:') === true && othersTyping.length > 0;
  const groupTyping = activeConvKey?.startsWith('group:') === true && othersTyping.length > 0;

  function selectConv(key: string) {
    setActiveConvKey(key);
    if (isMobile) setShowChat(true);
  }

  function goBack() {
    setShowChat(false);
  }

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => a.username.localeCompare(b.username));
  }, [friends]);

  const friendName = (f: UserDTO) => f.nickname || f.username;

  /* 按对象取稳定色相：同一个人在任何列表、任何时间都是同一个颜色 */
  const hueClass = (id: number | string) => styles[`hue${hueIndex(id)}` as keyof typeof styles] ?? '';

  /* ---- render ---- */
  return (
    <div className={styles.layout}>
      {/* ================= 侧栏 ================= */}
      <aside className={`${styles.sidebar} ${isMobile && showChat ? styles.sidebarHidden : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.meRow}>
            <div className={styles.me} onClick={() => navigate('/app/settings')} role="button" tabIndex={0}>
              <div className={styles.meAvatar}>{auth?.nickname?.charAt(0).toUpperCase() || 'U'}</div>
              <div className={styles.meText}>
                <span className={styles.meName}>{auth?.nickname || auth?.username}</span>
                <span className={`${styles.meStatus} ${!connected ? styles.meStatusOffline : ''}`}>
                  {connected ? '在线' : '连接已断开'}
                </span>
              </div>
            </div>

            <div className={styles.tools}>
              <button
                className={styles.toolBtn}
                onClick={() => setShowGroupModal(true)}
                title="创建群组"
                aria-label="创建群组"
              >
                <AddIcon />
              </button>
              <ThemeToggle className={styles.toolBtn} />
              <button
                className={styles.toolBtn}
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="退出登录"
                aria-label="退出登录"
              >
                <SignOutIcon />
              </button>
            </div>
          </div>

          {/* 搜索常驻：高频动作不该藏在图标后面 */}
          <div className={styles.searchBar}>
            <SearchIcon size={16} />
            <input
              className={styles.searchBarInput}
              type="text"
              placeholder="搜索用户"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {!connected && <div className={styles.offlineBar}>连接已断开，正在自动重连…</div>}

        {pendingRequests.length > 0 && (
          <div className={styles.requests}>
            <div className={styles.requestsTitle}>{pendingRequests.length} 条好友请求</div>
            {pendingRequests.map((r) => (
              <div key={r.id} className={styles.requestRow}>
                <span className={styles.requestName}>用户 #{r.fromUserId}</span>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handleRequestAction(r.id, 'accept')}
                  title="接受"
                  aria-label="接受"
                >
                  <CheckmarkIcon size={14} />
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleRequestAction(r.id, 'reject')}
                  title="拒绝"
                  aria-label="拒绝"
                >
                  <DismissIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === '消息' ? styles.tabActive : ''}`} onClick={() => setTab('消息')}>
            消息
          </button>
          <button
            className={`${styles.tab} ${tab === '联系人' ? styles.tabActive : ''}`}
            onClick={() => setTab('联系人')}
          >
            联系人
          </button>
        </div>

        {searchQuery.trim() !== '' && (
          <div className={styles.searchArea}>
            {searchError && <p className={styles.searchError}>{searchError}</p>}
            {searchResults.length > 0 && (
              <div className={styles.results}>
                {searchResults.map((u) => (
                  <div key={u.id} className={styles.resultRow}>
                    <span className={styles.resultAvatar}>{friendName(u).charAt(0).toUpperCase()}</span>
                    <span className={styles.resultName}>{friendName(u)}</span>
                    <button className={styles.addBtn} onClick={() => addFriend(u.id)}>
                      加好友
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {dataLoading ? (
          <div className={styles.placeholder}>加载中…</div>
        ) : (
          <div className={styles.list}>
            {tab === '消息' &&
              (conversations.length === 0 ? (
                <div className={styles.placeholder}>
                  还没有会话
                  <br />
                  去「联系人」开始聊天
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.key}
                    className={`${styles.row} ${conv.key === activeConvKey ? styles.rowActive : ''}`}
                    onClick={() => selectConv(conv.key)}
                  >
                    <div
                      className={`${styles.rowAvatar} ${
                        conv.type === 'group' ? styles.rowAvatarGroup : hueClass(conv.key)
                      }`}
                    >
                      {conv.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.rowBody}>
                      <div className={styles.rowTop}>
                        <span className={styles.rowName}>{conv.name}</span>
                        <span className={styles.rowTime}>{formatTime(conv.lastTime)}</span>
                      </div>
                      <div className={styles.rowBottom}>
                        <span className={styles.rowPreview}>{conv.lastMessage}</span>
                        {conv.unread > 0 && (
                          <span className={styles.badge}>{conv.unread > 99 ? '99+' : conv.unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ))}

            {tab === '联系人' && (
              <>
                {sortedFriends.length > 0 && (
                  <>
                    <div className={styles.sectionLabel}>好友</div>
                    {sortedFriends.map((f) => {
                      const ck = `p2p:${Math.min(userId, f.id)}:${Math.max(userId, f.id)}`;
                      return (
                        <div
                          key={f.id}
                          className={`${styles.row} ${ck === activeConvKey ? styles.rowActive : ''}`}
                          onClick={() => selectConv(ck)}
                        >
                          <div className={`${styles.rowAvatar} ${hueClass(f.id)}`}>
                            {friendName(f).charAt(0).toUpperCase()}
                            <span
                              className={`${styles.presence} ${f.online ? styles.presenceOnline : styles.presenceOffline}`}
                            />
                          </div>
                          <div className={styles.rowBody}>
                            <span className={styles.rowName}>{friendName(f)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {groups.length > 0 && (
                  <>
                    <div className={styles.sectionLabel}>群组</div>
                    {groups.map((g) => {
                      const ck = `group:${g.id}`;
                      return (
                        <div
                          key={g.id}
                          className={`${styles.row} ${ck === activeConvKey ? styles.rowActive : ''}`}
                          onClick={() => selectConv(ck)}
                        >
                          <div className={`${styles.rowAvatar} ${styles.rowAvatarGroup}`}>
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.rowBody}>
                            <span className={styles.rowName}>{g.name}</span>
                            <span className={styles.rowPreview}>{g.memberCount} 人</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {friends.length === 0 && groups.length === 0 && <div className={styles.placeholder}>还没有联系人</div>}
              </>
            )}
          </div>
        )}
      </aside>

      {/* ================= 会话区 ================= */}
      <main className={`${styles.main} ${isMobile && !showChat ? styles.mainHidden : ''}`}>
        {activeContact ? (
          <>
            <header className={styles.chatHeader}>
              {isMobile && (
                <button className={styles.backBtn} onClick={goBack} aria-label="返回">
                  <ArrowLeftIcon />
                </button>
              )}
              <div
                className={`${styles.chatAvatar} ${
                  activeContact.type === 'group' ? styles.chatAvatarGroup : hueClass(activeContact.key)
                }`}
              >
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.chatMeta}>
                <div className={styles.chatName}>{activeContact.name}</div>
                <div className={styles.chatSub}>
                  {activeContact.type === 'p2p'
                    ? peerTyping
                      ? '正在输入…'
                      : activeContact.user?.online
                        ? '在线'
                        : '离线'
                    : groupTyping
                      ? '有人正在输入…'
                      : `群组 · ${activeContact.group?.memberCount || '?'} 人`}
                </div>
              </div>
            </header>

            <div className={styles.messages}>
              <div className={styles.messagesInner}>
                {messageLoading && activeMessages.length === 0 ? (
                  <div className={styles.placeholder}>加载消息中…</div>
                ) : (
                  <MessageList messages={activeMessages} userId={userId} contactType={activeContact.type} />
                )}
              </div>
            </div>

            <div className={styles.composer}>
              <div className={styles.composerInner}>
                <input
                  className={styles.composerField}
                  type="text"
                  placeholder="输入消息…"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    notifyTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={!inputText.trim()} aria-label="发送">
                  <SendIcon size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <ChatIcon size={44} className={styles.emptyIcon} />
            <span className={styles.emptyTitle}>选择一个会话</span>
            <span className={styles.emptyHint}>从左侧选择好友或群组，开始你的对话。</span>
          </div>
        )}
      </main>

      {showGroupModal && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowGroupModal(false)}
          onCreated={(g) => {
            setGroups((prev) => [...prev, g]);
            setContacts((prev) => [
              ...prev,
              {
                key: `group:${g.id}`,
                type: 'group' as const,
                name: g.name,
                group: g,
              },
            ]);
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

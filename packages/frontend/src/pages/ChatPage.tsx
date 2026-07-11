import type { Contact, GroupDTO, MessageDTO, UserDTO } from '../types';
import { buildConversations } from '../components/conversations';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWs, WebSocketProvider } from '../context/WebSocketContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import ChatPanel from '../components/ChatPanel';
import CreateGroupModal from '../components/CreateGroupModal';
import styles from './ChatPage.module.css';

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
      } catch (_err) {
      } finally {
        setDataLoading(false);
      }
    })();
  }, [auth, userId]);

  /* ---- load messages ---- */
  const loadMessages = useCallback(
    async (convKey: string) => {
      if (!auth) return;
      setMessageLoading(true);
      try {
        const res = await fetch(`/api/chat/messages?convKey=${encodeURIComponent(convKey)}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok) return;
        const text = await res.text();
        let data: MessageDTO[];
        try { data = JSON.parse(text); } catch { return; }
        setConvMessages((prev) => {
          const n = new Map(prev);
          n.set(convKey, data);
          return n;
        });
      } catch (_err) {
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
          const ex = n.get(convKey) || [];
          if (data.id && ex.some((m) => m.id === data.id)) return prev;
          if (ex.some((m) => m.createdAt === data.createdAt && m.senderId === data.senderId && m.content === data.content))
            return prev;
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
      } catch (_err) {}
    });

    const unsub2 = subscribe('online', (msg) => {
      try {
        const uid = msg.userId as number;
        const online = msg.online as boolean;
        setFriends((prev) => prev.map((f) => (f.id === uid ? { ...f, online } : f)));
        setContacts((prev) =>
          prev.map((c) => {
            if (c.user?.id === uid) return { ...c, user: { ...c.user, online } };
            return c;
          }),
        );
      } catch (_err) {}
    });

    return () => {
      unsub1();
      unsub2();
    };
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
    } catch { setSearchResults([]); setSearchError('网络错误'); }
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
    } catch {}
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
    } catch {}
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

  const sortedFriends = useMemo(() => [...friends].sort((a, b) => a.username.localeCompare(b.username)), [friends]);

  /* ---- handle group created ---- */
  function onGroupCreated(g: GroupDTO) {
    setGroups((prev) => [...prev, g]);
    setContacts((prev) => [
      ...prev,
      { key: `group:${g.id}`, type: 'group' as const, name: g.name, group: g },
    ]);
  }

  return (
    <div className={styles.layout}>
      <ChatSidebar
        auth={auth}
        connected={connected}
        logout={logout}
        navigate={navigate}
        isMobile={isMobile}
        showChat={showChat}
        tab={tab}
        setTab={setTab}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchQuery={searchQuery}
        searchResults={searchResults}
        searchError={searchError}
        handleSearch={handleSearch}
        addFriend={addFriend}
        pendingRequests={pendingRequests}
        handleRequestAction={handleRequestAction}
        setShowGroupModal={setShowGroupModal}
        dataLoading={dataLoading}
        conversations={conversations}
        activeConvKey={activeConvKey}
        selectConv={selectConv}
        sortedFriends={sortedFriends}
        groups={groups}
        contacts={contacts}
        userId={userId}
      />

      <ChatPanel
        isMobile={isMobile}
        showChat={showChat}
        activeContact={activeContact}
        activeMessages={activeMessages}
        messageLoading={messageLoading}
        inputText={inputText}
        setInputText={setInputText}
        handleSend={handleSend}
        goBack={goBack}
        userId={userId}
      />

      {showGroupModal && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowGroupModal(false)}
          onCreated={onGroupCreated}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  const { auth } = useAuth();
  if (!auth) return null;
  return (
    <WebSocketProvider>
      <ChatPageInner />
    </WebSocketProvider>
  );
}

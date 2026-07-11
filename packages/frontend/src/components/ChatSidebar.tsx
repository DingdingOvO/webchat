import type { Contact, GroupDTO, UserDTO, AuthInfo } from '../types';
import type { Conversation } from './conversations';
import { SearchIcon, CheckmarkIcon, DismissIcon, SignOutIcon } from './Icons';
import chatStyles from '../pages/ChatPage.module.css';

interface ChatSidebarProps {
  auth: AuthInfo | null;
  connected: boolean;
  logout: () => void;
  navigate: (path: string) => void;
  isMobile: boolean;
  showChat: boolean;
  tab: '消息' | '联系人';
  setTab: (t: '消息' | '联系人') => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  searchQuery: string;
  searchResults: UserDTO[];
  searchError: string;
  handleSearch: (q: string) => void;
  addFriend: (uid: number) => void;
  pendingRequests: { id: number; fromUserId: number; status: string }[];
  handleRequestAction: (id: number, action: 'accept' | 'reject') => void;
  setShowGroupModal: (v: boolean) => void;
  dataLoading: boolean;
  conversations: Conversation[];
  activeConvKey: string | null;
  selectConv: (key: string) => void;
  sortedFriends: UserDTO[];
  groups: GroupDTO[];
  contacts: Contact[];
  userId: number;
}

export default function ChatSidebar(props: ChatSidebarProps) {
  const s = chatStyles;

  return (
    <aside className={`${s.leftPanel} ${props.isMobile && props.showChat ? s.leftPanelHidden : ''}`}>
      {/* top bar */}
      <div className={s.topbar}>
        <div className={s.userInfo} onClick={() => props.navigate('/app/settings')}>
          <div className={s.userAvatar}>{props.auth?.nickname?.charAt(0).toUpperCase() || 'U'}</div>
          <span className={s.userName}>{props.auth?.nickname || props.auth?.username}</span>
          {!props.connected && <span className={s.offlineBadge}>未连接</span>}
        </div>
        <div className={s.toolbar}>
          <button className={s.iconBtn} onClick={() => props.setShowSearch(!props.showSearch)} title="搜索">
            <SearchIcon />
          </button>
          <button className={s.iconBtn} onClick={() => props.setShowGroupModal(true)} title="建群">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2.5a.5.5 0 0 0-1 0V9H2.5a.5.5 0 0 0 0 1H9v6.5a.5.5 0 0 0 1 0V10h6.5a.5.5 0 0 0 0-1H10V2.5Z" />
            </svg>
          </button>
          <button className={s.iconBtn} onClick={() => props.navigate('/app/settings')} title="设置">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM9 5.5a1 1 0 1 1 2 0V9h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V5.5Z" />
            </svg>
          </button>
          <button className={s.iconBtn} onClick={() => { props.logout(); props.navigate('/'); }} title="退出">
            <SignOutIcon />
          </button>
        </div>
      </div>

      {/* pending friend requests */}
      {props.pendingRequests.length > 0 && (
        <div className={s.requestBanner}>
          <span className={s.requestBannerTitle}>{props.pendingRequests.length} 条好友请求</span>
          <div className={s.requestActions}>
            {props.pendingRequests.map((r) => (
              <div key={r.id} className={s.requestItem}>
                <span>用户 #{r.fromUserId}</span>
                <button className={s.requestAccept} onClick={() => props.handleRequestAction(r.id, 'accept')}>
                  <CheckmarkIcon size={14} />
                </button>
                <button className={s.requestReject} onClick={() => props.handleRequestAction(r.id, 'reject')}>
                  <DismissIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* tabs */}
      <div className={s.tabBar}>
        <button className={`${s.tab} ${props.tab === '消息' ? s.tabActive : ''}`} onClick={() => props.setTab('消息')}>消息</button>
        <button className={`${s.tab} ${props.tab === '联系人' ? s.tabActive : ''}`} onClick={() => props.setTab('联系人')}>联系人</button>
      </div>

      {/* search */}
      {props.showSearch && (
        <div className={s.searchBox}>
          <div className={s.searchInputWrap}>
            <span className={s.searchIcon}><SearchIcon size={16} /></span>
            <input className={s.searchInput} type="text" placeholder="搜索用户..." value={props.searchQuery}
              onChange={(e) => props.handleSearch(e.target.value)} />
          </div>
          {props.searchError && <p style={{ color: 'var(--red)', padding: 'var(--p2)' }}>{props.searchError}</p>}
          {props.searchResults.map((u) => (
            <div key={u.id} className={s.searchResultItem}>
              <span className={s.searchResultAvatar}>{u.nickname?.charAt(0).toUpperCase()}</span>
              <span className={s.searchResultName}>{u.nickname || u.username}</span>
              <button className={s.addBtn} onClick={() => props.addFriend(u.id)}>加好友</button>
            </div>
          ))}
        </div>
      )}

      {/* list area */}
      {props.dataLoading ? (
        <div className={s.loadingState}>加载中...</div>
      ) : (
        <div className={s.list}>
          {props.tab === '消息' &&
            (props.conversations.length === 0 ? (
              <div className={s.emptyState}>暂无消息</div>
            ) : (
              props.conversations.map((conv) => (
                <div key={conv.key}
                  className={`${s.convItem} ${conv.key === props.activeConvKey ? s.convItemActive : ''}`}
                  onClick={() => props.selectConv(conv.key)}>
                  <div className={s.convAvatar}>{conv.name.charAt(0).toUpperCase()}</div>
                  <div className={s.convInfo}>
                    <div className={s.convTop}>
                      <span className={s.convName}>{conv.name}</span>
                      <span className={s.convTime}>
                        {new Date(conv.lastTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={s.convBottom}>
                      <span className={s.convLast}>{conv.lastMessage}</span>
                      {conv.unread > 0 && <span className={s.convBadge}>{conv.unread > 99 ? '99+' : conv.unread}</span>}
                    </div>
                  </div>
                </div>
              ))
            ))}

          {props.tab === '联系人' && (
            <>
              {props.sortedFriends.length > 0 && (
                <>
                  <div className={s.sectionHeader}>好友 A-Z</div>
                  {props.sortedFriends.map((f) => {
                    const ck = `p2p:${Math.min(props.userId, f.id)}:${Math.max(props.userId, f.id)}`;
                    return (
                      <div key={f.id}
                        className={`${s.contactItem} ${ck === props.activeConvKey ? s.contactItemActive : ''}`}
                        onClick={() => props.selectConv(ck)}>
                        <div className={s.contactAvatar}>
                          {f.nickname?.charAt(0).toUpperCase()}
                          <span className={`${s.statusDot} ${f.online ? s.statusOnline : s.statusOffline}`} />
                        </div>
                        <span className={s.contactName}>{f.nickname || f.username}</span>
                      </div>
                    );
                  })}
                </>
              )}
              {props.groups && props.groups.length > 0 && (
                <>
                  <div className={s.sectionHeader}>群组 #</div>
                  {props.groups.map((g: GroupDTO) => {
                    const ck = `group:${g.id}`;
                    return (
                      <div key={g.id}
                        className={`${s.contactItem} ${ck === props.activeConvKey ? s.contactItemActive : ''}`}
                        onClick={() => props.selectConv(ck)}>
                        <div className={`${s.contactAvatar} ${s.groupAvatar}`}>{g.name.charAt(0).toUpperCase()}</div>
                        <span className={s.contactName}>{g.name}</span>
                      </div>
                    );
                  })}
                </>
              )}
              {props.sortedFriends.length === 0 && (!props.groups || props.groups.length === 0) && (
                <div className={s.emptyState}>暂无联系人</div>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}

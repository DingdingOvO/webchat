export interface UserDTO {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  online: boolean;
  lastOnline: string | null;
}

export interface MessageDTO {
  id: string | null;
  senderId: number;
  senderName: string;
  receiverId: number | null;
  type: 'P2P' | 'GROUP';
  content: string;
  /**
   * ISO-8601 字符串，例如 "2026-10-02T18:56:23.909Z"。
   *
   * 后端约定见 JacksonConfig：已关闭 WRITE_DATES_AS_TIMESTAMPS，
   * 不再输出浮点秒数。历史数据可能是数字，读取时请统一走
   * `toMillis()` / `formatTime()`（components/time.ts）做归一化。
   */
  createdAt: string;
}

export interface GroupDTO {
  id: number;
  name: string;
  avatar: string | null;
  ownerId: number;
  memberCount: number;
}

export interface Contact {
  key: string; // conversationKey
  type: 'p2p' | 'group';
  name: string;
  user?: UserDTO;
  group?: GroupDTO;
  unread?: number;
}

export interface AuthInfo {
  token: string;
  userId: number;
  username: string;
  nickname: string;
}

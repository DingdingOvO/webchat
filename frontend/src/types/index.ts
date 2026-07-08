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

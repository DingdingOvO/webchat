/**
 * 后端接口的集中定义。
 *
 * 页面只调用这里的具名函数，不再直接写路径字符串 ——
 * 路径一旦变动，改一处即可，不必全仓搜索 `/api/...`。
 */

import type { AuthInfo, GroupDTO, MessageDTO, UserDTO } from '../types';
import { apiGet, apiGetWithQuery, apiPost, apiPut } from './client';

/* 统一从 barrel 导出，调用方只需 import from '../api'。 */
export { ApiError, setAuthToken } from './client';

/* ---------------- 认证 ---------------- */

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  /** 昵称可省略，后端会回退用用户名。 */
  nickname?: string;
}

export const authApi = {
  login: (payload: LoginPayload) => apiPost<AuthInfo>('/api/auth/login', payload),
  register: (payload: RegisterPayload) => apiPost<AuthInfo>('/api/auth/register', payload),
  /** 用当前 token 换取身份信息，token 失效时抛出 401。 */
  me: () => apiGet<AuthInfo>('/api/auth/me'),
};

/* ---------------- 用户 / 好友 ---------------- */

/** 后端直接返回 FriendRequest 实体，字段与实体保持一致。 */
export interface PendingRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  status: string;
}

export const userApi = {
  friends: () => apiGet<UserDTO[]>('/api/users/friends'),
  search: (keyword: string) => apiGetWithQuery<UserDTO[]>('/api/users/search', { q: keyword }),
  pendingRequests: () => apiGet<PendingRequest[]>('/api/users/friend-requests/pending'),
  /** 注意：路径是单数 friend-request，后端接收 { userId }。 */
  sendFriendRequest: (userId: number) => apiPost<void>('/api/users/friend-request', { userId }),
  acceptFriendRequest: (id: number) => apiPost<void>(`/api/users/friend-requests/${id}/accept`),
  rejectFriendRequest: (id: number) => apiPost<void>(`/api/users/friend-requests/${id}/reject`),
  updateUsername: (username: string) => apiPut<void>('/api/users/profile/username', { username }),
  /** 头像更新是 POST（SettingsController），不是 PUT。 */
  updateAvatar: (avatar: string) => apiPost<void>('/api/users/profile/avatar', { avatar }),
  updatePassword: (oldPassword: string, newPassword: string) =>
    apiPut<void>('/api/users/profile/password', { oldPassword, newPassword }),
};

/* ---------------- 群组 ---------------- */

export const groupApi = {
  list: () => apiGet<GroupDTO[]>('/api/groups'),
  create: (name: string, memberIds: number[]) => apiPost<GroupDTO>('/api/groups', { name, memberIds }),
};

/* ---------------- 消息 ---------------- */

export const chatApi = {
  /** 按会话键取历史消息，convKey 形如 `p2p:1:2` 或 `group:3`。 */
  messages: (convKey: string) => apiGetWithQuery<MessageDTO[]>('/api/chat/messages', { convKey }),
};

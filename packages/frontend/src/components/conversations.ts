import type { Contact, MessageDTO } from '../types';
import { toMillis } from './time';

export interface Conversation {
  key: string;
  name: string;
  type: 'p2p' | 'group';
  lastMessage: string;
  /** 后端给的 epoch 秒；保留原始类型不动，读取时统一走 toMillis 归一化 */
  lastTime: string | number;
  unread: number;
}

export function buildConversations(
  convMessages: Map<string, MessageDTO[]>,
  contacts: Contact[],
  unreadMap: Map<string, number>,
): Conversation[] {
  const result: Conversation[] = [];
  for (const [key, msgs] of convMessages) {
    if (msgs.length === 0) continue;
    const last = msgs[msgs.length - 1];
    if (!last) continue;
    const contact = contacts.find((c) => c.key === key);
    result.push({
      key,
      name: contact?.name || key,
      type: contact?.type || 'p2p',
      lastMessage: last.content,
      lastTime: last.createdAt,
      unread: unreadMap.get(key) || 0,
    });
  }
  /* 必须用 toMillis 归一化再比。
     直接 new Date(秒数) 会得到 1970 年，new Date("秒数字符串") 会得到
     Invalid Date → getTime() 为 NaN → 排序静默失效，列表顺序随机。 */
  result.sort((a, b) => toMillis(b.lastTime) - toMillis(a.lastTime));
  return result;
}

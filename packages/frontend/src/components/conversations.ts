import type { Contact, MessageDTO } from '../types';
import { toMillis } from './time';

export interface Conversation {
  key: string;
  name: string;
  type: 'p2p' | 'group';
  lastMessage: string;
  /**
   * 正常应为 ISO-8601 字符串（后端已关闭 WRITE_DATES_AS_TIMESTAMPS）。
   * 但历史数据、Redis 热缓存里可能残留浮点秒数，因此放宽为
   * string | number，读取时一律经 toMillis() 归一化，不直接比较。
   */
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

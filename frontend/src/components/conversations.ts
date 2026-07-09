import type { MessageDTO, Contact } from '../types';

export interface Conversation {
  key: string;
  name: string;
  type: 'p2p' | 'group';
  lastMessage: string;
  lastTime: string;
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
    const contact = contacts.find(c => c.key === key);
    result.push({
      key,
      name: contact?.name || key,
      type: contact?.type || 'p2p',
      lastMessage: last.content,
      lastTime: last.createdAt,
      unread: unreadMap.get(key) || 0,
    });
  }
  result.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
  return result;
}

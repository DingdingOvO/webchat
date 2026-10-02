import { memo, useEffect, useMemo, useRef } from 'react';
import styles from '../pages/ChatPage.module.css';
import type { MessageDTO } from '../types';
import { hueIndex } from './avatarHue';
import { ChatIcon } from './Icons';
import { formatTime, toMillis } from './time';

interface Props {
  messages: MessageDTO[];
  userId: number;
  contactType: 'p2p' | 'group';
  emptyIcon?: boolean;
}

/** 相邻消息间隔超过 5 分钟，视为新一轮，重新显示分组头与时间戳 */
const GROUP_GAP_MS = 5 * 60 * 1000;

/**
 * 把扁平消息切成「组」。
 *
 * 旧实现给每条消息都渲染一个时间戳，同一人连发三条就出现三行时间，
 * 视觉上就是一片散落的小字。这里改为：
 * - 同一人、间隔 < 5 分钟 → 并入同组，时间戳只在组尾出现一次；
 * - 换人、或间隔超时 → 开新组，带发送者名（仅群聊且非自己）。
 */
interface Group {
  key: string;
  senderId: number;
  senderName: string;
  isMe: boolean;
  items: MessageDTO[];
  showHeader: boolean;
}

function buildGroups(messages: MessageDTO[], userId: number, contactType: 'p2p' | 'group'): Group[] {
  const groups: Group[] = [];
  let prev: MessageDTO | null = null;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m) continue;
    const isMe = m.senderId === userId;
    const sameSender = prev !== null && prev.senderId === m.senderId;
    const withinGap = prev !== null && Math.abs(toMillis(m.createdAt) - toMillis(prev.createdAt)) < GROUP_GAP_MS;
    const continues = sameSender && withinGap;
    const last = groups[groups.length - 1];

    if (continues && last) {
      last.items.push(m);
    } else {
      groups.push({
        key: `${m.createdAt}-${m.senderId}-${i}`,
        senderId: m.senderId,
        senderName: m.senderName,
        isMe,
        items: [m],
        // 仅群聊展示发言人名字，私聊头像已足够表达身份
        showHeader: contactType === 'group' && !isMe,
      });
    }
    prev = m;
  }
  return groups;
}

function MessageListInner({ messages, userId, contactType, emptyIcon }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => buildGroups(messages, userId, contactType), [messages, userId, contactType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        {emptyIcon && <ChatIcon size={40} className={styles.emptyIcon} />}
        <span className={styles.emptyTitle}>还没有消息</span>
        <span className={styles.emptyHint}>在下方输入框发送第一条消息，开始这段对话。</span>
      </div>
    );
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.key} className={`${styles.msgGroup} ${g.isMe ? styles.msgGroupMine : ''}`}>
          {g.showHeader && (
            <div className={styles.msgHeader}>
              <span
                className={`${styles.msgAvatar} ${styles[`hue${hueIndex(g.senderId)}` as keyof typeof styles] ?? ''}`}
              >
                {g.senderName.charAt(0).toUpperCase()}
              </span>
              <span className={styles.msgSender}>{g.senderName}</span>
            </div>
          )}
          <div className={styles.msgStack}>
            {g.items.map((m, idx) => (
              <div
                key={`${m.createdAt}-${idx}`}
                className={`${styles.bubble} ${g.isMe ? styles.bubbleMine : styles.bubbleOther}`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <span className={styles.msgTime}>{formatTime(g.items[g.items.length - 1]?.createdAt)}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </>
  );
}

export const MessageList = memo(MessageListInner);

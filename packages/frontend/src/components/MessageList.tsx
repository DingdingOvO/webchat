import { memo, useEffect, useRef } from 'react';
import type { MessageDTO } from '../types';
import { ChatIcon } from './Icons';

interface Props {
  messages: MessageDTO[];
  userId: number;
  contactType: 'p2p' | 'group';
  emptyIcon?: boolean;
}

function MessageListInner({ messages, userId, contactType, emptyIcon }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (messages.length === 0) {
    return (
      <div
        className="empty-state"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-faint)',
          fontSize: 'var(--fs-sm)',
          gap: 'var(--p3)',
        }}
      >
        {emptyIcon && <ChatIcon size={48} />}
        <span>暂无消息</span>
      </div>
    );
  }

  return (
    <>
      {messages.map((m, idx) => {
        const isMe = m.senderId === userId;
        const showSender = contactType === 'group' && !isMe;
        return (
          <div
            key={`${m.createdAt}-${m.senderId}-${idx}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 'var(--p4)',
              maxWidth: '68%',
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              alignItems: isMe ? 'flex-end' : 'flex-start',
            }}
          >
            {showSender && (
              <span
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--primary)',
                  fontWeight: 500,
                  marginBottom: 2,
                  padding: '0 var(--p2)',
                }}
              >
                {m.senderName}
              </span>
            )}
            <div
              style={{
                padding: '10px var(--p4)',
                borderRadius: 'var(--r-lg)',
                fontSize: 'var(--fs-base)',
                lineHeight: 1.5,
                wordBreak: 'break-word',
                background: isMe ? 'var(--bubble-mine-bg)' : 'var(--bubble-other-bg)',
                color: isMe ? 'var(--bubble-mine-text)' : 'var(--bubble-other-text)',
                boxShadow: isMe ? 'var(--bubble-mine-shadow)' : 'var(--bubble-other-shadow)',
                borderBottomLeftRadius: isMe ? 'var(--r-lg)' : 'var(--r-sm)',
                borderBottomRightRadius: isMe ? 'var(--r-sm)' : 'var(--r-lg)',
              }}
            >
              {m.content}
            </div>
            <span
              style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-faint)',
                marginTop: 2,
                padding: '0 var(--p2)',
              }}
            >
              {new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </>
  );
}

export const MessageList = memo(MessageListInner);

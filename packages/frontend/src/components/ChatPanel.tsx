import type { Contact, MessageDTO } from '../types';
import { ArrowLeftIcon, ChatIcon, SendIcon } from './Icons';
import { MessageList } from './MessageList';
import chatStyles from '../pages/ChatPage.module.css';

interface ChatPanelProps {
  isMobile: boolean;
  showChat: boolean;
  activeContact: Contact | undefined;
  activeMessages: MessageDTO[];
  messageLoading: boolean;
  inputText: string;
  setInputText: (v: string) => void;
  handleSend: () => void;
  goBack: () => void;
  userId: number;
}

export default function ChatPanel(props: ChatPanelProps) {
  const s = chatStyles;

  return (
    <main className={`${s.rightPanel} ${props.isMobile && !props.showChat ? s.rightPanelHidden : ''}`}>
      {props.activeContact ? (
        <>
          <header className={s.chatHeader}>
            {props.isMobile && (
              <button className={s.chatBackBtn} onClick={props.goBack}>
                <ArrowLeftIcon />
              </button>
            )}
            <div className={s.chatAvatar}>{props.activeContact.name.charAt(0).toUpperCase()}</div>
            <div className={s.chatInfo}>
              <div className={s.chatName}>{props.activeContact.name}</div>
              <div className={s.chatMeta}>
                {props.activeContact.type === 'p2p'
                  ? props.activeContact.user?.online ? '在线' : '离线'
                  : `群组 · ${props.activeContact.group?.memberCount || '?'} 人`}
              </div>
            </div>
          </header>
          <div className={s.messages}>
            {props.messageLoading && props.activeMessages.length === 0 ? (
              <div className={s.loadingState}>加载消息中...</div>
            ) : (
              <MessageList messages={props.activeMessages} userId={props.userId} contactType={props.activeContact.type} />
            )}
          </div>
          <div className={s.inputArea}>
            <input className={s.inputField} type="text" placeholder="输入消息..."
              value={props.inputText}
              onChange={(e) => props.setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); props.handleSend(); }
              }} />
            <button className={s.sendBtn} onClick={props.handleSend} disabled={!props.inputText.trim()}>
              <SendIcon size={18} />
            </button>
          </div>
        </>
      ) : (
        <div className={s.empty}>
          <ChatIcon size={64} />
          <span>选择一个对话开始聊天</span>
        </div>
      )}
    </main>
  );
}

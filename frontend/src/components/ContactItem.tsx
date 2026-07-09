import type { Contact } from '../types';
import styles from './ContactItem.module.css';

interface Props {
  readonly contact: Contact;
  readonly active: boolean;
  readonly unread: number;
  readonly onClick: () => void;
}

export default function ContactItem({ contact, active, unread, onClick }: Props) {
  const initial = contact.name.charAt(0).toUpperCase();
  const isOnline = contact.user?.online;
  const meta = contact.type === 'p2p'
    ? (isOnline ? '在线' : '离线')
    : `${String(contact.group?.memberCount ?? 0)} 人`;

  return (
    <div
      className={`${styles.item} ${active ? styles.active : ''}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
    >
      <div className={styles['avatarWrap']}>
        <div className={`${styles['avatar']} ${contact.type === 'group' ? styles['groupAvatar'] : ''}`}>
          {initial}
        </div>
        {contact.type === 'p2p' && (
          <span className={`${styles['statusIndicator']} ${isOnline ? styles['statusOnline'] : styles['statusOffline']}`} />
        )}
      </div>
      <div className={styles['info']}>
        <span className={styles['name']}>{contact.name}</span>
        <span className={styles['meta']}>{meta}</span>
      </div>
      {unread > 0 && <span className={styles['badge']}>{unread > 99 ? '99+' : unread}</span>}
    </div>
  );
}

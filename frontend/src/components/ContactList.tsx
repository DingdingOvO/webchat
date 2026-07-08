import { memo } from 'react';
import type { Contact } from '../types';
import ContactItem from './ContactItem';
import styles from './ContactList.module.css';

interface Props {
  contacts: Contact[];
  activeKey: string | null;
  unreadMap: Map<string, number>;
  onSelect: (key: string) => void;
}

function ContactList({ contacts, activeKey, unreadMap, onSelect }: Props) {
  const p2p = contacts.filter((c) => c.type === 'p2p');
  const group = contacts.filter((c) => c.type === 'group');

  return (
    <div className={styles.list}>
      {contacts.length === 0 && (
        <p className={styles.empty}>
          暂无联系人<br />
          点击搜索按钮添加好友
        </p>
      )}

      {p2p.length > 0 && (
        <>
          <div className={styles.sectionHeader}>联系人</div>
          {p2p.map((c) => (
            <ContactItem
              key={c.key}
              contact={c}
              active={c.key === activeKey}
              unread={unreadMap.get(c.key) || 0}
              onClick={() => onSelect(c.key)}
            />
          ))}
        </>
      )}

      {group.length > 0 && (
        <>
          <div className={styles.sectionHeader}>群组</div>
          {group.map((c) => (
            <ContactItem
              key={c.key}
              contact={c}
              active={c.key === activeKey}
              unread={unreadMap.get(c.key) || 0}
              onClick={() => onSelect(c.key)}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default memo(ContactList);

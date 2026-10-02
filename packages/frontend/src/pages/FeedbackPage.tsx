import { useEffect } from 'react';
import styles from './FeedbackPage.module.css';

const FEEDBACK_URL =
  'https://forms.office.com/Pages/ResponsePage.aspx' +
  '?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAANAAW1mMnJUOTlNNFVTSVEzS0Q0UzZUTTNXNUJDQzY0Vy4u';

export default function FeedbackPage() {
  useEffect(() => {
    window.location.href = FEEDBACK_URL;
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.logo}>W</div>
      <p className={styles.title}>正在前往反馈页面</p>
      <p className={styles.hint}>
        如果浏览器没有自动跳转，
        <a href={FEEDBACK_URL}>点此手动前往</a>。
      </p>
    </div>
  );
}

import { useEffect } from 'react';

const FEEDBACK_URL =
  'https://forms.office.com/Pages/ResponsePage.aspx' +
  '?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAANAAW1mMnJUOTlNNFVTSVEzS0Q0UzZUTTNXNUJDQzY0Vy4u';

export default function FeedbackPage() {
  useEffect(() => {
    window.location.href = FEEDBACK_URL;
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: '#868e96',
      fontSize: 15,
      gap: 16,
    }}>
      <span style={{ fontSize: 32 }}>📋</span>
      <span>正在跳转到 Microsoft Forms 反馈页面...</span>
      <a
        href={FEEDBACK_URL}
        style={{ color: '#2563eb', fontSize: 13 }}
      >
        如果未自动跳转，请点击此处
      </a>
    </div>
  );
}

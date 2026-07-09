import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: '-apple-system, sans-serif',
            color: '#333',
            padding: 32,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>出了点问题</h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24, maxWidth: 400 }}>
            {this.state.error?.message || '页面渲染异常'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 24px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

type WsMessage = Record<string, unknown>;

interface WsContextValue {
  connected: boolean;
  send: (msg: WsMessage) => void;
  subscribe: (action: string, handler: (data: WsMessage) => void) => () => void;
}

const WsContext = createContext<WsContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: WsMessage) => void>>>(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000); // 指数退避起始 1s

  const connect = useCallback(() => {
    if (!auth) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.host;
    // 保留页面 URL 中的 sandbox 路由参数（预览环境需要）
    const sandboxParams = location.search || '';
    const wsUrl = `${protocol}//${host}/ws/chat?token=${auth.token}${sandboxParams ? '&' + sandboxParams.slice(1) : ''}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      reconnectDelay.current = 1000;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage;
        const action = msg.action as string;
        const handlers = handlersRef.current.get(action);
        if (handlers) handlers.forEach((fn) => fn(msg));
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      if (auth) {
        const delay = reconnectDelay.current;
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000); // 指数退避，最大 30s
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [auth]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    if (auth) connect();
    else disconnect();
    return disconnect;
  }, [auth, connect, disconnect]);

  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback((action: string, handler: (data: WsMessage) => void) => {
    if (!handlersRef.current.has(action)) {
      handlersRef.current.set(action, new Set());
    }
    handlersRef.current.get(action)!.add(handler);
    return () => { handlersRef.current.get(action)?.delete(handler); };
  }, []);

  return (
    <WsContext.Provider value={{ connected, send, subscribe }}>
      {children}
    </WsContext.Provider>
  );
}

export function useWs() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error('useWs must be used within WebSocketProvider');
  return ctx;
}

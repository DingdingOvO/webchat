import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  /* 用 ref 保存最新 token：重连定时器里的闭包要拿「当前」token，
     否则重新登录后仍会用旧 token 去连。 */
  const tokenRef = useRef<string | undefined>(auth?.token);
  tokenRef.current = auth?.token;
  /* 组件是否仍挂载：避免卸载后定时器再触发连接 */
  const aliveRef = useRef(true);
  /* connect 的自引用，供重连定时器调用而不进入依赖数组 */
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    const token = tokenRef.current;
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.host;
    // 保留页面 URL 中的 sandbox 路由参数（预览环境需要）
    const sandboxParams = location.search || '';
    const wsUrl = `${protocol}//${host}/ws/chat?token=${token}${sandboxParams ? `&${sandboxParams.slice(1)}` : ''}`;
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
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      if (!aliveRef.current || !tokenRef.current) return;
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000); // 指数退避，最大 30s
      reconnectTimer.current = setTimeout(() => connectRef.current(), delay);
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, []);

  // 让重连定时器能调到最新的 connect，同时保持 connect 引用稳定
  connectRef.current = connect;

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    // 先摘掉 onclose，避免主动断开又触发一次重连
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    setConnected(false);
  }, []);

  /* 只在「有无 token」或「token 本身变化」时重建连接。
     原先依赖整个 auth 对象，任何身份信息变动都会把长连接掐断重连。 */
  const token = auth?.token;
  useEffect(() => {
    aliveRef.current = true;
    if (token) connect();
    else disconnect();
    return () => {
      aliveRef.current = false;
      disconnect();
    };
  }, [token, connect, disconnect]);

  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback((action: string, handler: (data: WsMessage) => void) => {
    if (!handlersRef.current.has(action)) {
      handlersRef.current.set(action, new Set());
    }
    handlersRef.current.get(action)?.add(handler);
    return () => {
      handlersRef.current.get(action)?.delete(handler);
    };
  }, []);

  const value = useMemo(() => ({ connected, send, subscribe }), [connected, send, subscribe]);

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
}

export function useWs() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error('useWs must be used within WebSocketProvider');
  return ctx;
}

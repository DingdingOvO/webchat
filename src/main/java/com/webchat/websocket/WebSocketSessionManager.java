package com.webchat.websocket;

import com.webchat.kvstore.RedisStateStore;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 会话管理器：维护 userId → WebSocketSession 映射，
 * 配合 RedisStateStore 做多实例扩展。
 */
@Component
public class WebSocketSessionManager {

    private final ConcurrentHashMap<Long, ConcurrentHashMap<String, WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final RedisStateStore stateStore;

    public WebSocketSessionManager(RedisStateStore stateStore) {
        this.stateStore = stateStore;
    }

    public void add(Long userId, String sessionId, WebSocketSession session) {
        sessions.computeIfAbsent(userId, k -> new ConcurrentHashMap<>()).put(sessionId, session);
        stateStore.bindSession(userId, sessionId);
    }

    public void remove(Long userId, String sessionId) {
        var map = sessions.get(userId);
        if (map != null) {
            map.remove(sessionId);
            if (map.isEmpty()) sessions.remove(userId);
        }
        stateStore.unbindSession(userId, sessionId);
    }

    public WebSocketSession getSession(Long userId) {
        var map = sessions.get(userId);
        if (map == null || map.isEmpty()) return null;
        // 返回第一个可用会话
        return map.values().stream().filter(WebSocketSession::isOpen).findFirst().orElse(null);
    }

    public void sendToUser(Long userId, String message) {
        WebSocketSession session = getSession(userId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new org.springframework.web.socket.TextMessage(message));
            } catch (Exception ignored) {}
        }
    }

    public boolean hasSession(Long userId) {
        return sessions.containsKey(userId) && !sessions.get(userId).isEmpty();
    }
}

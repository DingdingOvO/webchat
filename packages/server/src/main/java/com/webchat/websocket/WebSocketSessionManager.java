package com.webchat.websocket;

import com.webchat.kvstore.RedisStateStore;
import com.webchat.util.LogSanitizer;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

/** WebSocket 会话管理器：维护 userId → WebSocketSession 映射， 配合 RedisStateStore 做多实例扩展。 */
@Component
public class WebSocketSessionManager {

    private static final Logger LOG = LoggerFactory.getLogger(WebSocketSessionManager.class);

    /** 外层按 userId、内层按 sessionId 索引，支持同一用户多端同时在线。 */
    private final Map<Long, Map<String, WebSocketSession>> sessions = new ConcurrentHashMap<>();

    private final RedisStateStore stateStore;

    public WebSocketSessionManager(RedisStateStore stateStore) {
        this.stateStore = stateStore;
    }

    public void add(Long userId, String sessionId, WebSocketSession session) {
        sessions.computeIfAbsent(userId, key -> new ConcurrentHashMap<>()).put(sessionId, session);
        stateStore.bindSession(userId, sessionId);
    }

    public void remove(Long userId, String sessionId) {
        Map<String, WebSocketSession> userSessions = sessions.get(userId);
        if (userSessions != null) {
            userSessions.remove(sessionId);
            if (userSessions.isEmpty()) {
                sessions.remove(userId);
            }
        }
        stateStore.unbindSession(userId, sessionId);
    }

    /**
     * 取该用户当前可用的会话。
     *
     * <p>返回的是管理器长期持有的<b>共享</b>会话对象，由 WebSocket 容器在连接结束时统一关闭， 调用方不得 close。若在此处 close，会直接掐断用户的在线连接。
     */
    public WebSocketSession getSession(Long userId) {
        Map<String, WebSocketSession> userSessions = sessions.get(userId);
        if (userSessions == null || userSessions.isEmpty()) {
            return null;
        }
        return userSessions.values().stream()
                .filter(WebSocketSession::isOpen)
                .findFirst()
                .orElse(null);
    }

    /**
     * 向指定用户的在线会话推送文本。
     *
     * <p>PMD 的 CloseResource 与 AvoidCatchingGenericException 在此均属误报/必要： 会话是共享资源不做 close（见 {@link
     * #getSession(Long)}）；而 {@code sendMessage} 在不同容器实现下
     * 抛出的类型并不统一（IOException、IllegalStateException 等），此处按「推送失败」这一业务语义统一兜住。
     */
    @SuppressWarnings({"PMD.CloseResource", "PMD.AvoidCatchingGenericException"})
    @SuppressFBWarnings(
            value = "CRLF_INJECTION_LOGS",
            justification = "异常消息已经 LogSanitizer.safe() 转义后再写入日志")
    public void sendToUser(Long userId, String message) {
        WebSocketSession session = getSession(userId);
        if (session == null || !session.isOpen()) {
            return;
        }
        try {
            session.sendMessage(new TextMessage(message));
        } catch (Exception ex) {
            // 不能静默吞掉：推送失败意味着该用户收不到这条消息。
            // 至少留下日志，否则线上表现为「消息偶尔丢失」且无迹可查。
            if (LOG.isWarnEnabled()) {
                LOG.warn(
                        "推送消息失败: userId={}, sessionId={}, 原因={}",
                        userId,
                        session.getId(),
                        LogSanitizer.safe(ex.getMessage()));
            }
        }
    }

    public boolean hasSession(Long userId) {
        Map<String, WebSocketSession> userSessions = sessions.get(userId);
        return userSessions != null && !userSessions.isEmpty();
    }
}

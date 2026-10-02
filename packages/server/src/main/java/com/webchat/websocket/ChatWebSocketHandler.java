package com.webchat.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webchat.dto.MessageDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.service.ChatService;
import com.webchat.util.LogSanitizer;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.io.IOException;
import java.net.URI;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger LOG = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private static final String ATTR_USER_ID = "userId";
    private static final String GROUP = "GROUP";
    private static final String P2P = "P2P";
    private static final String KEY_TYPE = "type";
    private static final String KEY_RECEIVER_ID = "receiverId";
    private static final String KEY_CONVERSATION_KEY = "conversationKey";

    private final AuthService authService;
    private final ChatService chatService;
    private final WebSocketSessionManager sessionManager;
    private final RedisStateStore stateStore;
    private final ObjectMapper mapper;

    public ChatWebSocketHandler(
            AuthService authService,
            ChatService chatService,
            WebSocketSessionManager sessionManager,
            RedisStateStore stateStore,
            ObjectMapper mapper) {
        this.authService = authService;
        this.chatService = chatService;
        this.sessionManager = sessionManager;
        this.stateStore = stateStore;
        this.mapper = mapper;
    }

    /**
     * 建立连接并认证。
     *
     * <p>PMD 的 AvoidCatchingGenericException 在此为有意为之：{@code authService.validateToken} 对
     * 客户端只暴露「认证是否通过」，其内部可能因过期/签名/用户不存在抛出不同运行时异常， 这里需要统一收敛为 4001 关闭。
     */
    @Override
    @SuppressWarnings("PMD.AvoidCatchingGenericException")
    public void afterConnectionEstablished(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) {
            close(session, 4001, "缺少 token");
            return;
        }
        String query = uri.getQuery();
        if (query == null || !query.startsWith("token=")) {
            close(session, 4001, "缺少 token");
            return;
        }

        User user;
        try {
            user = authService.validateToken(query.substring(6));
        } catch (RuntimeException ex) {
            // 认证失败的原因（过期、签名不符、格式错误）对客户端无差别，
            // 统一回 4001 关闭，避免把内部校验细节泄露给未认证方。
            // 只捕 RuntimeException：AuthService 对外约定抛业务异常，
            // 真正的 Error 不应被吞。
            if (LOG.isDebugEnabled()) {
                LOG.debug("WS 认证失败: {}", LogSanitizer.safe(ex.getMessage()));
            }
            close(session, 4001, "无效 token");
            return;
        }

        Long userId = user.getId();
        session.getAttributes().put(ATTR_USER_ID, userId);
        sessionManager.add(userId, session.getId(), session);
        stateStore.setOnline(userId);
        LOG.info("WS 已连接: userId={}", userId);
        broadcastOnlineStatus(userId, user.getNickname(), true);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Long userId = (Long) session.getAttributes().get(ATTR_USER_ID);
        if (userId == null) {
            return;
        }
        Map<String, Object> payload;
        try {
            payload = parsePayload(message.getPayload());
        } catch (JsonProcessingException ex) {
            // 客户端发来的不是合法 JSON——属于对端协议错误，
            // 记 DEBUG 即可，不该按服务端故障报 ERROR。
            if (LOG.isDebugEnabled()) {
                LOG.debug("WS 收到非法 JSON: {}", LogSanitizer.safe(ex.getMessage()));
            }
            return;
        }

        String type = (String) payload.get(KEY_TYPE);
        if (type == null) {
            return;
        }
        dispatch(userId, payload, type);
    }

    /** 解析客户端 JSON 载荷。非法 JSON 直接抛出，由调用方决定如何处理。 */
    private Map<String, Object> parsePayload(String text) throws JsonProcessingException {
        @SuppressWarnings("unchecked")
        Map<String, Object> parsed = mapper.readValue(text, Map.class);
        return parsed;
    }

    /** 按协议 type 字段分发到具体处理器。 */
    private void dispatch(Long userId, Map<String, Object> payload, String type) {
        switch (type) {
            case "p2p", "group" -> handleChatMessage(userId, payload, type);
            case "typing" -> handleTyping(userId, payload);
            case "read" -> handleRead(userId, payload);
            default -> {
                if (LOG.isWarnEnabled()) {
                    LOG.warn("未知 WS 消息类型: {}", LogSanitizer.safe(type));
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = (Long) session.getAttributes().get(ATTR_USER_ID);
        if (userId != null) {
            sessionManager.remove(userId, session.getId());
            if (!sessionManager.hasSession(userId)) {
                stateStore.setOffline(userId);
                broadcastOnlineStatus(userId, null, false);
            }
        }
    }

    private void handleChatMessage(Long userId, Map<String, Object> payload, String type) {
        long receiverId = Long.parseLong(payload.get(KEY_RECEIVER_ID).toString());
        String content = (String) payload.get("content");
        if (content == null || content.isBlank()) {
            return;
        }

        // 协议字段是 ASCII，来自前端固定的小写枚举（"p2p" / "group"）。
        // 这里按字面量精确匹配，不做任何大小写转换：比 toUpperCase /
        // equalsIgnoreCase 更安全也更清晰，既避开了默认 locale 的
        // Turkish-I 陷阱，也不引入 Unicode 大小写映射的歧义。
        String protoType =
                switch (type) {
                    case "p2p" -> P2P;
                    case "group" -> GROUP;
                    default -> type;
                };
        MessageDTO dto = chatService.sendMessage(userId, receiverId, protoType, content);
        try {
            String json = mapper.writeValueAsString(Map.of("action", "message", "data", dto));
            if (GROUP.equals(protoType)) {
                stateStore.publish("group:" + receiverId, json);
            } else {
                sessionManager.sendToUser(receiverId, json);
                sessionManager.sendToUser(userId, json);
            }
        } catch (JsonProcessingException ex) {
            // 消息已落库，仅推送序列化失败。属于本端编码问题，需要 ERROR 级留痕。
            LOG.error("发送消息失败", ex);
        }
    }

    @SuppressFBWarnings(
            value = "CRLF_INJECTION_LOGS",
            justification = "本方法内写日志的异常消息均经 LogSanitizer.safe() 转义")
    private void handleTyping(Long userId, Map<String, Object> payload) {
        long receiverId = Long.parseLong(payload.get(KEY_RECEIVER_ID).toString());
        String convKey = ChatService.conversationKey(P2P, userId, receiverId);
        stateStore.setTyping(userId, convKey);
        try {
            sessionManager.sendToUser(
                    receiverId,
                    mapper.writeValueAsString(
                            Map.of(
                                    "action",
                                    "typing",
                                    "userId",
                                    userId,
                                    KEY_CONVERSATION_KEY,
                                    convKey)));
        } catch (JsonProcessingException ex) {
            // 「正在输入」是尽力而为的瞬时提示，失败不影响消息本身，
            // 因此不向上抛。但要留痕：否则前端表现为「对方一直不显示输入中」，
            // 排查时无从下手。DEBUG 级别加守卫，避免关闭调试日志时仍付出
            // 参数求值（LogSanitizer 遍历整串）的开销。
            if (LOG.isDebugEnabled()) {
                LOG.debug(
                        "转发 typing 事件失败: userId={}, 原因={}",
                        userId,
                        LogSanitizer.safe(ex.getMessage()));
            }
        }
    }

    private void handleRead(Long userId, Map<String, Object> payload) {
        String convKey = (String) payload.get(KEY_CONVERSATION_KEY);
        if (convKey != null) {
            stateStore.resetUnread(userId, convKey);
        }
    }

    @SuppressFBWarnings(
            value = "CRLF_INJECTION_LOGS",
            justification = "本方法内写日志的异常消息均经 LogSanitizer.safe() 转义")
    private void broadcastOnlineStatus(Long userId, String nickname, boolean online) {
        try {
            stateStore.publish(
                    "ws:online",
                    mapper.writeValueAsString(
                            Map.of(
                                    "action",
                                    "online",
                                    "userId",
                                    userId,
                                    "nickname",
                                    nickname,
                                    "online",
                                    online)));
        } catch (JsonProcessingException ex) {
            // 在线状态广播失败不阻断主流程，但需留痕以便排查
            // 「部分用户看不到某人上线」这类问题。
            if (LOG.isDebugEnabled()) {
                LOG.debug("广播在线状态失败: userId={}, 原因={}", userId, LogSanitizer.safe(ex.getMessage()));
            }
        }
    }

    private void close(WebSocketSession session, int code, String reason) {
        try {
            session.close(new CloseStatus(code, reason));
        } catch (IOException ex) {
            // 关闭时对端可能已断开，属于正常竞态，DEBUG 留痕即可。
            if (LOG.isDebugEnabled()) {
                LOG.debug("关闭 WS 会话失败: {}", LogSanitizer.safe(ex.getMessage()));
            }
        }
    }
}

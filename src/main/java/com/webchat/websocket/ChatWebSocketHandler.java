package com.webchat.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webchat.dto.MessageDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    private static final String ATTR_USER_ID = "userId";

    private final AuthService authService;
    private final ChatService chatService;
    private final WebSocketSessionManager sessionManager;
    private final RedisStateStore stateStore;
    private final ObjectMapper mapper;

    public ChatWebSocketHandler(AuthService authService, ChatService chatService,
                                WebSocketSessionManager sessionManager, RedisStateStore stateStore) {
        this.authService = authService;
        this.chatService = chatService;
        this.sessionManager = sessionManager;
        this.stateStore = stateStore;
        this.mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) { close(session, 4001, "缺少 token"); return; }
        String query = uri.getQuery();
        if (query == null || !query.startsWith("token=")) { close(session, 4001, "缺少 token"); return; }

        User user;
        try { user = authService.validateToken(query.substring(6)); }
        catch (Exception e) { close(session, 4001, "无效 token"); return; }

        Long userId = user.getId();
        session.getAttributes().put(ATTR_USER_ID, userId);
        sessionManager.add(userId, session.getId(), session);
        stateStore.setOnline(userId);
        log.info("WS 已连接: userId={}", userId);
        broadcastOnlineStatus(userId, user.getNickname(), true);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Long userId = (Long) session.getAttributes().get(ATTR_USER_ID);
        if (userId == null) return;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = mapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");
            if (type == null) return;
            switch (type) {
                case "p2p", "group" -> handleChatMessage(userId, payload, type);
                case "typing" -> handleTyping(userId, payload);
                case "read" -> handleRead(userId, payload);
            }
        } catch (Exception e) { log.error("WS 消息失败", e); }
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
        long receiverId = Long.parseLong(payload.get("receiverId").toString());
        String content = (String) payload.get("content");
        if (content == null || content.isBlank()) return;

        MessageDTO dto = chatService.sendMessage(userId, receiverId, type.toUpperCase(), content);
        try {
            String json = mapper.writeValueAsString(Map.of("action", "message", "data", dto));
            if ("GROUP".equalsIgnoreCase(type)) {
                stateStore.publish("group:" + receiverId, json);
            } else {
                sessionManager.sendToUser(receiverId, json);
                sessionManager.sendToUser(userId, json);
            }
        } catch (Exception e) { log.error("发送消息失败", e); }
    }

    private void handleTyping(Long userId, Map<String, Object> payload) {
        long receiverId = Long.parseLong(payload.get("receiverId").toString());
        String convKey = ChatService.conversationKey("P2P", userId, receiverId);
        stateStore.setTyping(userId, convKey);
        try {
            sessionManager.sendToUser(receiverId, mapper.writeValueAsString(
                    Map.of("action", "typing", "userId", userId, "conversationKey", convKey)));
        } catch (Exception ignored) {}
    }

    private void handleRead(Long userId, Map<String, Object> payload) {
        String convKey = (String) payload.get("conversationKey");
        if (convKey != null) stateStore.resetUnread(userId, convKey);
    }

    private void broadcastOnlineStatus(Long userId, String nickname, boolean online) {
        try {
            stateStore.publish("ws:online", mapper.writeValueAsString(
                    Map.of("action", "online", "userId", userId, "nickname", nickname, "online", online)));
        } catch (Exception ignored) {}
    }

    private void close(WebSocketSession session, int code, String reason) {
        try { session.close(new CloseStatus(code, reason)); } catch (IOException ignored) {}
    }
}

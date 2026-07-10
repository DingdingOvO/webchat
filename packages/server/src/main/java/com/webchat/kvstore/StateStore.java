package com.webchat.kvstore;

import java.util.Map;
import java.util.Set;

/**
 * 自研 KV 实时状态层接口。
 * 负责在线状态、未读数、正在输入、推送状态的存取。
 */
public interface StateStore {

    // ---- 在线状态 ----
    void setOnline(Long userId);
    void setOffline(Long userId);
    boolean isOnline(Long userId);
    Set<String> getOnlineUsers();

    // ---- 未读消息数 ----
    long getUnreadCount(Long userId, String conversationKey);
    Map<String, Long> getAllUnreadCounts(Long userId);
    void incrementUnread(Long userId, String conversationKey);
    void resetUnread(Long userId, String conversationKey);

    // ---- 正在输入 ----
    void setTyping(Long userId, String conversationKey);
    void clearTyping(Long userId, String conversationKey);
    boolean isTyping(Long userId, String conversationKey);

    // ---- WebSocket 会话 ----
    void bindSession(Long userId, String sessionId);
    void unbindSession(Long userId, String sessionId);
    Set<String> getSessions(Long userId);

    // ---- 最近联系人（ZSet，按最后活跃时间排序） ----
    void touchContact(Long userId, String conversationKey);
    Set<String> getRecentContacts(Long userId, int limit);

    // ---- 热消息缓存（List，保留最近 N 条）- ----
    void pushHotMessage(String conversationKey, String messageJson);
    java.util.List<String> getHotMessages(String conversationKey, int count);

    // ---- Pub/Sub 频道 ----
    void publish(String channel, String message);
}

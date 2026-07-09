package com.webchat.kvstore;

import org.springframework.data.redis.core.*;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;

@Component
public class RedisStateStore implements StateStore {

    private static final String KEY_ONLINE      = "ws:online";
    private static final String KEY_UNREAD       = "ws:unread:%d";
    private static final String KEY_TYPING       = "ws:typing:%s";
    private static final String KEY_SESSION      = "ws:sessions:%d";
    private static final String KEY_CONTACTS     = "ws:contacts:%d";
    private static final String KEY_HOT_MSG      = "ws:hot:%s";
    private static final int    HOT_MSG_MAX      = 100;

    private final StringRedisTemplate redis;

    public RedisStateStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    // ========== 在线状态 ==========

    @Override
    public void setOnline(Long userId) {
        redis.opsForSet().add(KEY_ONLINE, userId.toString());
    }

    @Override
    public void setOffline(Long userId) {
        redis.opsForSet().remove(KEY_ONLINE, userId.toString());
    }

    @Override
    public boolean isOnline(Long userId) {
        return Boolean.TRUE.equals(redis.opsForSet().isMember(KEY_ONLINE, userId.toString()));
    }

    @Override
    public Set<String> getOnlineUsers() {
        return redis.opsForSet().members(KEY_ONLINE);
    }

    // ========== 未读消息数 ==========

    @Override
    public long getUnreadCount(Long userId, String conversationKey) {
        Object val = redis.opsForHash().get(String.format(KEY_UNREAD, userId), conversationKey);
        return val == null ? 0 : Long.parseLong(val.toString());
    }

    @Override
    public Map<String, Long> getAllUnreadCounts(Long userId) {
        Map<Object, Object> entries = redis.opsForHash().entries(String.format(KEY_UNREAD, userId));
        Map<String, Long> result = new LinkedHashMap<>();
        entries.forEach((k, v) -> result.put((String) k, Long.parseLong((String) v)));
        return result;
    }

    @Override
    public void incrementUnread(Long userId, String conversationKey) {
        redis.opsForHash().increment(String.format(KEY_UNREAD, userId), conversationKey, 1);
    }

    @Override
    public void resetUnread(Long userId, String conversationKey) {
        redis.opsForHash().delete(String.format(KEY_UNREAD, userId), conversationKey);
    }

    // ========== 正在输入 ==========

    @Override
    public void setTyping(Long userId, String conversationKey) {
        redis.opsForValue().set(
                String.format(KEY_TYPING, conversationKey),
                userId.toString(),
                Duration.ofSeconds(10));
    }

    @Override
    public void clearTyping(Long userId, String conversationKey) {
        String key = String.format(KEY_TYPING, conversationKey);
        String val = redis.opsForValue().get(key);
        if (userId.toString().equals(val)) {
            redis.delete(key);
        }
    }

    @Override
    public boolean isTyping(Long userId, String conversationKey) {
        String val = redis.opsForValue().get(String.format(KEY_TYPING, conversationKey));
        return val != null && !val.equals(userId.toString());
    }

    // ========== WebSocket 会话 ==========

    @Override
    public void bindSession(Long userId, String sessionId) {
        redis.opsForSet().add(String.format(KEY_SESSION, userId), sessionId);
    }

    @Override
    public void unbindSession(Long userId, String sessionId) {
        redis.opsForSet().remove(String.format(KEY_SESSION, userId), sessionId);
    }

    @Override
    public Set<String> getSessions(Long userId) {
        return redis.opsForSet().members(String.format(KEY_SESSION, userId));
    }

    // ========== 最近联系人 ==========

    @Override
    public void touchContact(Long userId, String conversationKey) {
        redis.opsForZSet().add(String.format(KEY_CONTACTS, userId), conversationKey, System.currentTimeMillis());
    }

    @Override
    public Set<String> getRecentContacts(Long userId, int limit) {
        return redis.opsForZSet().reverseRange(String.format(KEY_CONTACTS, userId), 0, limit - 1);
    }

    // ========== 热消息缓存 ==========

    @Override
    public void pushHotMessage(String conversationKey, String messageJson) {
        ListOperations<String, String> list = redis.opsForList();
        String key = String.format(KEY_HOT_MSG, conversationKey);
        list.leftPush(key, messageJson);
        list.trim(key, 0, HOT_MSG_MAX - 1);
    }

    @Override
    public List<String> getHotMessages(String conversationKey, int count) {
        return redis.opsForList().range(String.format(KEY_HOT_MSG, conversationKey), 0, count - 1);
    }

    // ========== Pub/Sub ==========

    @Override
    public void publish(String channel, String message) {
        redis.convertAndSend(channel, message);
    }
}

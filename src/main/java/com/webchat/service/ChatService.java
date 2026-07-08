package com.webchat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.webchat.document.MessageDoc;
import com.webchat.dto.MessageDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.ChatGroupMember;
import com.webchat.model.User;
import com.webchat.repository.ChatGroupMemberRepository;
import com.webchat.repository.MessageRepository;
import com.webchat.repository.UserRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final int HOT_MSG_COUNT = 50;

    private final MessageRepository msgRepo;
    private final UserRepository userRepo;
    private final ChatGroupMemberRepository memberRepo;
    private final RedisStateStore stateStore;
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public ChatService(MessageRepository msgRepo, UserRepository userRepo,
                       ChatGroupMemberRepository memberRepo,
                       RedisStateStore stateStore, StringRedisTemplate redis) {
        this.msgRepo = msgRepo;
        this.userRepo = userRepo;
        this.memberRepo = memberRepo;
        this.stateStore = stateStore;
        this.redis = redis;
        this.mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    /** 生成会话键 */
    public static String conversationKey(String type, Long id1, Long id2) {
        if ("GROUP".equals(type)) return "group:" + id2;
        long a = Math.min(id1, id2), b = Math.max(id1, id2);
        return "p2p:" + a + ":" + b;
    }

    /** 发送消息 */
    public MessageDTO sendMessage(Long senderId, Long receiverId, String type, String content) {
        String convKey = conversationKey(type, senderId, receiverId);
        User sender = userRepo.findById(senderId).orElseThrow();

        MessageDoc doc = new MessageDoc(senderId, sender.getNickname(), convKey, type, content);
        doc = msgRepo.save(doc);

        MessageDTO dto = new MessageDTO(
                null, senderId, sender.getNickname(), receiverId, type, content, doc.getCreatedAt());

        // 写 Redis 热缓存
        try {
            stateStore.pushHotMessage(convKey, mapper.writeValueAsString(dto));
        } catch (JsonProcessingException ignored) {}

        // 未读计数 & 最近联系人
        if (!"GROUP".equals(type)) {
            stateStore.incrementUnread(receiverId, convKey);
            stateStore.touchContact(receiverId, convKey);
        } else {
            // 群聊：给除发送者外的所有成员加未读
            List<Long> memberIds = getGroupMemberIds(receiverId);
            for (Long uid : memberIds) {
                if (!uid.equals(senderId)) {
                    stateStore.incrementUnread(uid, convKey);
                    stateStore.touchContact(uid, convKey);
                }
            }
        }
        stateStore.touchContact(senderId, convKey);

        return dto;
    }

    /** 获取群成员 ID 列表（优先 Redis 缓存，回源 DB） */
    public List<Long> getGroupMemberIds(Long groupId) {
        String cached = redis.opsForValue().get("group:members:" + groupId);
        if (cached != null) {
            try {
                return mapper.readValue(cached, mapper.getTypeFactory()
                        .constructCollectionType(List.class, Long.class));
            } catch (Exception ignored) {}
        }
        // 回源 DB 并写缓存
        List<Long> ids = memberRepo.findByGroupId(groupId).stream()
                .map(ChatGroupMember::getUserId).toList();
        try {
            redis.opsForValue().set("group:members:" + groupId, mapper.writeValueAsString(ids));
        } catch (Exception ignored) {}
        return ids;
    }

    /** 获取消息 */
    public List<MessageDTO> getMessages(String conversationKey) {
        // 1. Redis 热缓存
        List<String> hot = stateStore.getHotMessages(conversationKey, HOT_MSG_COUNT);
        if (!hot.isEmpty()) {
            return hot.stream().map(json -> {
                try { return mapper.readValue(json, MessageDTO.class); }
                catch (Exception e) { return null; }
            }).filter(Objects::nonNull).collect(Collectors.toList());
        }
        // 2. 回源 MongoDB
        List<MessageDoc> docs = msgRepo.findByConversationKeyOrderByCreatedAtAsc(conversationKey);
        return docs.stream().map(d -> new MessageDTO(
                null, d.getSenderId(), d.getSenderName(),
                null, d.getType(), d.getContent(), d.getCreatedAt()))
                .collect(Collectors.toList());
    }
}

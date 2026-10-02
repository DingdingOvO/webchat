package com.webchat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webchat.document.MessageDoc;
import com.webchat.dto.MessageDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.User;
import com.webchat.repository.MessageRepository;
import com.webchat.repository.UserRepository;
import com.webchat.util.BusinessException;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    private static final Logger LOG = LoggerFactory.getLogger(ChatService.class);

    private static final int HOT_MSG_COUNT = 50;

    /** 会话类型标识，与前端协议、MessageDoc.type 字段取值保持一致。 */
    private static final String GROUP = "GROUP";

    private final MessageRepository msgRepo;
    private final UserRepository userRepo;
    private final GroupService groupService;
    private final RedisStateStore stateStore;
    private final ObjectMapper mapper;

    public ChatService(
            MessageRepository msgRepo,
            UserRepository userRepo,
            GroupService groupService,
            RedisStateStore stateStore,
            ObjectMapper mapper) {
        this.msgRepo = msgRepo;
        this.userRepo = userRepo;
        this.groupService = groupService;
        this.stateStore = stateStore;
        this.mapper = mapper;
    }

    public static String conversationKey(String type, Long id1, Long id2) {
        if (GROUP.equals(type)) {
            // 群会话只由群 ID 决定，与发起人无关。
            return "group:" + id2;
        }
        // P2P 会话键必须与「谁发给谁」无关，否则 A→B 与 B→A 会落进
        // 两个不同的会话，历史消息就被拆成两条线索。按大小排序归一化。
        long smaller = Math.min(id1, id2);
        long larger = Math.max(id1, id2);
        return "p2p:" + smaller + ":" + larger;
    }

    public MessageDTO sendMessage(Long senderId, Long receiverId, String type, String content) {
        String convKey = conversationKey(type, senderId, receiverId);
        User sender = userRepo.findById(senderId).orElseThrow();

        if (GROUP.equals(type)) {
            List<Long> memberIds = groupService.getGroupMemberIds(receiverId);
            if (!memberIds.contains(senderId)) {
                throw new BusinessException("你不是该群成员，无法发送消息");
            }
        }

        MessageDoc doc =
                new MessageDoc(senderId, sender.getNickname(), receiverId, convKey, type, content);
        doc = msgRepo.save(doc);

        MessageDTO dto =
                new MessageDTO(
                        doc.getId(),
                        senderId,
                        sender.getNickname(),
                        receiverId,
                        type,
                        content,
                        doc.getCreatedAt());

        try {
            stateStore.pushHotMessage(convKey, mapper.writeValueAsString(dto));
        } catch (JsonProcessingException ex) {
            // 热消息只是缓存，写失败不影响消息已落 MongoDB 的事实，
            // 但会造成「最近消息列表缺一条」，需要留痕便于定位。
            if (LOG.isWarnEnabled()) {
                LOG.warn("热消息写入失败: conversationKey={}", convKey, ex);
            }
        }

        if (GROUP.equals(type)) {
            List<Long> memberIds = groupService.getGroupMemberIds(receiverId);
            for (Long uid : memberIds) {
                if (!uid.equals(senderId)) {
                    stateStore.incrementUnread(uid, convKey);
                    stateStore.touchContact(uid, convKey);
                }
            }
        } else {
            stateStore.incrementUnread(receiverId, convKey);
            stateStore.touchContact(receiverId, convKey);
        }
        stateStore.touchContact(senderId, convKey);

        return dto;
    }

    public List<MessageDTO> getMessages(String conversationKey) {
        List<String> hot = stateStore.getHotMessages(conversationKey, HOT_MSG_COUNT);
        if (!hot.isEmpty()) {
            return hot.stream()
                    .map(
                            json -> {
                                try {
                                    return mapper.readValue(json, MessageDTO.class);
                                } catch (JsonProcessingException ex) {
                                    // 热消息缓存里混入了无法反序列化的脏数据。
                                    // 若静默丢弃，用户会看到「消息少了一条」且无法解释。
                                    if (LOG.isWarnEnabled()) {
                                        LOG.warn("热消息反序列化失败，已跳过该条", ex);
                                    }
                                    return null;
                                }
                            })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }
        List<MessageDoc> docs = msgRepo.findByConversationKeyOrderByCreatedAtAsc(conversationKey);
        return docs.stream()
                .map(
                        d ->
                                new MessageDTO(
                                        d.getId(),
                                        d.getSenderId(),
                                        d.getSenderName(),
                                        d.getReceiverId(),
                                        d.getType(),
                                        d.getContent(),
                                        d.getCreatedAt()))
                .collect(Collectors.toList());
    }
}

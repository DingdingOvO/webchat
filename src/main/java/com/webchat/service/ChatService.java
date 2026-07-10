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
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    private static final int HOT_MSG_COUNT = 50;

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
        if ("GROUP".equals(type)) return "group:" + id2;
        long a = Math.min(id1, id2), b = Math.max(id1, id2);
        return "p2p:" + a + ":" + b;
    }

    public MessageDTO sendMessage(Long senderId, Long receiverId, String type, String content) {
        String convKey = conversationKey(type, senderId, receiverId);
        User sender = userRepo.findById(senderId).orElseThrow();

        if ("GROUP".equals(type)) {
            List<Long> memberIds = groupService.getGroupMemberIds(receiverId);
            if (!memberIds.contains(senderId)) {
                throw new BusinessException("你不是该群成员，无法发送消息");
            }
        }

        MessageDoc doc = new MessageDoc(senderId, sender.getNickname(), receiverId, convKey, type, content);
        doc = msgRepo.save(doc);

        MessageDTO dto = new MessageDTO(
                doc.getId(), senderId, sender.getNickname(), receiverId, type, content, doc.getCreatedAt());

        try {
            stateStore.pushHotMessage(convKey, mapper.writeValueAsString(dto));
        } catch (JsonProcessingException ignored) {}

        if (!"GROUP".equals(type)) {
            stateStore.incrementUnread(receiverId, convKey);
            stateStore.touchContact(receiverId, convKey);
        } else {
            List<Long> memberIds = groupService.getGroupMemberIds(receiverId);
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

    public List<MessageDTO> getMessages(String conversationKey) {
        List<String> hot = stateStore.getHotMessages(conversationKey, HOT_MSG_COUNT);
        if (!hot.isEmpty()) {
            return hot.stream().map(json -> {
                try { return mapper.readValue(json, MessageDTO.class); }
                catch (Exception e) { return null; }
            }).filter(Objects::nonNull).collect(Collectors.toList());
        }
        List<MessageDoc> docs = msgRepo.findByConversationKeyOrderByCreatedAtAsc(conversationKey);
        return docs.stream().map(d -> new MessageDTO(
                d.getId(), d.getSenderId(), d.getSenderName(),
                d.getReceiverId(), d.getType(), d.getContent(), d.getCreatedAt()))
                .collect(Collectors.toList());
    }
}

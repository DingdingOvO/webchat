package com.webchat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webchat.dto.GroupDTO;
import com.webchat.dto.UserDTO;
import com.webchat.model.ChatGroup;
import com.webchat.model.ChatGroupMember;
import com.webchat.repository.ChatGroupMemberRepository;
import com.webchat.repository.ChatGroupRepository;
import com.webchat.repository.UserRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class GroupService {

    private final ChatGroupRepository groupRepo;
    private final ChatGroupMemberRepository memberRepo;
    private final UserRepository userRepo;
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public GroupService(ChatGroupRepository groupRepo, ChatGroupMemberRepository memberRepo,
                        UserRepository userRepo, StringRedisTemplate redis) {
        this.groupRepo = groupRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
        this.redis = redis;
        this.mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
    }

    @Transactional
    public GroupDTO createGroup(String name, Long ownerId, Collection<Long> memberIds) {
        ChatGroup group = groupRepo.save(new ChatGroup(name, ownerId));
        Set<Long> added = new HashSet<>();
        added.add(ownerId);
        memberRepo.save(new ChatGroupMember(group, ownerId));

        if (memberIds != null) {
            for (Long uid : memberIds) {
                if (!uid.equals(ownerId) && added.add(uid)) {
                    memberRepo.save(new ChatGroupMember(group, uid));
                }
            }
        }

        cacheGroupMembers(group.getId());
        int count = (int) memberRepo.countByGroupId(group.getId());
        return new GroupDTO(group.getId(), group.getName(), group.getAvatar(), ownerId, count);
    }

    public List<GroupDTO> getUserGroups(Long userId) {
        return memberRepo.findByUserId(userId).stream()
                .map(m -> {
                    ChatGroup g = m.getGroup();
                    int count = (int) memberRepo.countByGroupId(g.getId());
                    return new GroupDTO(g.getId(), g.getName(), g.getAvatar(), g.getOwnerId(), count);
                })
                .toList();
    }

    public List<UserDTO> getGroupMembers(Long groupId) {
        return memberRepo.findByGroupId(groupId).stream()
                .map(m -> userRepo.findById(m.getUserId()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toDTO)
                .toList();
    }

    public List<Long> getGroupMemberIds(Long groupId) {
        String cached = redis.opsForValue().get("group:members:" + groupId);
        if (cached != null) {
            try {
                return mapper.readValue(cached, mapper.getTypeFactory()
                        .constructCollectionType(List.class, Long.class));
            } catch (Exception ignored) {}
        }
        List<Long> ids = memberRepo.findByGroupId(groupId).stream()
                .map(ChatGroupMember::getUserId)
                .toList();
        cacheMemberList(groupId, ids);
        return ids;
    }

    public void cacheGroupMembers(Long groupId) {
        List<Long> uids = memberRepo.findByGroupId(groupId).stream()
                .map(ChatGroupMember::getUserId)
                .toList();
        cacheMemberList(groupId, uids);
    }

    private void cacheMemberList(Long groupId, List<Long> memberIds) {
        try {
            redis.opsForValue().set("group:members:" + groupId, mapper.writeValueAsString(memberIds));
        } catch (Exception ignored) {}
    }

    private UserDTO toDTO(com.webchat.model.User u) {
        return new UserDTO(
                u.getId(), u.getUsername(), u.getNickname(), u.getAvatar(),
                false, u.getLastOnline() != null ? u.getLastOnline().toString() : null);
    }
}

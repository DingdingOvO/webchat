package com.webchat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webchat.dto.GroupDTO;
import com.webchat.dto.UserDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.*;
import com.webchat.repository.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final FriendRepository friendRepo;
    private final FriendRequestRepository requestRepo;
    private final ChatGroupRepository groupRepo;
    private final ChatGroupMemberRepository memberRepo;
    private final RedisStateStore stateStore;
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public UserService(UserRepository userRepo, FriendRepository friendRepo,
                       FriendRequestRepository requestRepo, ChatGroupRepository groupRepo,
                       ChatGroupMemberRepository memberRepo, RedisStateStore stateStore,
                       StringRedisTemplate redis) {
        this.userRepo = userRepo;
        this.friendRepo = friendRepo;
        this.requestRepo = requestRepo;
        this.groupRepo = groupRepo;
        this.memberRepo = memberRepo;
        this.stateStore = stateStore;
        this.redis = redis;
        this.mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
    }

    public List<UserDTO> searchUsers(String keyword, Long excludeUserId) {
        return userRepo.findAll().stream()
                .filter(u -> !u.getId().equals(excludeUserId))
                .filter(u -> u.getUsername().contains(keyword) || u.getNickname().contains(keyword))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getFriends(Long userId) {
        return friendRepo.findByUserId(userId).stream()
                .map(f -> userRepo.findById(f.getFriendId()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void sendFriendRequest(Long fromUserId, Long toUserId) {
        if (fromUserId.equals(toUserId)) throw new RuntimeException("不能加自己为好友");
        if (friendRepo.existsByUserIdAndFriendId(fromUserId, toUserId))
            throw new RuntimeException("已是好友");
        if (requestRepo.findByFromUserIdAndToUserId(fromUserId, toUserId).isPresent())
            throw new RuntimeException("已发送过好友请求");
        requestRepo.save(new FriendRequest(fromUserId, toUserId));
    }

    public List<FriendRequest> getPendingRequests(Long userId) {
        return requestRepo.findByToUserIdAndStatus(userId, FriendRequest.Status.PENDING);
    }

    @Transactional
    public void acceptFriendRequest(Long requestId) {
        FriendRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        req.setStatus(FriendRequest.Status.ACCEPTED);
        requestRepo.save(req);
        friendRepo.save(new Friend(req.getFromUserId(), req.getToUserId()));
        friendRepo.save(new Friend(req.getToUserId(), req.getFromUserId()));
    }

    @Transactional
    public void rejectFriendRequest(Long requestId) {
        FriendRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        req.setStatus(FriendRequest.Status.REJECTED);
        requestRepo.save(req);
    }

    // ---- 群组 ----

    @Transactional
    public GroupDTO createGroup(String name, Long ownerId, Long[] memberIds) {
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

        // 写入 Redis 群成员缓存
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
                .collect(Collectors.toList());
    }

    public List<UserDTO> getGroupMembers(Long groupId) {
        return memberRepo.findByGroupId(groupId).stream()
                .map(m -> userRepo.findById(m.getUserId()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /** 将群成员 ID 列表写入 Redis 缓存 */
    public void cacheGroupMembers(Long groupId) {
        try {
            List<Long> uids = memberRepo.findByGroupId(groupId).stream()
                    .map(ChatGroupMember::getUserId)
                    .toList();
            redis.opsForValue().set("group:members:" + groupId, mapper.writeValueAsString(uids));
        } catch (Exception ignored) {}
    }

    // ---- 辅助 ----

    private UserDTO toDTO(User u) {
        return new UserDTO(
                u.getId(), u.getUsername(), u.getNickname(), u.getAvatar(),
                stateStore.isOnline(u.getId()),
                u.getLastOnline() != null ? u.getLastOnline().toString() : null);
    }
}

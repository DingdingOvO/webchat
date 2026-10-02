package com.webchat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webchat.dto.GroupDTO;
import com.webchat.dto.UserDTO;
import com.webchat.model.ChatGroup;
import com.webchat.model.ChatGroupMember;
import com.webchat.model.User;
import com.webchat.repository.ChatGroupMemberRepository;
import com.webchat.repository.ChatGroupRepository;
import com.webchat.repository.UserRepository;
import com.webchat.util.LogSanitizer;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroupService {

    private static final Logger LOG = LoggerFactory.getLogger(GroupService.class);

    /** Redis 中群成员列表的键前缀。集中管理，避免字面量散落在读写两处而写错。 */
    private static final String GROUP_MEMBERS_KEY_PREFIX = "group:members:";

    private final ChatGroupRepository groupRepo;
    private final ChatGroupMemberRepository memberRepo;
    private final UserRepository userRepo;
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public GroupService(
            ChatGroupRepository groupRepo,
            ChatGroupMemberRepository memberRepo,
            UserRepository userRepo,
            StringRedisTemplate redis,
            ObjectMapper mapper) {
        this.groupRepo = groupRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
        this.redis = redis;
        this.mapper = mapper;
    }

    @Transactional
    public GroupDTO createGroup(String name, Long ownerId, Collection<Long> memberIds) {
        ChatGroup group = groupRepo.save(new ChatGroup(name, ownerId));
        Set<Long> added = new HashSet<>();
        added.add(ownerId);
        memberRepo.save(new ChatGroupMember(group, ownerId));

        if (memberIds != null) {
            // 先把待插入的成员收集成列表，再一次性 saveAll。
            // 逐个 save 会在循环里反复开事务/发出 INSERT，成员多时是 N 次往返。
            List<ChatGroupMember> toInsert = new ArrayList<>();
            for (Long memberId : memberIds) {
                if (!memberId.equals(ownerId) && added.add(memberId)) {
                    toInsert.add(new ChatGroupMember(group, memberId));
                }
            }
            memberRepo.saveAll(toInsert);
        }

        cacheGroupMembers(group.getId());
        int count = (int) memberRepo.countByGroupId(group.getId());
        return new GroupDTO(group.getId(), group.getName(), group.getAvatar(), ownerId, count);
    }

    public List<GroupDTO> getUserGroups(Long userId) {
        return memberRepo.findByUserId(userId).stream()
                .map(
                        membership -> {
                            ChatGroup group = membership.getGroup();
                            int count = (int) memberRepo.countByGroupId(group.getId());
                            return new GroupDTO(
                                    group.getId(),
                                    group.getName(),
                                    group.getAvatar(),
                                    group.getOwnerId(),
                                    count);
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
        String cached = redis.opsForValue().get(GROUP_MEMBERS_KEY_PREFIX + groupId);
        if (cached != null) {
            try {
                return mapper.readValue(
                        cached,
                        mapper.getTypeFactory().constructCollectionType(List.class, Long.class));
            } catch (JsonProcessingException ex) {
                // 缓存内容损坏（格式变更、手动误写等）。降级为查库并覆盖缓存，
                // 但留痕：否则会表现为「每次都读库」而查不出原因。
                if (LOG.isWarnEnabled()) {
                    LOG.warn("群成员缓存反序列化失败，回退查库: groupId={}", groupId, ex);
                }
            }
        }
        List<Long> ids =
                memberRepo.findByGroupId(groupId).stream().map(ChatGroupMember::getUserId).toList();
        cacheMemberList(groupId, ids);
        return ids;
    }

    public void cacheGroupMembers(Long groupId) {
        List<Long> memberIds =
                memberRepo.findByGroupId(groupId).stream().map(ChatGroupMember::getUserId).toList();
        cacheMemberList(groupId, memberIds);
    }

    private void cacheMemberList(Long groupId, List<Long> memberIds) {
        try {
            redis.opsForValue()
                    .set(GROUP_MEMBERS_KEY_PREFIX + groupId, mapper.writeValueAsString(memberIds));
        } catch (JsonProcessingException ex) {
            // 这是缓存写入，失败不应阻断主流程（成员关系已在 MySQL 落库）。
            // 但必须留日志：否则缓存长期写不进去也无人察觉，
            // 只会表现为「群成员列表偶尔读到旧数据」。
            if (LOG.isWarnEnabled()) {
                LOG.warn(
                        "群成员缓存写入失败: groupId={}, 原因={}",
                        groupId,
                        LogSanitizer.safe(ex.getMessage()));
            }
        }
    }

    private UserDTO toDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getAvatar(),
                false,
                user.getLastOnline() != null ? user.getLastOnline().toString() : null);
    }
}

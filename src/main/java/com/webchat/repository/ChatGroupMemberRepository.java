package com.webchat.repository;

import com.webchat.model.ChatGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatGroupMemberRepository extends JpaRepository<ChatGroupMember, Long> {
    List<ChatGroupMember> findByUserId(Long userId);
    List<ChatGroupMember> findByGroupId(Long groupId);
    Optional<ChatGroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
    long countByGroupId(Long groupId);
}

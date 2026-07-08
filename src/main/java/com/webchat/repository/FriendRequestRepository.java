package com.webchat.repository;

import com.webchat.model.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByToUserIdAndStatus(Long toUserId, FriendRequest.Status status);
    List<FriendRequest> findByFromUserId(Long fromUserId);
    Optional<FriendRequest> findByFromUserIdAndToUserId(Long fromUserId, Long toUserId);
}

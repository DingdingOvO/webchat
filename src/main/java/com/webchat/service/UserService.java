package com.webchat.service;

import com.webchat.dto.UserDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.*;
import com.webchat.repository.*;
import com.webchat.util.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final FriendRepository friendRepo;
    private final FriendRequestRepository requestRepo;
    private final RedisStateStore stateStore;

    public UserService(UserRepository userRepo, FriendRepository friendRepo,
                       FriendRequestRepository requestRepo, RedisStateStore stateStore) {
        this.userRepo = userRepo;
        this.friendRepo = friendRepo;
        this.requestRepo = requestRepo;
        this.stateStore = stateStore;
    }

    public List<UserDTO> searchUsers(String keyword, Long excludeUserId) {
        return userRepo.searchByKeyword(keyword, excludeUserId).stream()
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
        if (fromUserId.equals(toUserId)) throw new BusinessException("不能加自己为好友");
        if (friendRepo.existsByUserIdAndFriendId(fromUserId, toUserId))
            throw new BusinessException("已是好友");
        if (requestRepo.findByFromUserIdAndToUserId(fromUserId, toUserId).isPresent())
            throw new BusinessException("已发送过好友请求");
        requestRepo.save(new FriendRequest(fromUserId, toUserId));
    }

    public List<FriendRequest> getPendingRequests(Long userId) {
        return requestRepo.findByToUserIdAndStatus(userId, FriendRequest.Status.PENDING);
    }

    @Transactional
    public void acceptFriendRequest(Long requestId) {
        FriendRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new BusinessException("请求不存在"));
        req.setStatus(FriendRequest.Status.ACCEPTED);
        requestRepo.save(req);
        friendRepo.save(new Friend(req.getFromUserId(), req.getToUserId()));
        friendRepo.save(new Friend(req.getToUserId(), req.getFromUserId()));
    }

    @Transactional
    public void rejectFriendRequest(Long requestId) {
        FriendRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new BusinessException("请求不存在"));
        req.setStatus(FriendRequest.Status.REJECTED);
        requestRepo.save(req);
    }

    private UserDTO toDTO(User u) {
        return new UserDTO(
                u.getId(), u.getUsername(), u.getNickname(), u.getAvatar(),
                stateStore.isOnline(u.getId()),
                u.getLastOnline() != null ? u.getLastOnline().toString() : null);
    }
}

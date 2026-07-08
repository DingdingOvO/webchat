package com.webchat.controller;

import com.webchat.dto.GroupDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.service.GroupService;
import com.webchat.service.UserService;
import com.webchat.util.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final UserService userService;
    private final GroupService groupService;
    private final RedisStateStore stateStore;

    public UserController(AuthService authService, UserService userService,
                          GroupService groupService, RedisStateStore stateStore) {
        this.authService = authService;
        this.userService = userService;
        this.groupService = groupService;
        this.stateStore = stateStore;
    }

    private User authenticate(String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new UnauthorizedException("未授权");
        }
        try {
            return authService.validateToken(auth.substring(7));
        } catch (Exception e) {
            throw new UnauthorizedException("未授权");
        }
    }

    @GetMapping("/search")
    public List<com.webchat.dto.UserDTO> search(@RequestParam("q") String keyword,
                                                 @RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return userService.searchUsers(keyword, me.getId());
    }

    @GetMapping("/friends")
    public List<com.webchat.dto.UserDTO> friends(@RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return userService.getFriends(me.getId());
    }

    @PostMapping("/friend-request")
    public ResponseEntity<?> sendRequest(@RequestBody Map<String, Long> body,
                                          @RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        userService.sendFriendRequest(me.getId(), body.get("userId"));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/friend-requests/pending")
    public List<?> pendingRequests(@RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return userService.getPendingRequests(me.getId());
    }

    @PostMapping("/friend-requests/{id}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long id,
                                            @RequestHeader("Authorization") String auth) {
        authenticate(auth);
        userService.acceptFriendRequest(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/friend-requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id,
                                            @RequestHeader("Authorization") String auth) {
        authenticate(auth);
        userService.rejectFriendRequest(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/groups")
    public GroupDTO createGroup(@RequestBody Map<String, Object> body,
                                 @RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        String name = (String) body.get("name");
        @SuppressWarnings("unchecked")
        List<Object> rawIds = (List<Object>) body.get("memberIds");
        List<Long> memberIds = null;
        if (rawIds != null) {
            memberIds = rawIds.stream()
                    .map(v -> ((Number) v).longValue())
                    .toList();
        }
        return groupService.createGroup(name, me.getId(), memberIds);
    }

    @GetMapping("/groups")
    public List<GroupDTO> myGroups(@RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return groupService.getUserGroups(me.getId());
    }

    @GetMapping("/groups/{id}/members")
    public List<com.webchat.dto.UserDTO> groupMembers(@PathVariable Long id,
                                                       @RequestHeader("Authorization") String auth) {
        authenticate(auth);
        return groupService.getGroupMembers(id);
    }

    @GetMapping("/contacts")
    public java.util.Set<String> contacts(@RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return stateStore.getRecentContacts(me.getId(), 50);
    }
}

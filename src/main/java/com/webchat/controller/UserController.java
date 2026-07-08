package com.webchat.controller;

import com.webchat.dto.GroupDTO;
import com.webchat.dto.UserDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.FriendRequest;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final UserService userService;
    private final RedisStateStore stateStore;

    public UserController(AuthService authService, UserService userService, RedisStateStore stateStore) {
        this.authService = authService;
        this.userService = userService;
        this.stateStore = stateStore;
    }

    private User authenticate(String auth) {
        return authService.validateToken(auth.replace("Bearer ", ""));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam("q") String keyword,
                                    @RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            return ResponseEntity.ok(userService.searchUsers(keyword, me.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }

    @GetMapping("/friends")
    public ResponseEntity<?> friends(@RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            return ResponseEntity.ok(userService.getFriends(me.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }

    @PostMapping("/friend-request")
    public ResponseEntity<?> sendRequest(@RequestBody Map<String, Long> body,
                                          @RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            userService.sendFriendRequest(me.getId(), body.get("userId"));
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/friend-requests/pending")
    public ResponseEntity<?> pendingRequests(@RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            return ResponseEntity.ok(userService.getPendingRequests(me.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }

    @PostMapping("/friend-requests/{id}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long id,
                                            @RequestHeader("Authorization") String auth) {
        try {
            authenticate(auth);
            userService.acceptFriendRequest(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/friend-requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id,
                                            @RequestHeader("Authorization") String auth) {
        try {
            authenticate(auth);
            userService.rejectFriendRequest(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- 群组 ----

    @PostMapping("/groups")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> body,
                                          @RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            String name = (String) body.get("name");
            @SuppressWarnings("unchecked")
            List<Object> rawIds = (List<Object>) body.get("memberIds");
            Long[] memberIds = null;
            if (rawIds != null) {
                memberIds = rawIds.stream()
                        .map(v -> ((Number) v).longValue())
                        .toArray(Long[]::new);
            }
            GroupDTO group = userService.createGroup(name, me.getId(), memberIds);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/groups")
    public ResponseEntity<?> myGroups(@RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            return ResponseEntity.ok(userService.getUserGroups(me.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }

    @GetMapping("/groups/{id}/members")
    public ResponseEntity<?> groupMembers(@PathVariable Long id,
                                           @RequestHeader("Authorization") String auth) {
        try {
            authenticate(auth);
            return ResponseEntity.ok(userService.getGroupMembers(id));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }

    // ---- 最近联系人 ----
    @GetMapping("/contacts")
    public ResponseEntity<?> contacts(@RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            return ResponseEntity.ok(stateStore.getRecentContacts(me.getId(), 50));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }
}

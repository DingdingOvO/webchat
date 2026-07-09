package com.webchat.controller;

import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.service.UserService;
import com.webchat.util.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final UserService userService;
    private final RedisStateStore stateStore;

    public UserController(AuthService authService, UserService userService,
                          RedisStateStore stateStore) {
        this.authService = authService;
        this.userService = userService;
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
    public java.util.List<com.webchat.dto.UserDTO> search(@RequestParam("q") String keyword,
                                                           @RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return userService.searchUsers(keyword, me.getId());
    }

    @GetMapping("/friends")
    public java.util.List<com.webchat.dto.UserDTO> friends(@RequestHeader("Authorization") String auth) {
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
    public java.util.List<?> pendingRequests(@RequestHeader("Authorization") String auth) {
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

    @GetMapping("/contacts")
    public Set<String> contacts(@RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return stateStore.getRecentContacts(me.getId(), 50);
    }
}

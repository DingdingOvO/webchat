package com.webchat.controller;

import com.webchat.dto.UserDTO;
import com.webchat.kvstore.RedisStateStore;
import com.webchat.model.User;
import com.webchat.service.UserService;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    /** 最近联系人条数上限。 */
    private static final int RECENT_CONTACTS_LIMIT = 50;

    private final UserService userService;
    private final RedisStateStore stateStore;
    private final AuthenticationSupport authentication;

    public UserController(
            UserService userService,
            RedisStateStore stateStore,
            AuthenticationSupport authentication) {
        this.userService = userService;
        this.stateStore = stateStore;
        this.authentication = authentication;
    }

    @GetMapping("/search")
    public List<UserDTO> search(
            @RequestParam("q") String keyword,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        return userService.searchUsers(keyword, me.getId());
    }

    @GetMapping("/friends")
    public List<UserDTO> friends(
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        return userService.getFriends(me.getId());
    }

    @PostMapping("/friend-request")
    public ResponseEntity<?> sendRequest(
            @RequestBody Map<String, Long> body,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        userService.sendFriendRequest(me.getId(), body.get("userId"));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/friend-requests/pending")
    public List<?> pendingRequests(
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        return userService.getPendingRequests(me.getId());
    }

    @PostMapping("/friend-requests/{id}/accept")
    public ResponseEntity<?> acceptRequest(
            @PathVariable Long id,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        authentication.authenticate(xAuth, auth);
        userService.acceptFriendRequest(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/friend-requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        authentication.authenticate(xAuth, auth);
        userService.rejectFriendRequest(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/contacts")
    public Set<String> contacts(
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        return stateStore.getRecentContacts(me.getId(), RECENT_CONTACTS_LIMIT);
    }
}

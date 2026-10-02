package com.webchat.controller;

import com.webchat.dto.GroupDTO;
import com.webchat.dto.UserDTO;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.service.GroupService;
import com.webchat.util.UnauthorizedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final AuthService authService;
    private final GroupService groupService;

    public GroupController(AuthService authService, GroupService groupService) {
        this.authService = authService;
        this.groupService = groupService;
    }

    private User authenticate(String xAuth, String auth) {
        String token = extractToken(xAuth, auth);
        if (token == null) {
            throw new UnauthorizedException("未授权");
        }
        return authService.validateToken(token);
    }

    @PostMapping
    public GroupDTO createGroup(@RequestBody Map<String, Object> body,
                                 @RequestHeader(value = "X-Auth-Token", required = false) String xAuth,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        User me = authenticate(xAuth, auth);
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

    @GetMapping
    public List<GroupDTO> myGroups(@RequestHeader(value = "X-Auth-Token", required = false) String xAuth,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        User me = authenticate(xAuth, auth);
        return groupService.getUserGroups(me.getId());
    }

    @GetMapping("/{id}/members")
    public List<UserDTO> groupMembers(@PathVariable Long id,
                                       @RequestHeader(value = "X-Auth-Token", required = false) String xAuth,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        authenticate(xAuth, auth);
        return groupService.getGroupMembers(id);
    }

    /** 提取 token：优先 X-Auth-Token（网关会改写 Authorization，故部署环境用此头），回退 Authorization: Bearer */
    private static String extractToken(String xAuth, String auth) {
        if (xAuth != null && !xAuth.isBlank()) {
            return xAuth.startsWith("Bearer ") ? xAuth.substring(7) : xAuth.trim();
        }
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        return null;
    }

}

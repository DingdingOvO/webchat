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

    private User authenticate(String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new UnauthorizedException("未授权");
        }
        return authService.validateToken(auth.substring(7));
    }

    @PostMapping
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

    @GetMapping
    public List<GroupDTO> myGroups(@RequestHeader("Authorization") String auth) {
        User me = authenticate(auth);
        return groupService.getUserGroups(me.getId());
    }

    @GetMapping("/{id}/members")
    public List<UserDTO> groupMembers(@PathVariable Long id,
                                       @RequestHeader("Authorization") String auth) {
        authenticate(auth);
        return groupService.getGroupMembers(id);
    }
}

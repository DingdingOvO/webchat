package com.webchat.controller;

import com.webchat.dto.GroupDTO;
import com.webchat.dto.UserDTO;
import com.webchat.model.User;
import com.webchat.service.GroupService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private static final String FIELD_NAME = "name";
    private static final String FIELD_MEMBER_IDS = "memberIds";

    private final GroupService groupService;
    private final AuthenticationSupport authentication;

    public GroupController(GroupService groupService, AuthenticationSupport authentication) {
        this.groupService = groupService;
        this.authentication = authentication;
    }

    @PostMapping
    public GroupDTO createGroup(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        String name = (String) body.get(FIELD_NAME);
        List<Long> memberIds = parseMemberIds(body.get(FIELD_MEMBER_IDS));
        return groupService.createGroup(name, me.getId(), memberIds);
    }

    @GetMapping
    public List<GroupDTO> myGroups(
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        return groupService.getUserGroups(me.getId());
    }

    @GetMapping("/{id}/members")
    public List<UserDTO> groupMembers(
            @PathVariable Long id,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        authentication.authenticate(xAuth, auth);
        return groupService.getGroupMembers(id);
    }

    /** JSON 反序列化后成员 ID 是 Integer/Long 混用的 Number，统一归一成 Long。 */
    private static List<Long> parseMemberIds(Object raw) {
        if (!(raw instanceof List<?> rawList)) {
            // 返回空列表而非 null：调用方据此走「只把群主拉进来」的正常分支，
            // 无需再判空，也避免把 null 继续往 service 里传。
            return List.of();
        }
        return rawList.stream().map(value -> ((Number) value).longValue()).toList();
    }
}

package com.webchat.controller;

import com.webchat.dto.MessageDTO;
import com.webchat.service.AuthService;
import com.webchat.service.ChatService;
import com.webchat.util.UnauthorizedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final AuthService authService;
    private final ChatService chatService;

    public ChatController(AuthService authService, ChatService chatService) {
        this.authService = authService;
        this.chatService = chatService;
    }

    @GetMapping("/messages")
    public List<MessageDTO> messages(@RequestParam("convKey") String convKey,
                                      @RequestHeader(value = "X-Auth-Token", required = false) String xAuth,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        String token = extractToken(xAuth, auth);
        if (token == null) {
            throw new UnauthorizedException("未授权");
        }
        authService.validateToken(token);
        return chatService.getMessages(convKey);
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

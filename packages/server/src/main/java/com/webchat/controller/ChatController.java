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
                                      @RequestHeader("Authorization") String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new UnauthorizedException("未授权");
        }
        authService.validateToken(auth.substring(7));
        return chatService.getMessages(convKey);
    }
}

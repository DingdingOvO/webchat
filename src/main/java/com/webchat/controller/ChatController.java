package com.webchat.controller;

import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    public ResponseEntity<?> messages(@RequestParam("convKey") String convKey,
                                       @RequestHeader("Authorization") String auth) {
        try {
            authService.validateToken(auth.replace("Bearer ", ""));
            return ResponseEntity.ok(chatService.getMessages(convKey));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }
}

package com.webchat.controller;

import com.webchat.dto.MessageDTO;
import com.webchat.service.ChatService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final AuthenticationSupport authentication;

    public ChatController(ChatService chatService, AuthenticationSupport authentication) {
        this.chatService = chatService;
        this.authentication = authentication;
    }

    @GetMapping("/messages")
    public List<MessageDTO> messages(
            @RequestParam("convKey") String convKey,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        authentication.authenticate(xAuth, auth);
        return chatService.getMessages(convKey);
    }
}

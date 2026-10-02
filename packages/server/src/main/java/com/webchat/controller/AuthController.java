package com.webchat.controller;

import com.webchat.dto.AuthResponse;
import com.webchat.dto.LoginRequest;
import com.webchat.dto.RegisterRequest;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationSupport authentication;

    public AuthController(AuthService authService, AuthenticationSupport authentication) {
        this.authService = authService;
        this.authentication = authentication;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User user = authentication.authenticate(xAuth, auth);
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("username", user.getUsername());
        resp.put("nickname", user.getNickname());
        resp.put("avatar", user.getAvatar() != null ? user.getAvatar() : "");
        return ResponseEntity.ok(resp);
    }
}

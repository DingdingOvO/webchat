package com.webchat.controller;

import com.webchat.dto.AuthResponse;
import com.webchat.dto.LoginRequest;
import com.webchat.dto.RegisterRequest;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.util.UnauthorizedException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new UnauthorizedException("未授权");
        }
        String token = auth.substring(7);
        User user = authService.validateToken(token);
        var resp = new HashMap<String, Object>();
        resp.put("id", user.getId());
        resp.put("username", user.getUsername());
        resp.put("nickname", user.getNickname());
        resp.put("avatar", user.getAvatar() != null ? user.getAvatar() : "");
        return ResponseEntity.ok(resp);
    }
}

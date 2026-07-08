package com.webchat.controller;

import com.webchat.dto.AuthResponse;
import com.webchat.dto.LoginRequest;
import com.webchat.dto.RegisterRequest;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        try {
            AuthResponse res = authService.register(req);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            AuthResponse res = authService.login(req);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
        try {
            String token = auth.replace("Bearer ", "");
            User user = authService.validateToken(token);
            var resp = new java.util.HashMap<String, Object>();
            resp.put("id", user.getId());
            resp.put("username", user.getUsername());
            resp.put("nickname", user.getNickname());
            resp.put("avatar", user.getAvatar() != null ? user.getAvatar() : "");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }
}

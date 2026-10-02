package com.webchat.controller;

import com.webchat.model.User;
import com.webchat.repository.UserRepository;
import com.webchat.service.AuthService;
import com.webchat.util.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class SettingsController {

    private final AuthService authService;
    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder;

    public SettingsController(AuthService authService, UserRepository userRepo,
                              BCryptPasswordEncoder encoder) {
        this.authService = authService;
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    private User authenticate(String xAuth, String auth) {
        String token = extractToken(xAuth, auth);
        if (token == null) {
            throw new UnauthorizedException("未授权");
        }
        return authService.validateToken(token);
    }

    @PutMapping("/profile/username")
    public ResponseEntity<?> updateUsername(@RequestBody Map<String, String> body,
                                            @RequestHeader(value = "X-Auth-Token", required = false) String xAuth,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        User me = authenticate(xAuth, auth);
        String newUsername = body.get("username");
        if (newUsername == null || newUsername.isBlank() || newUsername.length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名至少 3 个字符"));
        }
        if (!newUsername.equals(me.getUsername()) && userRepo.existsByUsername(newUsername)) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名已被使用"));
        }
        me.setUsername(newUsername);
        userRepo.save(me);
        return ResponseEntity.ok(Map.of("ok", true, "username", newUsername));
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> body,
                                          @RequestHeader(value = "X-Auth-Token", required = false) String xAuth,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        User me = authenticate(xAuth, auth);
        String avatar = body.get("avatar");
        if (avatar == null || avatar.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "请选择图片"));
        }
        if (avatar.length() > 512_000) {
            return ResponseEntity.badRequest().body(Map.of("error", "图片过大，请压缩后上传"));
        }
        me.setAvatar(avatar);
        userRepo.save(me);
        return ResponseEntity.ok(Map.of("ok", true, "avatar", avatar.substring(0, 50) + "..."));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body,
                                            @RequestHeader(value = "X-Auth-Token", required = false) String xAuth,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        User me = authenticate(xAuth, auth);
        String oldPw = body.get("oldPassword");
        String newPw = body.get("newPassword");
        if (oldPw == null || newPw == null || newPw.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "密码至少 4 个字符"));
        }
        if (!encoder.matches(oldPw, me.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "原密码错误"));
        }
        me.setPassword(encoder.encode(newPw));
        userRepo.save(me);
        return ResponseEntity.ok(Map.of("ok", true));
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

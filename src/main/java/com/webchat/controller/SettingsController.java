package com.webchat.controller;

import com.webchat.model.User;
import com.webchat.repository.UserRepository;
import com.webchat.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class SettingsController {

    private final AuthService authService;
    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public SettingsController(AuthService authService, UserRepository userRepo) {
        this.authService = authService;
        this.userRepo = userRepo;
    }

    private User authenticate(String auth) {
        return authService.validateToken(auth.replace("Bearer ", ""));
    }

    /** 修改用户名 */
    @PutMapping("/profile/username")
    public ResponseEntity<?> updateUsername(@RequestBody Map<String, String> body,
                                            @RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
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
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }

    /** 上传头像（base64 data URL） */
    @PostMapping("/profile/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> body,
                                          @RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
            String avatar = body.get("avatar");
            if (avatar == null || avatar.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "请选择图片"));
            }
            // 限制 base64 头像大小（约 500KB）
            if (avatar.length() > 512_000) {
                return ResponseEntity.badRequest().body(Map.of("error", "图片过大，请压缩后上传"));
            }
            me.setAvatar(avatar);
            userRepo.save(me);
            return ResponseEntity.ok(Map.of("ok", true, "avatar", avatar.substring(0, 50) + "..."));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }

    /** 修改密码 */
    @PutMapping("/profile/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body,
                                            @RequestHeader("Authorization") String auth) {
        try {
            User me = authenticate(auth);
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
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "未授权"));
        }
    }
}

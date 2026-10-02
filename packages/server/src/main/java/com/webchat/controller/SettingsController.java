package com.webchat.controller;

import com.webchat.model.User;
import com.webchat.repository.UserRepository;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class SettingsController {

    /** 用户名最短长度。 */
    private static final int USERNAME_MIN_LENGTH = 3;

    /** 密码最短长度。 */
    private static final int PASSWORD_MIN_LENGTH = 4;

    /**
     * 头像字段上限（字符数）。
     *
     * <p>前端以 base64 Data URL 方式提交头像，此上限用于挡住明显超标的请求体， 避免把过大的字符串写进数据库。真实的图片体积限制应由网关/反向代理承担。
     */
    private static final int AVATAR_MAX_LENGTH = 512_000;

    /** 头像回显摘要的截断长度。 */
    private static final int AVATAR_PREVIEW_LENGTH = 50;

    /** 错误响应体统一的字段名。 */
    private static final String FIELD_ERROR = "error";

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder;
    private final AuthenticationSupport authentication;

    public SettingsController(
            UserRepository userRepo,
            BCryptPasswordEncoder encoder,
            AuthenticationSupport authentication) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.authentication = authentication;
    }

    @PutMapping("/profile/username")
    public ResponseEntity<?> updateUsername(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        String newUsername = body.get("username");
        if (newUsername == null
                || newUsername.isBlank()
                || newUsername.length() < USERNAME_MIN_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, "用户名至少 3 个字符"));
        }
        if (!newUsername.equals(me.getUsername()) && userRepo.existsByUsername(newUsername)) {
            return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, "用户名已被使用"));
        }
        me.setUsername(newUsername);
        userRepo.save(me);
        return ResponseEntity.ok(Map.of("ok", true, "username", newUsername));
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<?> updateAvatar(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        String avatar = body.get("avatar");
        if (avatar == null || avatar.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, "请选择图片"));
        }
        if (avatar.length() > AVATAR_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, "图片过大，请压缩后上传"));
        }
        me.setAvatar(avatar);
        userRepo.save(me);
        // 不能直接 substring(0, 50)：短于 50 个字符的头像会抛
        // StringIndexOutOfBoundsException，导致「上传小图必崩」。
        // 响应里只回显摘要，不把整个 base64 再吐回去。
        String preview =
                avatar.length() > AVATAR_PREVIEW_LENGTH
                        ? avatar.substring(0, AVATAR_PREVIEW_LENGTH) + "..."
                        : avatar;
        return ResponseEntity.ok(Map.of("ok", true, "avatar", preview));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<?> updatePassword(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = AuthenticationSupport.HEADER_X_AUTH_TOKEN, required = false)
                    String xAuth,
            @RequestHeader(value = AuthenticationSupport.HEADER_AUTHORIZATION, required = false)
                    String auth) {
        User me = authentication.authenticate(xAuth, auth);
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null
                || newPassword == null
                || newPassword.length() < PASSWORD_MIN_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, "密码至少 4 个字符"));
        }
        if (!encoder.matches(oldPassword, me.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, "原密码错误"));
        }
        me.setPassword(encoder.encode(newPassword));
        userRepo.save(me);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}

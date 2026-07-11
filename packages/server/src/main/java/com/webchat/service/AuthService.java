package com.webchat.service;

import com.webchat.dto.AuthResponse;
import com.webchat.dto.LoginRequest;
import com.webchat.dto.RegisterRequest;
import com.webchat.model.User;
import com.webchat.repository.UserRepository;
import com.webchat.util.BusinessException;
import com.webchat.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder;

    public AuthService(UserRepository userRepo, JwtUtil jwtUtil, BCryptPasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
        this.encoder = encoder;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByUsername(req.username())) {
            throw new BusinessException("用户名已存在");
        }
        String nickname =
                req.nickname() != null && !req.nickname().isBlank()
                        ? req.nickname()
                        : req.username();
        User user = new User(req.username(), encoder.encode(req.password()), nickname, req.email());
        user = userRepo.save(user);
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getNickname());
    }

    public AuthResponse login(LoginRequest req) {
        User user =
                userRepo.findByUsername(req.username())
                        .orElseThrow(() -> new BusinessException("用户名或密码错误"));
        if (!encoder.matches(req.password(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getNickname());
    }

    public User validateToken(String token) {
        if (!jwtUtil.validateToken(token)) throw new BusinessException("无效 token");
        Long userId = jwtUtil.getUserIdFromToken(token);
        return userRepo.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
    }
}

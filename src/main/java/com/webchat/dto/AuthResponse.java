package com.webchat.dto;

public record AuthResponse(
        String token,
        Long userId,
        String username,
        String nickname
) {}

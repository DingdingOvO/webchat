package com.webchat.dto;

public record UserDTO(
        Long id,
        String username,
        String nickname,
        String avatar,
        boolean online,
        String lastOnline
) {}

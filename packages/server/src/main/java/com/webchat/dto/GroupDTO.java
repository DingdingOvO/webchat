package com.webchat.dto;

public record GroupDTO(
        Long id,
        String name,
        String avatar,
        Long ownerId,
        int memberCount
) {}

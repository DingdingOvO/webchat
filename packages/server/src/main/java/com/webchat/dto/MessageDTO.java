package com.webchat.dto;

import java.time.Instant;

public record MessageDTO(
        String id,
        Long senderId,
        String senderName,
        Long receiverId,
        String type,
        String content,
        Instant createdAt
) {}

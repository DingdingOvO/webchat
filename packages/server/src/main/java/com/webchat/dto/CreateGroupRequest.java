package com.webchat.dto;

public record CreateGroupRequest(
        String name,
        Long[] memberIds
) {}

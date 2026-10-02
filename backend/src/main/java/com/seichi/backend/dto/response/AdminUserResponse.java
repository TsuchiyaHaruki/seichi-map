package com.seichi.backend.dto.response;

import com.seichi.backend.entity.User;
import com.seichi.backend.enums.Role;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String userName,
        String email,
        Role role,
        boolean enabled,
        int failedAttempts,
        boolean locked,
        Instant lockedAt,
        Instant createdAt
) {

    public static AdminUserResponse of(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getUserName(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.getFailedAttempts(),
                user.isLocked(),
                user.getLockedAt(),
                user.getCreatedAt()
        );
    }
}

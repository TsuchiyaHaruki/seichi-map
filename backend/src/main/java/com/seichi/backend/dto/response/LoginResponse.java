package com.seichi.backend.dto.response;

public record LoginResponse(
        boolean authenticated,
        UserResponse user
) {
}

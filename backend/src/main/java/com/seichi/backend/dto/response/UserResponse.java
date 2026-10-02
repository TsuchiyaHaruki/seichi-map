package com.seichi.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.seichi.backend.entity.User;
import com.seichi.backend.enums.Role;

/**
 * emailは登録レスポンスのみ返す(nullなら出力しない)。/auth/me・ログインではemailを含めない。
 */
public record UserResponse(
        Long id,
        String userName,
        @JsonInclude(JsonInclude.Include.NON_NULL) String email,
        Role role
) {

    public static UserResponse of(User user) {
        return new UserResponse(user.getId(), user.getUserName(), null, user.getRole());
    }

    public static UserResponse withEmail(User user) {
        return new UserResponse(user.getId(), user.getUserName(), user.getEmail(), user.getRole());
    }
}

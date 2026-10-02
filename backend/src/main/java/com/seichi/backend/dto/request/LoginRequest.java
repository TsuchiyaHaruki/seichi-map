package com.seichi.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "メールアドレスは必須です。")
        String email,

        @NotBlank(message = "パスワードは必須です。")
        String password
) {
}

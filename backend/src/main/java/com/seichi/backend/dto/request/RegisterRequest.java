package com.seichi.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "ユーザー名は必須です。")
        @Size(min = 2, max = 50, message = "ユーザー名は2文字以上50文字以内で入力してください。")
        String userName,

        @NotBlank(message = "メールアドレスは必須です。")
        @Email(message = "メールアドレスの形式が正しくありません。")
        @Size(max = 255, message = "メールアドレスは255文字以内で入力してください。")
        String email,

        @NotBlank(message = "パスワードは必須です。")
        @Size(min = 8, message = "パスワードは8文字以上で入力してください。")
        String password,

        @NotBlank(message = "確認用パスワードは必須です。")
        String passwordConfirmation
) {
}

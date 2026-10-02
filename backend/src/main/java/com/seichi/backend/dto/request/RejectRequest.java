package com.seichi.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRequest(

        @NotBlank(message = "却下理由は必須です。")
        @Size(max = 500, message = "却下理由は500文字以内で入力してください。")
        String reason
) {
}

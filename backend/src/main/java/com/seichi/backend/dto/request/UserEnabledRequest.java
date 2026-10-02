package com.seichi.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record UserEnabledRequest(

        @NotNull(message = "有効フラグは必須です。")
        Boolean enabled
) {
}

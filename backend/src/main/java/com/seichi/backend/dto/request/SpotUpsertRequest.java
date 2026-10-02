package com.seichi.backend.dto.request;

import com.seichi.backend.enums.Category;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SpotUpsertRequest(

        @NotBlank(message = "作品名は必須です。")
        @Size(max = 100, message = "作品名は100文字以内で入力してください。")
        String workName,

        @NotBlank(message = "聖地名は必須です。")
        @Size(max = 100, message = "聖地名は100文字以内で入力してください。")
        String spotName,

        @NotNull(message = "カテゴリーは必須です。")
        Category category,

        @NotBlank(message = "住所は必須です。")
        @Size(max = 255, message = "住所は255文字以内で入力してください。")
        String address,

        @Size(max = 50, message = "都道府県は50文字以内で入力してください。")
        String prefecture,

        @NotNull(message = "緯度は必須です。")
        @DecimalMin(value = "-90", message = "緯度は-90から90の範囲で入力してください。")
        @DecimalMax(value = "90", message = "緯度は-90から90の範囲で入力してください。")
        BigDecimal latitude,

        @NotNull(message = "経度は必須です。")
        @DecimalMin(value = "-180", message = "経度は-180から180の範囲で入力してください。")
        @DecimalMax(value = "180", message = "経度は-180から180の範囲で入力してください。")
        BigDecimal longitude,

        @Size(max = 500, message = "登場場面は500文字以内で入力してください。")
        String sceneDescription,

        @Size(max = 5000, message = "説明は5000文字以内で入力してください。")
        String description,

        @Pattern(regexp = "^$|^https?://.+", message = "出典URLの形式が正しくありません。")
        @Size(max = 500, message = "出典URLは500文字以内で入力してください。")
        String sourceUrl,

        @Size(max = 500, message = "出典説明は500文字以内で入力してください。")
        String sourceDescription,

        @Size(max = 255, message = "Google Place IDは255文字以内で入力してください。")
        String googlePlaceId
) {
}

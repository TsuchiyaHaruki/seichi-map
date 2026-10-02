package com.seichi.backend.dto.response;

import java.time.Instant;

/**
 * 聖地画像の一覧項目。実データは GET /api/v1/sacred-spots/{spotId}/images/{id} で取得する。
 */
public record SpotImageResponse(
        Long id,
        Long spotId,
        String originalName,
        String contentType,
        long sizeBytes,
        Instant createdAt
) {
}

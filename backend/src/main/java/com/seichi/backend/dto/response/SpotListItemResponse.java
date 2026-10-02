package com.seichi.backend.dto.response;

import com.seichi.backend.enums.Category;

public record SpotListItemResponse(
        Long id,
        String workName,
        String spotName,
        Category category,
        String address,
        double latitude,
        double longitude,
        String trustLabel,
        long likeCount
) {
}

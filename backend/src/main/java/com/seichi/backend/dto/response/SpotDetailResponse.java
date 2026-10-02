package com.seichi.backend.dto.response;

import com.seichi.backend.enums.Category;

import java.time.Instant;

public record SpotDetailResponse(
        Long id,
        String workName,
        String spotName,
        Category category,
        String address,
        String prefecture,
        double latitude,
        double longitude,
        String sceneDescription,
        String description,
        String sourceUrl,
        String sourceDescription,
        String googlePlaceId,
        String registrantName,
        String trustLabel,
        long likeCount,
        boolean likedByCurrentUser,
        boolean favoritedByCurrentUser,
        Instant createdAt,
        Instant updatedAt
) {
}

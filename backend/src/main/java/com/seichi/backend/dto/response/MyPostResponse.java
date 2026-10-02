package com.seichi.backend.dto.response;

import com.seichi.backend.enums.Category;
import com.seichi.backend.enums.VerificationStatus;

import java.time.Instant;

public record MyPostResponse(
        Long id,
        String workName,
        String spotName,
        Category category,
        String address,
        double latitude,
        double longitude,
        VerificationStatus verificationStatus,
        String rejectionReason,
        String trustLabel,
        long likeCount,
        Instant createdAt,
        Instant updatedAt
) {
}

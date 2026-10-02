package com.seichi.backend.dto.response;

import com.seichi.backend.enums.Category;
import com.seichi.backend.enums.VerificationStatus;

import java.time.Instant;

public record AdminSpotResponse(
        Long id,
        String workName,
        String spotName,
        Category category,
        String address,
        VerificationStatus verificationStatus,
        String trustLabel,
        String registrantName,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {
}

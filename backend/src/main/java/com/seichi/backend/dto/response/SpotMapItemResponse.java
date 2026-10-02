package com.seichi.backend.dto.response;

public record SpotMapItemResponse(
        Long id,
        String workName,
        String spotName,
        double latitude,
        double longitude,
        String trustLabel
) {
}

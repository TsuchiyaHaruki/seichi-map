package com.seichi.backend.dto.response;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

public record ErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        @JsonInclude(JsonInclude.Include.NON_NULL) Map<String, String> errors) {

    public static ErrorResponse of(int status, String code, String message, String path) {
        return new ErrorResponse(Instant.now(), status, code, message, path, null);
    }

    public static ErrorResponse of(int status, String code, String message, String path,
                                   Map<String, String> errors) {
        return new ErrorResponse(Instant.now(), status, code, message, path, errors);
    }
}

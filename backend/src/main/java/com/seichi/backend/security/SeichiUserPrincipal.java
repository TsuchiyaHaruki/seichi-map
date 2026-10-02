package com.seichi.backend.security;

public record SeichiUserPrincipal(Long id, String email, String role) {
}

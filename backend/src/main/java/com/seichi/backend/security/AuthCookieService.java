package com.seichi.backend.security;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.stereotype.Service;

import com.seichi.backend.config.AppProperties;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthCookieService {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";

    private final AppProperties properties;
    private final CsrfTokenRepository csrfTokenRepository;

    public AuthCookieService(AppProperties properties, CsrfTokenRepository csrfTokenRepository) {
        this.properties = properties;
        this.csrfTokenRepository = csrfTokenRepository;
    }

    public ResponseCookie createAccessTokenCookie(String token) {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(properties.cookie().secure())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMinutes(properties.jwt().expirationMinutes()))
                .build();
    }

    public ResponseCookie createLogoutCookie() {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(properties.cookie().secure())
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }

    public void addAccessTokenCookie(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE, createAccessTokenCookie(token).toString());
    }

    public void clearAccessTokenCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, createLogoutCookie().toString());
    }

    /**
     * ログイン・ログアウト時にCSRFトークン(XSRF-TOKEN Cookie)を破棄する。
     * 次回の GET /auth/csrf で新しいトークンが生成される。
     */
    public void clearCsrfToken(HttpServletRequest request, HttpServletResponse response) {
        csrfTokenRepository.saveToken(null, request, response);
    }
}

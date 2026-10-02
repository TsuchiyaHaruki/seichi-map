package com.seichi.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.seichi.backend.config.AppProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final Duration expiration;

    public JwtService(AppProperties properties) {
        this.secretKey = Keys.hmacShaKeyFor(
                properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.expiration = Duration.ofMinutes(properties.jwt().expirationMinutes());
    }

    public String createToken(Long userId, String email, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * トークンを検証してクレームを返す。無効な場合はJwtExceptionをスローする。
     */
    public Claims parseClaims(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

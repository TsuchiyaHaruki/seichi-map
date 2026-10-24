package com.seichi.backend.security;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import com.seichi.backend.config.AppProperties;
import com.seichi.backend.entity.User;
import com.seichi.backend.repository.UserRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthCookieService authCookieService;
    private final UserRepository userRepository;
    private final Duration slidingRefreshThreshold;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   AuthCookieService authCookieService,
                                   UserRepository userRepository,
                                   AppProperties properties) {
        this.jwtService = jwtService;
        this.authCookieService = authCookieService;
        this.userRepository = userRepository;
        this.slidingRefreshThreshold =
                Duration.ofMinutes(properties.jwt().slidingRefreshThresholdMinutes());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Cookie cookie = WebUtils.getCookie(request, AuthCookieService.ACCESS_TOKEN_COOKIE);
        if (cookie != null && StringUtils.hasText(cookie.getValue())
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtService.parseClaims(cookie.getValue());
                Long userId = Long.valueOf(claims.getSubject());

                // 無効化・削除・ロール変更を即時に反映するため、トークンの内容ではなくDBの現在の状態で判定する
                User user = userRepository.findById(userId).orElse(null);
                if (user == null || !user.isEnabled()) {
                    authCookieService.clearAccessTokenCookie(response);
                    filterChain.doFilter(request, response);
                    return;
                }
                String email = user.getEmail();
                String role = user.getRole().name();

                SeichiUserPrincipal principal = new SeichiUserPrincipal(userId, email, role);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                // スライディング更新: 残り有効期間が閾値(15分)未満なら新しいJWTを再発行する
                Duration remaining =
                        Duration.between(Instant.now(), claims.getExpiration().toInstant());
                if (remaining.compareTo(slidingRefreshThreshold) < 0) {
                    authCookieService.addAccessTokenCookie(
                            response, jwtService.createToken(userId, email, role));
                }
            } catch (JwtException | IllegalArgumentException ex) {
                // 無効トークンは黙って未認証として続行する
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}

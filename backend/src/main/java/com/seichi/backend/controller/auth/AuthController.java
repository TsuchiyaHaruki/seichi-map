package com.seichi.backend.controller.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.seichi.backend.dto.request.LoginRequest;
import com.seichi.backend.dto.request.RegisterRequest;
import com.seichi.backend.dto.response.CsrfTokenResponse;
import com.seichi.backend.dto.response.LoginResponse;
import com.seichi.backend.dto.response.UserResponse;
import com.seichi.backend.security.AuthCookieService;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    public AuthController(AuthService authService, AuthCookieService authCookieService) {
        this.authService = authService;
        this.authCookieService = authCookieService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request)
            throws MethodArgumentNotValidException {
        return authService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request,
                               HttpServletRequest httpRequest,
                               HttpServletResponse response) {
        AuthService.LoginResult result = authService.login(request);
        authCookieService.addAccessTokenCookie(response, result.token());
        authCookieService.clearCsrfToken(httpRequest, response);
        return new LoginResponse(true, result.user());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        // permitAll: 未ログインでも204でCookieを削除する
        authCookieService.clearAccessTokenCookie(response);
        authCookieService.clearCsrfToken(request, response);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal SeichiUserPrincipal principal) {
        return authService.currentUser(principal);
    }

    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(CsrfToken csrfToken) {
        return new CsrfTokenResponse(csrfToken.getToken());
    }
}

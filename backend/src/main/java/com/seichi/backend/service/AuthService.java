package com.seichi.backend.service;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.MethodArgumentNotValidException;

import com.seichi.backend.dto.request.LoginRequest;
import com.seichi.backend.dto.request.RegisterRequest;
import com.seichi.backend.dto.response.UserResponse;
import com.seichi.backend.entity.User;
import com.seichi.backend.enums.Role;
import com.seichi.backend.exception.AuthFailureException;
import com.seichi.backend.exception.ConflictException;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.repository.UserRepository;
import com.seichi.backend.security.JwtService;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.support.ValidationErrors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final String EMAIL_ALREADY_EXISTS_MESSAGE = "このメールアドレスは既に登録されています。";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SystemSettingService systemSettingService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       SystemSettingService systemSettingService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.systemSettingService = systemSettingService;
    }

    /**
     * ログイン成功結果。tokenはHttpOnly Cookieとしてコントローラで発行する。
     */
    public record LoginResult(String token, UserResponse user) {
    }

    @Transactional
    public UserResponse register(RegisterRequest request) throws MethodArgumentNotValidException {
        if (!request.password().equals(request.passwordConfirmation())) {
            throw ValidationErrors.of("passwordConfirmation", "パスワードが一致しません。");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", EMAIL_ALREADY_EXISTS_MESSAGE);
        }
        User user = new User();
        user.setUserName(request.userName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        // 自己登録のロールは必ずUSER(リクエスト値でのロール指定は受け付けない)
        user.setRole(Role.USER);
        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", EMAIL_ALREADY_EXISTS_MESSAGE);
        }
        return UserResponse.withEmail(user);
    }

    /**
     * ログイン。失敗回数の加算・ロック状態の更新はAuthFailureExceptionでもロールバックしない。
     */
    @Transactional(noRollbackFor = AuthFailureException.class)
    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(AuthService::authenticationFailed);
        if (!user.isEnabled()) {
            throw new AuthFailureException("ACCOUNT_DISABLED",
                    "アカウントが無効化されています。管理者にお問い合わせください。");
        }
        if (user.isLocked()) {
            throw accountLocked();
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            handleFailedAttempt(user);
        }
        if (user.getFailedAttempts() != 0) {
            user.setFailedAttempts(0);
            userRepository.save(user);
        }
        String token = jwtService.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new LoginResult(token, UserResponse.of(user));
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(SeichiUserPrincipal principal) {
        User user = userRepository.findById(principal.id())
                .orElseThrow(() -> new NotFoundException("ユーザーが見つかりません。"));
        return UserResponse.of(user);
    }

    private void handleFailedAttempt(User user) {
        int attempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(attempts);
        int maxFailedAttempts = systemSettingService.getMaxFailedAttempts();
        if (attempts >= maxFailedAttempts) {
            user.setLocked(true);
            user.setLockedAt(Instant.now());
            userRepository.save(user);
            log.info("ログイン失敗回数が上限に達したためアカウントをロックしました。userId={}", user.getId());
            throw accountLocked();
        }
        userRepository.save(user);
        throw authenticationFailed();
    }

    private static AuthFailureException authenticationFailed() {
        return new AuthFailureException("AUTHENTICATION_FAILED",
                "メールアドレスまたはパスワードが正しくありません。");
    }

    private static AuthFailureException accountLocked() {
        return new AuthFailureException("ACCOUNT_LOCKED",
                "アカウントがロックされています。管理者にお問い合わせください。");
    }
}

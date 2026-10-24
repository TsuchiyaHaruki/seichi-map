package com.seichi.backend.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

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

    /** BCryptが扱えるパスワードの上限(超えると照合時に例外になる) */
    static final int MAX_PASSWORD_BYTES = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SystemSettingService systemSettingService;
    private final String dummyPasswordHash;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       SystemSettingService systemSettingService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.systemSettingService = systemSettingService;
        // 存在しないアカウントでも照合と同じ時間をかけるためのダミーハッシュ
        this.dummyPasswordHash = passwordEncoder.encode("dummy-password-for-timing");
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
        if (exceedsMaxPasswordBytes(request.password())) {
            throw ValidationErrors.of("password",
                    "パスワードが長すぎます。全角は24文字、半角は72文字以内で入力してください。");
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
     * アカウントの存在・無効化・ロック状態は、パスワードが一致した場合にだけ明かす。
     */
    @Transactional(noRollbackFor = AuthFailureException.class)
    public LoginResult login(LoginRequest request) {
        Optional<User> found = userRepository.findByEmailForUpdate(request.email());
        if (found.isEmpty()) {
            // 応答時間の差からアカウントの存在を推測されないよう、照合と同じ処理を行う
            passwordMatches(request.password(), dummyPasswordHash);
            throw authenticationFailed();
        }
        User user = found.get();
        boolean matches = passwordMatches(request.password(), user.getPasswordHash());
        if (!user.isEnabled() || user.isLocked()) {
            if (!matches) {
                throw authenticationFailed();
            }
            if (!user.isEnabled()) {
                throw new AuthFailureException("ACCOUNT_DISABLED",
                        "アカウントが無効化されています。管理者にお問い合わせください。");
            }
            throw accountLocked();
        }
        if (!matches) {
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
            log.info("ログイン失敗回数が上限に達したためアカウントをロックしました。userId={}", user.getId());
        }
        userRepository.save(user);
        throw authenticationFailed();
    }

    /** 72バイトを超えるパスワードは照合できない(BCryptが例外を投げる)ため、不一致として扱う */
    private boolean passwordMatches(String rawPassword, String passwordHash) {
        if (exceedsMaxPasswordBytes(rawPassword)) {
            passwordEncoder.matches("", passwordHash);
            return false;
        }
        return passwordEncoder.matches(rawPassword, passwordHash);
    }

    private static boolean exceedsMaxPasswordBytes(String password) {
        return password != null
                && password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES;
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

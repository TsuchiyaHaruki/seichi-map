package com.seichi.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.seichi.backend.entity.User;
import com.seichi.backend.enums.Role;
import com.seichi.backend.repository.UserRepository;

@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final AppProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountInitializer(AppProperties properties,
                                   UserRepository userRepository,
                                   PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AppProperties.Admin admin = properties.admin();
        if (admin == null
                || !StringUtils.hasText(admin.userName())
                || !StringUtils.hasText(admin.email())
                || !StringUtils.hasText(admin.password())) {
            log.info("初期管理者アカウントの設定がないため作成をスキップします。");
            return;
        }
        if (userRepository.existsByEmail(admin.email())) {
            log.info("初期管理者アカウントは既に存在するため作成をスキップします。");
            return;
        }
        User user = new User();
        user.setUserName(admin.userName());
        user.setEmail(admin.email());
        user.setPasswordHash(passwordEncoder.encode(admin.password()));
        user.setRole(Role.ADMIN);
        user.setEnabled(true);
        user.setFailedAttempts(0);
        user.setLocked(false);
        userRepository.save(user);
        log.info("初期管理者アカウントを作成しました。");
    }
}

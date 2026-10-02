package com.seichi.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.entity.SystemSetting;
import com.seichi.backend.repository.SystemSettingRepository;

@Service
public class SystemSettingService {

    public static final String MAX_FAILED_ATTEMPTS_KEY = "max_failed_attempts";

    private static final Logger log = LoggerFactory.getLogger(SystemSettingService.class);
    private static final int DEFAULT_MAX_FAILED_ATTEMPTS = 5;

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    /**
     * ログイン失敗回数の上限。system_settingsに未設定・不正値の場合は既定の5を返す。
     */
    @Transactional(readOnly = true)
    public int getMaxFailedAttempts() {
        return systemSettingRepository.findById(MAX_FAILED_ATTEMPTS_KEY)
                .map(SystemSetting::getSettingValue)
                .map(this::parsePositiveIntOrNull)
                .orElse(DEFAULT_MAX_FAILED_ATTEMPTS);
    }

    private Integer parsePositiveIntOrNull(String value) {
        try {
            int parsed = Integer.parseInt(value.trim());
            if (parsed > 0) {
                return parsed;
            }
        } catch (NumberFormatException ex) {
            // フォールバックへ
        }
        log.warn("system_settings {} の値が不正なため既定値 {} を使用します。",
                MAX_FAILED_ATTEMPTS_KEY, DEFAULT_MAX_FAILED_ATTEMPTS);
        return null;
    }
}

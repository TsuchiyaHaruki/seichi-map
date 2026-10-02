package com.seichi.backend.controller.support;

import java.util.Locale;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.MethodArgumentNotValidException;

import com.seichi.backend.enums.Category;
import com.seichi.backend.enums.Role;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.service.support.ValidationErrors;

/**
 * ページング・ソート・検索条件のリクエストパラメータ変換。
 * page既定0(負値・不正値は0)、size既定20・最大100にクランプ。
 * sortはホワイトリスト(createdAt|updatedAt|workName|spotName)+方向のみ許可。
 */
public final class PageRequests {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private static final Set<String> SORT_PROPERTIES =
            Set.of("createdAt", "updatedAt", "workName", "spotName");

    private PageRequests() {
    }

    public static Pageable of(String page, String size) {
        return PageRequest.of(parsePage(page), parseSize(size));
    }

    public static Pageable of(String page, String size, Sort sort) {
        return PageRequest.of(parsePage(page), parseSize(size), sort);
    }

    public static Pageable of(String page, String size, String sort)
            throws MethodArgumentNotValidException {
        return PageRequest.of(parsePage(page), parseSize(size), parseSort(sort));
    }

    public static Sort parseSort(String sort) throws MethodArgumentNotValidException {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",", -1);
        String property = parts[0].trim();
        if (parts.length > 2 || !SORT_PROPERTIES.contains(property)) {
            throw invalidSort();
        }
        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length == 2) {
            String dir = parts[1].trim().toLowerCase(Locale.ROOT);
            if ("desc".equals(dir)) {
                direction = Sort.Direction.DESC;
            } else if (!"asc".equals(dir)) {
                throw invalidSort();
            }
        }
        return Sort.by(direction, property);
    }

    public static Category parseCategory(String value) throws MethodArgumentNotValidException {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Category.valueOf(value.trim());
        } catch (IllegalArgumentException ex) {
            throw ValidationErrors.of("category", "カテゴリーの指定が正しくありません。");
        }
    }

    public static Role parseRegistrantType(String value) throws MethodArgumentNotValidException {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Role.valueOf(value.trim());
        } catch (IllegalArgumentException ex) {
            throw ValidationErrors.of("registrantType", "登録者区分の指定が正しくありません。");
        }
    }

    public static VerificationStatus parseStatus(String value) throws MethodArgumentNotValidException {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return VerificationStatus.valueOf(value.trim());
        } catch (IllegalArgumentException ex) {
            throw ValidationErrors.of("status", "確認状態の指定が正しくありません。");
        }
    }

    private static MethodArgumentNotValidException invalidSort() {
        return ValidationErrors.of("sort", "並び替えの指定が正しくありません。");
    }

    private static int parsePage(String page) {
        int value = parseIntOrDefault(page, DEFAULT_PAGE);
        return Math.max(value, 0);
    }

    private static int parseSize(String size) {
        int value = parseIntOrDefault(size, DEFAULT_SIZE);
        if (value < 1) {
            return DEFAULT_SIZE;
        }
        return Math.min(value, MAX_SIZE);
    }

    private static int parseIntOrDefault(String value, int defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}

package com.seichi.backend.exception;

/**
 * ログイン失敗系の例外。codeは
 * AUTHENTICATION_FAILED / ACCOUNT_LOCKED / ACCOUNT_DISABLED のいずれか。
 */
public class AuthFailureException extends RuntimeException {

    private final String code;

    public AuthFailureException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

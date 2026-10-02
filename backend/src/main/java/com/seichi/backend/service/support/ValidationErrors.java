package com.seichi.backend.service.support;

import java.util.Map;

import org.springframework.core.MethodParameter;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

/**
 * GlobalExceptionHandlerが400 VALIDATION_ERRORとして処理できる例外を生成するユーティリティ。
 */
public final class ValidationErrors {

    private static final MethodParameter DUMMY_PARAMETER;

    static {
        try {
            DUMMY_PARAMETER = new MethodParameter(
                    ValidationErrors.class.getDeclaredMethod("target", Object.class), 0);
        } catch (NoSuchMethodException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private ValidationErrors() {
    }

    @SuppressWarnings("unused")
    private static void target(Object request) {
    }

    public static MethodArgumentNotValidException of(String field, String message) {
        return of(Map.of(field, message));
    }

    public static MethodArgumentNotValidException of(Map<String, String> fieldErrors) {
        BindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        fieldErrors.forEach((field, message) ->
                bindingResult.addError(new FieldError("request", field, message)));
        return new MethodArgumentNotValidException(DUMMY_PARAMETER, bindingResult);
    }
}

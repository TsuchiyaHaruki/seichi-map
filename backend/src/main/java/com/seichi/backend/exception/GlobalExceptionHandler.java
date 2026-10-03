package com.seichi.backend.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.seichi.backend.dto.response.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                                                          HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "入力内容を確認してください。",
                request.getRequestURI(),
                errors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex,
                                                          HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "リクエストの形式が正しくありません。",
                request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(AuthFailureException.class)
    public ResponseEntity<ErrorResponse> handleAuthFailure(AuthFailureException ex,
                                                           HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getCode(),
                ex.getMessage(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex,
                                                        HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                ex.getMessage(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex,
                                                               HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                "対象が見つかりません。",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex,
                                                        HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                ex.getCode(),
                ex.getMessage(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex,
                                                            HttpServletRequest request) {
        // サービス層の所有者・権限チェックで送出されたAccessDeniedException(フィルタ層は
        // RestAccessDeniedHandlerが処理するため、ここへ到達するのは業務ロジック由来のもの)。
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                "FORBIDDEN",
                "この操作を行う権限がありません。",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex,
                                                             HttpServletRequest request) {
        // spring.servlet.multipart の上限超過はコントローラー到達前に送出されるため、ここで413へ変換する
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.PAYLOAD_TOO_LARGE.value(),
                "PAYLOAD_TOO_LARGE",
                "ファイルサイズが上限を超えています。",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException ex,
                                                            HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                "BUSINESS_RULE_VIOLATION",
                ex.getMessage(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex,
                                                          HttpServletRequest request) {
        // 内部情報はレスポンスへ含めず、技術ログにのみ記録する
        log.error("想定外のエラーが発生しました。path={}", request.getRequestURI(), ex);
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                "サーバーエラーが発生しました。時間をおいて再度お試しください。",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

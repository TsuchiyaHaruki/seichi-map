package com.seichi.backend.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.seichi.backend.dto.response.ErrorResponse;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void アップロードサイズ超過は413と統一エラー形式で返す() {
        MockHttpServletRequest request = new MockHttpServletRequest(
                "POST", "/api/v1/sacred-spots/1/images");

        ResponseEntity<ErrorResponse> response = handler.handleMaxUploadSize(
                new MaxUploadSizeExceededException(5_242_880L), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(413);
        assertThat(body.code()).isEqualTo("PAYLOAD_TOO_LARGE");
        assertThat(body.path()).isEqualTo("/api/v1/sacred-spots/1/images");
        // 内部例外のメッセージをレスポンスへ含めない
        assertThat(body.message()).doesNotContain("5242880");
    }
}

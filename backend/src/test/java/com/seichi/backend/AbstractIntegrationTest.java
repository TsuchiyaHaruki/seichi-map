package com.seichi.backend;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seichi.backend.support.ApiTestClient;

/**
 * 実PostgreSQL(compose の seichi_test データベース)に対して、
 * 実エンドポイント(MockMvc)を本番同様のCSRF・Cookieフローで叩く統合テスト基盤。
 *
 * <p>実行前に `docker compose up -d db` でDBを起動しておくこと。接続先は
 * システムプロパティ `test.datasource.url` で上書きできる(既定は seichi_test)。
 *
 * <p>本環境の Docker Desktop(Engine 29 / API 1.52)は Testcontainers 同梱の
 * docker-java と非互換(/info が 400)のため、Testcontainers ではなく稼働中の
 * compose DB を使用する。各テストの前にデータ表をTRUNCATEして分離する。
 */
@SpringBootTest(properties = {
        "spring.datasource.url=${test.datasource.url:jdbc:postgresql://localhost:55432/seichi_test}",
        "spring.datasource.username=${test.datasource.username:seichi}",
        "spring.datasource.password=${test.datasource.password:seichi_dev_password}",
        "app.jwt.secret=test-jwt-secret-key-for-integration-tests-0123456789",
        "app.cookie.secure=false",
        "app.cors.frontend-origin=http://localhost:3000",
        // 画像はテスト用の一時フォルダへ保存する(プロジェクト配下を汚さない)
        "app.upload.spot-images-dir=${java.io.tmpdir}/seichi-test-spot-images",
        // 初期管理者は各テストで明示作成するため無効化
        "app.admin.email="
})
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** 各テストの前にデータ表を初期化し、IDを1から採番し直す(system_settingsは保持)。 */
    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.execute(
                "TRUNCATE TABLE likes, favorites, spot_images, sacred_spots, users"
                        + " RESTART IDENTITY CASCADE");
    }

    protected ApiTestClient newClient() {
        return new ApiTestClient(mockMvc, objectMapper);
    }
}

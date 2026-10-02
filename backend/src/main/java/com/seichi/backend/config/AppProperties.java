package com.seichi.backend.config;

import java.nio.charset.StandardCharsets;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app")
public record AppProperties(Jwt jwt, Cookie cookie, Cors cors, Admin admin, Upload upload) {

    public record Jwt(String secret, long expirationMinutes, long slidingRefreshThresholdMinutes) {
        public Jwt {
            // HS256には256ビット(32バイト)以上の鍵が必須
            if (secret == null || secret.isBlank()
                    || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
                throw new IllegalStateException(
                        "app.jwt.secret が未設定か短すぎます。"
                                + "環境変数 JWT_SECRET に32バイト(256ビット)以上のシークレットを設定してください。");
            }
        }
    }

    public record Cookie(boolean secure) {
    }

    public record Cors(String frontendOrigin) {
    }

    public record Admin(String userName, String email, String password) {
    }

    /**
     * 聖地画像の保存設定。spotImagesDirはローカルフォルダのパス(相対指定はプロセスの作業ディレクトリ基準)。
     */
    public record Upload(String spotImagesDir, int maxImagesPerSpot, long maxImageSizeBytes) {

        /** 環境変数が空のまま渡された場合の保存先 */
        private static final String DEFAULT_SPOT_IMAGES_DIR = "./var/spot-images";

        public Upload {
            if (spotImagesDir == null || spotImagesDir.isBlank()) {
                spotImagesDir = DEFAULT_SPOT_IMAGES_DIR;
            }
            if (maxImagesPerSpot < 1) {
                throw new IllegalStateException("app.upload.max-images-per-spot は1以上にしてください。");
            }
            if (maxImageSizeBytes < 1) {
                throw new IllegalStateException("app.upload.max-image-size-bytes は1以上にしてください。");
            }
        }
    }
}

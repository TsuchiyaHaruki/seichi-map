package com.seichi.backend.service.support;

import java.util.Optional;

/**
 * 受け入れる画像形式。拡張子や申告されたContent-Typeは信用せず、
 * ファイル先頭のバイト列(マジックナンバー)で判定する。
 */
public enum ImageFormat {

    JPEG("image/jpeg", "jpg"),
    PNG("image/png", "png"),
    WEBP("image/webp", "webp");

    /** 判定に必要な先頭バイト数(WebPのRIFFヘッダーが最長で12バイト) */
    public static final int HEADER_LENGTH = 12;

    private static final byte[] PNG_SIGNATURE = {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    private final String contentType;
    private final String extension;

    ImageFormat(String contentType, String extension) {
        this.contentType = contentType;
        this.extension = extension;
    }

    public String contentType() {
        return contentType;
    }

    public String extension() {
        return extension;
    }

    public static Optional<ImageFormat> detect(byte[] header) {
        if (header == null) {
            return Optional.empty();
        }
        if (isJpeg(header)) {
            return Optional.of(JPEG);
        }
        if (isPng(header)) {
            return Optional.of(PNG);
        }
        if (isWebp(header)) {
            return Optional.of(WEBP);
        }
        return Optional.empty();
    }

    private static boolean isJpeg(byte[] header) {
        return header.length >= 3
                && (header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF;
    }

    private static boolean isPng(byte[] header) {
        if (header.length < PNG_SIGNATURE.length) {
            return false;
        }
        for (int i = 0; i < PNG_SIGNATURE.length; i++) {
            if (header[i] != PNG_SIGNATURE[i]) {
                return false;
            }
        }
        return true;
    }

    /** "RIFF" + 4バイトのサイズ + "WEBP" */
    private static boolean isWebp(byte[] header) {
        return header.length >= 12
                && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
    }
}

package com.seichi.backend.exception;

public class NotFoundException extends RuntimeException {

    public NotFoundException() {
        super("対象が見つかりません。");
    }

    public NotFoundException(String message) {
        super(message);
    }
}

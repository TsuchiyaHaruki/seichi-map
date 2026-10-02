package com.seichi.backend.service.support;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.seichi.backend.config.AppProperties;
import com.seichi.backend.exception.BusinessRuleException;

/**
 * 聖地画像のローカルフォルダ保存。
 *
 * <p>保存先は app.upload.spot-images-dir(環境変数 SPOT_IMAGE_DIR)。
 * ファイル名は利用者の入力を使わずUUIDで生成し、聖地IDごとのサブフォルダへ置く。
 */
@Component
public class SpotImageStorage {

    private static final Logger log = LoggerFactory.getLogger(SpotImageStorage.class);

    private final Path baseDir;

    public SpotImageStorage(AppProperties properties) {
        this.baseDir = Path.of(properties.upload().spotImagesDir()).toAbsolutePath().normalize();
    }

    /** 拡張子は受け取ったファイル名ではなく、判定済みの形式から決める */
    public String save(Long spotId, MultipartFile file, String extension) {
        String storedName = spotId + "/" + UUID.randomUUID() + "." + extension;
        Path target = resolve(storedName);
        try {
            Files.createDirectories(target.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new BusinessRuleException("画像を保存できませんでした。時間をおいて再度お試しください。");
        }
        return storedName;
    }

    public byte[] read(String storedName) {
        Path path = resolve(storedName);
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new BusinessRuleException("画像を読み込めませんでした。");
        }
    }

    /** 実ファイルを削除する。DBの行は呼び出し側で削除する */
    public void delete(String storedName) {
        try {
            Files.deleteIfExists(resolve(storedName));
        } catch (IOException e) {
            // 実ファイルが消せなくても業務上は続行する(孤立ファイルはログで追う)
            log.warn("画像ファイルを削除できませんでした。storedName={}", storedName, e);
        }
    }

    /** 聖地の削除時に、その聖地のフォルダごと片付ける */
    public void deleteSpotDirectory(Long spotId) {
        Path dir = resolve(String.valueOf(spotId));
        if (!Files.exists(dir)) {
            return;
        }
        try (var paths = Files.walk(dir)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    log.warn("画像ファイルを削除できませんでした。path={}", path, e);
                }
            });
        } catch (IOException e) {
            log.warn("画像フォルダを削除できませんでした。spotId={}", spotId, e);
        }
    }

    /** 保存先の外へ出るパスを拒否する */
    private Path resolve(String storedName) {
        Path path = baseDir.resolve(storedName).normalize();
        if (!path.startsWith(baseDir)) {
            throw new BusinessRuleException("画像の保存先が不正です。");
        }
        return path;
    }
}

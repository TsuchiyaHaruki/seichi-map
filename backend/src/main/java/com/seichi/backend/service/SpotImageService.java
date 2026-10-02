package com.seichi.backend.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.seichi.backend.config.AppProperties;
import com.seichi.backend.dto.response.SpotImageResponse;
import com.seichi.backend.entity.SacredSpot;
import com.seichi.backend.entity.SpotImage;
import com.seichi.backend.enums.Role;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.exception.BusinessRuleException;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.repository.SacredSpotRepository;
import com.seichi.backend.repository.SpotImageRepository;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.support.ImageFormat;
import com.seichi.backend.service.support.SpotImageStorage;

/**
 * 聖地画像の登録・取得・削除。
 *
 * <p>閲覧範囲は聖地詳細と同じで、VERIFIEDは誰でも、PENDING/REJECTEDは投稿者本人とADMINのみ。
 * 登録・削除は投稿者本人とADMINのみ。
 */
@Service
public class SpotImageService {

    private static final String FORBIDDEN_MESSAGE = "この操作を行う権限がありません。";

    private final SacredSpotRepository sacredSpotRepository;
    private final SpotImageRepository spotImageRepository;
    private final SpotImageStorage storage;
    private final AppProperties properties;

    public SpotImageService(SacredSpotRepository sacredSpotRepository,
                            SpotImageRepository spotImageRepository,
                            SpotImageStorage storage,
                            AppProperties properties) {
        this.sacredSpotRepository = sacredSpotRepository;
        this.spotImageRepository = spotImageRepository;
        this.storage = storage;
        this.properties = properties;
    }

    /** 画像の登録(投稿者本人・ADMINのみ) */
    @Transactional
    public SpotImageResponse upload(Long spotId, MultipartFile file, SeichiUserPrincipal principal) {
        SacredSpot spot = sacredSpotRepository.findById(spotId)
                .orElseThrow(NotFoundException::new);
        if (!canEdit(spot, principal)) {
            throw new AccessDeniedException(FORBIDDEN_MESSAGE);
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("画像ファイルを選択してください。");
        }
        long maxSize = properties.upload().maxImageSizeBytes();
        if (file.getSize() > maxSize) {
            throw new BusinessRuleException(
                    "画像は1枚あたり" + (maxSize / 1024 / 1024) + "MBまでです。");
        }
        int maxCount = properties.upload().maxImagesPerSpot();
        if (spotImageRepository.countBySpotId(spotId) >= maxCount) {
            throw new BusinessRuleException("画像は1件につき" + maxCount + "枚までです。");
        }
        // 拡張子や申告されたContent-Typeではなく、中身の先頭バイトで形式を判定する
        ImageFormat format = ImageFormat.detect(readHeader(file))
                .orElseThrow(() -> new BusinessRuleException(
                        "対応していない画像形式です。JPEG、PNG、WebPのいずれかを選んでください。"));

        String storedName = storage.save(spotId, file, format.extension());
        SpotImage image = new SpotImage();
        image.setSpotId(spotId);
        image.setStoredName(storedName);
        image.setOriginalName(safeOriginalName(file.getOriginalFilename(), format.extension()));
        image.setContentType(format.contentType());
        image.setSizeBytes(file.getSize());
        image.setSortOrder((int) spotImageRepository.countBySpotId(spotId));
        image.setCreatedBy(principal.id());
        return toResponse(spotImageRepository.save(image));
    }

    /** 画像一覧(閲覧範囲は聖地詳細と同じ) */
    @Transactional(readOnly = true)
    public List<SpotImageResponse> list(Long spotId, SeichiUserPrincipal principal) {
        requireViewable(spotId, principal);
        return spotImageRepository.findBySpotIdOrderBySortOrderAscIdAsc(spotId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** 画像データ本体(閲覧範囲は聖地詳細と同じ) */
    @Transactional(readOnly = true)
    public ImageContent load(Long spotId, Long imageId, SeichiUserPrincipal principal) {
        requireViewable(spotId, principal);
        SpotImage image = spotImageRepository.findByIdAndSpotId(imageId, spotId)
                .orElseThrow(NotFoundException::new);
        return new ImageContent(storage.read(image.getStoredName()), image.getContentType());
    }

    /** 画像の削除(投稿者本人・ADMINのみ) */
    @Transactional
    public void delete(Long spotId, Long imageId, SeichiUserPrincipal principal) {
        SacredSpot spot = sacredSpotRepository.findById(spotId)
                .orElseThrow(NotFoundException::new);
        if (!canEdit(spot, principal)) {
            throw new AccessDeniedException(FORBIDDEN_MESSAGE);
        }
        SpotImage image = spotImageRepository.findByIdAndSpotId(imageId, spotId)
                .orElseThrow(NotFoundException::new);
        spotImageRepository.delete(image);
        storage.delete(image.getStoredName());
    }

    /**
     * 聖地の削除に伴う実ファイルの片付け。DBの行は外部キーのON DELETE CASCADEで消える。
     * 聖地を削除する直前に呼ぶこと。
     */
    public void deleteFilesOfSpot(Long spotId) {
        storage.deleteSpotDirectory(spotId);
    }

    private void requireViewable(Long spotId, SeichiUserPrincipal principal) {
        SacredSpot spot = sacredSpotRepository.findById(spotId)
                .orElseThrow(NotFoundException::new);
        if (spot.getVerificationStatus() == VerificationStatus.VERIFIED) {
            return;
        }
        // 非公開の聖地は存在自体を漏らさない
        if (principal == null
                || (!isAdmin(principal) && !spot.getCreatedBy().equals(principal.id()))) {
            throw new NotFoundException();
        }
    }

    private boolean canEdit(SacredSpot spot, SeichiUserPrincipal principal) {
        return isAdmin(principal) || spot.getCreatedBy().equals(principal.id());
    }

    private boolean isAdmin(SeichiUserPrincipal principal) {
        return Role.ADMIN.name().equals(principal.role());
    }

    private byte[] readHeader(MultipartFile file) {
        try (var in = file.getInputStream()) {
            return in.readNBytes(ImageFormat.HEADER_LENGTH);
        } catch (Exception e) {
            throw new BusinessRuleException("画像を読み込めませんでした。");
        }
    }

    /** もとのファイル名は表示にのみ使う。長さを制限し、パス区切りを落とす */
    private String safeOriginalName(String originalName, String extension) {
        if (originalName == null || originalName.isBlank()) {
            return "image." + extension;
        }
        String name = originalName.replaceAll("[\\\\/]", "_").trim();
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
    }

    private SpotImageResponse toResponse(SpotImage image) {
        return new SpotImageResponse(
                image.getId(),
                image.getSpotId(),
                image.getOriginalName(),
                image.getContentType(),
                image.getSizeBytes(),
                image.getCreatedAt());
    }

    /** 配信用の画像データ */
    public record ImageContent(byte[] bytes, String contentType) {
    }
}

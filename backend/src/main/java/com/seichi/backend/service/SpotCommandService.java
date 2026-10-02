package com.seichi.backend.service;

import java.time.Instant;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.dto.request.SpotUpsertRequest;
import com.seichi.backend.dto.response.SpotDetailResponse;
import com.seichi.backend.entity.SacredSpot;
import com.seichi.backend.enums.Role;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.exception.BusinessRuleException;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.mapper.SpotMapper;
import com.seichi.backend.repository.FavoriteRepository;
import com.seichi.backend.repository.LikeRepository;
import com.seichi.backend.repository.SacredSpotRepository;
import com.seichi.backend.repository.SpotSearchRow;
import com.seichi.backend.security.SeichiUserPrincipal;

@Service
public class SpotCommandService {

    private static final String FORBIDDEN_MESSAGE = "この操作を行う権限がありません。";

    private final SacredSpotRepository sacredSpotRepository;
    private final LikeRepository likeRepository;
    private final FavoriteRepository favoriteRepository;
    private final SpotImageService spotImageService;
    private final SpotMapper spotMapper;

    public SpotCommandService(SacredSpotRepository sacredSpotRepository,
                              LikeRepository likeRepository,
                              FavoriteRepository favoriteRepository,
                              SpotImageService spotImageService,
                              SpotMapper spotMapper) {
        this.sacredSpotRepository = sacredSpotRepository;
        this.likeRepository = likeRepository;
        this.favoriteRepository = favoriteRepository;
        this.spotImageService = spotImageService;
        this.spotMapper = spotMapper;
    }

    /**
     * 投稿。USERは必ずPENDING、ADMINの直接登録はVERIFIED(verified_by=本人, verified_at=now)。
     */
    @Transactional
    public SpotDetailResponse create(SpotUpsertRequest request, SeichiUserPrincipal principal) {
        SacredSpot spot = new SacredSpot();
        applyRequest(spot, request);
        spot.setCreatedBy(principal.id());
        if (isAdmin(principal)) {
            spot.setVerificationStatus(VerificationStatus.VERIFIED);
            spot.setVerifiedBy(principal.id());
            spot.setVerifiedAt(Instant.now());
        } else {
            spot.setVerificationStatus(VerificationStatus.PENDING);
        }
        spot = sacredSpotRepository.save(spot);
        return detailOf(spot.getId(), principal);
    }

    /**
     * 更新。投稿者本人またはADMIN。USERが編集した場合はPENDINGへ戻し確認情報をクリア、ADMINは状態維持。
     */
    @Transactional
    public SpotDetailResponse update(Long id, SpotUpsertRequest request, SeichiUserPrincipal principal) {
        SacredSpot spot = sacredSpotRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        boolean admin = isAdmin(principal);
        if (!admin && !spot.getCreatedBy().equals(principal.id())) {
            throw new AccessDeniedException(FORBIDDEN_MESSAGE);
        }
        applyRequest(spot, request);
        if (!admin) {
            spot.setVerificationStatus(VerificationStatus.PENDING);
            spot.setVerifiedBy(null);
            spot.setVerifiedAt(null);
            spot.setRejectionReason(null);
        }
        sacredSpotRepository.save(spot);
        return detailOf(id, principal);
    }

    /**
     * 削除。USERは自分のPENDING/REJECTEDのみ(自分のVERIFIEDは422、他人のは403)。ADMINは任意。
     */
    @Transactional
    public void delete(Long id, SeichiUserPrincipal principal) {
        SacredSpot spot = sacredSpotRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        if (!isAdmin(principal)) {
            if (!spot.getCreatedBy().equals(principal.id())) {
                throw new AccessDeniedException(FORBIDDEN_MESSAGE);
            }
            if (spot.getVerificationStatus() == VerificationStatus.VERIFIED) {
                throw new BusinessRuleException(
                        "承認済みの投稿は削除できません。管理者にお問い合わせください。");
            }
        }
        // DBの画像行は外部キーのCASCADEで消えるため、実ファイルを先に片付ける
        spotImageService.deleteFilesOfSpot(id);
        sacredSpotRepository.delete(spot);
    }

    private SpotDetailResponse detailOf(Long id, SeichiUserPrincipal principal) {
        SpotSearchRow row = sacredSpotRepository.findRowById(id)
                .orElseThrow(NotFoundException::new);
        boolean liked = likeRepository.existsByUserIdAndSpotId(principal.id(), id);
        boolean favorited = favoriteRepository.existsByUserIdAndSpotId(principal.id(), id);
        return spotMapper.toDetail(row, liked, favorited);
    }

    private void applyRequest(SacredSpot spot, SpotUpsertRequest request) {
        spot.setWorkName(request.workName().trim());
        spot.setSpotName(request.spotName().trim());
        spot.setCategory(request.category());
        spot.setAddress(request.address().trim());
        spot.setPrefecture(trimToNull(request.prefecture()));
        spot.setLatitude(request.latitude());
        spot.setLongitude(request.longitude());
        spot.setSceneDescription(trimToNull(request.sceneDescription()));
        spot.setDescription(trimToNull(request.description()));
        spot.setSourceUrl(trimToNull(request.sourceUrl()));
        spot.setSourceDescription(trimToNull(request.sourceDescription()));
        spot.setGooglePlaceId(trimToNull(request.googlePlaceId()));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean isAdmin(SeichiUserPrincipal principal) {
        return Role.ADMIN.name().equals(principal.role());
    }
}

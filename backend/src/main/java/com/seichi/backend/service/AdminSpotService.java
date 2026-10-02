package com.seichi.backend.service;

import java.time.Instant;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.dto.request.SpotUpsertRequest;
import com.seichi.backend.dto.response.AdminSpotResponse;
import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.dto.response.SpotDetailResponse;
import com.seichi.backend.entity.SacredSpot;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.exception.ConflictException;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.mapper.SpotMapper;
import com.seichi.backend.repository.SacredSpotRepository;
import com.seichi.backend.security.SeichiUserPrincipal;

@Service
public class AdminSpotService {

    private final SacredSpotRepository sacredSpotRepository;
    private final SpotQueryService spotQueryService;
    private final SpotCommandService spotCommandService;
    private final SpotMapper spotMapper;

    public AdminSpotService(SacredSpotRepository sacredSpotRepository,
                            SpotQueryService spotQueryService,
                            SpotCommandService spotCommandService,
                            SpotMapper spotMapper) {
        this.sacredSpotRepository = sacredSpotRepository;
        this.spotQueryService = spotQueryService;
        this.spotCommandService = spotCommandService;
        this.spotMapper = spotMapper;
    }

    /**
     * 管理者一覧。statusは任意フィルタ(nullなら全件)。
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminSpotResponse> list(VerificationStatus status, Pageable pageable) {
        return PageResponse.of(
                sacredSpotRepository.search(null, null, null, null, status, null, null, pageable),
                spotMapper::toAdminItem);
    }

    /**
     * 確認待ち一覧(PENDINGのみ。createdAt昇順のPageableを渡すこと)。
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminSpotResponse> pending(Pageable pageable) {
        return PageResponse.of(
                sacredSpotRepository.search(null, null, null, null,
                        VerificationStatus.PENDING, null, null, pageable),
                spotMapper::toAdminItem);
    }

    /**
     * 詳細(状態不問。ADMINはSpotQueryServiceの閲覧制限を満たす)。
     */
    @Transactional(readOnly = true)
    public SpotDetailResponse detail(Long id, SeichiUserPrincipal principal) {
        return spotQueryService.detail(id, principal);
    }

    /**
     * 承認。既にVERIFIEDの場合は409。
     */
    @Transactional
    public AdminSpotResponse verify(Long id, SeichiUserPrincipal principal) {
        SacredSpot spot = sacredSpotRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        if (spot.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new ConflictException("既に承認済みです。");
        }
        spot.setVerificationStatus(VerificationStatus.VERIFIED);
        spot.setVerifiedBy(principal.id());
        spot.setVerifiedAt(Instant.now());
        spot.setRejectionReason(null);
        sacredSpotRepository.save(spot);
        return adminItemOf(id);
    }

    /**
     * 却下。理由必須(Bean Validation)。既にREJECTEDの場合は409。
     */
    @Transactional
    public AdminSpotResponse reject(Long id, String reason, SeichiUserPrincipal principal) {
        SacredSpot spot = sacredSpotRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        if (spot.getVerificationStatus() == VerificationStatus.REJECTED) {
            throw new ConflictException("既に却下済みです。");
        }
        spot.setVerificationStatus(VerificationStatus.REJECTED);
        spot.setVerifiedBy(principal.id());
        spot.setVerifiedAt(Instant.now());
        spot.setRejectionReason(reason.trim());
        sacredSpotRepository.save(spot);
        return adminItemOf(id);
    }

    /**
     * 管理者更新(状態維持)。
     */
    @Transactional
    public SpotDetailResponse update(Long id, SpotUpsertRequest request, SeichiUserPrincipal principal) {
        return spotCommandService.update(id, request, principal);
    }

    /**
     * 管理者削除(任意の投稿)。
     */
    @Transactional
    public void delete(Long id, SeichiUserPrincipal principal) {
        spotCommandService.delete(id, principal);
    }

    private AdminSpotResponse adminItemOf(Long id) {
        return sacredSpotRepository.findRowById(id)
                .map(spotMapper::toAdminItem)
                .orElseThrow(NotFoundException::new);
    }
}

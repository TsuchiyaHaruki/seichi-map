package com.seichi.backend.service;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.dto.response.SpotDetailResponse;
import com.seichi.backend.dto.response.SpotListItemResponse;
import com.seichi.backend.dto.response.SpotMapItemResponse;
import com.seichi.backend.entity.SacredSpot;
import com.seichi.backend.enums.Category;
import com.seichi.backend.enums.Role;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.mapper.SpotMapper;
import com.seichi.backend.repository.FavoriteRepository;
import com.seichi.backend.repository.LikeRepository;
import com.seichi.backend.repository.SacredSpotRepository;
import com.seichi.backend.repository.SpotSearchRow;
import com.seichi.backend.security.SeichiUserPrincipal;

@Service
public class SpotQueryService {

    private static final int MAP_LIMIT = 500;

    private final SacredSpotRepository sacredSpotRepository;
    private final LikeRepository likeRepository;
    private final FavoriteRepository favoriteRepository;
    private final SpotMapper spotMapper;

    public SpotQueryService(SacredSpotRepository sacredSpotRepository,
                            LikeRepository likeRepository,
                            FavoriteRepository favoriteRepository,
                            SpotMapper spotMapper) {
        this.sacredSpotRepository = sacredSpotRepository;
        this.likeRepository = likeRepository;
        this.favoriteRepository = favoriteRepository;
        this.spotMapper = spotMapper;
    }

    /**
     * 公開検索。VERIFIEDのみ対象。
     * likedOnly / favoritedOnly はログイン利用者本人の記録で絞り込む。未ログインなら結果は0件。
     */
    @Transactional(readOnly = true)
    public PageResponse<SpotListItemResponse> search(String keyword,
                                                     Category category,
                                                     String prefecture,
                                                     Role registrantRole,
                                                     boolean likedOnly,
                                                     boolean favoritedOnly,
                                                     SeichiUserPrincipal principal,
                                                     Pageable pageable) {
        if (requiresLoginFilter(likedOnly, favoritedOnly, principal)) {
            return PageResponse.of(Page.empty(pageable), spotMapper::toListItem);
        }
        Page<SpotSearchRow> rows = sacredSpotRepository.search(
                keywordPattern(keyword),
                category,
                normalize(prefecture),
                registrantRole,
                VerificationStatus.VERIFIED,
                filterUserId(likedOnly, principal),
                filterUserId(favoritedOnly, principal),
                pageable);
        return PageResponse.of(rows, spotMapper::toListItem);
    }

    /**
     * 地図用。VERIFIEDのみ・createdAt降順・最大500件。
     */
    @Transactional(readOnly = true)
    public List<SpotMapItemResponse> map(String keyword,
                                         Category category,
                                         String prefecture,
                                         Role registrantRole,
                                         boolean likedOnly,
                                         boolean favoritedOnly,
                                         SeichiUserPrincipal principal) {
        if (requiresLoginFilter(likedOnly, favoritedOnly, principal)) {
            return List.of();
        }
        return sacredSpotRepository.searchForMap(
                        keywordPattern(keyword),
                        category,
                        normalize(prefecture),
                        registrantRole,
                        filterUserId(likedOnly, principal),
                        filterUserId(favoritedOnly, principal),
                        PageRequest.of(0, MAP_LIMIT))
                .stream()
                .map(spotMapper::toMapItem)
                .toList();
    }

    /** 未ログインでいいね・お気に入り絞り込みが指定された場合はtrue(結果を空にする) */
    private boolean requiresLoginFilter(boolean likedOnly,
                                        boolean favoritedOnly,
                                        SeichiUserPrincipal principal) {
        return (likedOnly || favoritedOnly) && principal == null;
    }

    /** 絞り込みが有効なときだけ利用者IDを返す(無効ならnull=条件なし) */
    private Long filterUserId(boolean enabled, SeichiUserPrincipal principal) {
        if (!enabled || principal == null) {
            return null;
        }
        return principal.id();
    }

    /**
     * 詳細。VERIFIEDは誰でも閲覧可。PENDING/REJECTEDは投稿者本人かADMINのみ(それ以外は404)。
     */
    @Transactional(readOnly = true)
    public SpotDetailResponse detail(Long id, SeichiUserPrincipal principal) {
        SpotSearchRow row = sacredSpotRepository.findRowById(id)
                .orElseThrow(NotFoundException::new);
        SacredSpot spot = row.spot();
        if (spot.getVerificationStatus() != VerificationStatus.VERIFIED
                && !canViewNonVerified(spot, principal)) {
            // 非公開の聖地は存在自体を漏らさない
            throw new NotFoundException();
        }
        boolean liked = false;
        boolean favorited = false;
        if (principal != null) {
            liked = likeRepository.existsByUserIdAndSpotId(principal.id(), id);
            favorited = favoriteRepository.existsByUserIdAndSpotId(principal.id(), id);
        }
        return spotMapper.toDetail(row, liked, favorited);
    }

    private boolean canViewNonVerified(SacredSpot spot, SeichiUserPrincipal principal) {
        if (principal == null) {
            return false;
        }
        return Role.ADMIN.name().equals(principal.role())
                || spot.getCreatedBy().equals(principal.id());
    }

    private String keywordPattern(String keyword) {
        String normalized = normalize(keyword);
        if (normalized == null) {
            return null;
        }
        return "%" + normalized.toLowerCase(Locale.ROOT) + "%";
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

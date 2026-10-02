package com.seichi.backend.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.dto.response.MyPostResponse;
import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.dto.response.SpotListItemResponse;
import com.seichi.backend.mapper.SpotMapper;
import com.seichi.backend.repository.FavoriteRepository;
import com.seichi.backend.repository.LikeRepository;
import com.seichi.backend.repository.SacredSpotRepository;

@Service
public class MyPageService {

    private final SacredSpotRepository sacredSpotRepository;
    private final LikeRepository likeRepository;
    private final FavoriteRepository favoriteRepository;
    private final SpotMapper spotMapper;

    public MyPageService(SacredSpotRepository sacredSpotRepository,
                         LikeRepository likeRepository,
                         FavoriteRepository favoriteRepository,
                         SpotMapper spotMapper) {
        this.sacredSpotRepository = sacredSpotRepository;
        this.likeRepository = likeRepository;
        this.favoriteRepository = favoriteRepository;
        this.spotMapper = spotMapper;
    }

    /**
     * 自分の投稿一覧(状態・却下理由を含む)。
     */
    @Transactional(readOnly = true)
    public PageResponse<MyPostResponse> posts(Long userId, Pageable pageable) {
        return PageResponse.of(
                sacredSpotRepository.findRowsByCreatedBy(userId, pageable),
                spotMapper::toMyPost);
    }

    /**
     * 自分がいいねした聖地一覧(VERIFIEDのみ)。
     */
    @Transactional(readOnly = true)
    public PageResponse<SpotListItemResponse> likes(Long userId, Pageable pageable) {
        return PageResponse.of(
                likeRepository.findSpotRowsByUserId(userId, pageable),
                spotMapper::toListItem);
    }

    /**
     * 自分のお気に入り聖地一覧(VERIFIEDのみ)。
     */
    @Transactional(readOnly = true)
    public PageResponse<SpotListItemResponse> favorites(Long userId, Pageable pageable) {
        return PageResponse.of(
                favoriteRepository.findSpotRowsByUserId(userId, pageable),
                spotMapper::toListItem);
    }
}

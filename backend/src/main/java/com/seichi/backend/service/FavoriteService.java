package com.seichi.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.entity.Favorite;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.exception.ConflictException;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.repository.FavoriteRepository;
import com.seichi.backend.repository.SacredSpotRepository;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final SacredSpotRepository sacredSpotRepository;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           SacredSpotRepository sacredSpotRepository) {
        this.favoriteRepository = favoriteRepository;
        this.sacredSpotRepository = sacredSpotRepository;
    }

    /**
     * お気に入り登録。対象がVERIFIED以外・存在しない場合は404、重複は409。
     */
    @Transactional
    public void add(Long spotId, Long userId) {
        sacredSpotRepository.findById(spotId)
                .filter(spot -> spot.getVerificationStatus() == VerificationStatus.VERIFIED)
                .orElseThrow(NotFoundException::new);
        if (favoriteRepository.existsByUserIdAndSpotId(userId, spotId)) {
            throw new ConflictException("既にお気に入りに登録しています。");
        }
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setSpotId(spotId);
        favoriteRepository.save(favorite);
    }

    /**
     * お気に入り解除。未登録の場合は404。
     */
    @Transactional
    public void remove(Long spotId, Long userId) {
        if (favoriteRepository.deleteByUserIdAndSpotId(userId, spotId) == 0) {
            throw new NotFoundException("お気に入りが見つかりません。");
        }
    }
}

package com.seichi.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.entity.Like;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.exception.ConflictException;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.repository.LikeRepository;
import com.seichi.backend.repository.SacredSpotRepository;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final SacredSpotRepository sacredSpotRepository;

    public LikeService(LikeRepository likeRepository,
                       SacredSpotRepository sacredSpotRepository) {
        this.likeRepository = likeRepository;
        this.sacredSpotRepository = sacredSpotRepository;
    }

    /**
     * いいね登録。対象がVERIFIED以外・存在しない場合は404、重複は409。
     */
    @Transactional
    public void add(Long spotId, Long userId) {
        sacredSpotRepository.findById(spotId)
                .filter(spot -> spot.getVerificationStatus() == VerificationStatus.VERIFIED)
                .orElseThrow(NotFoundException::new);
        if (likeRepository.existsByUserIdAndSpotId(userId, spotId)) {
            throw new ConflictException("既にいいねしています。");
        }
        Like like = new Like();
        like.setUserId(userId);
        like.setSpotId(spotId);
        likeRepository.save(like);
    }

    /**
     * いいね解除。未登録の場合は404。
     */
    @Transactional
    public void remove(Long spotId, Long userId) {
        if (likeRepository.deleteByUserIdAndSpotId(userId, spotId) == 0) {
            throw new NotFoundException("いいねが見つかりません。");
        }
    }
}

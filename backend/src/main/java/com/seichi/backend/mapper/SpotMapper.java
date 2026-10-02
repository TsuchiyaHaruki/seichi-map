package com.seichi.backend.mapper;

import com.seichi.backend.dto.response.AdminSpotResponse;
import com.seichi.backend.dto.response.MyPostResponse;
import com.seichi.backend.dto.response.SpotDetailResponse;
import com.seichi.backend.dto.response.SpotListItemResponse;
import com.seichi.backend.dto.response.SpotMapItemResponse;
import com.seichi.backend.entity.SacredSpot;
import com.seichi.backend.enums.Role;
import com.seichi.backend.enums.VerificationStatus;
import com.seichi.backend.repository.SpotSearchRow;
import org.springframework.stereotype.Component;

@Component
public class SpotMapper {

    /**
     * 信頼性ラベルはDBへ保存せず、投稿者ロールと確認状態から生成する。
     */
    public String trustLabel(Role registrantRole, VerificationStatus status) {
        return switch (status) {
            case PENDING -> "確認待ち";
            case REJECTED -> "却下";
            case VERIFIED -> registrantRole == Role.ADMIN ? "管理者登録" : "管理者確認済み";
        };
    }

    public SpotListItemResponse toListItem(SpotSearchRow row) {
        SacredSpot spot = row.spot();
        return new SpotListItemResponse(
                spot.getId(),
                spot.getWorkName(),
                spot.getSpotName(),
                spot.getCategory(),
                spot.getAddress(),
                spot.getLatitude().doubleValue(),
                spot.getLongitude().doubleValue(),
                trustLabel(row.registrantRole(), spot.getVerificationStatus()),
                likeCount(row)
        );
    }

    public SpotMapItemResponse toMapItem(SpotSearchRow row) {
        SacredSpot spot = row.spot();
        return new SpotMapItemResponse(
                spot.getId(),
                spot.getWorkName(),
                spot.getSpotName(),
                spot.getLatitude().doubleValue(),
                spot.getLongitude().doubleValue(),
                trustLabel(row.registrantRole(), spot.getVerificationStatus())
        );
    }

    public SpotDetailResponse toDetail(SpotSearchRow row, boolean likedByCurrentUser, boolean favoritedByCurrentUser) {
        SacredSpot spot = row.spot();
        return new SpotDetailResponse(
                spot.getId(),
                spot.getWorkName(),
                spot.getSpotName(),
                spot.getCategory(),
                spot.getAddress(),
                spot.getPrefecture(),
                spot.getLatitude().doubleValue(),
                spot.getLongitude().doubleValue(),
                spot.getSceneDescription(),
                spot.getDescription(),
                spot.getSourceUrl(),
                spot.getSourceDescription(),
                spot.getGooglePlaceId(),
                row.registrantName(),
                trustLabel(row.registrantRole(), spot.getVerificationStatus()),
                likeCount(row),
                likedByCurrentUser,
                favoritedByCurrentUser,
                spot.getCreatedAt(),
                spot.getUpdatedAt()
        );
    }

    public MyPostResponse toMyPost(SpotSearchRow row) {
        SacredSpot spot = row.spot();
        return new MyPostResponse(
                spot.getId(),
                spot.getWorkName(),
                spot.getSpotName(),
                spot.getCategory(),
                spot.getAddress(),
                spot.getLatitude().doubleValue(),
                spot.getLongitude().doubleValue(),
                spot.getVerificationStatus(),
                spot.getRejectionReason(),
                trustLabel(row.registrantRole(), spot.getVerificationStatus()),
                likeCount(row),
                spot.getCreatedAt(),
                spot.getUpdatedAt()
        );
    }

    public AdminSpotResponse toAdminItem(SpotSearchRow row) {
        SacredSpot spot = row.spot();
        return new AdminSpotResponse(
                spot.getId(),
                spot.getWorkName(),
                spot.getSpotName(),
                spot.getCategory(),
                spot.getAddress(),
                spot.getVerificationStatus(),
                trustLabel(row.registrantRole(), spot.getVerificationStatus()),
                row.registrantName(),
                spot.getRejectionReason(),
                spot.getCreatedAt(),
                spot.getUpdatedAt()
        );
    }

    private long likeCount(SpotSearchRow row) {
        return row.likeCount() == null ? 0L : row.likeCount();
    }
}

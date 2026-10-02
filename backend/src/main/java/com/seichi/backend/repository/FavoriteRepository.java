package com.seichi.backend.repository;

import com.seichi.backend.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByUserIdAndSpotId(Long userId, Long spotId);

    long countBySpotId(Long spotId);

    Optional<Favorite> findByUserIdAndSpotId(Long userId, Long spotId);

    long deleteByUserIdAndSpotId(Long userId, Long spotId);

    /**
     * お気に入り一覧(マイページ用)。VERIFIEDのみ・お気に入り登録日時の降順。
     */
    @Query(value = """
            select new com.seichi.backend.repository.SpotSearchRow(
                s,
                u.userName,
                u.role,
                (select count(l.id) from Like l where l.spotId = s.id)
            )
            from Favorite f
            join SacredSpot s on s.id = f.spotId
            join User u on u.id = s.createdBy
            where f.userId = :userId
              and s.verificationStatus = com.seichi.backend.enums.VerificationStatus.VERIFIED
            order by f.createdAt desc
            """,
            countQuery = """
            select count(f)
            from Favorite f
            join SacredSpot s on s.id = f.spotId
            where f.userId = :userId
              and s.verificationStatus = com.seichi.backend.enums.VerificationStatus.VERIFIED
            """)
    Page<SpotSearchRow> findSpotRowsByUserId(@Param("userId") Long userId, Pageable pageable);
}

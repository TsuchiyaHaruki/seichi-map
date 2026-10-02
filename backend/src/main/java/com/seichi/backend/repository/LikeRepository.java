package com.seichi.backend.repository;

import com.seichi.backend.entity.Like;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserIdAndSpotId(Long userId, Long spotId);

    long countBySpotId(Long spotId);

    Optional<Like> findByUserIdAndSpotId(Long userId, Long spotId);

    long deleteByUserIdAndSpotId(Long userId, Long spotId);

    /**
     * いいね一覧(マイページ用)。VERIFIEDのみ・いいね登録日時の降順。
     */
    @Query(value = """
            select new com.seichi.backend.repository.SpotSearchRow(
                s,
                u.userName,
                u.role,
                (select count(l.id) from Like l where l.spotId = s.id)
            )
            from Like lk
            join SacredSpot s on s.id = lk.spotId
            join User u on u.id = s.createdBy
            where lk.userId = :userId
              and s.verificationStatus = com.seichi.backend.enums.VerificationStatus.VERIFIED
            order by lk.createdAt desc
            """,
            countQuery = """
            select count(lk)
            from Like lk
            join SacredSpot s on s.id = lk.spotId
            where lk.userId = :userId
              and s.verificationStatus = com.seichi.backend.enums.VerificationStatus.VERIFIED
            """)
    Page<SpotSearchRow> findSpotRowsByUserId(@Param("userId") Long userId, Pageable pageable);
}

package com.seichi.backend.repository;

import com.seichi.backend.entity.SacredSpot;
import com.seichi.backend.enums.Category;
import com.seichi.backend.enums.Role;
import com.seichi.backend.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SacredSpotRepository extends JpaRepository<SacredSpot, Long> {

    /**
     * 検索(一覧・管理者一覧共用)。
     * keywordは呼び出し側で小文字化し前後に%を付けたパターン(例 "%clannad%")を渡す。未指定はnull。
     * category / prefecture / registrantRole / status も未指定はnull。
     * likedBy / favoritedBy は指定した利用者がいいね・お気に入りした聖地だけに絞る。未指定はnull。
     */
    @Query(value = """
            select new com.seichi.backend.repository.SpotSearchRow(
                s,
                u.userName,
                u.role,
                (select count(l.id) from Like l where l.spotId = s.id)
            )
            from SacredSpot s
            join User u on u.id = s.createdBy
            where (:keyword is null
                   or lower(s.workName) like :keyword
                   or lower(s.spotName) like :keyword
                   or lower(s.address) like :keyword
                   or lower(s.sceneDescription) like :keyword)
              and (:category is null or s.category = :category)
              and (:prefecture is null or s.prefecture = :prefecture)
              and (:registrantRole is null or u.role = :registrantRole)
              and (:status is null or s.verificationStatus = :status)
              and (:likedBy is null
                   or exists (select 1 from Like ml where ml.spotId = s.id and ml.userId = :likedBy))
              and (:favoritedBy is null
                   or exists (select 1 from Favorite mf where mf.spotId = s.id and mf.userId = :favoritedBy))
            """,
            countQuery = """
            select count(s)
            from SacredSpot s
            join User u on u.id = s.createdBy
            where (:keyword is null
                   or lower(s.workName) like :keyword
                   or lower(s.spotName) like :keyword
                   or lower(s.address) like :keyword
                   or lower(s.sceneDescription) like :keyword)
              and (:category is null or s.category = :category)
              and (:prefecture is null or s.prefecture = :prefecture)
              and (:registrantRole is null or u.role = :registrantRole)
              and (:status is null or s.verificationStatus = :status)
              and (:likedBy is null
                   or exists (select 1 from Like ml where ml.spotId = s.id and ml.userId = :likedBy))
              and (:favoritedBy is null
                   or exists (select 1 from Favorite mf where mf.spotId = s.id and mf.userId = :favoritedBy))
            """)
    Page<SpotSearchRow> search(
            @Param("keyword") String keyword,
            @Param("category") Category category,
            @Param("prefecture") String prefecture,
            @Param("registrantRole") Role registrantRole,
            @Param("status") VerificationStatus status,
            @Param("likedBy") Long likedBy,
            @Param("favoritedBy") Long favoritedBy,
            Pageable pageable);

    /**
     * 地図用。VERIFIEDのみ・createdAt降順。上限は呼び出し側でPageRequest.of(0, 500)を渡す。
     */
    @Query("""
            select new com.seichi.backend.repository.SpotSearchRow(
                s,
                u.userName,
                u.role,
                (select count(l.id) from Like l where l.spotId = s.id)
            )
            from SacredSpot s
            join User u on u.id = s.createdBy
            where s.verificationStatus = com.seichi.backend.enums.VerificationStatus.VERIFIED
              and (:keyword is null
                   or lower(s.workName) like :keyword
                   or lower(s.spotName) like :keyword
                   or lower(s.address) like :keyword
                   or lower(s.sceneDescription) like :keyword)
              and (:category is null or s.category = :category)
              and (:prefecture is null or s.prefecture = :prefecture)
              and (:registrantRole is null or u.role = :registrantRole)
              and (:likedBy is null
                   or exists (select 1 from Like ml where ml.spotId = s.id and ml.userId = :likedBy))
              and (:favoritedBy is null
                   or exists (select 1 from Favorite mf where mf.spotId = s.id and mf.userId = :favoritedBy))
            order by s.createdAt desc
            """)
    List<SpotSearchRow> searchForMap(
            @Param("keyword") String keyword,
            @Param("category") Category category,
            @Param("prefecture") String prefecture,
            @Param("registrantRole") Role registrantRole,
            @Param("likedBy") Long likedBy,
            @Param("favoritedBy") Long favoritedBy,
            Pageable pageable);

    /**
     * マイページ用(自分の投稿一覧)。
     */
    @Query(value = """
            select new com.seichi.backend.repository.SpotSearchRow(
                s,
                u.userName,
                u.role,
                (select count(l.id) from Like l where l.spotId = s.id)
            )
            from SacredSpot s
            join User u on u.id = s.createdBy
            where s.createdBy = :createdBy
            order by s.createdAt desc
            """,
            countQuery = """
            select count(s)
            from SacredSpot s
            where s.createdBy = :createdBy
            """)
    Page<SpotSearchRow> findRowsByCreatedBy(@Param("createdBy") Long createdBy, Pageable pageable);

    /**
     * 詳細・単票用(likeCount・投稿者情報を1クエリで取得)。
     */
    @Query("""
            select new com.seichi.backend.repository.SpotSearchRow(
                s,
                u.userName,
                u.role,
                (select count(l.id) from Like l where l.spotId = s.id)
            )
            from SacredSpot s
            join User u on u.id = s.createdBy
            where s.id = :id
            """)
    Optional<SpotSearchRow> findRowById(@Param("id") Long id);
}

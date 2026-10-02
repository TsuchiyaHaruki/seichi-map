package com.seichi.backend.repository;

import com.seichi.backend.entity.SacredSpot;
import com.seichi.backend.enums.Role;

/**
 * 検索用projection。likeCount・registrantName・投稿者ロールを1クエリで取得する(N+1禁止)。
 */
public record SpotSearchRow(
        SacredSpot spot,
        String registrantName,
        Role registrantRole,
        Long likeCount
) {
}

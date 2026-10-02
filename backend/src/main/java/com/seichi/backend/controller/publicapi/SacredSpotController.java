package com.seichi.backend.controller.publicapi;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.seichi.backend.controller.support.PageRequests;
import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.dto.response.SpotDetailResponse;
import com.seichi.backend.dto.response.SpotListItemResponse;
import com.seichi.backend.dto.response.SpotMapItemResponse;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.SpotQueryService;

/**
 * 公開API(VERIFIEDのみ)。詳細のみ、投稿者本人・ADMINは非公開状態も閲覧できる。
 */
@RestController
@RequestMapping("/api/v1/sacred-spots")
public class SacredSpotController {

    private final SpotQueryService spotQueryService;

    public SacredSpotController(SpotQueryService spotQueryService) {
        this.spotQueryService = spotQueryService;
    }

    @GetMapping
    public PageResponse<SpotListItemResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String prefecture,
            @RequestParam(required = false) String registrantType,
            @RequestParam(required = false, defaultValue = "false") boolean likedOnly,
            @RequestParam(required = false, defaultValue = "false") boolean favoritedOnly,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal SeichiUserPrincipal principal)
            throws MethodArgumentNotValidException {
        return spotQueryService.search(
                keyword,
                PageRequests.parseCategory(category),
                prefecture,
                PageRequests.parseRegistrantType(registrantType),
                likedOnly,
                favoritedOnly,
                principal,
                PageRequests.of(page, size, sort));
    }

    @GetMapping("/map")
    public List<SpotMapItemResponse> map(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String prefecture,
            @RequestParam(required = false) String registrantType,
            @RequestParam(required = false, defaultValue = "false") boolean likedOnly,
            @RequestParam(required = false, defaultValue = "false") boolean favoritedOnly,
            @AuthenticationPrincipal SeichiUserPrincipal principal)
            throws MethodArgumentNotValidException {
        return spotQueryService.map(
                keyword,
                PageRequests.parseCategory(category),
                prefecture,
                PageRequests.parseRegistrantType(registrantType),
                likedOnly,
                favoritedOnly,
                principal);
    }

    @GetMapping("/{id}")
    public SpotDetailResponse detail(@PathVariable Long id,
                                     @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return spotQueryService.detail(id, principal);
    }
}

package com.seichi.backend.controller.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.seichi.backend.controller.support.PageRequests;
import com.seichi.backend.dto.request.RejectRequest;
import com.seichi.backend.dto.request.SpotUpsertRequest;
import com.seichi.backend.dto.response.AdminSpotResponse;
import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.dto.response.SpotDetailResponse;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.AdminSpotService;

import jakarta.validation.Valid;

/**
 * 管理者向け聖地API(すべてADMIN権限必須。認可はSecurityConfigで /api/v1/admin/** に付与)。
 */
@RestController
@RequestMapping("/api/v1/admin/sacred-spots")
public class AdminSacredSpotController {

    private final AdminSpotService adminSpotService;

    public AdminSacredSpotController(AdminSpotService adminSpotService) {
        this.adminSpotService = adminSpotService;
    }

    @GetMapping
    public PageResponse<AdminSpotResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) throws MethodArgumentNotValidException {
        Pageable pageable = PageRequests.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return adminSpotService.list(PageRequests.parseStatus(status), pageable);
    }

    @GetMapping("/pending")
    public PageResponse<AdminSpotResponse> pending(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        Pageable pageable = PageRequests.of(page, size,
                Sort.by(Sort.Direction.ASC, "createdAt"));
        return adminSpotService.pending(pageable);
    }

    @GetMapping("/{id}")
    public SpotDetailResponse detail(@PathVariable Long id,
                                     @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return adminSpotService.detail(id, principal);
    }

    @PatchMapping("/{id}/verify")
    public AdminSpotResponse verify(@PathVariable Long id,
                                    @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return adminSpotService.verify(id, principal);
    }

    @PatchMapping("/{id}/reject")
    public AdminSpotResponse reject(@PathVariable Long id,
                                    @Valid @RequestBody RejectRequest request,
                                    @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return adminSpotService.reject(id, request.reason(), principal);
    }

    @PutMapping("/{id}")
    public SpotDetailResponse update(@PathVariable Long id,
                                     @Valid @RequestBody SpotUpsertRequest request,
                                     @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return adminSpotService.update(id, request, principal);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal SeichiUserPrincipal principal) {
        adminSpotService.delete(id, principal);
    }
}

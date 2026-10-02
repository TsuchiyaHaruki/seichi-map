package com.seichi.backend.controller.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.seichi.backend.controller.support.PageRequests;
import com.seichi.backend.dto.request.UserEnabledRequest;
import com.seichi.backend.dto.response.AdminUserResponse;
import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.service.AdminUserService;

import jakarta.validation.Valid;

/**
 * 管理者向けユーザーAPI(すべてADMIN権限必須)。
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public PageResponse<AdminUserResponse> list(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        Pageable pageable = PageRequests.of(page, size,
                Sort.by(Sort.Direction.ASC, "id"));
        return adminUserService.list(pageable);
    }

    @PostMapping("/{id}/unlock")
    public AdminUserResponse unlock(@PathVariable Long id) {
        return adminUserService.unlock(id);
    }

    @PatchMapping("/{id}/enabled")
    public AdminUserResponse updateEnabled(@PathVariable Long id,
                                           @Valid @RequestBody UserEnabledRequest request) {
        return adminUserService.updateEnabled(id, request.enabled());
    }
}

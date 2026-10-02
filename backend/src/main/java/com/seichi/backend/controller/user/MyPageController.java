package com.seichi.backend.controller.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.seichi.backend.controller.support.PageRequests;
import com.seichi.backend.dto.response.MyPostResponse;
import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.dto.response.SpotListItemResponse;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.MyPageService;

@RestController
@RequestMapping("/api/v1/users/me")
public class MyPageController {

    private final MyPageService myPageService;

    public MyPageController(MyPageService myPageService) {
        this.myPageService = myPageService;
    }

    @GetMapping("/posts")
    public PageResponse<MyPostResponse> posts(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return myPageService.posts(principal.id(), PageRequests.of(page, size));
    }

    @GetMapping("/likes")
    public PageResponse<SpotListItemResponse> likes(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return myPageService.likes(principal.id(), PageRequests.of(page, size));
    }

    @GetMapping("/favorites")
    public PageResponse<SpotListItemResponse> favorites(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return myPageService.favorites(principal.id(), PageRequests.of(page, size));
    }
}

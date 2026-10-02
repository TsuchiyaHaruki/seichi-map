package com.seichi.backend.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.LikeService;

@RestController
@RequestMapping("/api/v1/sacred-spots/{id}/likes")
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void add(@PathVariable Long id,
                    @AuthenticationPrincipal SeichiUserPrincipal principal) {
        likeService.add(id, principal.id());
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long id,
                       @AuthenticationPrincipal SeichiUserPrincipal principal) {
        likeService.remove(id, principal.id());
    }
}

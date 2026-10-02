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
import com.seichi.backend.service.FavoriteService;

@RestController
@RequestMapping("/api/v1/sacred-spots/{id}/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void add(@PathVariable Long id,
                    @AuthenticationPrincipal SeichiUserPrincipal principal) {
        favoriteService.add(id, principal.id());
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long id,
                       @AuthenticationPrincipal SeichiUserPrincipal principal) {
        favoriteService.remove(id, principal.id());
    }
}

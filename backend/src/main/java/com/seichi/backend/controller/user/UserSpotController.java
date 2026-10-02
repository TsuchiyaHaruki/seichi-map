package com.seichi.backend.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.seichi.backend.dto.request.SpotUpsertRequest;
import com.seichi.backend.dto.response.SpotDetailResponse;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.SpotCommandService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/sacred-spots")
public class UserSpotController {

    private final SpotCommandService spotCommandService;

    public UserSpotController(SpotCommandService spotCommandService) {
        this.spotCommandService = spotCommandService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpotDetailResponse create(@Valid @RequestBody SpotUpsertRequest request,
                                     @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return spotCommandService.create(request, principal);
    }

    @PutMapping("/{id}")
    public SpotDetailResponse update(@PathVariable Long id,
                                     @Valid @RequestBody SpotUpsertRequest request,
                                     @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return spotCommandService.update(id, request, principal);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal SeichiUserPrincipal principal) {
        spotCommandService.delete(id, principal);
    }
}

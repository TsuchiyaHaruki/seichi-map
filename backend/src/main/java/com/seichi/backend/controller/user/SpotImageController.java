package com.seichi.backend.controller.user;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.seichi.backend.dto.response.SpotImageResponse;
import com.seichi.backend.security.SeichiUserPrincipal;
import com.seichi.backend.service.SpotImageService;

/**
 * 聖地画像API。参照は聖地詳細と同じ範囲、登録と削除は投稿者本人とADMINのみ。
 */
@RestController
@RequestMapping("/api/v1/sacred-spots/{spotId}/images")
public class SpotImageController {

    private final SpotImageService spotImageService;

    public SpotImageController(SpotImageService spotImageService) {
        this.spotImageService = spotImageService;
    }

    @GetMapping
    public List<SpotImageResponse> list(@PathVariable Long spotId,
                                        @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return spotImageService.list(spotId, principal);
    }

    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> content(@PathVariable Long spotId,
                                          @PathVariable Long imageId,
                                          @AuthenticationPrincipal SeichiUserPrincipal principal) {
        SpotImageService.ImageContent content = spotImageService.load(spotId, imageId, principal);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(content.contentType()))
                .cacheControl(CacheControl.noCache())
                .body(content.bytes());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpotImageResponse upload(@PathVariable Long spotId,
                                    @RequestParam("file") MultipartFile file,
                                    @AuthenticationPrincipal SeichiUserPrincipal principal) {
        return spotImageService.upload(spotId, file, principal);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long spotId,
                       @PathVariable Long imageId,
                       @AuthenticationPrincipal SeichiUserPrincipal principal) {
        spotImageService.delete(spotId, imageId, principal);
    }
}

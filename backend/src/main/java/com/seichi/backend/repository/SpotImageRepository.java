package com.seichi.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.seichi.backend.entity.SpotImage;

public interface SpotImageRepository extends JpaRepository<SpotImage, Long> {

    List<SpotImage> findBySpotIdOrderBySortOrderAscIdAsc(Long spotId);

    Optional<SpotImage> findByIdAndSpotId(Long id, Long spotId);

    long countBySpotId(Long spotId);
}

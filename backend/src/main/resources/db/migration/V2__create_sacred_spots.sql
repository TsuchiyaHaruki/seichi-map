CREATE TABLE sacred_spots (
    id BIGSERIAL PRIMARY KEY,
    work_name VARCHAR(100) NOT NULL,
    spot_name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    prefecture VARCHAR(50),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    scene_description VARCHAR(500),
    description TEXT,
    source_url VARCHAR(500),
    source_description VARCHAR(500),
    google_place_id VARCHAR(255),
    created_by BIGINT NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by BIGINT,
    verified_at TIMESTAMPTZ,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sacred_spots_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_sacred_spots_verified_by
        FOREIGN KEY (verified_by) REFERENCES users(id),
    CONSTRAINT chk_sacred_spots_category
        CHECK (category IN ('GAME', 'ANIME', 'GAME_AND_ANIME')),
    CONSTRAINT chk_sacred_spots_status
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT chk_sacred_spots_latitude
        CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_sacred_spots_longitude
        CHECK (longitude BETWEEN -180 AND 180)
);

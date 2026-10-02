CREATE TABLE spot_images (
    id BIGSERIAL PRIMARY KEY,
    spot_id BIGINT NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_spot_images_spot
        FOREIGN KEY (spot_id) REFERENCES sacred_spots(id) ON DELETE CASCADE,
    CONSTRAINT fk_spot_images_user
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_spot_images_stored_name
        UNIQUE (stored_name)
);

CREATE INDEX idx_spot_images_spot ON spot_images (spot_id, sort_order, id);

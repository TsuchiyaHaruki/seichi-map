CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    spot_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_spot
        FOREIGN KEY (spot_id) REFERENCES sacred_spots(id) ON DELETE CASCADE,
    CONSTRAINT uq_favorites_user_spot
        UNIQUE (user_id, spot_id)
);

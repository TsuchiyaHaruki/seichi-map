CREATE INDEX idx_sacred_spots_status
    ON sacred_spots (verification_status);

CREATE INDEX idx_sacred_spots_created_by
    ON sacred_spots (created_by);

CREATE INDEX idx_sacred_spots_created_at
    ON sacred_spots (created_at DESC);

CREATE INDEX idx_sacred_spots_work_name
    ON sacred_spots (work_name);

CREATE INDEX idx_sacred_spots_spot_name
    ON sacred_spots (spot_name);

CREATE INDEX idx_likes_spot_id
    ON likes (spot_id);

CREATE INDEX idx_favorites_user_id
    ON favorites (user_id);

CREATE TABLE refresh_tokens
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    token VARCHAR(1000) NOT NULL UNIQUE,

    user_id UUID NOT NULL,

    expires_at TIMESTAMP NOT NULL,

    revoked BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

 
CREATE TABLE IF NOT EXISTS users (
    id                  CHAR(36)        NOT NULL DEFAULT (UUID()),
    email               VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    first_name          VARCHAR(100)    NULL,
    last_name           VARCHAR(100)    NULL,
    status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
    last_login_at       DATETIME(3)     NULL,
    avatar_url          TEXT            NULL,
    timezone            VARCHAR(64)     NOT NULL DEFAULT 'UTC',
    preferences         JSON            NULL,
    created_at          DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3)     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
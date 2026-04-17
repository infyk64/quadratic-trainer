-- ============================================
-- Начальная схема: users, attempts
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id           SERIAL PRIMARY KEY,
    username     VARCHAR(100) NOT NULL UNIQUE,
    role         VARCHAR(20)  NOT NULL DEFAULT 'student',
    password_hash VARCHAR(255),
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attempts (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_correct    BOOLEAN NOT NULL,
    question_type VARCHAR(20),
    question_data JSONB,
    attempted_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
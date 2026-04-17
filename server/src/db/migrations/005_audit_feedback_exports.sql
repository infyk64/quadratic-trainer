-- ============================================
-- 005_audit_feedback_exports.sql
-- Аудит действий + обратная связь студентов
-- ============================================

CREATE TABLE IF NOT EXISTS action_logs (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username     VARCHAR(255),
    user_role    VARCHAR(20),
    action_type  VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(100),
    entity_id    INTEGER,
    details      TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON action_logs(user_id);

CREATE TABLE IF NOT EXISTS feedback_reports (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject       VARCHAR(255) NOT NULL,
    message       TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at    TIMESTAMP DEFAULT NOW(),
    resolved_at   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_reports_created_at ON feedback_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_student_id ON feedback_reports(student_id);

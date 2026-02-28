-- ============================================
-- 002_roles_tests_open_answers.sql
-- Миграция: роли, тесты, открытые ответы
-- ============================================

-- ==========================================
-- 1. ОБНОВЛЕНИЕ ТАБЛИЦЫ USERS
-- ==========================================

-- Добавляем хэш пароля (bcrypt)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Добавляем роль (если нет)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student';
  END IF;
END $$;

-- ==========================================
-- 2. ТАБЛИЦА ГРУПП (если нет)
-- ==========================================

CREATE TABLE IF NOT EXISTS groups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    id          SERIAL PRIMARY KEY,
    group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    student_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, student_id)
);

-- ==========================================
-- 3. ТЕОРЕТИЧЕСКИЕ МАТЕРИАЛЫ (если нет)
-- ==========================================

CREATE TABLE IF NOT EXISTS theory_materials (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 4. ТЕОРЕТИЧЕСКИЕ ВОПРОСЫ (если нет)
-- ==========================================

CREATE TABLE IF NOT EXISTS theory_questions (
    id           SERIAL PRIMARY KEY,
    question     TEXT NOT NULL,
    answer_mask  TEXT NOT NULL,
    answer_type  VARCHAR(20) NOT NULL DEFAULT 'exact',
    hint         TEXT,
    created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 5. СИСТЕМА ТЕСТОВ
-- ==========================================

-- Тест (создаёт преподаватель)
CREATE TABLE IF NOT EXISTS tests (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ограничения
    time_limit       INTEGER,          -- лимит времени в секундах (NULL = без лимита)
    max_errors       INTEGER,          -- макс ошибок до завершения (NULL = без лимита)
    
    -- Шкала оценивания (процент правильных → оценка)
    grade_excellent  INTEGER DEFAULT 90,  -- % для "5"
    grade_good       INTEGER DEFAULT 75,  -- % для "4"
    grade_satisf     INTEGER DEFAULT 60,  -- % для "3"
    -- ниже grade_satisf → "2"
    
    is_published     BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- Вопрос в тесте
CREATE TABLE IF NOT EXISTS test_questions (
    id              SERIAL PRIMARY KEY,
    test_id         INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    question_type   VARCHAR(20) NOT NULL,   -- 'equation' | 'theory' | 'open'
    
    -- Для equation: коэффициенты уравнения
    eq_a            INTEGER,
    eq_b            INTEGER,
    eq_c            INTEGER,
    
    -- Для theory/open: текст вопроса
    question_text   TEXT,
    
    -- Правильный ответ
    answer_mask     TEXT NOT NULL,
    answer_type     VARCHAR(20) NOT NULL DEFAULT 'exact',  -- 'exact' | 'keywords' | 'regex' | 'numeric'
    
    hint            TEXT,
    sort_order      INTEGER DEFAULT 0,
    points          INTEGER DEFAULT 1,
    
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Назначение теста группе
CREATE TABLE IF NOT EXISTS test_assignments (
    id          SERIAL PRIMARY KEY,
    test_id     INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    deadline    TIMESTAMP,
    UNIQUE(test_id, group_id)
);

-- Сессия прохождения теста
CREATE TABLE IF NOT EXISTS test_sessions (
    id               SERIAL PRIMARY KEY,
    test_id          INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    student_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    started_at       TIMESTAMP DEFAULT NOW(),
    finished_at      TIMESTAMP,
    
    total_questions  INTEGER DEFAULT 0,
    correct_answers  INTEGER DEFAULT 0,
    errors_count     INTEGER DEFAULT 0,
    score_percent    NUMERIC(5,2),
    grade            INTEGER,            -- 2, 3, 4 или 5
    
    status           VARCHAR(20) DEFAULT 'in_progress'
    -- 'in_progress' | 'completed' | 'failed_time' | 'failed_errors'
);

-- Ответы студента в тесте
CREATE TABLE IF NOT EXISTS test_answers (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id     INTEGER REFERENCES test_questions(id) ON DELETE CASCADE,
    student_answer  TEXT,
    is_correct      BOOLEAN,
    answered_at     TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 6. ОБНОВЛЕНИЕ ATTEMPTS (привязка к вопросу)
-- ==========================================

ALTER TABLE attempts ADD COLUMN IF NOT EXISTS question_type VARCHAR(20);
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS question_data JSONB;

-- ==========================================
-- 7. СОЗДАНИЕ ДЕФОЛТНОГО АДМИНА
-- ==========================================
-- Пароль: admin123 (bcrypt hash)
-- Хэш нужно будет сгенерить при запуске migrate.ts

-- ==========================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_test_id ON test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_group_id ON test_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON test_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_student_id ON test_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_session_id ON test_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_student_id ON group_members(student_id);
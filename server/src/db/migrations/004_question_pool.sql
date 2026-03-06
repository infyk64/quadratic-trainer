-- ============================================
-- 004_question_pool.sql
-- Пул вопросов: автогенерация + индивидуальные наборы
-- ============================================

-- 1. Правила генерации уравнений для теста
-- Преподаватель задаёт: "сгенерируй 10 уравнений с коэффициентами от -30 до 100"
CREATE TABLE IF NOT EXISTS test_generators (
    id          SERIAL PRIMARY KEY,
    test_id     INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    
    -- Параметры генерации
    count       INTEGER NOT NULL DEFAULT 5,          -- сколько уравнений сгенерировать
    coeff_min   INTEGER NOT NULL DEFAULT -10,        -- мин. значение коэффициентов a, b, c
    coeff_max   INTEGER NOT NULL DEFAULT 10,         -- макс. значение коэффициентов a, b, c
    eq_type     VARCHAR(20) NOT NULL DEFAULT 'full', -- 'full' | 'incomplete' | 'random'
    points_each INTEGER NOT NULL DEFAULT 1,          -- баллов за каждое уравнение
    
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 2. Вопросы, сгенерированные для конкретной сессии студента
-- Каждый студент получает уникальный набор
CREATE TABLE IF NOT EXISTS session_questions (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER REFERENCES test_sessions(id) ON DELETE CASCADE,
    
    -- Данные сгенерированного уравнения
    generator_id    INTEGER REFERENCES test_generators(id) ON DELETE SET NULL,
    eq_a            INTEGER NOT NULL,
    eq_b            INTEGER NOT NULL,
    eq_c            INTEGER NOT NULL,
    answer_mask     TEXT NOT NULL,       -- правильный ответ (вычисленные корни)
    points          INTEGER DEFAULT 1,
    sort_order      INTEGER DEFAULT 0,
    
    -- Ответ студента
    student_answer  TEXT,
    is_correct      BOOLEAN,
    answered_at     TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_test_generators_test_id ON test_generators(test_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id ON session_questions(session_id);
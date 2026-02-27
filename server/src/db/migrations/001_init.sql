CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Уравнение ax² + bx + c = 0
CREATE TABLE questions (
    id            SERIAL PRIMARY KEY,
    a             INTEGER NOT NULL,
    b             INTEGER NOT NULL,
    c             INTEGER NOT NULL,
    equation_type VARCHAR(20) NOT NULL, -- 'full' | 'incomplete' | 'random'
    discriminant  NUMERIC,
    root_count    INTEGER,              -- 0, 1, 2
    root1         NUMERIC,
    root2         NUMERIC
);

-- Варианты ответов к вопросу
CREATE TABLE answer_options (
    id          SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    value       NUMERIC,               -- числовое значение варианта
    label       VARCHAR(30),           -- "x = 2", "нет корней" и т.д.
    is_correct  BOOLEAN NOT NULL
);

-- Попытки пользователя
CREATE TABLE attempts (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id),
    question_id  INTEGER REFERENCES questions(id),
    is_correct   BOOLEAN NOT NULL,
    time_spent   INTEGER,              -- секунды на ответ
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Выбранные варианты в конкретной попытке
CREATE TABLE attempt_answers (
    id          SERIAL PRIMARY KEY,
    attempt_id  INTEGER REFERENCES attempts(id) ON DELETE CASCADE,
    option_id   INTEGER REFERENCES answer_options(id)
);

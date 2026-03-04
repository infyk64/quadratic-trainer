-- ============================================
-- 003_theory_link_and_fixes.sql
-- Связь теста с теорией + недостающие колонки
-- ============================================

-- 1. Связь теста с теоретическим материалом
ALTER TABLE tests ADD COLUMN IF NOT EXISTS theory_id INTEGER REFERENCES theory_materials(id) ON DELETE SET NULL;

-- 2. Недостающие колонки (могли быть добавлены вручную, IF NOT EXISTS для безопасности)
ALTER TABLE tests ADD COLUMN IF NOT EXISTS max_attempts INTEGER;
ALTER TABLE test_questions ADD COLUMN IF NOT EXISTS options JSONB;

-- 3. Индекс для быстрого поиска тестов по теории
CREATE INDEX IF NOT EXISTS idx_tests_theory_id ON tests(theory_id);

import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// ===========================================
// GET /api/stats/test/:testId — Статистика по тесту
// Средний балл, распределение оценок, сложные вопросы
// ===========================================
router.get("/test/:testId", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const testId = parseInt(req.params.testId);

    // Общая статистика по тесту
    const overviewResult = await pool.query(
      `SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed_time') as failed_time,
        COUNT(*) FILTER (WHERE status = 'failed_errors') as failed_errors,
        ROUND(AVG(score_percent)::numeric, 1) as avg_score,
        ROUND(AVG(grade)::numeric, 1) as avg_grade,
        COUNT(*) FILTER (WHERE grade = 5) as grade_5,
        COUNT(*) FILTER (WHERE grade = 4) as grade_4,
        COUNT(*) FILTER (WHERE grade = 3) as grade_3,
        COUNT(*) FILTER (WHERE grade = 2) as grade_2
       FROM test_sessions
       WHERE test_id = $1 AND status != 'in_progress'`,
      [testId]
    );

    // Самые сложные вопросы (наибольший % ошибок)
    const hardQuestionsResult = await pool.query(
      `SELECT 
        tq.id, tq.question_type, tq.question_text, tq.eq_a, tq.eq_b, tq.eq_c,
        COUNT(ta.id) as total_answers,
        COUNT(ta.id) FILTER (WHERE ta.is_correct = false) as wrong_answers,
        ROUND(
          COUNT(ta.id) FILTER (WHERE ta.is_correct = false)::numeric 
          / NULLIF(COUNT(ta.id), 0) * 100, 1
        ) as error_rate
       FROM test_questions tq
       LEFT JOIN test_answers ta ON tq.id = ta.question_id
       WHERE tq.test_id = $1
       GROUP BY tq.id
       ORDER BY error_rate DESC NULLS LAST
       LIMIT 10`,
      [testId]
    );

    // Все сессии (для таблицы)
    const sessionsResult = await pool.query(
      `SELECT ts.*, u.username as student_name
       FROM test_sessions ts
       JOIN users u ON ts.student_id = u.id
       WHERE ts.test_id = $1 AND ts.status != 'in_progress'
       ORDER BY ts.finished_at DESC`,
      [testId]
    );

    res.json({
      overview: overviewResult.rows[0],
      hardQuestions: hardQuestionsResult.rows,
      sessions: sessionsResult.rows,
    });
  } catch (err) {
    console.error("Ошибка статистики по тесту:", err);
    res.status(500).json({ error: "Не удалось получить статистику" });
  }
});

// ===========================================
// GET /api/stats/group/:groupId — Статистика по группе
// Все тесты группы, результаты каждого студента
// ===========================================
router.get("/group/:groupId", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);

    // Информация о группе
    const groupResult = await pool.query(
      `SELECT g.*, u.username as teacher_name
       FROM groups g LEFT JOIN users u ON g.teacher_id = u.id
       WHERE g.id = $1`,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Группа не найдена" });
    }

    // Студенты группы с их результатами по всем тестам
    const studentsResult = await pool.query(
      `SELECT 
        u.id, u.username,
        COUNT(DISTINCT ts.test_id) as tests_taken,
        ROUND(AVG(ts.score_percent)::numeric, 1) as avg_score,
        ROUND(AVG(ts.grade)::numeric, 1) as avg_grade,
        COUNT(*) FILTER (WHERE ts.grade = 5) as count_5,
        COUNT(*) FILTER (WHERE ts.grade = 4) as count_4,
        COUNT(*) FILTER (WHERE ts.grade = 3) as count_3,
        COUNT(*) FILTER (WHERE ts.grade = 2) as count_2
       FROM group_members gm
       JOIN users u ON gm.student_id = u.id
       LEFT JOIN test_sessions ts ON u.id = ts.student_id AND ts.status != 'in_progress'
       WHERE gm.group_id = $1
       GROUP BY u.id, u.username
       ORDER BY avg_score DESC NULLS LAST`,
      [groupId]
    );

    // Назначенные тесты
    const testsResult = await pool.query(
      `SELECT t.id, t.title, ta.assigned_at, ta.deadline,
              COUNT(DISTINCT ts.id) as sessions_count,
              ROUND(AVG(ts.score_percent)::numeric, 1) as avg_score
       FROM test_assignments ta
       JOIN tests t ON ta.test_id = t.id
       LEFT JOIN test_sessions ts ON t.id = ts.test_id AND ts.status != 'in_progress'
       WHERE ta.group_id = $1
       GROUP BY t.id, t.title, ta.assigned_at, ta.deadline
       ORDER BY ta.assigned_at DESC`,
      [groupId]
    );

    res.json({
      group: groupResult.rows[0],
      students: studentsResult.rows,
      tests: testsResult.rows,
    });
  } catch (err) {
    console.error("Ошибка статистики по группе:", err);
    res.status(500).json({ error: "Не удалось получить статистику" });
  }
});

// ===========================================
// GET /api/stats/student/:studentId — Личная статистика ученика
// Все тесты, тренажёр, динамика
// ===========================================
router.get("/student/:studentId", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    // Информация о студенте
    const userResult = await pool.query(
      "SELECT id, username, created_at FROM users WHERE id = $1",
      [studentId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Студент не найден" });
    }

    // Результаты тестов
    const testSessionsResult = await pool.query(
      `SELECT ts.*, t.title as test_title
       FROM test_sessions ts
       JOIN tests t ON ts.test_id = t.id
       WHERE ts.student_id = $1 AND ts.status != 'in_progress'
       ORDER BY ts.finished_at DESC`,
      [studentId]
    );

    // Статистика тренажёра
    const trainerResult = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_correct = true) as correct,
        COUNT(*) FILTER (WHERE is_correct = false) as wrong,
        ROUND(
          COUNT(*) FILTER (WHERE is_correct = true)::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
        ) as success_rate
       FROM attempts
       WHERE user_id = $1`,
      [studentId]
    );

    // Динамика по дням (последние 30 дней)
    const dynamicsResult = await pool.query(
      `SELECT 
        DATE(attempted_at) as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_correct = true) as correct,
        ROUND(
          COUNT(*) FILTER (WHERE is_correct = true)::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
        ) as success_rate
       FROM attempts
       WHERE user_id = $1 AND attempted_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(attempted_at)
       ORDER BY date`,
      [studentId]
    );

    // Группы студента
    const groupsResult = await pool.query(
      `SELECT g.id, g.name
       FROM group_members gm
       JOIN groups g ON gm.group_id = g.id
       WHERE gm.student_id = $1`,
      [studentId]
    );

    res.json({
      student: userResult.rows[0],
      testSessions: testSessionsResult.rows,
      trainer: trainerResult.rows[0],
      dynamics: dynamicsResult.rows,
      groups: groupsResult.rows,
    });
  } catch (err) {
    console.error("Ошибка статистики студента:", err);
    res.status(500).json({ error: "Не удалось получить статистику" });
  }
});

// ===========================================
// GET /api/stats/group/:groupId/test/:testId — Результаты группы за тест
// ===========================================
router.get("/group/:groupId/test/:testId", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const testId = parseInt(req.params.testId);

    const result = await pool.query(
      `SELECT 
        u.id as student_id, u.username,
        ts.id as session_id, ts.status, ts.score_percent, ts.grade,
        ts.correct_answers, ts.errors_count, ts.total_questions,
        ts.started_at, ts.finished_at
       FROM group_members gm
       JOIN users u ON gm.student_id = u.id
       LEFT JOIN test_sessions ts ON u.id = ts.student_id AND ts.test_id = $2
       WHERE gm.group_id = $1
       ORDER BY ts.grade DESC NULLS LAST, u.username`,
      [groupId, testId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка статистики группы за тест:", err);
    res.status(500).json({ error: "Не удалось получить статистику" });
  }
});

export default router;
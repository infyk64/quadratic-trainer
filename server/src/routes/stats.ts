import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { logAction } from "../services/auditLogger";

import { linearRegression, classifyStudent } from "../services/analyticsService";

const router = Router();

router.get("/export/student-performance", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id as student_id,
         u.username,
         COUNT(ts.id) FILTER (WHERE ts.status != 'in_progress') as tests_taken,
         ROUND(AVG(ts.score_percent)::numeric, 2) as avg_score_percent,
         ROUND(AVG(ts.grade)::numeric, 2) as avg_grade,
         COUNT(ts.id) FILTER (WHERE ts.grade = 5) as grade_5_count,
         COUNT(ts.id) FILTER (WHERE ts.grade = 4) as grade_4_count,
         COUNT(ts.id) FILTER (WHERE ts.grade = 3) as grade_3_count,
         COUNT(ts.id) FILTER (WHERE ts.grade = 2) as grade_2_count
       FROM users u
       LEFT JOIN test_sessions ts ON ts.student_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.username
       ORDER BY u.username`,
    );

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const header = [
      "student_id",
      "username",
      "tests_taken",
      "avg_score_percent",
      "avg_grade",
      "grade_5_count",
      "grade_4_count",
      "grade_3_count",
      "grade_2_count",
    ];
    const lines = result.rows.map((row) =>
      [
        row.student_id,
        row.username,
        row.tests_taken,
        row.avg_score_percent,
        row.avg_grade,
        row.grade_5_count,
        row.grade_4_count,
        row.grade_3_count,
        row.grade_2_count,
      ]
        .map(escapeCsv)
        .join(","),
    );

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "export.student_performance_csv",
      entityType: "stats",
      details: `Экспорт успеваемости по ${result.rows.length} студентам`,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="student-performance.csv"');
    res.send([header.join(","), ...lines].join("\n"));
  } catch (err) {
    console.error("Ошибка экспорта успеваемости:", err);
    res.status(500).json({ error: "Не удалось экспортировать успеваемость" });
  }
});

// ===========================================
// GET /api/stats/test/:testId — Статистика по тесту
// Средний балл, распределение оценок, сложные вопросы
// ===========================================
router.get("/test/:testId", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const testId = parseInt(String(req.params.testId), 10);

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
    const groupId = parseInt(String(req.params.groupId), 10);

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
    const studentId = parseInt(String(req.params.studentId), 10);

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
    const groupId = parseInt(String(req.params.groupId), 10);
    const testId = parseInt(String(req.params.testId), 10);

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

// ===========================================
// GET /api/stats/analytics/student/:studentId
// Регрессия + классификация для конкретного студента
// ===========================================
router.get("/analytics/student/:studentId", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const studentId = parseInt(String(req.params.studentId), 10);

    // Все завершённые сессии студента (хронологически)
    const sessionsResult = await pool.query(
      `SELECT ts.score_percent, ts.grade, ts.correct_answers, ts.errors_count,
              ts.total_questions, ts.started_at, ts.finished_at, ts.status,
              t.time_limit, t.title as test_title
       FROM test_sessions ts
       JOIN tests t ON ts.test_id = t.id
       WHERE ts.student_id = $1 AND ts.status != 'in_progress'
       ORDER BY ts.finished_at ASC`,
      [studentId]
    );

    const sessions = sessionsResult.rows;
    const scores = sessions.map((s: any) => parseFloat(s.score_percent) || 0);

    // 1. Линейная регрессия
    const regression = linearRegression(scores);

    // 2. Фичи для классификации
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const totalErrors = sessions.reduce((s: number, r: any) => s + (parseInt(r.errors_count) || 0), 0);
    const totalQuestions = sessions.reduce((s: number, r: any) => s + (parseInt(r.total_questions) || 0), 0);
    const errorRate = totalQuestions > 0 ? (totalErrors / totalQuestions) * 100 : 50;

    // Среднее отношение времени к лимиту
    let avgTimeRatio = 0.7;
    const timedSessions = sessions.filter((s: any) => s.time_limit && s.finished_at && s.started_at);
    if (timedSessions.length > 0) {
      const ratios = timedSessions.map((s: any) => {
        const elapsed = (new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 1000;
        return elapsed / s.time_limit;
      });
      avgTimeRatio = ratios.reduce((a: number, b: number) => a + b, 0) / ratios.length;
    }

    const classification = classifyStudent({
      avg_score: Math.round(avgScore * 10) / 10,
      tests_passed: sessions.length,
      error_rate: Math.round(errorRate * 10) / 10,
      avg_time_ratio: Math.round(avgTimeRatio * 100) / 100,
      trend_slope: regression?.slope || 0,
    });

    // Информация о студенте
    const userResult = await pool.query(
      "SELECT id, username FROM users WHERE id = $1",
      [studentId]
    );

    res.json({
      student: userResult.rows[0],
      sessions_count: sessions.length,
      regression,
      classification,
    });
  } catch (err) {
    console.error("Ошибка аналитики студента:", err);
    res.status(500).json({ error: "Не удалось получить аналитику" });
  }
});

// ===========================================
// GET /api/stats/analytics/group/:groupId
// Аналитика по всей группе — классификация каждого студента
// ===========================================
router.get("/analytics/group/:groupId", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const groupId = parseInt(String(req.params.groupId), 10);

    // Все студенты группы
    const membersResult = await pool.query(
      `SELECT u.id, u.username
       FROM group_members gm JOIN users u ON gm.student_id = u.id
       WHERE gm.group_id = $1
       ORDER BY u.username`,
      [groupId]
    );

    const students = [];
    for (const member of membersResult.rows) {
      const sessionsResult = await pool.query(
        `SELECT ts.score_percent, ts.errors_count, ts.total_questions,
                ts.started_at, ts.finished_at, ts.status, t.time_limit
         FROM test_sessions ts JOIN tests t ON ts.test_id = t.id
         WHERE ts.student_id = $1 AND ts.status != 'in_progress'
         ORDER BY ts.finished_at ASC`,
        [member.id]
      );

      const sessions = sessionsResult.rows;
      const scores = sessions.map((s: any) => parseFloat(s.score_percent) || 0);
      const regression = linearRegression(scores);

      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const totalErrors = sessions.reduce((s: number, r: any) => s + (parseInt(r.errors_count) || 0), 0);
      const totalQuestions = sessions.reduce((s: number, r: any) => s + (parseInt(r.total_questions) || 0), 0);
      const errorRate = totalQuestions > 0 ? (totalErrors / totalQuestions) * 100 : 50;

      let avgTimeRatio = 0.7;
      const timedSessions = sessions.filter((s: any) => s.time_limit && s.finished_at && s.started_at);
      if (timedSessions.length > 0) {
        const ratios = timedSessions.map((s: any) => {
          const elapsed = (new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 1000;
          return elapsed / s.time_limit;
        });
        avgTimeRatio = ratios.reduce((a: number, b: number) => a + b, 0) / ratios.length;
      }

      const classification = classifyStudent({
        avg_score: Math.round(avgScore * 10) / 10,
        tests_passed: sessions.length,
        error_rate: Math.round(errorRate * 10) / 10,
        avg_time_ratio: Math.round(avgTimeRatio * 100) / 100,
        trend_slope: regression?.slope || 0,
      });

      students.push({
        id: member.id,
        username: member.username,
        sessions_count: sessions.length,
        avg_score: Math.round(avgScore * 10) / 10,
        classification,
        regression: regression ? { slope: regression.slope, trend: regression.trend, prediction_next: regression.prediction_next } : null,
      });
    }

    // Сводка по группе
    const categoryCounts = { excellent: 0, good: 0, average: 0, at_risk: 0 };
    for (const s of students) {
      categoryCounts[s.classification.category]++;
    }

    // Информация о группе
    const groupResult = await pool.query(
      "SELECT g.name, u.username as teacher_name FROM groups g LEFT JOIN users u ON g.teacher_id = u.id WHERE g.id = $1",
      [groupId]
    );

    res.json({
      group: groupResult.rows[0],
      students,
      summary: categoryCounts,
    });
  } catch (err) {
    console.error("Ошибка аналитики группы:", err);
    res.status(500).json({ error: "Не удалось получить аналитику" });
  }
});

export default router;
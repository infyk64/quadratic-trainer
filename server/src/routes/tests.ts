import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { checkAnswer, checkEquationAnswer } from "../services/answerChecker";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res) => {
    try {
      const isAdmin = req.user!.role === "admin";
      const result = await pool.query(
        `SELECT t.*, u.username as author_name,
              COUNT(DISTINCT tq.id) as questions_count,
              COUNT(DISTINCT ta.id) as assignments_count
       FROM tests t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN test_questions tq ON t.id = tq.test_id
       LEFT JOIN test_assignments ta ON t.id = ta.test_id
       ${isAdmin ? "" : "WHERE t.created_by = $1"}
       GROUP BY t.id, u.username
       ORDER BY t.created_at DESC`,
        isAdmin ? [] : [req.user!.userId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Ошибка получения тестов:", err);
      res.status(500).json({ error: "Не удалось получить тесты" });
    }
  },
);

router.get("/student/available", authenticate, async (req, res) => {
  try {
    const studentId = req.user!.userId;
    const result = await pool.query(
      `SELECT DISTINCT t.id, t.title, t.description, t.time_limit, t.max_errors,
              t.grade_excellent, t.grade_good, t.grade_satisf,
              t.created_at, u.username as author_name,
              COUNT(DISTINCT tq.id) as questions_count,
              ta.deadline,
              ts.id as session_id, ts.status as session_status,
              ts.grade, ts.score_percent
       FROM tests t
       JOIN test_assignments ta ON t.id = ta.test_id
       JOIN group_members gm ON ta.group_id = gm.group_id
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN test_questions tq ON t.id = tq.test_id
       LEFT JOIN test_sessions ts ON t.id = ts.test_id AND ts.student_id = $1
       WHERE gm.student_id = $1 AND t.is_published = true
       GROUP BY t.id, u.username, ta.deadline, ts.id, ts.status, ts.grade, ts.score_percent
       ORDER BY t.created_at DESC`,
      [studentId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка:", err);
    res.status(500).json({ error: "Не удалось получить тесты" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    const testResult = await pool.query(
      `SELECT t.*, u.username as author_name FROM tests t LEFT JOIN users u ON t.created_by = u.id WHERE t.id = $1`,
      [testId],
    );
    if (testResult.rows.length === 0)
      return res.status(404).json({ error: "Тест не найден" });
    const questionsResult = await pool.query(
      "SELECT * FROM test_questions WHERE test_id = $1 ORDER BY sort_order, id",
      [testId],
    );
    const assignmentsResult = await pool.query(
      `SELECT ta.*, g.name as group_name FROM test_assignments ta JOIN groups g ON ta.group_id = g.id WHERE ta.test_id = $1`,
      [testId],
    );
    res.json({
      ...testResult.rows[0],
      questions: questionsResult.rows,
      assignments: assignmentsResult.rows,
    });
  } catch (err) {
    console.error("Ошибка:", err);
    res.status(500).json({ error: "Не удалось получить тест" });
  }
});

router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const {
        title,
        description,
        time_limit,
        max_errors,
        grade_excellent,
        grade_good,
        grade_satisf,
        questions,
      } = req.body;
      if (!title?.trim())
        return res.status(400).json({ error: "Введите название" });
      if (!questions || questions.length === 0)
        return res.status(400).json({ error: "Добавьте вопросы" });

      const testResult = await client.query(
        `INSERT INTO tests (title, description, created_by, time_limit, max_errors, grade_excellent, grade_good, grade_satisf)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          title.trim(),
          description?.trim() || null,
          req.user!.userId,
          time_limit || null,
          max_errors || null,
          grade_excellent || 90,
          grade_good || 75,
          grade_satisf || 60,
        ],
      );
      const test = testResult.rows[0];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `INSERT INTO test_questions (test_id, question_type, eq_a, eq_b, eq_c, question_text, answer_mask, answer_type, hint, sort_order, points)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            test.id,
            q.question_type,
            q.eq_a || null,
            q.eq_b || null,
            q.eq_c || null,
            q.question_text || null,
            q.answer_mask,
            q.answer_type || "exact",
            q.hint || null,
            i,
            q.points || 1,
          ],
        );
      }
      await client.query("COMMIT");
      res.json({ ...test, questions_count: questions.length });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Ошибка создания:", err);
      res.status(500).json({ error: "Не удалось создать тест" });
    } finally {
      client.release();
    }
  },
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const testId = parseInt(req.params.id);
      const {
        title,
        description,
        time_limit,
        max_errors,
        grade_excellent,
        grade_good,
        grade_satisf,
        is_published,
        questions,
      } = req.body;
      const testResult = await client.query(
        `UPDATE tests SET title=COALESCE($1,title), description=$2, time_limit=$3, max_errors=$4,
        grade_excellent=COALESCE($5,grade_excellent), grade_good=COALESCE($6,grade_good),
        grade_satisf=COALESCE($7,grade_satisf), is_published=COALESCE($8,is_published)
       WHERE id=$9 RETURNING *`,
        [
          title?.trim(),
          description?.trim() || null,
          time_limit || null,
          max_errors || null,
          grade_excellent,
          grade_good,
          grade_satisf,
          is_published,
          testId,
        ],
      );
      if (testResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Не найден" });
      }
      if (questions && Array.isArray(questions)) {
        await client.query("DELETE FROM test_questions WHERE test_id = $1", [
          testId,
        ]);
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await client.query(
            `INSERT INTO test_questions (test_id, question_type, eq_a, eq_b, eq_c, question_text, answer_mask, answer_type, hint, sort_order, points)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
              testId,
              q.question_type,
              q.eq_a || null,
              q.eq_b || null,
              q.eq_c || null,
              q.question_text || null,
              q.answer_mask,
              q.answer_type || "exact",
              q.hint || null,
              i,
              q.points || 1,
            ],
          );
        }
      }
      await client.query("COMMIT");
      res.json(testResult.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Ошибка:", err);
      res.status(500).json({ error: "Не удалось обновить" });
    } finally {
      client.release();
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res) => {
    try {
      await pool.query("DELETE FROM tests WHERE id = $1", [
        parseInt(req.params.id),
      ]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Ошибка удаления" });
    }
  },
);

router.post(
  "/:id/publish",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "UPDATE tests SET is_published = true WHERE id = $1 RETURNING *",
        [parseInt(req.params.id)],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Не найден" });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Ошибка" });
    }
  },
);

router.post(
  "/:id/assign",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const { group_id, deadline } = req.body;
      if (!group_id) return res.status(400).json({ error: "Укажите группу" });
      const result = await pool.query(
        "INSERT INTO test_assignments (test_id, group_id, deadline) VALUES ($1,$2,$3) RETURNING *",
        [testId, group_id, deadline || null],
      );
      await pool.query("UPDATE tests SET is_published = true WHERE id = $1", [
        testId,
      ]);
      res.json(result.rows[0]);
    } catch (err: any) {
      if (err.code === "23505")
        return res.status(400).json({ error: "Уже назначен" });
      res.status(500).json({ error: "Ошибка назначения" });
    }
  },
);

router.delete(
  "/:id/assign/:groupId",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM test_assignments WHERE test_id = $1 AND group_id = $2",
        [parseInt(req.params.id), parseInt(req.params.groupId)],
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Ошибка" });
    }
  },
);

router.post("/:id/start", authenticate, async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    const studentId = req.user!.userId;
    const existing = await pool.query(
      "SELECT * FROM test_sessions WHERE test_id=$1 AND student_id=$2 ORDER BY started_at DESC LIMIT 1",
      [testId, studentId],
    );
    if (existing.rows.length > 0) {
      const s = existing.rows[0];
      if (s.status === "in_progress") return res.json(s);
      if (["completed", "failed_time", "failed_errors"].includes(s.status)) {
        return res
          .status(400)
          .json({ error: "Вы уже проходили этот тест", session: s });
      }
    }
    const qCount = await pool.query(
      "SELECT COUNT(*) FROM test_questions WHERE test_id=$1",
      [testId],
    );
    const result = await pool.query(
      "INSERT INTO test_sessions (test_id, student_id, total_questions) VALUES ($1,$2,$3) RETURNING *",
      [testId, studentId, parseInt(qCount.rows[0].count)],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка начала теста:", err);
    res.status(500).json({ error: "Не удалось начать тест" });
  }
});

router.post("/sessions/:sessionId/answer", authenticate, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { question_id, student_answer } = req.body;

    const sessionResult = await pool.query(
      "SELECT * FROM test_sessions WHERE id=$1 AND student_id=$2",
      [sessionId, req.user!.userId],
    );
    if (sessionResult.rows.length === 0)
      return res.status(404).json({ error: "Сессия не найдена" });
    const session = sessionResult.rows[0];
    if (session.status !== "in_progress")
      return res.status(400).json({ error: "Тест уже завершён" });

    const testResult = await pool.query(
      "SELECT time_limit, max_errors FROM tests WHERE id=$1",
      [session.test_id],
    );
    const test = testResult.rows[0];

    if (test.time_limit) {
      const elapsed =
        (Date.now() - new Date(session.started_at).getTime()) / 1000;
      if (elapsed > test.time_limit) {
        await finishSession(sessionId, "failed_time");
        return res
          .status(400)
          .json({ error: "Время вышло", status: "failed_time" });
      }
    }

    const qResult = await pool.query(
      "SELECT * FROM test_questions WHERE id=$1",
      [question_id],
    );
    if (qResult.rows.length === 0)
      return res.status(404).json({ error: "Вопрос не найден" });
    const question = qResult.rows[0];

    let checkResult;
    if (question.question_type === "equation") {
      checkResult = checkEquationAnswer(
        question.eq_a,
        question.eq_b,
        question.eq_c,
        student_answer,
      );
    } else {
      checkResult = checkAnswer(
        student_answer,
        question.answer_mask,
        question.answer_type,
      );
    }

    await pool.query(
      "INSERT INTO test_answers (session_id, question_id, student_answer, is_correct) VALUES ($1,$2,$3,$4)",
      [sessionId, question_id, student_answer, checkResult.isCorrect],
    );

    if (checkResult.isCorrect) {
      await pool.query(
        "UPDATE test_sessions SET correct_answers = correct_answers + 1 WHERE id=$1",
        [sessionId],
      );
    } else {
      await pool.query(
        "UPDATE test_sessions SET errors_count = errors_count + 1 WHERE id=$1",
        [sessionId],
      );
      if (test.max_errors) {
        const updated = await pool.query(
          "SELECT errors_count FROM test_sessions WHERE id=$1",
          [sessionId],
        );
        if (updated.rows[0].errors_count >= test.max_errors) {
          await finishSession(sessionId, "failed_errors");
          return res.json({
            ...checkResult,
            status: "failed_errors",
            message: "Превышен лимит ошибок",
          });
        }
      }
    }
    res.json(checkResult);
  } catch (err) {
    console.error("Ошибка ответа:", err);
    res.status(500).json({ error: "Не удалось сохранить ответ" });
  }
});

router.post("/sessions/:sessionId/finish", authenticate, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const session = await pool.query(
      "SELECT * FROM test_sessions WHERE id=$1 AND student_id=$2",
      [sessionId, req.user!.userId],
    );
    if (session.rows.length === 0)
      return res.status(404).json({ error: "Сессия не найдена" });
    if (session.rows[0].status !== "in_progress")
      return res.json(session.rows[0]);
    const result = await finishSession(sessionId, "completed");
    res.json(result);
  } catch (err) {
    console.error("Ошибка завершения:", err);
    res.status(500).json({ error: "Не удалось завершить тест" });
  }
});

router.get("/sessions/:sessionId/result", authenticate, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const sessionResult = await pool.query(
      `SELECT ts.*, t.title as test_title, t.grade_excellent, t.grade_good, t.grade_satisf
       FROM test_sessions ts JOIN tests t ON ts.test_id = t.id WHERE ts.id=$1`,
      [sessionId],
    );
    if (sessionResult.rows.length === 0)
      return res.status(404).json({ error: "Сессия не найдена" });
    const answersResult = await pool.query(
      `SELECT ta.*, tq.question_type, tq.question_text,
              tq.eq_a, tq.eq_b, tq.eq_c, tq.answer_mask, tq.points
       FROM test_answers ta JOIN test_questions tq ON ta.question_id = tq.id
       WHERE ta.session_id=$1 ORDER BY ta.answered_at`,
      [sessionId],
    );
    res.json({ session: sessionResult.rows[0], answers: answersResult.rows });
  } catch (err) {
    console.error("Ошибка:", err);
    res.status(500).json({ error: "Не удалось получить результат" });
  }
});

async function finishSession(sessionId: number, status: string) {
  const session = await pool.query(
    `SELECT ts.*, t.grade_excellent, t.grade_good, t.grade_satisf
     FROM test_sessions ts JOIN tests t ON ts.test_id = t.id WHERE ts.id=$1`,
    [sessionId],
  );
  const s = session.rows[0];
  const total = s.total_questions || 1;
  const correct = s.correct_answers || 0;
  const scorePercent = Math.round((correct / total) * 100 * 100) / 100;

  let grade = 2;
  if (status === "completed") {
    if (scorePercent >= s.grade_excellent) grade = 5;
    else if (scorePercent >= s.grade_good) grade = 4;
    else if (scorePercent >= s.grade_satisf) grade = 3;
  }

  const result = await pool.query(
    `UPDATE test_sessions SET status=$1, finished_at=NOW(), score_percent=$2, grade=$3
     WHERE id=$4 RETURNING *`,
    [status, scorePercent, grade, sessionId],
  );
  return result.rows[0];
}

export default router;

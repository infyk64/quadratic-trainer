import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { logAction } from "../services/auditLogger";

const router = Router();

// Получить все вопросы
router.get("/", authenticate, async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const result = await pool.query(
      isAdmin
        ? "SELECT * FROM theory_questions ORDER BY created_at DESC"
        : "SELECT * FROM theory_questions WHERE created_by = $1 ORDER BY created_at DESC",
      isAdmin ? [] : [req.user!.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения вопросов:", err);
    res.status(500).json({ error: "Не удалось получить вопросы" });
  }
});

// Создать вопрос
router.post("/", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const { question, answer_mask, answer_type, hint } = req.body;

    const result = await pool.query(
      `INSERT INTO theory_questions 
       (question, answer_mask, answer_type, hint, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [question, answer_mask, answer_type, hint || null, req.user!.userId]
    );

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "theory_question.create",
      entityType: "theory_question",
      entityId: result.rows[0].id,
      details: `Создан вопрос: "${String(result.rows[0].question).slice(0, 80)}"`,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка создания вопроса:", err);
    res.status(500).json({ error: "Не удалось создать вопрос" });
  }
});

// Экспорт вопросов в CSV (только админ)
router.get("/export", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tq.id, tq.question, tq.answer_type, tq.created_at, u.username as author_name
       FROM theory_questions tq
       LEFT JOIN users u ON tq.created_by = u.id
       ORDER BY tq.created_at DESC`,
    );

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const header = ["id", "question", "answer_type", "author_name", "created_at"];
    const lines = result.rows.map((row) =>
      [
        row.id,
        row.question,
        row.answer_type,
        row.author_name,
        row.created_at?.toISOString?.() || row.created_at,
      ]
        .map(escapeCsv)
        .join(","),
    );

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "export.theory_questions_csv",
      entityType: "theory_question",
      details: `Экспортировано вопросов: ${result.rows.length}`,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="theory-questions.csv"');
    res.send([header.join(","), ...lines].join("\n"));
  } catch (err) {
    console.error("Ошибка экспорта вопросов:", err);
    res.status(500).json({ error: "Не удалось экспортировать вопросы" });
  }
});

// Удалить вопрос
router.delete("/:id", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Некорректный id вопроса" });
    }

    const isAdmin = req.user!.role === "admin";
    const result = await pool.query(
      isAdmin
        ? "DELETE FROM theory_questions WHERE id = $1 RETURNING id"
        : "DELETE FROM theory_questions WHERE id = $1 AND created_by = $2 RETURNING id",
      isAdmin ? [id] : [id, req.user!.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Вопрос не найден или нет прав на удаление" });
    }

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "theory_question.delete",
      entityType: "theory_question",
      entityId: id,
      details: "Удален теоретический вопрос",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления вопроса:", err);
    res.status(500).json({ error: "Не удалось удалить вопрос" });
  }
});

export default router;
import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { logAction } from "../services/auditLogger";

const router = Router();

// Студент отправляет обращение
router.post("/", authenticate, authorize("student"), async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "Заполните тему и описание проблемы" });
    }

    const result = await pool.query(
      `INSERT INTO feedback_reports (student_id, subject, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user!.userId, subject.trim(), message.trim()],
    );

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "feedback.create",
      entityType: "feedback_report",
      entityId: result.rows[0].id,
      details: `Отправлено обращение: "${subject.trim()}"`,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка отправки обратной связи:", err);
    res.status(500).json({ error: "Не удалось отправить сообщение" });
  }
});

// Админ получает список обращений
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fr.*, u.username as student_name
       FROM feedback_reports fr
       JOIN users u ON fr.student_id = u.id
       ORDER BY fr.created_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения обращений:", err);
    res.status(500).json({ error: "Не удалось получить обращения" });
  }
});

// Админ обновляет статус обращения
router.patch("/:id/status", authenticate, authorize("admin"), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { status } = req.body as { status?: "new" | "resolved" };
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Некорректный id обращения" });
    }
    if (status !== "new" && status !== "resolved") {
      return res.status(400).json({ error: "Некорректный статус" });
    }

    const result = await pool.query(
      `UPDATE feedback_reports
       SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE NULL END
       WHERE id = $2
       RETURNING *`,
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Обращение не найдено" });
    }

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "feedback.update_status",
      entityType: "feedback_report",
      entityId: id,
      details: `Статус обращения: ${status}`,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка обновления статуса:", err);
    res.status(500).json({ error: "Не удалось обновить статус" });
  }
});

export default router;

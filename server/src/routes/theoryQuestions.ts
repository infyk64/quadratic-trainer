import { Router } from "express";
import { pool } from "../db/pool";

const router = Router();

// Получить все вопросы
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM theory_questions ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения вопросов:", err);
    res.status(500).json({ error: "Не удалось получить вопросы" });
  }
});

// Создать вопрос
router.post("/", async (req, res) => {
  try {
    const { question, answer_mask, answer_type, hint, created_by } = req.body;

    const result = await pool.query(
      `INSERT INTO theory_questions 
       (question, answer_mask, answer_type, hint, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [question, answer_mask, answer_type, hint || null, created_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка создания вопроса:", err);
    res.status(500).json({ error: "Не удалось создать вопрос" });
  }
});

// Удалить вопрос
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query("DELETE FROM theory_questions WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления вопроса:", err);
    res.status(500).json({ error: "Не удалось удалить вопрос" });
  }
});

export default router;
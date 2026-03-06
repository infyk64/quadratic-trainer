import { Router } from "express";
import { pool } from "../db/pool";
import bcrypt from "bcryptjs";

const router = Router();

// Создать нового пользователя (админ задаёт пароль)
router.post("/create", async (req, res) => {
  try {
    const { username, role, password } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ error: "Введите имя пользователя" });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Пароль должен быть не менее 4 символов" });
    }

    // Проверяем существует ли уже
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username.trim()],
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Пользователь с таким именем уже существует" });
    }

    // Хэшируем пароль
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      "INSERT INTO users (username, role, password_hash) VALUES ($1, $2, $3) RETURNING id, username, role, created_at",
      [username.trim(), role || "student", passwordHash],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка создания пользователя:", err);
    res.status(500).json({ error: "Не удалось создать пользователя" });
  }
});

// Получить статистику пользователя
router.get("/:id/stats", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const result = await pool.query(
      `
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE is_correct = true)        AS correct,
        COUNT(*) FILTER (WHERE is_correct = false)       AS wrong,
        ROUND(
          COUNT(*) FILTER (WHERE is_correct = true)::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
        )                                                 AS success_rate
      FROM attempts
      WHERE user_id = $1
    `,
      [userId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка получения статистики:", err);
    res.status(500).json({ error: "Не удалось получить статистику" });
  }
});

// Получить всех пользователей
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения пользователей:", err);
    res.status(500).json({ error: "Не удалось получить пользователей" });
  }
});

// Получить только студентов
router.get("/students", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username FROM users WHERE role = 'student' ORDER BY username"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка:", err);
    res.status(500).json({ error: "Не удалось получить студентов" });
  }
});

// Удалить пользователя
router.delete("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления пользователя:", err);
    res.status(500).json({ error: "Не удалось удалить пользователя" });
  }
});

export default router;
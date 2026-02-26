import { Router } from "express";
import { pool } from "../db/pool";

const router = Router();

// Вход/регистрация пользователя
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Хардкод пароли
    const adminPassword = "admin123";
    const teacherPassword = "teacher123";

    // Определяем роль
    let role: "admin" | "teacher" | "student" = "student";

    if (username.toLowerCase() === "admin") {
      if (password !== adminPassword) {
        return res
          .status(401)
          .json({ error: "Неверный пароль для администратора" });
      }
      role = "admin";
    } else if (
      username.toLowerCase().includes("teacher") ||
      username.toLowerCase().includes("препод")
    ) {
      if (password !== teacherPassword) {
        return res
          .status(401)
          .json({ error: "Неверный пароль для преподавателя" });
      }
      role = "teacher";
    }

    // Проверяем есть ли пользователь в БД
    let result = await pool.query(
      "SELECT id, username FROM users WHERE username = $1",
      [username],
    );

    if (result.rows.length === 0) {
      // Создаём нового
      result = await pool.query(
        "INSERT INTO users (username) VALUES ($1) RETURNING id, username",
        [username],
      );
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      username: user.username,
      role: role,
    });
  } catch (err) {
    console.error("Ошибка входа:", err);
    res.status(500).json({ error: "Не удалось войти" });
  }
});

// Создать/войти
router.post("/create", async (req, res) => {
  try {
    const { username, role } = req.body;

    // Проверяем существует ли уже
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Пользователь с таким именем уже существует" });
    }

    // Создаём нового
    const result = await pool.query(
      "INSERT INTO users (username) VALUES ($1) RETURNING id, username",
      [username],
    );

    res.json({ ...result.rows[0], role });
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
      "SELECT id, username, created_at FROM users ORDER BY created_at DESC",
    );

    // ВРЕМЕННО: добавляем роли на основе имён (пока нет в БД)
    const usersWithRoles = result.rows.map((user) => {
      let role = "student";
      if (user.username.toLowerCase() === "admin") role = "admin";
      if (
        user.username.toLowerCase().includes("teacher") ||
        user.username.toLowerCase().includes("препод")
      )
        role = "teacher";

      return { ...user, role };
    });

    res.json(usersWithRoles);
  } catch (err) {
    console.error("Ошибка получения пользователей:", err);
    res.status(500).json({ error: "Не удалось получить пользователей" });
  }
});

// Создать нового пользователя (только админ)
router.post("/create", async (req, res) => {
  try {
    const { username, role } = req.body;

    const result = await pool.query(
      "INSERT INTO users (username) VALUES ($1) RETURNING id, username",
      [username],
    );

    res.json({ ...result.rows[0], role });
  } catch (err) {
    console.error("Ошибка создания пользователя:", err);
    res.status(500).json({ error: "Не удалось создать пользователя" });
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

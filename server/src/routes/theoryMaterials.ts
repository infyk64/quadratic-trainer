import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { logAction } from "../services/auditLogger";

const router = Router();

// Получить все материалы
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM theory_materials ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения материалов:", err);
    res.status(500).json({ error: "Не удалось получить материалы" });
  }
});

// Создать материал
router.post("/", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const { title, content } = req.body;

    const result = await pool.query(
      `INSERT INTO theory_materials (title, content, author_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, content, req.user!.userId]
    );

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "theory_material.create",
      entityType: "theory_material",
      entityId: result.rows[0].id,
      details: `Создан материал "${result.rows[0].title}"`,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка создания материала:", err);
    res.status(500).json({ error: "Не удалось создать материал" });
  }
});

// Обновить материал
router.put("/:id", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Некорректный id материала" });
    }

    const { title, content } = req.body;
    const isAdmin = req.user!.role === "admin";
    const result = await pool.query(
      isAdmin
        ? "UPDATE theory_materials SET title = $1, content = $2 WHERE id = $3 RETURNING *"
        : "UPDATE theory_materials SET title = $1, content = $2 WHERE id = $3 AND author_id = $4 RETURNING *",
      isAdmin
        ? [title, content, id]
        : [title, content, id, req.user!.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Материал не найден или нет прав на редактирование" });
    }

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "theory_material.update",
      entityType: "theory_material",
      entityId: id,
      details: `Обновлен материал "${result.rows[0].title}"`,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка обновления материала:", err);
    res.status(500).json({ error: "Не удалось обновить материал" });
  }
});

// Удалить материал
router.delete("/:id", authenticate, authorize("admin", "teacher"), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Некорректный id материала" });
    }

    const isAdmin = req.user!.role === "admin";
    const result = await pool.query(
      isAdmin
        ? "DELETE FROM theory_materials WHERE id = $1 RETURNING id, title"
        : "DELETE FROM theory_materials WHERE id = $1 AND author_id = $2 RETURNING id, title",
      isAdmin ? [id] : [id, req.user!.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Материал не найден или нет прав на удаление" });
    }

    await logAction({
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      actionType: "theory_material.delete",
      entityType: "theory_material",
      entityId: id,
      details: `Удален материал "${result.rows[0].title}"`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления материала:", err);
    res.status(500).json({ error: "Не удалось удалить материал" });
  }
});

export default router;
import { Router } from "express";
import { pool } from "../db/pool";

const router = Router();

// Получить все материалы
router.get("/", async (req, res) => {
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
router.post("/", async (req, res) => {
  try {
    const { title, content, author_id } = req.body;

    const result = await pool.query(
      `INSERT INTO theory_materials (title, content, author_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, content, author_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка создания материала:", err);
    res.status(500).json({ error: "Не удалось создать материал" });
  }
});

// Удалить материал
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query("DELETE FROM theory_materials WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления материала:", err);
    res.status(500).json({ error: "Не удалось удалить материал" });
  }
});

export default router;
import { Router } from "express";
import { pool } from "../db/pool";

const router = Router();

// Получить все группы
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        g.id, 
        g.name, 
        g.teacher_id,
        g.created_at,
        u.username as teacher_name,
        COUNT(gm.student_id) as students_count
      FROM groups g
      LEFT JOIN users u ON g.teacher_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, u.username
      ORDER BY g.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения групп:", err);
    res.status(500).json({ error: "Не удалось получить группы" });
  }
});

// Создать группу
router.post("/", async (req, res) => {
  try {
    const { name, teacher_id } = req.body;

    const result = await pool.query(
      "INSERT INTO groups (name, teacher_id) VALUES ($1, $2) RETURNING *",
      [name, teacher_id || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка создания группы:", err);
    res.status(500).json({ error: "Не удалось создать группу" });
  }
});

// Получить студентов группы
router.get("/:id/members", async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);

    const result = await pool.query(`
      SELECT u.id, u.username, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.student_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at DESC
    `, [groupId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения студентов:", err);
    res.status(500).json({ error: "Не удалось получить студентов" });
  }
});

// Добавить студента в группу
router.post("/:id/members", async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { student_id } = req.body;

    await pool.query(
      "INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)",
      [groupId, student_id]
    );

    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: "Студент уже в группе" });
    }
    console.error("Ошибка добавления студента:", err);
    res.status(500).json({ error: "Не удалось добавить студента" });
  }
});

// Удалить студента из группы
router.delete("/:groupId/members/:studentId", async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const studentId = parseInt(req.params.studentId);

    await pool.query(
      "DELETE FROM group_members WHERE group_id = $1 AND student_id = $2",
      [groupId, studentId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления студента:", err);
    res.status(500).json({ error: "Не удалось удалить студента" });
  }
});

// Удалить группу
router.delete("/:id", async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    
    await pool.query("DELETE FROM groups WHERE id = $1", [groupId]);
    
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления группы:", err);
    res.status(500).json({ error: "Не удалось удалить группу" });
  }
});

export default router;
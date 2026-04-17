import { Router } from "express";
import { pool } from "../db/pool";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, username, user_role, action_type, entity_type, entity_id, details, created_at
       FROM action_logs
       ORDER BY created_at DESC
       LIMIT 200`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения логов:", err);
    res.status(500).json({ error: "Не удалось получить логи" });
  }
});

export default router;

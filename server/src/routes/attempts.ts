import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { userId, isCorrect } = req.body;

    const result = await pool.query(
      `INSERT INTO attempts (user_id, is_correct)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, isCorrect]
    );

    console.log('✅ Попытка сохранена:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка сохранения:', err);
    res.status(500).json({ error: 'Не удалось сохранить попытку' });
  }
});

export default router;
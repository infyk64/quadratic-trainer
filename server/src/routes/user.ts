import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

// Создать/войти пользователя
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;

    // Проверяем существует ли пользователь
    let result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Создаём нового
      result = await pool.query(
        'INSERT INTO users (username) VALUES ($1) RETURNING *',
        [username]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Не удалось войти' });
  }
});

// Получить статистику пользователя
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const result = await pool.query(`
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
    `, [userId]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка получения статистики:', err);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
});

export default router;
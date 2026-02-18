export async function getUserStats(userId: number) {
  const result = await pool.query(`
    SELECT
      COUNT(*)                                          AS total,
      COUNT(*) FILTER (WHERE is_correct = true)        AS correct,
      ROUND(
        COUNT(*) FILTER (WHERE is_correct = true)::numeric
        / NULLIF(COUNT(*), 0) * 100, 1
      )                                                 AS success_rate,
      AVG(time_spent)                                   AS avg_time_sec
    FROM attempts
    WHERE user_id = $1
  `, [userId]);

  return result.rows[0];
}
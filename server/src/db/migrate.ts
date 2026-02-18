import { pool } from './pool';

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        username   VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS questions (
        id            SERIAL PRIMARY KEY,
        a             INTEGER NOT NULL,
        b             INTEGER NOT NULL,
        c             INTEGER NOT NULL,
        equation_type VARCHAR(20) NOT NULL,
        discriminant  NUMERIC,
        root_count    INTEGER
      );

      CREATE TABLE IF NOT EXISTS attempts (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id),
        question_id INTEGER,
        is_correct  BOOLEAN NOT NULL,
        time_spent  INTEGER,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Таблицы созданы');
  } catch (err) {
    console.error('❌ Ошибка миграции:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
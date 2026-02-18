// server/src/db/pool.ts

import { Pool } from 'pg';

export const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'postgres2_db',
  user: 'postgres',
  password: 'postgres',
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL подключён');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка PostgreSQL:', err.message);
});
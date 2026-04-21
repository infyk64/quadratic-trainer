import { pool } from "./pool";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "admin";
const FIXED_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("🔄 Запуск миграций...\n");

    // Читаем и выполняем миграции по порядку
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith(".sql")) continue;

      console.log(`📄 Выполняю: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      await client.query(sql);
      console.log(`   ✅ ${file} — успешно\n`);
    }

    // Системный admin всегда существует с фиксированным паролем.
    const adminExists = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [ADMIN_USERNAME]
    );
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(FIXED_ADMIN_PASSWORD, salt);

    if (adminExists.rows.length === 0) {
      await client.query(
        "INSERT INTO users (username, role, password_hash) VALUES ($1, $2, $3)",
        [ADMIN_USERNAME, "admin", hash]
      );
      console.log("👑 Создан системный администратор:");
    } else {
      await client.query(
        "UPDATE users SET role = 'admin', password_hash = $1 WHERE username = $2",
        [hash, ADMIN_USERNAME]
      );
      console.log("🔒 Пароль системного администратора синхронизирован");
    }

    console.log(`   Логин: ${ADMIN_USERNAME}`);
    console.log(`   Пароль: ${FIXED_ADMIN_PASSWORD}`);
    console.log("   ℹ️  Пароль admin фиксированный и не меняется через API\n");

    console.log("✅ Все миграции выполнены успешно!");
  } catch (err) {
    console.error("❌ Ошибка миграции:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
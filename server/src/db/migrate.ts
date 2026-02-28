import { pool } from "./pool";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

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

    // Создаём дефолтного админа (если нет)
    const adminExists = await client.query(
      "SELECT id FROM users WHERE username = 'admin'"
    );

    if (adminExists.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("admin123", salt);

      await client.query(
        "INSERT INTO users (username, role, password_hash) VALUES ($1, $2, $3)",
        ["admin", "admin", hash]
      );
      console.log("👑 Создан администратор по умолчанию:");
      console.log("   Логин: admin");
      console.log("   Пароль: admin123");
      console.log("   ⚠️  Смените пароль после первого входа!\n");
    } else {
      // Обновляем хэш пароля если его нет (для обратной совместимости)
      const admin = await client.query(
        "SELECT id, password_hash FROM users WHERE username = 'admin'"
      );

      if (!admin.rows[0].password_hash) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("admin123", salt);

        await client.query(
          "UPDATE users SET password_hash = $1, role = 'admin' WHERE username = 'admin'",
          [hash]
        );
        console.log("🔑 Обновлён хэш пароля для admin (bcrypt)\n");
      } else {
        console.log("👑 Администратор уже существует\n");
      }
    }

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
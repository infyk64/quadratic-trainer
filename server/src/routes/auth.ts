import { Router } from "express";
import { pool } from "../db/pool";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAction } from "../services/auditLogger";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "quadratic-equations-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

export interface JwtPayload {
  userId: number;
  username: string;
  role: "admin" | "teacher" | "student";
}

// ===========================================
// POST /api/auth/login — Вход в систему
// ===========================================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ error: "Введите имя пользователя" });
    }

    // Ищем пользователя в БД
    const result = await pool.query(
      "SELECT id, username, role, password_hash FROM users WHERE username = $1",
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Пользователь не найден. Обратитесь к администратору." });
    }

    const user = result.rows[0];

    // Проверяем пароль
    if (user.password_hash) {
      // Если есть хэш — проверяем через bcrypt
      if (!password) {
        return res.status(401).json({ error: "Введите пароль" });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Неверный пароль" });
      }
    } else {
      // Пароль не установлен — вход запрещён для всех ролей
      return res.status(401).json({ 
        error: "Пароль не установлен. Обратитесь к администратору." 
      });
    }

    // Генерируем JWT
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await logAction({
      userId: user.id,
      username: user.username,
      userRole: user.role,
      actionType: "auth.login_success",
      entityType: "user",
      entityId: user.id,
      details: "Успешный вход в систему",
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Ошибка авторизации:", err);
    res.status(500).json({ error: "Ошибка сервера при входе" });
  }
});

// ===========================================
// GET /api/auth/me — Проверка текущего токена
// ===========================================
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Токен не предоставлен" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Проверяем что пользователь ещё существует
    const result = await pool.query(
      "SELECT id, username, role FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Токен истёк, войдите заново" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Недействительный токен" });
    }
    console.error("Ошибка проверки токена:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ===========================================
// POST /api/auth/change-password — Смена пароля
// ===========================================
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (decoded.role === "admin" && decoded.username === "admin") {
      return res.status(403).json({
        error: "Пароль системного администратора изменить нельзя",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "Пароль должен быть не менее 4 символов" });
    }

    // Проверяем текущий пароль (если он установлен)
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const user = userResult.rows[0];

    if (user.password_hash && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Неверный текущий пароль" });
      }
    }

    // Хэшируем новый пароль
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hash, decoded.userId]
    );

    res.json({ success: true, message: "Пароль изменён" });
  } catch (err: any) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Недействительный токен" });
    }
    console.error("Ошибка смены пароля:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export { JWT_SECRET };
export default router;
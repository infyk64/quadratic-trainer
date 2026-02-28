// Полный путь: server/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JwtPayload } from "../routes/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Не авторизован. Войдите в систему." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Сессия истекла. Войдите заново." });
    }
    return res.status(401).json({ error: "Недействительный токен" });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Доступ запрещён. Требуется роль: " + allowedRoles.join(" или ")
      });
    }

    next();
  };
}

export const adminOnly = [authenticate, authorize("admin")];
export const teacherOrAdmin = [authenticate, authorize("admin", "teacher")];
export const authRequired = [authenticate];
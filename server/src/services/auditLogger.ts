import { pool } from "../db/pool";

interface AuditLogPayload {
  userId?: number | null;
  username?: string | null;
  userRole?: string | null;
  actionType: string;
  entityType?: string | null;
  entityId?: number | null;
  details?: string | null;
}

export async function logAction(payload: AuditLogPayload) {
  try {
    await pool.query(
      `INSERT INTO action_logs
       (user_id, username, user_role, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        payload.userId ?? null,
        payload.username ?? null,
        payload.userRole ?? null,
        payload.actionType,
        payload.entityType ?? null,
        payload.entityId ?? null,
        payload.details ?? null,
      ],
    );
  } catch (err) {
    console.error("Ошибка записи audit-лога:", err);
  }
}

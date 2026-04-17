import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { User } from "../types";
import { useNavigate } from "react-router-dom";
import { downloadCsv } from "../untils/exportStats";

interface FeedbackReport {
  id: number;
  student_name: string;
  subject: string;
  message: string;
  status: "new" | "resolved";
  created_at: string;
}

interface ActionLog {
  id: number;
  username?: string;
  user_role?: string;
  action_type: string;
  details?: string;
  created_at: string;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("student");
  const [feedback, setFeedback] = useState<FeedbackReport[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);

  useEffect(() => {
    loadUsers();
    loadFeedback();
    loadLogs();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get<User[]>("/users/all");
      setUsers(data);
    } catch (err) {
      console.error("Ошибка загрузки пользователей:", err);
    }
  };

  const loadFeedback = async () => {
    try {
      const { data } = await api.get<FeedbackReport[]>("/feedback");
      setFeedback(data);
    } catch (err) {
      console.error("Ошибка загрузки обращений:", err);
    }
  };

  const loadLogs = async () => {
    try {
      const { data } = await api.get<ActionLog[]>("/logs");
      setLogs(data);
    } catch (err) {
      console.error("Ошибка загрузки журнала:", err);
    }
  };

  const createUser = async () => {
    if (!newUsername.trim()) return;
    if (!newPassword || newPassword.length < 4) {
      alert("Пароль должен быть не менее 4 символов");
      return;
    }

    try {
      await api.post("/users/create", {
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewUsername("");
      setNewPassword("");
      setNewRole("student");
      loadUsers();
      alert("Пользователь успешно создан!");
    } catch (err: any) {
      console.error("Ошибка создания пользователя:", err);
      const errorMessage =
        err.response?.data?.error || "Не удалось создать пользователя";
      alert("" + errorMessage);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Удалить пользователя?")) return;

    try {
      await api.delete(`/users/${userId}`);
      loadUsers();
    } catch (err) {
      console.error("Ошибка удаления:", err);
    }
  };

  const updateFeedbackStatus = async (id: number, status: "new" | "resolved") => {
    try {
      await api.patch(`/feedback/${id}/status`, { status });
      loadFeedback();
      loadLogs();
    } catch (err) {
      console.error("Ошибка обновления статуса обращения:", err);
      alert("Не удалось обновить статус обращения");
    }
  };

  const exportQuestionsCsv = async () => {
    try {
      await downloadCsv("/theory-questions/export", "theory-questions.csv");
    } catch (err) {
      console.error("Ошибка экспорта вопросов:", err);
      alert("Не удалось экспортировать вопросы");
    }
  };

  const exportPerformanceCsv = async () => {
    try {
      await downloadCsv("/stats/export/student-performance", "student-performance.csv");
    } catch (err) {
      console.error("Ошибка экспорта успеваемости:", err);
      alert("Не удалось экспортировать успеваемость");
    }
  };

  return (
    <div className="page-container">
      <h1>Панель администратора</h1>

      {/* НОВАЯ СЕКЦИЯ - Управление группами */}
      <div className="section-card">
        <h2>Управление группами</h2>
        <p>Создавайте группы и назначайте преподавателей</p>
        <button
          onClick={() => navigate("/admin/groups")}
          className="btn-primary"
          style={{ marginTop: "12px" }}
        >
          Управление группами
        </button>
      </div>

      <div className="section-card">
        <h2>Экспорт данных</h2>
        <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <button onClick={exportQuestionsCsv} className="btn-primary">
            Экспорт вопросов (CSV)
          </button>
          <button onClick={exportPerformanceCsv} className="btn-primary">
            Экспорт успеваемости (CSV)
          </button>
        </div>
      </div>

      <div className="section-card">
        <h2>Создать нового пользователя</h2>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Имя пользователя"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              fontSize: "16px",
              minWidth: "150px",
            }}
          />
          <input
            type="password"
            placeholder="Пароль (мин. 4 символа)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              fontSize: "16px",
              minWidth: "150px",
            }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as User["role"])}
            style={{ padding: "10px", fontSize: "16px" }}
          >
            <option value="student">Студент</option>
            <option value="teacher">Преподаватель</option>
            <option value="admin">Админ</option>
          </select>
          <button
            onClick={createUser}
            className="btn-primary"
            disabled={
              !newUsername.trim() || !newPassword || newPassword.length < 4
            }
          >
            Создать
          </button>
        </div>
      </div>

      <div className="section-card">
        <h2>Список пользователей ({users.length})</h2>
        <table
          style={{
            width: "100%",
            marginTop: "20px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid var(--border)",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Имя</th>
              <th style={{ padding: "12px" }}>Роль</th>
              <th style={{ padding: "12px" }}>Дата создания</th>
              <th style={{ padding: "12px" }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td style={{ padding: "12px" }}>{user.id}</td>
                <td style={{ padding: "12px" }}>{user.username}</td>
                <td style={{ padding: "12px" }}>
                  {user.role === "admin" && "Админ"}
                  {user.role === "teacher" && "Преподаватель"}
                  {user.role === "student" && "Студент"}
                </td>
                <td style={{ padding: "12px" }}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "—"}
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-card">
        <h2>Обращения студентов ({feedback.length})</h2>
        {feedback.length === 0 ? (
          <p style={{ color: "var(--text2)", marginTop: "12px" }}>Обращений пока нет</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            {feedback.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "12px",
                  background: "var(--surface2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                  <strong>
                    #{item.id} · {item.subject}
                  </strong>
                  <span style={{ color: item.status === "resolved" ? "#22c55e" : "#f59e0b" }}>
                    {item.status === "resolved" ? "Решено" : "Новое"}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text2)", marginTop: "4px" }}>
                  От: {item.student_name} · {new Date(item.created_at).toLocaleString()}
                </div>
                <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{item.message}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button
                    className="btn-primary"
                    onClick={() => updateFeedbackStatus(item.id, "resolved")}
                    disabled={item.status === "resolved"}
                  >
                    Пометить как решено
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => updateFeedbackStatus(item.id, "new")}
                    disabled={item.status === "new"}
                  >
                    Вернуть в новые
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-card">
        <h2>Журнал действий (последние {logs.length})</h2>
        {logs.length === 0 ? (
          <p style={{ color: "var(--text2)", marginTop: "12px" }}>Логи пока пусты</p>
        ) : (
          <table
            style={{
              width: "100%",
              marginTop: "14px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Время</th>
                <th style={{ padding: "10px" }}>Пользователь</th>
                <th style={{ padding: "10px" }}>Действие</th>
                <th style={{ padding: "10px" }}>Детали</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px" }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: "10px" }}>
                    {log.username || "system"} ({log.user_role || "—"})
                  </td>
                  <td style={{ padding: "10px" }}>{log.action_type}</td>
                  <td style={{ padding: "10px" }}>{log.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

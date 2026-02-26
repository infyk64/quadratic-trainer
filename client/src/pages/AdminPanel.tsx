import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { User } from "../types";

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("student");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get<User[]>("/users/all");
      setUsers(data);
    } catch (err) {
      console.error("Ошибка загрузки пользователей:", err);
    }
  };

  const createUser = async () => {
    if (!newUsername.trim()) return;

    try {
      await api.post("/users/create", {
        username: newUsername.trim(),
        role: newRole,
      });
      setNewUsername("");
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

  return (
    <div className="page-container">
      <h1> Панель администратора</h1>

      <div className="section-card">
        <h2>Создать нового пользователя</h2>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            style={{ flex: 1, padding: "10px", fontSize: "16px" }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as User["role"])}
            style={{ padding: "10px", fontSize: "16px" }}
          >
            <option value="student"> Студент</option>
            <option value="teacher"> Преподаватель</option>
            <option value="admin"> Админ</option>
          </select>
          <button
            onClick={createUser}
            className="btn-primary"
            disabled={!newUsername.trim()}
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
                  {user.role === "admin" && " Админ"}
                  {user.role === "teacher" && " Преподаватель"}
                  {user.role === "student" && " Студент"}
                </td>
                <td style={{ padding: "12px" }}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "—"}
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--red)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

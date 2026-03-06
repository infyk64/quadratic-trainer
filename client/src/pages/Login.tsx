import { useState } from "react";
import { api } from "../api/client";
import type { User } from "../types";

interface Props {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError("Введите имя пользователя");
      return;
    }
    if (!password.trim()) {
      setError("Введите пароль");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("role", data.user.role);

      onLogin(data.user);
      setError("");
    } catch (err: any) {
      console.error("Ошибка входа:", err);
      setError(
        err.response?.data?.error || "Неверное имя пользователя или пароль",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Тренажёр квадратных уравнений</h1>

      <div className="login-card">
        {error && (
          <div
            style={{
              background: "var(--danger-light)",
              color: "var(--danger)",
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              textAlign: "center",
              width: "100%",
              border: "1.5px solid #f0b8b8",
            }}
          >
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Имя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          onClick={handleLogin}
          disabled={!username.trim() || !password.trim() || loading}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
          fontSize: "13px",
          color: "var(--text3)",
          textAlign: "center",
          lineHeight: 1.8,
        }}
      >
        <p>Для входа необходим логин и пароль</p>
        <p>Обратитесь к администратору для регистрации</p>
      </div>
    </div>
  );
}

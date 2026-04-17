import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Login } from "./pages/Login";
import { Trainer } from "./pages/Trainer";
import { TheoryView } from "./pages/TheoryView";
import { Stats } from "./pages/Stats";
import { AdminPanel } from "./pages/AdminPanel";
import { TeacherPanel } from "./pages/TeacherPanel";
import { TheoryEditor } from "./pages/TheoryEditor";
import { QuestionEditor } from "./pages/QuestionEditor";
import { GroupManagement } from "./pages/GroupManagement";
import { UserGuide } from "./pages/UserGuide";
import { TestEditor } from "./pages/TestEditor";
import { TestList } from "./pages/TestList";
import { TeacherStats } from "./pages/TeacherStats";
import { StudentTests } from "./pages/StudentTests";
import { TestRunner } from "./pages/TestRunner";
import { TestResult } from "./pages/TestResult";
import { Analytics } from "./pages/Analytics";
import { FeedbackPage } from "./pages/FeedbackPage.tsx";
import { api } from "./api/client";
import type { User } from "./types/index";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser({ id: data.id, username: data.username, role: data.role });
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUser(null);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="navbar">
          <div className="nav-left">
            <span className="nav-logo">Квадратные уравнения</span>
            <div className="nav-links">
              {/* Тренажёр — только для студентов */}
              {user.role === "student" && (
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Тренажёр
                </NavLink>
              )}

              {/* Тесты — только для студентов */}
              {user.role === "student" && (
                <NavLink
                  to="/student/tests"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Тесты
                </NavLink>
              )}

              {/* Теоретический материал — не для админа */}
              {user.role !== "admin" && (
                <NavLink
                  to="/theory"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Теория
                </NavLink>
              )}

              {/* Статистика — только для студентов */}
              {user.role === "student" && (
                <NavLink
                  to="/stats"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Статистика
                </NavLink>
              )}

              {user.role === "student" && (
                <NavLink
                  to="/feedback"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Обратная связь
                </NavLink>
              )}

              {/* Справочник — руководство пользователя */}
              <NavLink
                to="/guide"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Справочник
              </NavLink>

              {/* Админ */}
              {user.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Админ
                </NavLink>
              )}

              {/* Преподаватель */}
              {(user.role === "admin" || user.role === "teacher") && (
                <NavLink
                  to="/teacher"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Преподаватель
                </NavLink>
              )}
            </div>
          </div>

          <div className="nav-right">
            <span className="nav-user">
              {user.role === "admin" && ""}
              {user.role === "teacher" && ""}
              {user.role === "student" && ""}
              {user.username}
            </span>
            <button className="nav-link" onClick={handleLogout}>
              Выход
            </button>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            {/* ===== Общие роуты ===== */}
            {user.role === "student" && <Route path="/" element={<Trainer />} />}
            {user.role !== "admin" && <Route path="/theory" element={<TheoryView />} />}
            {user.role === "student" && <Route path="/stats" element={<Stats />} />}
            {user.role === "student" && <Route path="/feedback" element={<FeedbackPage />} />}
            <Route path="/guide" element={<UserGuide />} />

            {/* ===== Админ ===== */}
            {user.role === "admin" && (
              <>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/groups" element={<GroupManagement />} />
              </>
            )}

            {/* ===== Преподаватель + Админ ===== */}
            {(user.role === "admin" || user.role === "teacher") && (
              <>
                <Route path="/teacher" element={<TeacherPanel />} />
                <Route path="/teacher/theory-editor" element={<TheoryEditor />} />
                <Route path="/teacher/questions-editor" element={<QuestionEditor />} />
                <Route path="/teacher/test-editor" element={<TestEditor />} />
                <Route path="/teacher/tests" element={<TestList />} />
                <Route path="/teacher/stats" element={<TeacherStats />} />
                <Route path="/teacher/analytics" element={<Analytics />} />
              </>
            )}

            {/* ===== Студент: тесты ===== */}
            <Route path="/student/tests" element={<StudentTests />} />
            <Route path="/student/test-run/:sessionId" element={<TestRunner />} />
            <Route path="/student/test-result/:sessionId" element={<TestResult />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Login } from "./pages/Login";
import { Trainer } from "./pages/Trainer";
import { TheoryView } from "./pages/TheoryView";
import { Stats } from "./pages/Stats";
import type { User } from "./types";
import { AdminPanel } from "./pages/AdminPanel";
import { TeacherPanel } from "./pages/TeacherPanel";
import { TheoryEditor } from "./pages/TheoryEditor";
import { QuestionEditor } from "./pages/QuestionEditor";
import { GroupManagement } from "./pages/GroupManagement";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role") as User["role"];

    if (userId && username && role) {
      setUser({ id: parseInt(userId), username, role });
    }
  }, []);

  const handleLogin = (loggedUser: User) => {
    localStorage.setItem("userId", String(loggedUser.id));
    localStorage.setItem("username", loggedUser.username);
    localStorage.setItem("role", loggedUser.role);
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUser(null);
  };

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
              {/* Общие вкладки для всех */}
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Тренажёр
              </NavLink>
              <NavLink
                to="/reference"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Теория
              </NavLink>
              <NavLink
                to="/stats"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Статистика
              </NavLink>

              {/* Вкладка админа */}
              {user.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Админ
                </NavLink>
              )}

              {/* Вкладка преподавателя */}
              {(user.role === "admin" || user.role === "teacher") && (
                <NavLink
                  to="/teacher"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Преподаватель
                </NavLink>
              )}
            </div>
          </div>

          <div className="nav-right">
            <span className="nav-user">
              {user.role === "admin" && " "}
              {user.role === "teacher" && " "}
              {user.role === "student" && " "}
              {user.username}
            </span>
            <button className="nav-link" onClick={handleLogout}>
              Выход
            </button>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Trainer />} />
            <Route path="/reference" element={<TheoryView />} />
            <Route path="/stats" element={<Stats />} />

            {user.role === "admin" && (
              <>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/groups" element={<GroupManagement />} />
              </>
            )}

            {(user.role === "admin" || user.role === "teacher") && (
              <>
                <Route path="/teacher" element={<TeacherPanel />} />
                <Route
                  path="/teacher/theory-editor"
                  element={<TheoryEditor />}
                />
              </>
            )}

            {(user.role === "admin" || user.role === "teacher") && (
              <>
                <Route path="/teacher" element={<TeacherPanel />} />
                <Route
                  path="/teacher/theory-editor"
                  element={<TheoryEditor />}
                />
                <Route
                  path="/teacher/questions-editor"
                  element={<QuestionEditor />}
                />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

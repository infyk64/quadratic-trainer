import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Login } from "./pages/Login";
import { Trainer } from "./pages/Trainer";
import { Reference } from "./pages/Reference";
import { Stats } from "./pages/Stats";
import "./App.css";

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(
    null,
  );

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    if (userId && username) {
      setUser({ id: parseInt(userId), username });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="navbar">
          <div className="nav-left">
            <span className="nav-logo">Квадратные уравнения</span>
            <div className="nav-links">
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
                Справочник
              </NavLink>
              <NavLink
                to="/stats"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Статистика
              </NavLink>
            </div>
          </div>
          <div className="nav-right">
            <span className="nav-user">👤 {user.username}</span>
            <button className="nav-link" onClick={handleLogout}>
              Выход
            </button>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Trainer />} />
            <Route path="/reference" element={<Reference />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

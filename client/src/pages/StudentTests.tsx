import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

interface AvailableTest {
  id: number;
  title: string;
  description?: string;
  time_limit?: number;
  max_errors?: number;
  grade_excellent: number;
  grade_good: number;
  grade_satisf: number;
  questions_count: number;
  author_name: string;
  deadline?: string;
  created_at: string;
  // Результат (если уже проходил)
  session_id?: number;
  session_status?: string;
  grade?: number;
  score_percent?: number;
}

export function StudentTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<AvailableTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data } = await api.get<AvailableTest[]>("/tests/student/available");
      setTests(data);
    } catch (err) {
      console.error("Ошибка загрузки тестов:", err);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId: number) => {
    try {
      const { data: session } = await api.post(`/tests/${testId}/start`);
      navigate(`/student/test-run/${session.id}`, { state: { testId } });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Не удалось начать тест";
      alert("❌ " + msg);

      // Если уже проходил — показываем результат
      if (err.response?.data?.session) {
        const s = err.response.data.session;
        navigate(`/student/test-result/${s.id}`);
      }
    }
  };

  const getStatusBadge = (test: AvailableTest) => {
    if (!test.session_status) {
      return { text: "Не начат", color: "var(--surface2)", textColor: "var(--text2)" };
    }
    switch (test.session_status) {
      case "in_progress":
        return { text: "В процессе", color: "#f59e0b", textColor: "white" };
      case "completed":
        return { text: `Оценка: ${test.grade}`, color: test.grade! >= 4 ? "#22c55e" : test.grade! >= 3 ? "#f59e0b" : "#ef4444", textColor: "white" };
      case "failed_time":
        return { text: "Время вышло", color: "#ef4444", textColor: "white" };
      case "failed_errors":
        return { text: "Лимит ошибок", color: "#ef4444", textColor: "white" };
      default:
        return { text: test.session_status, color: "var(--surface2)", textColor: "var(--text2)" };
    }
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text2)" }}>
        Загрузка тестов...
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>📝 Мои тесты</h1>

      {tests.length === 0 ? (
        <div className="section-card">
          <p style={{ color: "var(--text2)", textAlign: "center", padding: "40px" }}>
            Вам пока не назначено ни одного теста
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tests.map((test) => {
            const badge = getStatusBadge(test);
            const deadlinePassed = isDeadlinePassed(test.deadline);
            const canStart = !test.session_status && !deadlinePassed;
            const canContinue = test.session_status === "in_progress";
            const isDone = ["completed", "failed_time", "failed_errors"].includes(test.session_status || "");

            return (
              <div key={test.id} className="section-card" style={{ opacity: deadlinePassed && !isDone ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  {/* Информация */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h2 style={{ margin: 0 }}>{test.title}</h2>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: badge.color,
                          color: badge.textColor,
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>

                    {test.description && (
                      <p style={{ color: "var(--text2)", fontSize: "14px", margin: "0 0 10px 0" }}>
                        {test.description}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text2)", flexWrap: "wrap" }}>
                      <span>📝 {test.questions_count} вопросов</span>
                      {test.time_limit && <span>⏱ {Math.round(test.time_limit / 60)} мин</span>}
                      {test.max_errors && <span>❌ макс. {test.max_errors} ошибок</span>}
                      <span>👤 {test.author_name}</span>
                      {test.deadline && (
                        <span style={{ color: deadlinePassed ? "#ef4444" : "var(--text2)" }}>
                          📅 Дедлайн: {new Date(test.deadline).toLocaleDateString()}
                          {deadlinePassed && " (просрочен)"}
                        </span>
                      )}
                    </div>

                    {/* Шкала оценивания */}
                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text2)", marginTop: "6px" }}>
                      <span>«5» от {test.grade_excellent}%</span>
                      <span>«4» от {test.grade_good}%</span>
                      <span>«3» от {test.grade_satisf}%</span>
                    </div>

                    {/* Результат */}
                    {isDone && test.score_percent !== undefined && (
                      <div style={{ marginTop: "10px", padding: "8px 12px", background: "var(--surface2)", borderRadius: "6px", fontSize: "14px" }}>
                        Результат: <strong>{test.score_percent}%</strong> — оценка <strong>{test.grade}</strong>
                      </div>
                    )}
                  </div>

                  {/* Кнопка */}
                  <div style={{ flexShrink: 0, marginLeft: "16px" }}>
                    {canStart && (
                      <button
                        onClick={() => startTest(test.id)}
                        className="btn-primary"
                        style={{ padding: "10px 24px", width: "auto" }}
                      >
                        ▶ Начать
                      </button>
                    )}
                    {canContinue && (
                      <button
                        onClick={() => navigate(`/student/test-run/${test.session_id}`, { state: { testId: test.id } })}
                        className="btn-primary"
                        style={{ padding: "10px 24px", width: "auto", background: "#f59e0b" }}
                      >
                        ▶ Продолжить
                      </button>
                    )}
                    {isDone && test.session_id && (
                      <button
                        onClick={() => navigate(`/student/test-result/${test.session_id}`)}
                        style={{
                          padding: "10px 24px",
                          background: "var(--accent2)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        📊 Результат
                      </button>
                    )}
                    {deadlinePassed && !isDone && !canContinue && (
                      <span style={{ color: "#ef4444", fontSize: "13px" }}>Просрочен</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
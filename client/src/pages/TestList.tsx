import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

interface Test {
  id: number;
  title: string;
  description?: string;
  is_published: boolean;
  time_limit?: number;
  max_errors?: number;
  questions_count: number;
  assignments_count: number;
  author_name: string;
  created_at: string;
}

export function TestList() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data } = await api.get<Test[]>("/tests");
      setTests(data);
    } catch (err) {
      console.error("Ошибка загрузки тестов:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (id: number) => {
    if (!confirm("Удалить тест? Все результаты студентов будут потеряны."))
      return;
    try {
      await api.delete(`/tests/${id}`);
      loadTests();
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Не удалось удалить тест");
    }
  };

  const publishTest = async (id: number) => {
    try {
      await api.post(`/tests/${id}/publish`);
      loadTests();
    } catch (err) {
      console.error("Ошибка публикации:", err);
    }
  };

  if (loading) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: "var(--text2)" }}
      >
        Загрузка...
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Мои тесты</h1>

      <button
        onClick={() => navigate("/teacher/test-editor")}
        className="btn-primary"
        style={{ maxWidth: "300px", marginBottom: "24px" }}
      >
        ➕ Создать новый тест
      </button>

      {tests.length === 0 ? (
        <div className="section-card">
          <p
            style={{
              color: "var(--text2)",
              textAlign: "center",
              padding: "40px",
            }}
          >
            Вы ещё не создали ни одного теста
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tests.map((test) => (
            <div key={test.id} className="section-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                {/* Левая часть — информация */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <h2 style={{ margin: 0 }}>{test.title}</h2>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: test.is_published
                          ? "#22c55e"
                          : "var(--surface2)",
                        color: test.is_published ? "white" : "var(--text2)",
                      }}
                    >
                      {test.is_published ? "Опубликован" : "Черновик"}
                    </span>
                  </div>

                  {test.description && (
                    <p
                      style={{
                        color: "var(--text2)",
                        fontSize: "14px",
                        margin: "0 0 8px 0",
                      }}
                    >
                      {test.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "13px",
                      color: "var(--text2)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{test.questions_count} вопросов</span>
                    <span>{test.assignments_count} групп</span>
                    {test.time_limit && (
                      <span>⏱ {Math.round(test.time_limit / 60)} мин</span>
                    )}
                    {test.max_errors && (
                      <span>❌ макс. {test.max_errors} ошибок</span>
                    )}
                    <span>
                      {new Date(test.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Правая часть — кнопки */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexShrink: 0,
                    marginLeft: "16px",
                  }}
                >
                  {!test.is_published && (
                    <button
                      onClick={() => publishTest(test.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Опубликовать
                    </button>
                  )}
                  <button
                    onClick={() => deleteTest(test.id)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--red)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

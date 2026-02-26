// client/src/pages/QuestionEditor.tsx

import { useState, useEffect } from "react";
import { api } from "../api/client";

interface TheoryQuestion {
  id: number;
  question: string;
  answer_mask: string;
  answer_type: "exact" | "keywords" | "regex";
  hint?: string;
  created_by?: number;
}

export function QuestionEditor() {
  const [question, setQuestion] = useState("");
  const [answerMask, setAnswerMask] = useState("");
  const [answerType, setAnswerType] = useState<"exact" | "keywords" | "regex">(
    "exact",
  );
  const [hint, setHint] = useState("");
  const [questions, setQuestions] = useState<TheoryQuestion[]>([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data } = await api.get<TheoryQuestion[]>("/theory-questions");
      setQuestions(data);
    } catch (err) {
      console.error("Ошибка загрузки вопросов:", err);
    }
  };

  const saveQuestion = async () => {
    if (!question.trim() || !answerMask.trim()) {
      alert("Заполните вопрос и маску ответа");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");

      await api.post("/theory-questions", {
        question: question.trim(),
        answer_mask: answerMask.trim(),
        answer_type: answerType,
        hint: hint.trim() || null,
        created_by: userId ? parseInt(userId) : null,
      });

      setQuestion("");
      setAnswerMask("");
      setHint("");
      loadQuestions();
      alert("✅ Вопрос сохранён в базу данных!");
    } catch (err) {
      console.error("Ошибка сохранения вопроса:", err);
      alert("❌ Не удалось сохранить вопрос");
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm("Удалить вопрос из базы данных?")) return;

    try {
      await api.delete(`/theory-questions/${id}`);
      loadQuestions();
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("❌ Не удалось удалить вопрос");
    }
  };

  return (
    <div className="page-container">
      <h1>❓ Редактор теоретических вопросов</h1>

      <div className="section-card">
        <h2>Создать новый вопрос</h2>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            Вопрос
          </label>
          <textarea
            placeholder="Что такое дискриминант?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "12px",
              fontSize: "16px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            Тип проверки
          </label>
          <select
            value={answerType}
            onChange={(e) => setAnswerType(e.target.value as any)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
            }}
          >
            <option value="exact">Точное совпадение (список вариантов)</option>
            <option value="keywords">
              Ключевые слова (все должны присутствовать)
            </option>
            <option value="regex">
              Регулярное выражение (для продвинутых)
            </option>
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            Маска правильного ответа
          </label>

          {answerType === "exact" && (
            <div
              style={{
                marginBottom: "8px",
                fontSize: "14px",
                color: "var(--text2)",
              }}
            >
              Введите варианты через запятую: <code>дискриминант, D, d</code>
            </div>
          )}

          {answerType === "keywords" && (
            <div
              style={{
                marginBottom: "8px",
                fontSize: "14px",
                color: "var(--text2)",
              }}
            >
              Ключевые слова через запятую: <code>корень, уравнение</code>
            </div>
          )}

          {answerType === "regex" && (
            <div
              style={{
                marginBottom: "8px",
                fontSize: "14px",
                color: "var(--text2)",
              }}
            >
              Регулярное выражение: <code>/^d[иы]скр[иы]м[иы]нант$/i</code>
            </div>
          )}

          <input
            type="text"
            placeholder={
              answerType === "exact"
                ? "дискриминант, D, d"
                : answerType === "keywords"
                  ? "корень, уравнение"
                  : "/^d[иы]скр[иы]м[иы]нант$/i"
            }
            value={answerMask}
            onChange={(e) => setAnswerMask(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              fontFamily:
                answerType === "regex" ? "var(--mono)" : "var(--body)",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            Подсказка (опционально)
          </label>
          <input
            type="text"
            placeholder="Формула: D = b² - 4ac"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
            }}
          />
        </div>

        <button onClick={saveQuestion} className="btn-primary">
          Сохранить в базу данных
        </button>
      </div>

      <div className="section-card">
        <h2>Вопросы в базе данных ({questions.length})</h2>

        {questions.length === 0 ? (
          <p style={{ color: "var(--text2)" }}>База пуста</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {questions.map((q, index) => (
              <div
                key={q.id}
                style={{
                  padding: "16px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "var(--text2)",
                        marginBottom: "4px",
                      }}
                    >
                      ID: {q.id} • Вопрос #{index + 1}
                    </div>
                    <h3 style={{ margin: 0 }}>{q.question}</h3>
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
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
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text2)",
                    marginBottom: "4px",
                  }}
                >
                  <strong>Тип:</strong>{" "}
                  {q.answer_type === "exact" && "Точное совпадение"}
                  {q.answer_type === "keywords" && "Ключевые слова"}
                  {q.answer_type === "regex" && "Регулярное выражение"}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text2)",
                    marginBottom: "4px",
                  }}
                >
                  <strong>Маска:</strong>{" "}
                  <code
                    style={{
                      background: "var(--surface)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {q.answer_mask}
                  </code>
                </div>

                {q.hint && (
                  <div style={{ fontSize: "14px", color: "var(--text2)" }}>
                    <strong>Подсказка:</strong> {q.hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

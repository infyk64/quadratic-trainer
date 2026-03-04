import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useParams, useNavigate } from "react-router-dom";

interface SessionResult {
  id: number;
  test_title: string;
  status: string;
  total_questions: number;
  correct_answers: number;
  errors_count: number;
  score_percent: number;
  grade: number;
  grade_excellent: number;
  grade_good: number;
  grade_satisf: number;
  started_at: string;
  finished_at: string;
}

interface AnswerResult {
  id: number;
  question_type: string;
  question_text?: string;
  eq_a?: number;
  eq_b?: number;
  eq_c?: number;
  answer_mask: string;
  student_answer: string;
  is_correct: boolean;
  points: number;
}

export function TestResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionResult | null>(null);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    loadResult();
  }, [sessionId]);

  const loadResult = async () => {
    try {
      const { data } = await api.get(`/tests/sessions/${sessionId}/result`);
      setSession(data.session);
      setAnswers(data.answers);
    } catch (err) {
      console.error("Ошибка загрузки результата:", err);
      alert("Не удалось загрузить результат");
      navigate("/student/tests");
    } finally {
      setLoading(false);
    }
  };

  const formatEquation = (a: number, b: number, c: number): string => {
    const aStr = a === 1 ? "x²" : a === -1 ? "-x²" : `${a}x²`;
    const bStr =
      b === 0
        ? ""
        : b === 1
          ? " + x"
          : b === -1
            ? " - x"
            : b > 0
              ? ` + ${b}x`
              : ` - ${Math.abs(b)}x`;
    const cStr = c === 0 ? "" : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
    return `${aStr}${bStr}${cStr} = 0`;
  };

  const getGradeColor = (grade: number): string => {
    if (grade === 5) return "#22c55e";
    if (grade === 4) return "#84cc16";
    if (grade === 3) return "#f59e0b";
    return "#ef4444";
  };

  const getGradeText = (grade: number): string => {
    if (grade === 5) return "Отлично";
    if (grade === 4) return "Хорошо";
    if (grade === 3) return "Удовлетворительно";
    return "Неудовлетворительно";
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "completed":
        return "Завершён";
      case "failed_time":
        return "Время вышло";
      case "failed_errors":
        return "Превышен лимит ошибок";
      default:
        return status;
    }
  };

  const formatDuration = (start: string, end: string): string => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const totalSec = Math.round(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min === 0) return `${sec} сек`;
    return `${min} мин ${sec} сек`;
  };

  if (loading || !session) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: "var(--text2)" }}
      >
        Загрузка результата...
      </div>
    );
  }

  const gradeColor = getGradeColor(session.grade);

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <h1>Результат теста</h1>

      {/* Основной результат */}
      <div className="section-card" style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: "20px" }}>{session.test_title}</h2>

        {/* Оценка */}
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 40px",
            background: gradeColor + "15",
            borderRadius: "16px",
            border: `2px solid ${gradeColor}`,
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: gradeColor,
              lineHeight: 1,
            }}
          >
            {session.grade}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: gradeColor,
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            {getGradeText(session.grade)}
          </div>
        </div>

        {/* Статистика */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              padding: "16px",
              background: "var(--surface2)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {session.score_percent}%
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text2)",
                marginTop: "4px",
              }}
            >
              Результат
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--surface2)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{ fontSize: "28px", fontWeight: 700, color: "#22c55e" }}
            >
              {session.correct_answers}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text2)",
                marginTop: "4px",
              }}
            >
              Правильных
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--surface2)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{ fontSize: "28px", fontWeight: 700, color: "#ef4444" }}
            >
              {session.errors_count}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text2)",
                marginTop: "4px",
              }}
            >
              Ошибок
            </div>
          </div>
        </div>

        {/* Доп. информация */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "16px",
            fontSize: "13px",
            color: "var(--text2)",
            flexWrap: "wrap",
          }}
        >
          <span>📋 Статус: {getStatusText(session.status)}</span>
          <span>📝 {session.total_questions} вопросов</span>
          {session.finished_at && (
            <span>
              ⏱ Время: {formatDuration(session.started_at, session.finished_at)}
            </span>
          )}
        </div>

        {/* Шкала */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            marginTop: "12px",
            fontSize: "12px",
            color: "var(--text2)",
          }}
        >
          <span>«5» от {session.grade_excellent}%</span>
          <span>«4» от {session.grade_good}%</span>
          <span>«3» от {session.grade_satisf}%</span>
        </div>
      </div>

      {/* Разбор ответов */}
      <div className="section-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Разбор ответов</h2>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            style={{
              padding: "6px 14px",
              background: "var(--surface2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {showAnswers ? "Скрыть" : "Показать"}
          </button>
        </div>

        {showAnswers && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            {answers.map((a, i) => (
              <div
                key={a.id}
                style={{
                  padding: "12px",
                  background: a.is_correct ? "#f0fdf420" : "#fef2f220",
                  border: `1px solid ${a.is_correct ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "var(--text2)" }}>
                    #{i + 1} •
                    {a.question_type === "equation"
                      ? "Уравнение"
                      : a.question_type === "theory"
                        ? "Теория"
                        : "Вопрос"}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: a.is_correct ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {a.is_correct ? "Верно" : "Неверно"}
                  </span>
                </div>

                <div
                  style={{
                    color: "var(--text)",
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  {a.question_type === "equation"
                    ? formatEquation(a.eq_a!, a.eq_b!, a.eq_c!)
                    : a.question_text}
                </div>

                <div style={{ fontSize: "13px" }}>
                  <span style={{ color: "var(--text2)" }}>Ваш ответ: </span>
                  <span
                    style={{
                      color: a.is_correct ? "#22c55e" : "#ef4444",
                      fontWeight: 500,
                    }}
                  >
                    {a.student_answer || "(пусто)"}
                  </span>
                </div>

                {!a.is_correct && (
                  <div style={{ fontSize: "13px", marginTop: "2px" }}>
                    <span style={{ color: "var(--text2)" }}>
                      Правильный ответ:{" "}
                    </span>
                    <span style={{ color: "#22c55e", fontWeight: 500 }}>
                      {a.answer_mask}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка возврата */}
      <button
        onClick={() => navigate("/student/tests")}
        className="btn-primary"
        style={{ marginTop: "0" }}
      >
        ← Вернуться к списку тестов
      </button>
    </div>
  );
}

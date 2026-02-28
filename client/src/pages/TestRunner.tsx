import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api/client";
import { useParams, useNavigate, useLocation } from "react-router-dom";

interface TestQuestion {
  id: number;
  question_type: "equation" | "theory" | "open";
  eq_a?: number;
  eq_b?: number;
  eq_c?: number;
  question_text?: string;
  hint?: string;
  sort_order: number;
  points: number;
}

interface TestData {
  id: number;
  title: string;
  time_limit?: number;
  max_errors?: number;
  questions: TestQuestion[];
}

interface SessionData {
  id: number;
  started_at: string;
  errors_count: number;
  correct_answers: number;
  status: string;
}

export function TestRunner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const testId = (location.state as any)?.testId;

  const [test, setTest] = useState<TestData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; expected?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [errorsCount, setErrorsCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Загрузка теста и сессии
  useEffect(() => {
    if (!testId || !sessionId) return;

    const load = async () => {
      try {
        const { data: testData } = await api.get(`/tests/${testId}`);
        setTest(testData);

        // Если есть таймер — рассчитываем оставшееся время
        if (testData.time_limit) {
          // Получаем сессию для started_at
          const sessionIdNum = parseInt(sessionId);
          // Время сессии берём из started_at
          setSession({ id: sessionIdNum, started_at: new Date().toISOString(), errors_count: 0, correct_answers: 0, status: "in_progress" });

          // Таймер будет установлен после получения сессии
          setTimeLeft(testData.time_limit);
        }
      } catch (err) {
        console.error("Ошибка загрузки теста:", err);
        alert("❌ Не удалось загрузить тест");
        navigate("/student/tests");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [testId, sessionId]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || finished) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Время вышло
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, finished]);

  // Фокус на input при смене вопроса
  useEffect(() => {
    if (inputRef.current && !feedback) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback]);

  const handleTimeUp = useCallback(async () => {
    if (finished) return;
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await api.post(`/tests/sessions/${sessionId}/finish`);
    } catch {}

    alert("⏱ Время вышло!");
    navigate(`/student/test-result/${sessionId}`);
  }, [sessionId, finished, navigate]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatEquation = (a: number, b: number, c: number): string => {
    const aStr = a === 1 ? "x²" : a === -1 ? "-x²" : `${a}x²`;
    const bStr = b === 0 ? "" : b === 1 ? " + x" : b === -1 ? " - x" : b > 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`;
    const cStr = c === 0 ? "" : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
    return `${aStr}${bStr}${cStr} = 0`;
  };

  const submitAnswer = async () => {
    if (!test || !sessionId || submitting || feedback) return;

    const currentQuestion = test.questions[currentIndex];
    if (!answer.trim()) {
      alert("Введите ответ");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/tests/sessions/${sessionId}/answer`, {
        question_id: currentQuestion.id,
        student_answer: answer.trim(),
      });

      // Проверка: тест прерван по ошибкам
      if (data.status === "failed_errors") {
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
        setFeedback({ isCorrect: false, expected: data.expected });
        setErrorsCount((prev) => prev + 1);

        setTimeout(() => {
          alert("❌ Превышен лимит ошибок. Тест завершён.");
          navigate(`/student/test-result/${sessionId}`);
        }, 1500);
        return;
      }

      setFeedback(data);

      if (data.isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setErrorsCount((prev) => prev + 1);
      }
    } catch (err: any) {
      // Время вышло на сервере
      if (err.response?.data?.status === "failed_time") {
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
        alert("⏱ Время вышло!");
        navigate(`/student/test-result/${sessionId}`);
        return;
      }
      console.error("Ошибка отправки ответа:", err);
      alert("❌ " + (err.response?.data?.error || "Ошибка"));
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = async () => {
    const isLast = currentIndex >= test!.questions.length - 1;

    if (isLast) {
      // Завершаем тест
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);

      try {
        await api.post(`/tests/sessions/${sessionId}/finish`);
      } catch {}

      navigate(`/student/test-result/${sessionId}`);
      return;
    }

    // Следующий вопрос
    setCurrentIndex((prev) => prev + 1);
    setAnswer("");
    setFeedback(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (feedback) {
        nextQuestion();
      } else {
        submitAnswer();
      }
    }
  };

  if (loading || !test) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text2)" }}>
        Загрузка теста...
      </div>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const progress = ((currentIndex + (feedback ? 1 : 0)) / test.questions.length) * 100;

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      {/* Заголовок с таймером */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "20px" }}>{test.title}</h1>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {test.max_errors && (
            <span style={{
              fontSize: "14px",
              color: errorsCount >= test.max_errors - 1 ? "#ef4444" : "var(--text2)",
              fontWeight: 600,
            }}>
              ❌ {errorsCount}/{test.max_errors}
            </span>
          )}
          {timeLeft !== null && (
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                fontFamily: "monospace",
                color: timeLeft < 60 ? "#ef4444" : timeLeft < 180 ? "#f59e0b" : "var(--text)",
                padding: "4px 12px",
                background: "var(--surface2)",
                borderRadius: "6px",
              }}
            >
              ⏱ {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Прогресс-бар */}
      <div style={{ background: "var(--surface2)", borderRadius: "4px", height: "6px", marginBottom: "20px" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#6366f1",
            borderRadius: "4px",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Счётчик вопросов */}
      <div style={{ textAlign: "center", fontSize: "14px", color: "var(--text2)", marginBottom: "16px" }}>
        Вопрос {currentIndex + 1} из {test.questions.length} • ✅ {correctCount} • ❌ {errorsCount}
      </div>

      {/* Вопрос */}
      <div className="section-card">
        <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "12px" }}>
          {currentQuestion.question_type === "equation" && "📐 Уравнение"}
          {currentQuestion.question_type === "theory" && "📚 Теоретический вопрос"}
          {currentQuestion.question_type === "open" && "✏️ Открытый вопрос"}
          {" • "}{currentQuestion.points} балл(ов)
        </div>

        {/* Текст вопроса */}
        {currentQuestion.question_type === "equation" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--text)",
                background: "var(--surface2)",
                padding: "20px",
                borderRadius: "12px",
                display: "inline-block",
              }}
            >
              {formatEquation(currentQuestion.eq_a!, currentQuestion.eq_b!, currentQuestion.eq_c!)}
            </div>
            <p style={{ color: "var(--text2)", marginTop: "12px", fontSize: "14px" }}>
              Найдите корни уравнения. Если корней два — введите через запятую. Если нет — напишите «нет корней».
            </p>
          </div>
        ) : (
          <div style={{ fontSize: "17px", color: "var(--text)", lineHeight: "1.6", padding: "8px 0" }}>
            {currentQuestion.question_text}
          </div>
        )}

        {/* Подсказка */}
        {currentQuestion.hint && !feedback && (
          <div style={{
            padding: "8px 12px",
            background: "var(--surface2)",
            borderRadius: "6px",
            fontSize: "13px",
            color: "var(--text2)",
            marginTop: "8px",
          }}>
            💡 Подсказка: {currentQuestion.hint}
          </div>
        )}

        {/* Поле ввода ответа */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text)", fontWeight: 600 }}>
            Ваш ответ:
          </label>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!feedback || finished}
            placeholder={
              currentQuestion.question_type === "equation"
                ? "Например: 2, -3 или нет корней"
                : "Введите ответ..."
            }
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "18px",
              background: feedback
                ? feedback.isCorrect ? "#f0fdf4" : "#fef2f2"
                : "var(--surface2)",
              color: "var(--text)",
              border: feedback
                ? `2px solid ${feedback.isCorrect ? "#22c55e" : "#ef4444"}`
                : "1px solid var(--border)",
              borderRadius: "8px",
              outline: "none",
              transition: "all 0.2s",
            }}
          />
        </div>

        {/* Результат ответа */}
        {feedback && (
          <div
            style={{
              marginTop: "14px",
              padding: "14px",
              borderRadius: "8px",
              background: feedback.isCorrect ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${feedback.isCorrect ? "#bbf7d0" : "#fecaca"}`,
              color: feedback.isCorrect ? "#16a34a" : "#dc2626",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            {feedback.isCorrect ? "✅ Верно!" : `❌ Неверно. Правильный ответ: ${feedback.expected}`}
          </div>
        )}

        {/* Кнопки */}
        <div style={{ marginTop: "20px" }}>
          {!feedback ? (
            <button
              onClick={submitAnswer}
              className="btn-primary"
              disabled={!answer.trim() || submitting || finished}
            >
              {submitting ? "Проверка..." : "Проверить (Enter)"}
            </button>
          ) : (
            <button onClick={nextQuestion} className="btn-primary">
              {currentIndex >= test.questions.length - 1
                ? "🏁 Завершить тест (Enter)"
                : "Следующий вопрос → (Enter)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api/client";
import { useParams, useNavigate, useLocation } from "react-router-dom";

interface ChoiceOption {
  text: string;
  isCorrect: boolean;
}

interface TestQuestion {
  id: number;
  question_type:
    | "equation"
    | "theory"
    | "open"
    | "single_choice"
    | "multi_choice"
    | "generated_equation";
  eq_a?: number;
  eq_b?: number;
  eq_c?: number;
  question_text?: string;
  hint?: string;
  sort_order: number;
  points: number;
  options?: ChoiceOption[];
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

// Перемешивание массива (Fisher-Yates)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TestRunner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const testId = (location.state as { testId?: number })?.testId;

  const [test, setTest] = useState<TestData | null>(null);
  const [_session, setSession] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<
    { text: string; originalIndex: number }[]
  >([]);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    expected?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [errorsCount, setErrorsCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!testId || !sessionId) return;
    const load = async () => {
      try {
        const { data: testData } = await api.get(`/tests/${testId}`);

        // Загружаем сгенерированные вопросы для этой сессии
        let generatedQuestions: TestQuestion[] = [];
        try {
          const { data: genData } = await api.get(
            `/tests/sessions/${sessionId}/generated-questions`,
          );
          generatedQuestions = genData.map(
            (gq: {
              id: number;
              eq_a: number;
              eq_b: number;
              eq_c: number;
              points: number;
              sort_order: number;
            }) => ({
              id: gq.id,
              question_type: "generated_equation" as const,
              eq_a: gq.eq_a,
              eq_b: gq.eq_b,
              eq_c: gq.eq_c,
              points: gq.points,
              sort_order: gq.sort_order,
            }),
          );
        } catch (_e) {
          /* сгенерированных вопросов может не быть */
        }

        // Объединяем: ручные + сгенерированные
        const allQuestions = [...testData.questions, ...generatedQuestions];
        setTest({ ...testData, questions: allQuestions });

        if (testData.time_limit) {
          const sessionIdNum = parseInt(sessionId);
          setSession({
            id: sessionIdNum,
            started_at: new Date().toISOString(),
            errors_count: 0,
            correct_answers: 0,
            status: "in_progress",
          });
          setTimeLeft(testData.time_limit);
        }
      } catch (err) {
        console.error("Ошибка загрузки теста:", err);
        alert("Не удалось загрузить тест");
        navigate("/student/tests");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId, sessionId]);

  // Перемешиваем варианты при смене вопроса
  useEffect(() => {
    if (!test) return;
    const q = test.questions[currentIndex];
    if (
      (q.question_type === "single_choice" ||
        q.question_type === "multi_choice") &&
      q.options
    ) {
      const indexed = q.options.map((o, i) => ({
        text: o.text,
        originalIndex: i,
      }));
      setShuffledOptions(shuffleArray(indexed));
      setSelectedChoices([]);
    }
  }, [currentIndex, test]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
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

  useEffect(() => {
    if (inputRef.current && !feedback) inputRef.current.focus();
  }, [currentIndex, feedback]);

  const handleTimeUp = useCallback(async () => {
    if (finished) return;
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await api.post(`/tests/sessions/${sessionId}/finish`);
    } catch (_e) {
      /* ignore */
    }
    alert("Время вышло!");
    navigate(`/student/test-result/${sessionId}`);
  }, [sessionId, finished, navigate]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

  const toggleChoice = (shuffledIdx: number) => {
    if (feedback || finished) return;
    const q = test!.questions[currentIndex];
    if (q.question_type === "single_choice") {
      setSelectedChoices([shuffledIdx]);
    } else {
      setSelectedChoices((prev) =>
        prev.includes(shuffledIdx)
          ? prev.filter((i) => i !== shuffledIdx)
          : [...prev, shuffledIdx],
      );
    }
  };

  const submitAnswer = async () => {
    if (!test || !sessionId || submitting || feedback) return;
    const currentQuestion = test.questions[currentIndex];

    let studentAnswer: string;

    if (
      currentQuestion.question_type === "single_choice" ||
      currentQuestion.question_type === "multi_choice"
    ) {
      if (selectedChoices.length === 0) {
        alert("Выберите вариант ответа");
        return;
      }
      // Отправляем оригинальные индексы правильных
      const originalIndices = selectedChoices
        .map((si) => shuffledOptions[si].originalIndex)
        .sort((a, b) => a - b);
      studentAnswer = originalIndices.join(",");
    } else {
      if (!answer.trim()) {
        alert("Введите ответ");
        return;
      }
      studentAnswer = answer.trim();
    }

    setSubmitting(true);
    try {
      let data;
      if (currentQuestion.question_type === "generated_equation") {
        // Сгенерированный вопрос — отправляем на отдельный endpoint
        const resp = await api.post(
          `/tests/sessions/${sessionId}/answer-generated`,
          {
            question_id: currentQuestion.id,
            student_answer: studentAnswer,
          },
        );
        data = resp.data;
      } else {
        // Обычный вопрос
        const resp = await api.post(`/tests/sessions/${sessionId}/answer`, {
          question_id: currentQuestion.id,
          student_answer: studentAnswer,
        });
        data = resp.data;
      }

      if (data.status === "failed_errors") {
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
        setFeedback({ isCorrect: false, expected: data.expected });
        setErrorsCount((prev) => prev + 1);
        setTimeout(() => {
          alert("Превышен лимит ошибок. Тест завершён.");
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
      if (err.response?.data?.status === "failed_time") {
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
        alert("Время вышло!");
        navigate(`/student/test-result/${sessionId}`);
        return;
      }
      console.error("Ошибка:", err);
      alert(err.response?.data?.error || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = async () => {
    const isLast = currentIndex >= test!.questions.length - 1;
    if (isLast) {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        await api.post(`/tests/sessions/${sessionId}/finish`);
      } catch (_e) {
        /* ignore */
      }
      navigate(`/student/test-result/${sessionId}`);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setAnswer("");
    setSelectedChoices([]);
    setFeedback(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (feedback) nextQuestion();
      else submitAnswer();
    }
  };

  if (loading || !test) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: "var(--text2)" }}
      >
        Загрузка теста...
      </div>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const progress =
    ((currentIndex + (feedback ? 1 : 0)) / test.questions.length) * 100;
  const isChoiceQuestion =
    currentQuestion.question_type === "single_choice" ||
    currentQuestion.question_type === "multi_choice";

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
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
            <span
              style={{
                fontSize: "14px",
                color:
                  errorsCount >= test.max_errors - 1
                    ? "#ef4444"
                    : "var(--text2)",
                fontWeight: 600,
              }}
            >
              Ошибки: {errorsCount}/{test.max_errors}
            </span>
          )}
          {timeLeft !== null && (
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                fontFamily: "monospace",
                color:
                  timeLeft < 60
                    ? "#ef4444"
                    : timeLeft < 180
                      ? "#f59e0b"
                      : "var(--text)",
                padding: "4px 12px",
                background: "var(--surface2)",
                borderRadius: "6px",
              }}
            >
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          background: "var(--surface2)",
          borderRadius: "4px",
          height: "6px",
          marginBottom: "20px",
        }}
      >
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

      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: "var(--text2)",
          marginBottom: "16px",
        }}
      >
        Вопрос {currentIndex + 1} из {test.questions.length} | Верно:{" "}
        {correctCount} | Ошибок: {errorsCount}
      </div>

      <div className="section-card">
        <div
          style={{
            fontSize: "13px",
            color: "var(--text2)",
            marginBottom: "12px",
          }}
        >
          {currentQuestion.question_type === "equation" && "Уравнение"}
          {currentQuestion.question_type === "generated_equation" &&
            "Уравнение (индивидуальное)"}
          {currentQuestion.question_type === "theory" && "Теоретический вопрос"}
          {currentQuestion.question_type === "open" && "Открытый вопрос"}
          {currentQuestion.question_type === "single_choice" &&
            "Выберите один ответ"}
          {currentQuestion.question_type === "multi_choice" &&
            "Выберите все правильные ответы"}
          {" | "}
          {currentQuestion.points} балл(ов)
        </div>

        {currentQuestion.question_type === "equation" ||
        currentQuestion.question_type === "generated_equation" ? (
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
              {formatEquation(
                currentQuestion.eq_a!,
                currentQuestion.eq_b!,
                currentQuestion.eq_c!,
              )}
            </div>
            <p
              style={{
                color: "var(--text2)",
                marginTop: "12px",
                fontSize: "14px",
              }}
            >
              Найдите корни. Два корня — через запятую. Нет корней — напишите
              «нет корней».
            </p>
          </div>
        ) : (
          <div
            style={{
              fontSize: "17px",
              color: "var(--text)",
              lineHeight: "1.6",
              padding: "8px 0",
            }}
          >
            {currentQuestion.question_text}
          </div>
        )}

        {currentQuestion.hint && !feedback && (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--surface2)",
              borderRadius: "6px",
              fontSize: "13px",
              color: "var(--text2)",
              marginTop: "8px",
            }}
          >
            Подсказка: {currentQuestion.hint}
          </div>
        )}

        {/* Варианты ответа для закрытых вопросов */}
        {isChoiceQuestion && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {shuffledOptions.map((opt, si) => {
              const isSelected = selectedChoices.includes(si);
              let bg = isSelected ? "var(--accent2)" : "var(--surface2)";
              let borderColor = isSelected ? "var(--accent)" : "var(--border)";

              // После фидбэка показываем правильные/неправильные
              if (feedback && currentQuestion.options) {
                const origIdx = opt.originalIndex;
                const isCorrectOption =
                  currentQuestion.options[origIdx]?.isCorrect;
                if (isCorrectOption) {
                  bg = "#f0fdf4";
                  borderColor = "#22c55e";
                } else if (isSelected && !isCorrectOption) {
                  bg = "#fef2f2";
                  borderColor = "#ef4444";
                }
              }

              return (
                <button
                  key={si}
                  onClick={() => toggleChoice(si)}
                  disabled={!!feedback || finished}
                  style={{
                    padding: "14px 16px",
                    background: bg,
                    border: `2px solid ${borderColor}`,
                    borderRadius: "8px",
                    cursor: feedback ? "default" : "pointer",
                    color: "var(--text)",
                    fontSize: "15px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius:
                        currentQuestion.question_type === "single_choice"
                          ? "50%"
                          : "4px",
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      background: isSelected ? "var(--accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && "✓"}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Поле ввода для открытых вопросов */}
        {!isChoiceQuestion && (
          <div style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
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
                  ? feedback.isCorrect
                    ? "#f0fdf4"
                    : "#fef2f2"
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
        )}

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
            {feedback.isCorrect
              ? "Верно!"
              : `Неверно.${feedback.expected ? " Правильный ответ: " + feedback.expected : ""}`}
          </div>
        )}

        <div style={{ marginTop: "20px" }}>
          {!feedback ? (
            <button
              onClick={submitAnswer}
              className="btn-primary"
              disabled={
                (isChoiceQuestion
                  ? selectedChoices.length === 0
                  : !answer.trim()) ||
                submitting ||
                finished
              }
            >
              {submitting ? "Проверка..." : "Проверить (Enter)"}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="btn-primary"
              onKeyDown={handleKeyDown}
            >
              {currentIndex >= test.questions.length - 1
                ? "Завершить тест (Enter)"
                : "Следующий вопрос (Enter)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

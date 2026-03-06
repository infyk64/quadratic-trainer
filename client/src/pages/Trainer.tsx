import { useState } from "react";
import { api } from "../api/client";
import { EquationCard } from "../components/EquationCard";
import { AnswerOptions } from "../components/AnswerOptions";
import { ModeSelector } from "../components/ModeSelector";
import { Solution } from "../components/Solution";
import type { Question } from "../types/index";

type Mode = "full" | "incomplete" | "random";
type InputMode = "options" | "keyboard";

interface TheoryQ {
  id: number;
  question: string;
  answer_mask: string;
  answer_type: string;
  hint?: string;
}

export function Trainer() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mode, setMode] = useState<Mode>("random");
  const [inputMode, setInputMode] = useState<InputMode>("options");
  const [includeTheory, setIncludeTheory] = useState(false);

  // Для открытого ввода
  const [openAnswer, setOpenAnswer] = useState("");
  const [openResult, setOpenResult] = useState<{
    isCorrect: boolean;
    expected?: string;
  } | null>(null);

  // Для теоретических вопросов
  const [theoryQuestion, setTheoryQuestion] = useState<TheoryQ | null>(null);
  const [theoryAnswer, setTheoryAnswer] = useState("");
  const [theoryResult, setTheoryResult] = useState<{
    isCorrect: boolean;
    expected?: string;
  } | null>(null);
  const [isTheoryRound, setIsTheoryRound] = useState(false);

  const loadQuestion = async () => {
    // Если включена теория — чередуем (каждый 3-й вопрос — теория)
    if (includeTheory && (score.total + 1) % 3 === 0) {
      try {
        const { data: questions } =
          await api.get<TheoryQ[]>("/theory-questions");
        if (questions.length > 0) {
          const randomQ =
            questions[Math.floor(Math.random() * questions.length)];
          setTheoryQuestion(randomQ);
          setIsTheoryRound(true);
          setTheoryAnswer("");
          setTheoryResult(null);
          setQuestion(null);
          return;
        }
      } catch (err) {
        console.error("Ошибка загрузки теории:", err);
      }
    }

    // Обычный вопрос (уравнение)
    const { data } = await api.get<Question>(
      `/questions/generate?mode=${mode}`,
    );
    setQuestion(data);
    setIsTheoryRound(false);
    setTheoryQuestion(null);
    setSelected([]);
    setChecked(false);
    setOpenAnswer("");
    setOpenResult(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setQuestion(null);
    setTheoryQuestion(null);
    setIsTheoryRound(false);
    setSelected([]);
    setChecked(false);
    setOpenAnswer("");
    setOpenResult(null);
    setTheoryAnswer("");
    setTheoryResult(null);
  };

  // Проверка ответа (варианты)
  const checkOptionsAnswer = async () => {
    if (!question || selected.length === 0) return;

    const correctIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id);
    const isCorrect =
      correctIds.length === selected.length &&
      correctIds.every((id) => selected.includes(id));

    setChecked(true);
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));

    try {
      await api.post("/attempts", {
        userId: parseInt(localStorage.getItem("userId") || "0"),
        isCorrect,
      });
    } catch (err) {
      console.error("Ошибка сохранения:", err);
    }
  };

  // Проверка ответа (открытый ввод)
  const checkOpenAnswer = async () => {
    if (!question || !openAnswer.trim()) return;

    try {
      const { data } = await api.post("/answers/check-open", {
        answer: openAnswer.trim(),
        equation: {
          a: question.equation.a,
          b: question.equation.b,
          c: question.equation.c,
        },
      });

      setOpenResult(data);
      setChecked(true);
      setScore((s) => ({
        correct: s.correct + (data.isCorrect ? 1 : 0),
        total: s.total + 1,
      }));

      await api.post("/attempts", {
        userId: parseInt(localStorage.getItem("userId") || "0"),
        isCorrect: data.isCorrect,
      });
    } catch (err) {
      console.error("Ошибка проверки:", err);
    }
  };

  // Проверка теоретического вопроса
  const checkTheoryAnswer = async () => {
    if (!theoryQuestion || !theoryAnswer.trim()) return;

    try {
      const { data } = await api.post("/answers/check-open", {
        answer: theoryAnswer.trim(),
        answerMask: theoryQuestion.answer_mask,
        answerType: theoryQuestion.answer_type,
      });

      setTheoryResult(data);
      setScore((s) => ({
        correct: s.correct + (data.isCorrect ? 1 : 0),
        total: s.total + 1,
      }));

      await api.post("/attempts", {
        userId: parseInt(localStorage.getItem("userId") || "0"),
        isCorrect: data.isCorrect,
        question_type: "theory",
      });
    } catch (err) {
      console.error("Ошибка проверки:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isTheoryRound && !theoryResult) checkTheoryAnswer();
      else if (!isTheoryRound && inputMode === "keyboard" && !openResult)
        checkOpenAnswer();
    }
  };

  return (
    <div className="trainer-page">
      <h1>Квадратные уравнения</h1>

      <div className="score">
        {score.correct} / {score.total}
      </div>

      <ModeSelector mode={mode} onChange={handleModeChange} />

      {/* Переключатель режима ввода */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button
          onClick={() => setInputMode("options")}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            cursor: "pointer",
            border:
              inputMode === "options"
                ? "2px solid #6366f1"
                : "1px solid #e0e0e0",
            background: inputMode === "options" ? "#eef2ff" : "white",
            color: inputMode === "options" ? "#6366f1" : "#666",
          }}
        >
          Варианты
        </button>
        <button
          onClick={() => setInputMode("keyboard")}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            cursor: "pointer",
            border:
              inputMode === "keyboard"
                ? "2px solid #6366f1"
                : "1px solid #e0e0e0",
            background: inputMode === "keyboard" ? "#eef2ff" : "white",
            color: inputMode === "keyboard" ? "#6366f1" : "#666",
          }}
        >
          С клавиатуры
        </button>
      </div>

      {/* Чекбокс теории */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center",
          fontSize: "13px",
          color: "#666",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={includeTheory}
          onChange={(e) => setIncludeTheory(e.target.checked)}
        />
        Включить вопросы по теории
      </label>

      {!question && !theoryQuestion && (
        <button className="btn-primary" onClick={loadQuestion}>
          Начать тренировку
        </button>
      )}

      {/* ===== Теоретический вопрос ===== */}
      {isTheoryRound && theoryQuestion && (
        <>
          <div
            style={{
              background: "#f8f9ff",
              border: "1px solid #e0e4ff",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}
            >
              Вопрос по теории
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: 600, color: "#1a1a2e" }}
            >
              {theoryQuestion.question}
            </div>
            {theoryQuestion.hint && !theoryResult && (
              <div
                style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}
              >
                {theoryQuestion.hint}
              </div>
            )}
          </div>

          <input
            type="text"
            value={theoryAnswer}
            onChange={(e) => setTheoryAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!theoryResult}
            placeholder="Введите ответ..."
            autoFocus
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              borderRadius: "8px",
              border: theoryResult
                ? `2px solid ${theoryResult.isCorrect ? "#22c55e" : "#ef4444"}`
                : "1px solid #e0e0e0",
              background: theoryResult
                ? theoryResult.isCorrect
                  ? "#f0fdf4"
                  : "#fef2f2"
                : "white",
              textAlign: "center",
              outline: "none",
            }}
          />

          {theoryResult && (
            <div
              className={`result ${theoryResult.isCorrect ? "result-correct" : "result-wrong"}`}
            >
              {theoryResult.isCorrect
                ? "Верно!"
                : `Неверно. Правильный ответ: ${theoryResult.expected}`}
            </div>
          )}

          {!theoryResult ? (
            <button
              className="btn-primary"
              onClick={checkTheoryAnswer}
              disabled={!theoryAnswer.trim()}
            >
              Проверить
            </button>
          ) : (
            <button className="btn-primary" onClick={loadQuestion}>
              Следующее →
            </button>
          )}
        </>
      )}

      {/* ===== Уравнение ===== */}
      {question && !isTheoryRound && (
        <>
          <EquationCard
            a={question.equation.a}
            b={question.equation.b}
            c={question.equation.c}
          />

          {/* Режим вариантов */}
          {inputMode === "options" && (
            <>
              <p className="hint">Выбери все правильные корни:</p>
              <AnswerOptions
                options={question.options}
                selected={selected}
                onChange={setSelected}
                disabled={checked}
              />

              {checked && (
                <>
                  <div
                    className={`result ${
                      question.options
                        .filter((o) => o.isCorrect)
                        .every((o) => selected.includes(o.id))
                        ? "result-correct"
                        : "result-wrong"
                    }`}
                  >
                    {question.options
                      .filter((o) => o.isCorrect)
                      .every((o) => selected.includes(o.id))
                      ? "Верно!"
                      : `Неверно. Правильный ответ: ${question.options
                          .filter((o) => o.isCorrect)
                          .map((o) => o.label)
                          .join(", ")}`}
                  </div>
                  <Solution
                    a={question.equation.a}
                    b={question.equation.b}
                    c={question.equation.c}
                    discriminant={question.equation.discriminant}
                    roots={question.equation.roots}
                  />
                </>
              )}

              {!checked ? (
                <button
                  className="btn-primary"
                  onClick={checkOptionsAnswer}
                  disabled={selected.length === 0}
                >
                  Проверить
                </button>
              ) : (
                <button className="btn-primary" onClick={loadQuestion}>
                  Следующее →
                </button>
              )}
            </>
          )}

          {/* Режим клавиатуры */}
          {inputMode === "keyboard" && (
            <>
              <p className="hint">Введите корни уравнения:</p>

              <input
                type="text"
                value={openAnswer}
                onChange={(e) => setOpenAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!!openResult}
                placeholder="Например: 2, -3 или «нет корней»"
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "18px",
                  borderRadius: "8px",
                  border: openResult
                    ? `2px solid ${openResult.isCorrect ? "#22c55e" : "#ef4444"}`
                    : "1px solid #e0e0e0",
                  background: openResult
                    ? openResult.isCorrect
                      ? "#f0fdf4"
                      : "#fef2f2"
                    : "white",
                  textAlign: "center",
                  outline: "none",
                }}
              />

              {/* Быстрые кнопки */}
              {!openResult && (
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {["нет корней"].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setOpenAnswer(hint)}
                      style={{
                        padding: "4px 10px",
                        background: "#f8f9ff",
                        border: "1px solid #e0e4ff",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#6366f1",
                      }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              )}

              {openResult && (
                <>
                  <div
                    className={`result ${openResult.isCorrect ? "result-correct" : "result-wrong"}`}
                  >
                    {openResult.isCorrect
                      ? "Верно!"
                      : `Неверно. Правильный ответ: ${openResult.expected}`}
                  </div>
                  <Solution
                    a={question.equation.a}
                    b={question.equation.b}
                    c={question.equation.c}
                    discriminant={question.equation.discriminant}
                    roots={question.equation.roots}
                  />
                </>
              )}

              {!openResult ? (
                <button
                  className="btn-primary"
                  onClick={checkOpenAnswer}
                  disabled={!openAnswer.trim()}
                >
                  Проверить (Enter)
                </button>
              ) : (
                <button className="btn-primary" onClick={loadQuestion}>
                  Следующее →
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

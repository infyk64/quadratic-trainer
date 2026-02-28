import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

interface TestQuestion {
  question_type: "equation" | "theory" | "open";
  eq_a?: number;
  eq_b?: number;
  eq_c?: number;
  question_text?: string;
  answer_mask: string;
  answer_type: "exact" | "keywords" | "regex" | "numeric";
  hint?: string;
  points: number;
}

interface Group {
  id: number;
  name: string;
}

export function TestEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [maxErrors, setMaxErrors] = useState<number | "">("");
  const [gradeExcellent, setGradeExcellent] = useState(90);
  const [gradeGood, setGradeGood] = useState(75);
  const [gradeSatisf, setGradeSatisf] = useState(60);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  const [qType, setQType] = useState<"equation" | "theory" | "open">(
    "equation",
  );
  const [eqA, setEqA] = useState(1);
  const [eqB, setEqB] = useState(0);
  const [eqC, setEqC] = useState(-4);
  const [qText, setQText] = useState("");
  const [qMask, setQMask] = useState("");
  const [qAnswerType, setQAnswerType] = useState<
    "exact" | "keywords" | "regex" | "numeric"
  >("exact");
  const [qHint, setQHint] = useState("");
  const [qPoints, setQPoints] = useState(1);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  useEffect(() => {
    api
      .get("/groups")
      .then(({ data }) => setGroups(data))
      .catch(console.error);
  }, []);

  const formatEq = (a: number, b: number, c: number) => {
    const aS = a === 1 ? "x\u00B2" : a === -1 ? "-x\u00B2" : a + "x\u00B2";
    const bS =
      b === 0
        ? ""
        : b === 1
          ? " + x"
          : b === -1
            ? " - x"
            : b > 0
              ? " + " + b + "x"
              : " - " + Math.abs(b) + "x";
    const cS = c === 0 ? "" : c > 0 ? " + " + c : " - " + Math.abs(c);
    return aS + bS + cS + " = 0";
  };

  const computeRoots = () => {
    const D = eqB * eqB - 4 * eqA * eqC;
    if (D < 0) return "Нет корней";
    const r = (n: number) => Math.round(n * 100) / 100;
    if (D === 0) return "x = " + r(-eqB / (2 * eqA));
    return (
      "x1 = " +
      r((-eqB + Math.sqrt(D)) / (2 * eqA)) +
      ", x2 = " +
      r((-eqB - Math.sqrt(D)) / (2 * eqA))
    );
  };

  const computeMask = (): string => {
    const D = eqB * eqB - 4 * eqA * eqC;
    if (D < 0) return "нет корней";
    const r = (n: number) => Math.round(n * 100) / 100;
    if (D === 0) return String(r(-eqB / (2 * eqA)));
    const x1 = r((-eqB + Math.sqrt(D)) / (2 * eqA));
    const x2 = r((-eqB - Math.sqrt(D)) / (2 * eqA));
    return [x1, x2].sort((a, b) => a - b).join(", ");
  };

  const addQuestion = () => {
    let newQ: TestQuestion;
    if (qType === "equation") {
      if (eqA === 0) {
        alert("a не может быть 0");
        return;
      }
      newQ = {
        question_type: "equation",
        eq_a: eqA,
        eq_b: eqB,
        eq_c: eqC,
        answer_mask: computeMask(),
        answer_type: "numeric",
        hint: qHint || undefined,
        points: qPoints,
      };
    } else {
      if (!qText.trim() || !qMask.trim()) {
        alert("Заполните вопрос и маску");
        return;
      }
      newQ = {
        question_type: qType,
        question_text: qText.trim(),
        answer_mask: qMask.trim(),
        answer_type: qAnswerType,
        hint: qHint || undefined,
        points: qPoints,
      };
    }
    setQuestions([...questions, newQ]);
    setQText("");
    setQMask("");
    setQHint("");
    setQPoints(1);
  };

  const removeQuestion = (i: number) =>
    setQuestions(questions.filter((_, idx) => idx !== i));

  const moveQuestion = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const arr = [...questions];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setQuestions(arr);
  };

  const saveTest = async () => {
    if (!title.trim()) {
      alert("Введите название");
      return;
    }
    if (questions.length === 0) {
      alert("Добавьте вопросы");
      return;
    }
    setSaving(true);
    try {
      const { data: test } = await api.post("/tests", {
        title: title.trim(),
        description: description.trim() || null,
        time_limit: timeLimit ? Number(timeLimit) * 60 : null,
        max_errors: maxErrors || null,
        grade_excellent: gradeExcellent,
        grade_good: gradeGood,
        grade_satisf: gradeSatisf,
        questions,
      });
      for (const gid of selectedGroups) {
        try {
          await api.post("/tests/" + test.id + "/assign", { group_id: gid });
        } catch (e) {
          console.error(e);
        }
      }
      alert(
        "Тест " + test.title + " создан! (" + questions.length + " вопросов)",
      );
      navigate("/teacher");
    } catch (err: any) {
      alert(err.response?.data?.error || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    fontSize: "15px",
    background: "var(--surface2)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
  };
  const lbl: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    color: "var(--text)",
    fontSize: "14px",
    fontWeight: 600,
  };

  return (
    <div className="page-container">
      <h1>Конструктор тестов</h1>

      <div className="section-card">
        <h2>Настройки теста</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <div>
            <label style={lbl}>Название теста *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Контрольная работа №1"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание..."
              style={{ ...inp, minHeight: "60px", resize: "vertical" }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={lbl}>Время (мин)</label>
              <input
                type="number"
                min={0}
                value={timeLimit}
                onChange={(e) =>
                  setTimeLimit(e.target.value ? parseInt(e.target.value) : "")
                }
                placeholder="Без ограничения"
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Макс. ошибок</label>
              <input
                type="number"
                min={0}
                value={maxErrors}
                onChange={(e) =>
                  setMaxErrors(e.target.value ? parseInt(e.target.value) : "")
                }
                placeholder="Без ограничения"
                style={inp}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Шкала оценивания (% правильных)</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={{ fontSize: "13px", color: "var(--text2)" }}>
                  5 от %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeExcellent}
                  onChange={(e) =>
                    setGradeExcellent(parseInt(e.target.value) || 90)
                  }
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "var(--text2)" }}>
                  4 от %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeGood}
                  onChange={(e) => setGradeGood(parseInt(e.target.value) || 75)}
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "var(--text2)" }}>
                  3 от %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeSatisf}
                  onChange={(e) =>
                    setGradeSatisf(parseInt(e.target.value) || 60)
                  }
                  style={inp}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Добавить вопрос</h2>
        <div style={{ display: "flex", gap: "8px", margin: "16px 0" }}>
          {(["equation", "theory", "open"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setQType(t)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                border:
                  qType === t
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                background: qType === t ? "var(--accent2)" : "var(--surface2)",
                color: "white",
              }}
            >
              {t === "equation"
                ? "Уравнение"
                : t === "theory"
                  ? "Теоретический"
                  : "Открытый"}
            </button>
          ))}
        </div>

        {qType === "equation" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={lbl}>a</label>
                <input
                  type="number"
                  value={eqA}
                  onChange={(e) => setEqA(parseInt(e.target.value) || 0)}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>b</label>
                <input
                  type="number"
                  value={eqB}
                  onChange={(e) => setEqB(parseInt(e.target.value) || 0)}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>c</label>
                <input
                  type="number"
                  value={eqC}
                  onChange={(e) => setEqC(parseInt(e.target.value) || 0)}
                  style={inp}
                />
              </div>
            </div>
            <div
              style={{
                padding: "12px",
                background: "var(--surface2)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                {formatEq(eqA, eqB, eqC)}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--text2)",
                  marginTop: "4px",
                }}
              >
                Ответ: {computeRoots()}
              </div>
            </div>
          </div>
        )}

        {(qType === "theory" || qType === "open") && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={lbl}>Текст вопроса *</label>
              <textarea
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder={
                  qType === "theory"
                    ? "Что такое дискриминант?"
                    : "Решите и запишите ответ"
                }
                style={{ ...inp, minHeight: "80px", resize: "vertical" }}
              />
            </div>
            <div>
              <label style={lbl}>Тип проверки</label>
              <select
                value={qAnswerType}
                onChange={(e) => setQAnswerType(e.target.value as any)}
                style={inp}
              >
                <option value="exact">Точное совпадение</option>
                <option value="keywords">Ключевые слова</option>
                <option value="regex">Регулярное выражение</option>
                <option value="numeric">Числовое</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Маска ответа *</label>
              <input
                type="text"
                value={qMask}
                onChange={(e) => setQMask(e.target.value)}
                placeholder={
                  qAnswerType === "exact"
                    ? "дискриминант, D, d"
                    : qAnswerType === "keywords"
                      ? "корень, уравнение"
                      : qAnswerType === "regex"
                        ? "/^регулярка$/i"
                        : "2.5, -1"
                }
                style={inp}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "12px",
          }}
        >
          <div>
            <label style={lbl}>Подсказка</label>
            <input
              type="text"
              value={qHint}
              onChange={(e) => setQHint(e.target.value)}
              placeholder="D = b2 - 4ac"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Баллы</label>
            <input
              type="number"
              min={1}
              value={qPoints}
              onChange={(e) => setQPoints(parseInt(e.target.value) || 1)}
              style={inp}
            />
          </div>
        </div>
        <button
          onClick={addQuestion}
          className="btn-primary"
          style={{ marginTop: "16px" }}
        >
          Добавить вопрос
        </button>
      </div>

      <div className="section-card">
        <h2>Вопросы ({questions.length})</h2>
        {questions.length === 0 ? (
          <p style={{ color: "var(--text2)", marginTop: "12px" }}>
            Добавьте хотя бы один вопрос
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            {questions.map((q, i) => (
              <div
                key={i}
                style={{
                  padding: "14px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text2)",
                      marginBottom: "4px",
                    }}
                  >
                    #{i + 1} | {q.question_type} | {q.points} б.
                  </div>
                  <div style={{ color: "var(--text)", fontSize: "15px" }}>
                    {q.question_type === "equation"
                      ? formatEq(q.eq_a!, q.eq_b!, q.eq_c!)
                      : q.question_text}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text2)",
                      marginTop: "2px",
                    }}
                  >
                    Ответ: {q.answer_mask}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button
                    onClick={() => moveQuestion(i, -1)}
                    disabled={i === 0}
                    style={{
                      padding: "4px 8px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      cursor: i === 0 ? "not-allowed" : "pointer",
                      color: "var(--text)",
                    }}
                  >
                    ^
                  </button>
                  <button
                    onClick={() => moveQuestion(i, 1)}
                    disabled={i === questions.length - 1}
                    style={{
                      padding: "4px 8px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      cursor:
                        i === questions.length - 1 ? "not-allowed" : "pointer",
                      color: "var(--text)",
                    }}
                  >
                    v
                  </button>
                  <button
                    onClick={() => removeQuestion(i)}
                    style={{
                      padding: "4px 8px",
                      background: "var(--red)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-card">
        <h2>Назначить группам</h2>
        {groups.length === 0 ? (
          <p style={{ color: "var(--text2)", marginTop: "12px" }}>Нет групп</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  setSelectedGroups((prev) =>
                    prev.includes(g.id)
                      ? prev.filter((id) => id !== g.id)
                      : [...prev, g.id],
                  )
                }
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: selectedGroups.includes(g.id)
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: selectedGroups.includes(g.id)
                    ? "var(--accent2)"
                    : "var(--surface2)",
                  color: "white",
                }}
              >
                {selectedGroups.includes(g.id) ? "V " : ""}
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={saveTest}
        className="btn-primary"
        disabled={saving || !title.trim() || questions.length === 0}
      >
        {saving
          ? "Сохранение..."
          : "Создать тест (" + questions.length + " вопросов)"}
      </button>
    </div>
  );
}

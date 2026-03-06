import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

interface ChoiceOption {
  text: string;
  isCorrect: boolean;
}

interface TestQuestion {
  question_type:
    | "equation"
    | "theory"
    | "open"
    | "single_choice"
    | "multi_choice";
  eq_a?: number;
  eq_b?: number;
  eq_c?: number;
  question_text?: string;
  answer_mask: string;
  answer_type: "exact" | "keywords" | "regex" | "numeric";
  hint?: string;
  points: number;
  options?: ChoiceOption[];
}

interface Group {
  id: number;
  name: string;
}

interface TheoryMaterial {
  id: number;
  title: string;
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
  const [deadline, setDeadline] = useState("");
  const [maxAttempts, setMaxAttempts] = useState<number | "">("");
  const [theoryId, setTheoryId] = useState<number | "">("");
  const [theoryMaterials, setTheoryMaterials] = useState<TheoryMaterial[]>([]);
  const [generators, setGenerators] = useState<
    Array<{
      count: number;
      coeff_min: number;
      coeff_max: number;
      eq_type: "full" | "incomplete" | "random";
      points_each: number;
    }>
  >([]);

  const [qType, setQType] = useState<
    "equation" | "theory" | "open" | "single_choice" | "multi_choice"
  >("equation");
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

  // Для закрытых вопросов
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  useEffect(() => {
    api
      .get("/groups")
      .then(({ data }) => setGroups(data))
      .catch(console.error);
    api
      .get("/theory-materials")
      .then(({ data }) => setTheoryMaterials(data))
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

  const updateChoiceOption = (
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) => {
    setChoiceOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== index) {
          // Для single_choice снимаем галку с остальных
          if (
            field === "isCorrect" &&
            qType === "single_choice" &&
            value === true
          ) {
            return { ...opt, isCorrect: false };
          }
          return opt;
        }
        return { ...opt, [field]: value };
      }),
    );
  };

  const addChoiceOption = () => {
    if (choiceOptions.length >= 8) return;
    setChoiceOptions([...choiceOptions, { text: "", isCorrect: false }]);
  };

  const removeChoiceOption = (index: number) => {
    if (choiceOptions.length <= 2) return;
    setChoiceOptions(choiceOptions.filter((_, i) => i !== index));
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
    } else if (qType === "single_choice" || qType === "multi_choice") {
      if (!qText.trim()) {
        alert("Введите текст вопроса");
        return;
      }
      const filledOptions = choiceOptions.filter((o) => o.text.trim());
      if (filledOptions.length < 2) {
        alert("Нужно минимум 2 варианта ответа");
        return;
      }
      const correctOptions = filledOptions.filter((o) => o.isCorrect);
      if (correctOptions.length === 0) {
        alert("Отметьте правильный вариант(ы)");
        return;
      }
      if (qType === "single_choice" && correctOptions.length > 1) {
        alert("Для одиночного выбора отметьте только 1 правильный");
        return;
      }

      // Маска = индексы правильных (0-based) через запятую
      const mask = filledOptions
        .map((o, i) => (o.isCorrect ? String(i) : null))
        .filter(Boolean)
        .join(",");

      newQ = {
        question_type: qType,
        question_text: qText.trim(),
        answer_mask: mask,
        answer_type: "exact",
        hint: qHint || undefined,
        points: qPoints,
        options: filledOptions.map((o) => ({
          text: o.text.trim(),
          isCorrect: o.isCorrect,
        })),
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
    setChoiceOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
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
        deadline: deadline || null,
        max_attempts: maxAttempts || null,
        theory_id: theoryId || null,
        grade_excellent: gradeExcellent,
        grade_good: gradeGood,
        grade_satisf: gradeSatisf,
        questions,
        generators: generators.length > 0 ? generators : undefined,
      });
      for (const gid of selectedGroups) {
        try {
          await api.post("/tests/" + test.id + "/assign", {
            group_id: gid,
            deadline: deadline || null,
          });
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

  const questionTypeLabels: Record<string, string> = {
    equation: "Уравнение",
    theory: "Теоретический",
    open: "Открытый",
    single_choice: "Один ответ",
    multi_choice: "Несколько ответов",
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
          <div>
            <label style={lbl}>Теоретический материал</label>
            <select
              value={theoryId}
              onChange={(e) =>
                setTheoryId(e.target.value ? parseInt(e.target.value) : "")
              }
              style={inp}
            >
              <option value="">— Без привязки к теории —</option>
              {theoryMaterials.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.title}
                </option>
              ))}
            </select>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text2)",
                marginTop: "4px",
              }}
            >
              Студенты увидят ссылку на теорию перед началом теста
            </div>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={lbl}>Дедлайн (срок сдачи)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={inp}
              />
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text2)",
                  marginTop: "4px",
                }}
              >
                После этой даты студенты не смогут начать тест
              </div>
            </div>
            <div>
              <label style={lbl}>Макс. попыток</label>
              <input
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) =>
                  setMaxAttempts(e.target.value ? parseInt(e.target.value) : "")
                }
                placeholder="1 (по умолчанию)"
                style={inp}
              />
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text2)",
                  marginTop: "4px",
                }}
              >
                Сколько раз студент может пройти тест
              </div>
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            margin: "16px 0",
          }}
        >
          {(
            [
              "equation",
              "theory",
              "open",
              "single_choice",
              "multi_choice",
            ] as const
          ).map((t) => (
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
                color: qType === t ? "white" : "var(--text)",
                fontSize: "13px",
              }}
            >
              {questionTypeLabels[t]}
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

        {(qType === "single_choice" || qType === "multi_choice") && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={lbl}>Текст вопроса *</label>
              <textarea
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Что является дискриминантом квадратного уравнения?"
                style={{ ...inp, minHeight: "80px", resize: "vertical" }}
              />
            </div>
            <div>
              <label style={lbl}>
                Варианты ответа{" "}
                {qType === "single_choice"
                  ? "(отметьте 1 правильный)"
                  : "(отметьте все правильные)"}
              </label>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {choiceOptions.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type={qType === "single_choice" ? "radio" : "checkbox"}
                      name="correct_option"
                      checked={opt.isCorrect}
                      onChange={(e) =>
                        updateChoiceOption(i, "isCorrect", e.target.checked)
                      }
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        accentColor: "var(--accent)",
                      }}
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) =>
                        updateChoiceOption(i, "text", e.target.value)
                      }
                      placeholder={"Вариант " + (i + 1)}
                      style={{ ...inp, flex: 1 }}
                    />
                    {choiceOptions.length > 2 && (
                      <button
                        onClick={() => removeChoiceOption(i)}
                        style={{
                          padding: "6px 10px",
                          background: "var(--red)",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {choiceOptions.length < 8 && (
                <button
                  onClick={addChoiceOption}
                  style={{
                    marginTop: "8px",
                    padding: "6px 14px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "var(--text)",
                    fontSize: "13px",
                  }}
                >
                  + Добавить вариант
                </button>
              )}
              {qType === "multi_choice" && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text2)",
                    marginTop: "6px",
                  }}
                >
                  Частичное оценивание: за каждый правильный +1 балл, за каждый
                  неправильный -1 балл (минимум 0)
                </div>
              )}
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
                onChange={(e) =>
                  setQAnswerType(
                    e.target.value as
                      | "exact"
                      | "keywords"
                      | "regex"
                      | "numeric",
                  )
                }
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
              placeholder="D = b² - 4ac"
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
                    #{i + 1} | {questionTypeLabels[q.question_type]} |{" "}
                    {q.points} б.
                  </div>
                  <div style={{ color: "var(--text)", fontSize: "15px" }}>
                    {q.question_type === "equation"
                      ? formatEq(q.eq_a!, q.eq_b!, q.eq_c!)
                      : q.question_text}
                  </div>
                  {(q.question_type === "single_choice" ||
                    q.question_type === "multi_choice") &&
                    q.options && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text2)",
                          marginTop: "4px",
                        }}
                      >
                        {q.options.map((o, j) => (
                          <span
                            key={j}
                            style={{
                              marginRight: "8px",
                              color: o.isCorrect ? "#22c55e" : "var(--text2)",
                            }}
                          >
                            {o.isCorrect ? "✓" : "○"} {o.text}
                          </span>
                        ))}
                      </div>
                    )}
                  {q.question_type !== "single_choice" &&
                    q.question_type !== "multi_choice" && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text2)",
                          marginTop: "2px",
                        }}
                      >
                        Ответ: {q.answer_mask}
                      </div>
                    )}
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
        <h2>Автогенерация уравнений</h2>
        <p
          style={{ color: "var(--text2)", fontSize: "13px", marginTop: "8px" }}
        >
          Каждый студент получит уникальный набор уравнений со случайными
          коэффициентами
        </p>

        {generators.map((gen, gi) => (
          <div
            key={gi}
            style={{
              padding: "14px",
              background: "var(--surface2)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Блок #{gi + 1}: {gen.count} уравнений [{gen.coeff_min};{" "}
                {gen.coeff_max}]
              </span>
              <button
                onClick={() =>
                  setGenerators(generators.filter((_, i) => i !== gi))
                }
                className="btn-danger"
                style={{ padding: "4px 12px" }}
              >
                X
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={lbl}>Количество</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={gen.count}
                  onChange={(e) =>
                    setGenerators(
                      generators.map((g, i) =>
                        i === gi
                          ? { ...g, count: parseInt(e.target.value) || 1 }
                          : g,
                      ),
                    )
                  }
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Мин. коэфф.</label>
                <input
                  type="number"
                  value={gen.coeff_min}
                  onChange={(e) =>
                    setGenerators(
                      generators.map((g, i) =>
                        i === gi
                          ? { ...g, coeff_min: parseInt(e.target.value) || 0 }
                          : g,
                      ),
                    )
                  }
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Макс. коэфф.</label>
                <input
                  type="number"
                  value={gen.coeff_max}
                  onChange={(e) =>
                    setGenerators(
                      generators.map((g, i) =>
                        i === gi
                          ? { ...g, coeff_max: parseInt(e.target.value) || 0 }
                          : g,
                      ),
                    )
                  }
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Тип</label>
                <select
                  value={gen.eq_type}
                  onChange={(e) =>
                    setGenerators(
                      generators.map((g, i) =>
                        i === gi
                          ? {
                              ...g,
                              eq_type: e.target.value as
                                | "full"
                                | "incomplete"
                                | "random",
                            }
                          : g,
                      ),
                    )
                  }
                  style={inp}
                >
                  <option value="full">Полные</option>
                  <option value="incomplete">Неполные</option>
                  <option value="random">Смешанные</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Баллы</label>
                <input
                  type="number"
                  min={1}
                  value={gen.points_each}
                  onChange={(e) =>
                    setGenerators(
                      generators.map((g, i) =>
                        i === gi
                          ? { ...g, points_each: parseInt(e.target.value) || 1 }
                          : g,
                      ),
                    )
                  }
                  style={inp}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() =>
            setGenerators([
              ...generators,
              {
                count: 10,
                coeff_min: -10,
                coeff_max: 10,
                eq_type: "full",
                points_each: 1,
              },
            ])
          }
          style={{
            marginTop: "12px",
            padding: "10px 18px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          + Добавить блок автогенерации
        </button>
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
                  color: selectedGroups.includes(g.id)
                    ? "white"
                    : "var(--text)",
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
        disabled={
          saving ||
          !title.trim() ||
          (questions.length === 0 && generators.length === 0)
        }
      >
        {saving
          ? "Сохранение..."
          : `Создать тест (${questions.length} вопросов${generators.length > 0 ? " + " + generators.reduce((s, g) => s + g.count, 0) + " авто" : ""})`}
      </button>
    </div>
  );
}

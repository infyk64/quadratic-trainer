import { useState, useEffect } from "react";
import { api } from "../api/client";

type Tab = "group" | "test" | "student";

interface Group {
  id: number;
  name: string;
  teacher_name?: string;
}
interface Test {
  id: number;
  title: string;
  questions_count: number;
}
interface Student {
  id: number;
  username: string;
}

export function TeacherStats() {
  const [tab, setTab] = useState<Tab>("group");
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/groups")
      .then(({ data }) => setGroups(data))
      .catch(console.error);
    api
      .get("/tests")
      .then(({ data }) => setTests(data))
      .catch(console.error);
    api
      .get("/users/students")
      .then(({ data }) => setStudents(data))
      .catch(console.error);
  }, []);

  const loadGroupStats = async (groupId: number) => {
    setSelectedGroupId(groupId);
    setLoading(true);
    try {
      const { data } = await api.get(`/stats/group/${groupId}`);
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTestStats = async (testId: number) => {
    setSelectedTestId(testId);
    setLoading(true);
    try {
      const { data } = await api.get(`/stats/test/${testId}`);
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentStats = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setLoading(true);
    try {
      const { data } = await api.get(`/stats/student/${studentId}`);
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    setData(null);
    setSelectedGroupId(null);
    setSelectedTestId(null);
    setSelectedStudentId(null);
  };

  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={() => switchTab(key)}
      style={{
        padding: "10px 20px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: tab === key ? 600 : 400,
        border:
          tab === key ? "2px solid var(--accent)" : "1px solid var(--border)",
        background: tab === key ? "var(--accent2)" : "var(--surface)",
        color: tab === key ? "white" : "var(--text)",
      }}
    >
      {label}
    </button>
  );

  const gradeColor = (g: number) =>
    g >= 4.5
      ? "#22c55e"
      : g >= 3.5
        ? "#84cc16"
        : g >= 2.5
          ? "#f59e0b"
          : "#ef4444";

  const tbl: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "16px",
  };
  const th: React.CSSProperties = {
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "2px solid var(--border)",
    fontSize: "13px",
    color: "var(--text2)",
  };
  const td: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid var(--border)",
    fontSize: "14px",
  };

  return (
    <div className="page-container">
      <h1>Статистика</h1>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {tabBtn("group", "По группе")}
        {tabBtn("test", "По тесту")}
        {tabBtn("student", "По ученику")}
      </div>

      {/* ===== Выбор ===== */}
      <div className="section-card">
        <h2>
          {tab === "group"
            ? "Выберите группу"
            : tab === "test"
              ? "Выберите тест"
              : "Выберите ученика"}
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          {tab === "group" &&
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => loadGroupStats(g.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border:
                    selectedGroupId === g.id
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                  background:
                    selectedGroupId === g.id
                      ? "var(--accent2)"
                      : "var(--surface2)",
                  color: selectedGroupId === g.id ? "white" : "var(--text)",
                }}
              >
                {g.name}
              </button>
            ))}
          {tab === "test" &&
            tests.map((t) => (
              <button
                key={t.id}
                onClick={() => loadTestStats(t.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border:
                    selectedTestId === t.id
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                  background:
                    selectedTestId === t.id
                      ? "var(--accent2)"
                      : "var(--surface2)",
                  color: selectedTestId === t.id ? "white" : "var(--text)",
                }}
              >
                {t.title}
              </button>
            ))}
          {tab === "student" &&
            students.map((s) => (
              <button
                key={s.id}
                onClick={() => loadStudentStats(s.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border:
                    selectedStudentId === s.id
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                  background:
                    selectedStudentId === s.id
                      ? "var(--accent2)"
                      : "var(--surface2)",
                  color: selectedStudentId === s.id ? "white" : "var(--text)",
                }}
              >
                {s.username}
              </button>
            ))}
        </div>
      </div>

      {loading && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--text2)",
          }}
        >
          Загрузка...
        </div>
      )}

      {/* ===== Статистика по группе ===== */}
      {tab === "group" && data && !loading && (
        <>
          <div className="section-card">
            <h2>Группа: {data.group.name}</h2>
            {data.group.teacher_name && (
              <p style={{ color: "var(--text2)", fontSize: "14px" }}>
                Преподаватель: {data.group.teacher_name}
              </p>
            )}

            <h3 style={{ marginTop: "20px" }}>
              Студенты ({data.students.length})
            </h3>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Студент</th>
                  <th style={th}>Тестов</th>
                  <th style={th}>Ср. балл</th>
                  <th style={th}>Ср. оценка</th>
                  <th style={th}>5</th>
                  <th style={th}>4</th>
                  <th style={th}>3</th>
                  <th style={th}>2</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s: any) => (
                  <tr key={s.id}>
                    <td style={td}>{s.username}</td>
                    <td style={td}>{s.tests_taken || 0}</td>
                    <td style={td}>{s.avg_score ? `${s.avg_score}%` : "—"}</td>
                    <td
                      style={{
                        ...td,
                        fontWeight: 600,
                        color: s.avg_grade
                          ? gradeColor(s.avg_grade)
                          : "var(--text2)",
                      }}
                    >
                      {s.avg_grade || "—"}
                    </td>
                    <td style={td}>{s.count_5 || 0}</td>
                    <td style={td}>{s.count_4 || 0}</td>
                    <td style={td}>{s.count_3 || 0}</td>
                    <td style={td}>{s.count_2 || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.tests.length > 0 && (
            <div className="section-card">
              <h3>Назначенные тесты</h3>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Тест</th>
                    <th style={th}>Прошли</th>
                    <th style={th}>Ср. балл</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tests.map((t: any) => (
                    <tr key={t.id}>
                      <td style={td}>{t.title}</td>
                      <td style={td}>{t.sessions_count || 0}</td>
                      <td style={td}>
                        {t.avg_score ? `${t.avg_score}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== Статистика по тесту ===== */}
      {tab === "test" && data && !loading && (
        <>
          <div className="section-card">
            <h2>Обзор</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              {[
                {
                  label: "Прошли",
                  value: data.overview.total_sessions,
                  color: "var(--text)",
                },
                {
                  label: "Ср. балл",
                  value: data.overview.avg_score
                    ? `${data.overview.avg_score}%`
                    : "—",
                  color: "var(--accent)",
                },
                {
                  label: "Ср. оценка",
                  value: data.overview.avg_grade || "—",
                  color: data.overview.avg_grade
                    ? gradeColor(data.overview.avg_grade)
                    : "var(--text2)",
                },
                {
                  label: "Завершили",
                  value: data.overview.completed,
                  color: "#22c55e",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px",
                    background: "var(--surface2)",
                    borderRadius: "10px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text2)",
                      marginTop: "4px",
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Распределение оценок */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "16px",
                justifyContent: "center",
              }}
            >
              {[
                { grade: "5", count: data.overview.grade_5, color: "#22c55e" },
                { grade: "4", count: data.overview.grade_4, color: "#84cc16" },
                { grade: "3", count: data.overview.grade_3, color: "#f59e0b" },
                { grade: "2", count: data.overview.grade_2, color: "#ef4444" },
              ].map((g) => (
                <div key={g.grade} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: g.color,
                    }}
                  >
                    {g.count || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text2)" }}>
                    Оценка {g.grade}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Сложные вопросы */}
          {data.hardQuestions.length > 0 && (
            <div className="section-card">
              <h3>Самые сложные вопросы</h3>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Вопрос</th>
                    <th style={th}>Ответов</th>
                    <th style={th}>% ошибок</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hardQuestions
                    .filter((q: any) => q.total_answers > 0)
                    .map((q: any) => (
                      <tr key={q.id}>
                        <td style={td}>
                          {q.question_type === "equation"
                            ? `${q.eq_a}x² + ${q.eq_b}x + ${q.eq_c} = 0`
                            : q.question_text?.substring(0, 60) || "—"}
                        </td>
                        <td style={td}>{q.total_answers}</td>
                        <td
                          style={{
                            ...td,
                            color:
                              parseFloat(q.error_rate) > 50
                                ? "#ef4444"
                                : "var(--text)",
                          }}
                        >
                          {q.error_rate}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Результаты студентов */}
          <div className="section-card">
            <h3>Результаты студентов ({data.sessions.length})</h3>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Студент</th>
                  <th style={th}>Оценка</th>
                  <th style={th}>Балл</th>
                  <th style={th}>Правильно</th>
                  <th style={th}>Ошибок</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s: any) => (
                  <tr key={s.id}>
                    <td style={td}>{s.student_name}</td>
                    <td
                      style={{
                        ...td,
                        fontWeight: 700,
                        color: gradeColor(s.grade),
                      }}
                    >
                      {s.grade}
                    </td>
                    <td style={td}>{s.score_percent}%</td>
                    <td style={td}>{s.correct_answers}</td>
                    <td style={td}>{s.errors_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== Статистика по ученику ===== */}
      {tab === "student" && data && !loading && (
        <>
          <div className="section-card">
            <h2>Студент: {data.student.username}</h2>
            {data.groups.length > 0 && (
              <p style={{ color: "var(--text2)", fontSize: "14px" }}>
                Группы: {data.groups.map((g: any) => g.name).join(", ")}
              </p>
            )}

            {/* Тренажёр */}
            <h3 style={{ marginTop: "20px" }}>Тренажёр</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "22px", fontWeight: 700 }}>
                  {data.trainer.total || 0}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text2)" }}>
                  Попыток
                </div>
              </div>
              <div
                style={{
                  padding: "14px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#22c55e",
                  }}
                >
                  {data.trainer.correct || 0}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text2)" }}>
                  Верных
                </div>
              </div>
              <div
                style={{
                  padding: "14px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#ef4444",
                  }}
                >
                  {data.trainer.wrong || 0}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text2)" }}>
                  Ошибок
                </div>
              </div>
              <div
                style={{
                  padding: "14px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "22px", fontWeight: 700 }}>
                  {data.trainer.success_rate || 0}%
                </div>
                <div style={{ fontSize: "12px", color: "var(--text2)" }}>
                  Успех
                </div>
              </div>
            </div>
          </div>

          {/* Тесты */}
          {data.testSessions.length > 0 && (
            <div className="section-card">
              <h3>Результаты тестов ({data.testSessions.length})</h3>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Тест</th>
                    <th style={th}>Оценка</th>
                    <th style={th}>Балл</th>
                    <th style={th}>Статус</th>
                    <th style={th}>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {data.testSessions.map((s: any) => (
                    <tr key={s.id}>
                      <td style={td}>{s.test_title}</td>
                      <td
                        style={{
                          ...td,
                          fontWeight: 700,
                          color: gradeColor(s.grade),
                        }}
                      >
                        {s.grade}
                      </td>
                      <td style={td}>{s.score_percent}%</td>
                      <td style={td}>
                        {s.status === "completed"
                          ? ""
                          : s.status === "failed_time"
                            ? ""
                            : ""}
                      </td>
                      <td style={td}>
                        {s.finished_at
                          ? new Date(s.finished_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

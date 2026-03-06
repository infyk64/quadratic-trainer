import { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface Group {
  id: number;
  name: string;
}
interface Student {
  id: number;
  username: string;
}

type Tab = "student" | "group";
type StudentCategory = "excellent" | "good" | "average" | "at_risk";

/* eslint-disable @typescript-eslint/no-explicit-any */

const CATEGORY_COLORS: Record<string, string> = {
  excellent: "#22c55e",
  good: "#84cc16",
  average: "#f59e0b",
  at_risk: "#ef4444",
};

const CATEGORY_LABELS: Record<string, string> = {
  excellent: "Отличник",
  good: "Хорошист",
  average: "Средний",
  at_risk: "Группа риска",
};

const TREND_LABELS: Record<string, string> = {
  improving: "Растёт",
  declining: "Падает",
  stable: "Стабильно",
};

export function Analytics() {
  const [tab, setTab] = useState<Tab>("student");
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/groups")
      .then(({ data }) => setGroups(data))
      .catch(console.error);
    api
      .get("/users/students")
      .then(({ data }) => setStudents(data))
      .catch(console.error);
  }, []);

  const loadStudentAnalytics = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setLoading(true);
    try {
      const { data } = await api.get(`/stats/analytics/student/${studentId}`);
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupAnalytics = async (groupId: number) => {
    setSelectedGroupId(groupId);
    setLoading(true);
    try {
      const { data } = await api.get(`/stats/analytics/group/${groupId}`);
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setData(null);
    setSelectedStudentId(null);
    setSelectedGroupId(null);
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

  return (
    <div className="page-container">
      <h1>Аналитика успеваемости</h1>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {tabBtn("student", "По студенту")}
        {tabBtn("group", "По группе")}
      </div>

      {/* Выбор */}
      <div className="section-card">
        <h2>{tab === "student" ? "Выберите студента" : "Выберите группу"}</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          {tab === "student" &&
            students.map((s) => (
              <button
                key={s.id}
                onClick={() => loadStudentAnalytics(s.id)}
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
          {tab === "group" &&
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => loadGroupAnalytics(g.id)}
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
          Загрузка аналитики...
        </div>
      )}

      {/* ===== АНАЛИТИКА СТУДЕНТА ===== */}
      {tab === "student" && data && !loading && (
        <>
          {/* Классификация */}
          <div className="section-card">
            <h2>Классификация: {data.student.username}</h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginTop: "16px",
                padding: "20px",
                background:
                  CATEGORY_COLORS[data.classification.category] + "15",
                borderRadius: "12px",
                border: `2px solid ${CATEGORY_COLORS[data.classification.category]}`,
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  color: CATEGORY_COLORS[data.classification.category],
                  lineHeight: 1,
                }}
              >
                {data.classification.label}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text2)",
                    marginBottom: "8px",
                  }}
                >
                  Уверенность:{" "}
                  {Math.round(data.classification.confidence * 100)}% (наивный
                  Байес)
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "var(--text)",
                    lineHeight: 1.5,
                  }}
                >
                  {data.classification.recommendation}
                </div>
              </div>
            </div>

            {/* Вероятности классов */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              {(["excellent", "good", "average", "at_risk"] as const).map(
                (cat) => (
                  <div
                    key={cat}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderRadius: "8px",
                      background:
                        data.classification.category === cat
                          ? CATEGORY_COLORS[cat] + "20"
                          : "var(--surface2)",
                      border:
                        data.classification.category === cat
                          ? `2px solid ${CATEGORY_COLORS[cat]}`
                          : "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: CATEGORY_COLORS[cat],
                      }}
                    >
                      {Math.round(data.classification.probabilities[cat] * 100)}
                      %
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text2)",
                        marginTop: "4px",
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Фичи */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              {[
                {
                  label: "Ср. балл",
                  value: data.classification.features.avg_score + "%",
                },
                {
                  label: "Тестов",
                  value: data.classification.features.tests_passed,
                },
                {
                  label: "% ошибок",
                  value: data.classification.features.error_rate + "%",
                },
                {
                  label: "Время/лимит",
                  value: data.classification.features.avg_time_ratio,
                },
                {
                  label: "Тренд",
                  value:
                    data.classification.features.trend_slope > 0
                      ? "+" + data.classification.features.trend_slope
                      : data.classification.features.trend_slope,
                },
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px",
                    background: "var(--surface2)",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {f.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text2)",
                      marginTop: "2px",
                    }}
                  >
                    {f.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Регрессия */}
          {data.regression && (
            <div className="section-card">
              <h2>Линия тренда (линейная регрессия)</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                  marginTop: "16px",
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
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color:
                        data.regression.trend === "improving"
                          ? "#22c55e"
                          : data.regression.trend === "declining"
                            ? "#ef4444"
                            : "var(--text)",
                    }}
                  >
                    {TREND_LABELS[data.regression.trend]}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text2)",
                      marginTop: "4px",
                    }}
                  >
                    Тренд
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
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {data.regression.prediction_next}%
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text2)",
                      marginTop: "4px",
                    }}
                  >
                    Прогноз след.
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
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {data.regression.prediction_5}%
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text2)",
                      marginTop: "4px",
                    }}
                  >
                    Прогноз +5
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
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {data.regression.r_squared}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text2)",
                      marginTop: "4px",
                    }}
                  >
                    R² (качество)
                  </div>
                </div>
              </div>

              {/* График */}
              <div style={{ marginTop: "20px", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={[1, "dataMax"]}
                      label={{
                        value: "Попытка",
                        position: "bottom",
                        offset: -5,
                        style: { fill: "var(--text2)", fontSize: 12 },
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{
                        value: "Балл %",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "var(--text2)", fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      data={data.regression.points}
                      dataKey="y"
                      name="Результат"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 5, fill: "#6366f1" }}
                      type="monotone"
                    />
                    <Line
                      data={data.regression.trend_line}
                      dataKey="y"
                      name="Линия тренда"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text2)",
                  marginTop: "8px",
                  textAlign: "center",
                }}
              >
                y = {data.regression.intercept} + {data.regression.slope}x | R²
                = {data.regression.r_squared}
              </div>
            </div>
          )}

          {!data.regression && data.sessions_count < 2 && (
            <div className="section-card">
              <p
                style={{
                  color: "var(--text2)",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                Недостаточно данных для регрессии. Нужно минимум 2 завершённых
                теста.
              </p>
            </div>
          )}
        </>
      )}

      {/* ===== АНАЛИТИКА ГРУППЫ ===== */}
      {tab === "group" && data && !loading && (
        <>
          {/* Сводка */}
          <div className="section-card">
            <h2>Группа: {data.group.name}</h2>

            {/* Круговая диаграмма */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                marginTop: "16px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ width: "200px", height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Отличники",
                          value: data.summary.excellent,
                          fill: CATEGORY_COLORS.excellent,
                        },
                        {
                          name: "Хорошисты",
                          value: data.summary.good,
                          fill: CATEGORY_COLORS.good,
                        },
                        {
                          name: "Средние",
                          value: data.summary.average,
                          fill: CATEGORY_COLORS.average,
                        },
                        {
                          name: "Группа риска",
                          value: data.summary.at_risk,
                          fill: CATEGORY_COLORS.at_risk,
                        },
                      ].filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({
                        name,
                        value,
                      }: {
                        name: string;
                        value: number;
                      }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {[
                        CATEGORY_COLORS.excellent,
                        CATEGORY_COLORS.good,
                        CATEGORY_COLORS.average,
                        CATEGORY_COLORS.at_risk,
                      ].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  flex: 1,
                }}
              >
                {(["excellent", "good", "average", "at_risk"] as const).map(
                  (cat) => (
                    <div
                      key={cat}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background: CATEGORY_COLORS[cat] + "15",
                        border: `1px solid ${CATEGORY_COLORS[cat]}40`,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: 700,
                          color: CATEGORY_COLORS[cat],
                        }}
                      >
                        {data.summary[cat]}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text)" }}>
                        {CATEGORY_LABELS[cat]}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Столбчатая диаграмма — средний балл */}
          {data.students.length > 0 && (
            <div className="section-card">
              <h2>Средний балл студентов</h2>
              <div style={{ marginTop: "16px", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.students.map((s: any) => ({
                      name: s.username,
                      score: s.avg_score,
                      fill: CATEGORY_COLORS[s.classification.category],
                    }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "var(--text2)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "var(--text2)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="score"
                      name="Средний балл"
                      radius={[6, 6, 0, 0]}
                    >
                      {data.students.map((s: any, i: number) => (
                        <Cell
                          key={i}
                          fill={CATEGORY_COLORS[s.classification.category]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Таблица студентов */}
          <div className="section-card">
            <h2>Детализация ({data.students.length} студентов)</h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              {data.students.map((s: any) => (
                <div
                  key={s.id}
                  style={{
                    padding: "14px 18px",
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
                        fontWeight: 600,
                        color: "var(--text)",
                        fontSize: "15px",
                      }}
                    >
                      {s.username}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text2)",
                        marginTop: "2px",
                      }}
                    >
                      {s.sessions_count} тестов · Ср. балл: {s.avg_score}%
                      {s.regression &&
                        ` · Тренд: ${TREND_LABELS[s.regression.trend]} (${s.regression.slope > 0 ? "+" : ""}${s.regression.slope})`}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {s.regression && (
                      <span style={{ fontSize: "13px", color: "var(--text2)" }}>
                        Прогноз: {s.regression.prediction_next}%
                      </span>
                    )}
                    <span
                      style={{
                        padding: "4px 14px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background:
                          CATEGORY_COLORS[s.classification.category] + "20",
                        color: CATEGORY_COLORS[s.classification.category],
                        border: `1px solid ${CATEGORY_COLORS[s.classification.category]}40`,
                      }}
                    >
                      {s.classification.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

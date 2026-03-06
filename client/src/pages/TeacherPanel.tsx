import { useNavigate } from "react-router-dom";

export function TeacherPanel() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h1>Панель преподавателя</h1>

      {/* Теоретические материалы */}
      <div className="section-card">
        <h2>Теоретические материалы</h2>
        <p style={{ color: "var(--text2)" }}>
          Создавайте и редактируйте учебные материалы в формате Markdown
        </p>
        <button
          onClick={() => navigate("/teacher/theory-editor")}
          className="btn-primary"
          style={{ marginTop: "12px" }}
        >
          Открыть редактор теории
        </button>
      </div>

      {/* Теоретические вопросы */}
      <div className="section-card">
        <h2>База теоретических вопросов</h2>
        <p style={{ color: "var(--text2)" }}>
          Создавайте вопросы с масками ответов для тестов и тренажёра
        </p>
        <button
          onClick={() => navigate("/teacher/questions-editor")}
          className="btn-primary"
          style={{ marginTop: "12px" }}
        >
          Создать вопросы
        </button>
      </div>

      {/* Тесты */}
      <div className="section-card">
        <h2>Тесты</h2>
        <p style={{ color: "var(--text2)" }}>
          Создавайте тесты из уравнений и теоретических вопросов. Настраивайте
          таймер, лимит ошибок и шкалу оценивания. Назначайте тесты группам
          студентов.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/teacher/test-editor")}
            className="btn-success"
          >
            Создать тест
          </button>
          <button
            onClick={() => navigate("/teacher/tests")}
            className="btn-primary"
          >
            Мои тесты
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="section-card">
        <h2>Статистика</h2>
        <p style={{ color: "var(--text2)" }}>
          Просматривайте результаты студентов по группам, тестам и индивидуально
        </p>
        <button
          onClick={() => navigate("/teacher/stats")}
          className="btn-primary"
          style={{ marginTop: "12px" }}
        >
          Статистика
        </button>
      </div>

      {/* Аналитика */}
      <div className="section-card">
        <h2>Аналитика успеваемости</h2>
        <p style={{ color: "var(--text2)" }}>
          Прогноз успеваемости (линейная регрессия) и классификация студентов
          (наивный Байес). Графики трендов, категории риска, рекомендации.
        </p>
        <button
          onClick={() => navigate("/teacher/analytics")}
          className="btn-primary"
          style={{ marginTop: "12px" }}
        >
          Аналитика
        </button>
      </div>
    </div>
  );
}

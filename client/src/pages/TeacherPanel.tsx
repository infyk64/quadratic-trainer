
import { useNavigate } from 'react-router-dom';

export function TeacherPanel() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h1>📚 Панель преподавателя</h1>
      
      <div className="section-card">
        <h2>Теоретические материалы</h2>
        <p>Создавайте теорию в Markdown для студентов</p>
        <button 
          onClick={() => navigate('/teacher/theory-editor')}
          className="btn-primary" 
          style={{ marginTop: '12px' }}
        >
          📝 Открыть редактор
        </button>
      </div>

      <div className="section-card">
        <h2>Теоретические вопросы</h2>
        <p>Создавайте вопросы с масками ответов</p>
        <button 
          onClick={() => navigate('/teacher/questions-editor')}
          className="btn-primary" 
          style={{ marginTop: '12px' }}
        >
          ❓ Создать вопросы
        </button>
      </div>

      <div className="section-card">
        <h2>Тесты</h2>
        <p>Конструктор тестов с настройками</p>
        <ul>
          <li>Таймер и количество ошибок</li>
          <li>Шкала оценивания</li>
          <li>Назначение группам</li>
        </ul>
      </div>

      <div className="section-card">
        <h2>Статистика</h2>
        <ul>
          <li>Статистика по группам</li>
          <li>Статистика по тестам</li>
          <li>Личная статистика учеников</li>
        </ul>
      </div>
    </div>
  );
}
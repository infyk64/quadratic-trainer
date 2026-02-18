import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface StatsData {
  total: number;
  correct: number;
  wrong: number;
  success_rate: number;
}

export function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      api.get(`/users/${userId}/stats`)
        .then(({ data }) => setStats(data))
        .catch(err => console.error('Ошибка загрузки статистики:', err));
    }
  }, [userId]);

  if (!stats) return <div>Загрузка...</div>;

  return (
    <div className="stats-page">
      <h1>Статистика</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Всего попыток</div>
        </div>
        <div className="stat-card">
          <div className="stat-value correct">{stats.correct}</div>
          <div className="stat-label">Правильных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value wrong">{stats.wrong}</div>
          <div className="stat-label">Неправильных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.success_rate}%</div>
          <div className="stat-label">Процент успеха</div>
        </div>
      </div>
    </div>
  );
}
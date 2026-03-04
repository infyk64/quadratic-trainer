import { useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<User>('/users/login', {
        username: username.trim(),
        password: password.trim(),
      });

      localStorage.setItem('userId', String(data.id));
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);

      onLogin(data);
      setError('');
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      setError(err.response?.data?.error || 'Неверное имя пользователя или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Тренажёр квадратных уравнений</h1>

      <div className="login-card">
        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            textAlign: 'center',
            width: '100%',
            border: '1.5px solid #f0b8b8',
          }}>
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Имя"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />

        <button onClick={handleLogin} disabled={!username.trim() || loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        fontSize: '13px',
        color: 'var(--text3)',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        <p>Студенты могут войти без пароля</p>
        <p>Админ / Преподаватель — требуется пароль</p>
      </div>
    </div>
  );
}
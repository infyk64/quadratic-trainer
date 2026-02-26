// client/src/pages/Login.tsx

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

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }

    try {
      const { data } = await api.post<User>('/users/login', { 
        username: username.trim(),
        password: password.trim() 
      });
      
      localStorage.setItem('userId', String(data.id));
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);
      
      onLogin(data);
      setError('');
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      setError(err.response?.data?.error || 'Неверное имя пользователя или пароль');
    }
  };

  return (
    <div className="login-page">
      <h1>Вход в систему</h1>
      <p>Введите данные для входа</p>
      
      {error && (
        <div style={{
          background: 'var(--red)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          maxWidth: '300px',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Имя пользователя"
        value={username}
        onChange={e => setUsername(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
      />
      
      <input
        type="password"
        placeholder="Пароль (опционально для студента)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
      />
      
      <button onClick={handleLogin} disabled={!username.trim()}>
        Войти
      </button>

      <div style={{ 
        marginTop: '20px', 
        fontSize: '14px', 
        color: 'var(--text2)',
        maxWidth: '300px',
        textAlign: 'center',
      }}>
        <p>Студенты могут войти без пароля</p>
        <p>Админ/Преподаватель — требуется пароль</p>
      </div>
    </div>
  );
}
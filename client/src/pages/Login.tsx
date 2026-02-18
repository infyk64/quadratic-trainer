import { useState } from 'react';
import { api } from '../api/client';

interface Props {
  onLogin: (user: { id: number; username: string }) => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) return;

    try {
      const { data } = await api.post('/users/login', { username: username.trim() });
      localStorage.setItem('userId', data.id);
      localStorage.setItem('username', data.username);
      onLogin(data);
    } catch (err) {
      console.error('Ошибка входа:', err);
    }
  };

  return (
    <div className="login-page">
      <h1>Вход в систему</h1>
      <p>Введи своё имя чтобы начать</p>
      <input
        type="text"
        placeholder="Твоё имя"
        value={username}
        onChange={e => setUsername(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
      />
      <button onClick={handleLogin} disabled={!username.trim()}>
        Войти
      </button>
    </div>
  );
}
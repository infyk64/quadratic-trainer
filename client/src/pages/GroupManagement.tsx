import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface Group {
  id: number;
  name: string;
  teacher_id?: number;
  teacher_name?: string;
  students_count: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  useEffect(() => {
    loadGroups();
    loadUsers();
  }, []);

  const loadGroups = async () => {
    try {
      const { data } = await api.get<Group[]>('/groups');
      setGroups(data);
    } catch (err) {
      console.error('Ошибка загрузки групп:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get<User[]>('/users/all');
      setTeachers(data.filter(u => u.role === 'teacher'));
      setStudents(data.filter(u => u.role === 'student'));
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Введите название группы');
      return;
    }

    try {
      await api.post('/groups', {
        name: newGroupName.trim(),
        teacher_id: selectedTeacher,
      });

      setNewGroupName('');
      setSelectedTeacher(null);
      loadGroups();
      alert('Группа создана!');
    } catch (err) {
      console.error('Ошибка создания группы:', err);
      alert('Не удалось создать группу');
    }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('Удалить группу? Все студенты будут удалены из группы.')) return;

    try {
      await api.delete(`/groups/${id}`);
      loadGroups();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить группу');
    }
  };

  return (
    <div className="page-container">
      <h1>Управление группами</h1>

      <div className="section-card">
        <h2>Создать новую группу</h2>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Название группы"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '10px', fontSize: '16px' }}
          />

          <select
            value={selectedTeacher || ''}
            onChange={e => setSelectedTeacher(e.target.value ? parseInt(e.target.value) : null)}
            style={{ padding: '10px', fontSize: '16px', minWidth: '200px' }}
          >
            <option value="">Без преподавателя</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.username}
              </option>
            ))}
          </select>

          <button
            onClick={createGroup}
            className="btn-primary"
            disabled={!newGroupName.trim()}
          >
            Создать группу
          </button>
        </div>
      </div>

      <div className="section-card">
        <h2>Список групп ({groups.length})</h2>

        {groups.length === 0 ? (
          <p style={{ color: 'var(--text2)' }}>Пока нет групп</p>
        ) : (
          <table style={{ width: '100%', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Название</th>
                <th style={{ padding: '12px' }}>Преподаватель</th>
                <th style={{ padding: '12px' }}>Студентов</th>
                <th style={{ padding: '12px' }}>Создана</th>
                <th style={{ padding: '12px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>{group.id}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{group.name}</td>
                  <td style={{ padding: '12px' }}>
                    {group.teacher_name || <span style={{ color: 'var(--text2)' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px' }}>{group.students_count}</td>
                  <td style={{ padding: '12px' }}>
                    {new Date(group.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--red)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
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

interface GroupMember {
  id: number;
  username: string;
  joined_at: string;
}

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  // Управление студентами в группе
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addStudentId, setAddStudentId] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");

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
      if (expandedGroupId === id) {
        setExpandedGroupId(null);
        setGroupMembers([]);
      }
      loadGroups();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить группу');
    }
  };

  const toggleGroupMembers = async (groupId: number) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      setGroupMembers([]);
      setSearchQuery("");
      setAddStudentId("");
      return;
    }
    setExpandedGroupId(groupId);
    setSearchQuery("");
    setAddStudentId("");
    await loadGroupMembers(groupId);
  };

  const loadGroupMembers = async (groupId: number) => {
    setMembersLoading(true);
    try {
      const { data } = await api.get<GroupMember[]>(`/groups/${groupId}/members`);
      setGroupMembers(data);
    } catch (err) {
      console.error('Ошибка загрузки студентов группы:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const addStudentToGroup = async (groupId: number, studentId: number) => {
    try {
      await api.post(`/groups/${groupId}/members`, { student_id: studentId });
      await loadGroupMembers(groupId);
      loadGroups();
      setAddStudentId("");
      setSearchQuery("");
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Не удалось добавить студента';
      alert(msg);
    }
  };

  const removeStudentFromGroup = async (groupId: number, studentId: number, username: string) => {
    if (!confirm(`Удалить студента «${username}» из группы?`)) return;
    try {
      await api.delete(`/groups/${groupId}/members/${studentId}`);
      await loadGroupMembers(groupId);
      loadGroups();
    } catch (err) {
      console.error('Ошибка удаления студента:', err);
      alert('Не удалось удалить студента');
    }
  };

  // Студенты, которых ещё нет в текущей группе
  const availableStudents = students.filter(
    s => !groupMembers.some(m => m.id === s.id)
  );

  // Фильтрация по поиску
  const filteredAvailable = searchQuery.trim()
    ? availableStudents.filter(s =>
        s.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableStudents;

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px', fontSize: '15px',
    background: 'var(--surface2)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '6px',
  };

  return (
    <div className="page-container">
      <h1>Управление группами</h1>

      {/* Создание группы */}
      <div className="section-card">
        <h2>Создать новую группу</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Название группы"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            style={{ ...inp, flex: 1, minWidth: '200px' }}
          />
          <select
            value={selectedTeacher || ''}
            onChange={e => setSelectedTeacher(e.target.value ? parseInt(e.target.value) : null)}
            style={{ ...inp, minWidth: '200px', flex: 'none', width: 'auto' }}
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
            style={{ flex: 'none', width: 'auto', padding: '10px 24px' }}
          >
            Создать группу
          </button>
        </div>
      </div>

      {/* Список групп */}
      <div className="section-card">
        <h2>Список групп ({groups.length})</h2>

        {groups.length === 0 ? (
          <p style={{ color: 'var(--text2)', marginTop: '16px' }}>Пока нет групп</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {groups.map(group => (
              <div key={group.id} style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                overflow: 'hidden',
                background: expandedGroupId === group.id ? 'var(--surface)' : 'transparent',
              }}>
                {/* Шапка группы */}
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onClick={() => toggleGroupMembers(group.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{
                      transform: expandedGroupId === group.id ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s', fontSize: '14px', color: 'var(--text2)',
                    }}>
                      ▶
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>
                        {group.teacher_name || 'Без преподавателя'} · {group.students_count} студент(ов) · {new Date(group.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Раскрытая панель студентов */}
                {expandedGroupId === group.id && (
                  <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid var(--border)' }}>

                    {/* Добавление студента */}
                    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
                        Добавить студента
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                          <input
                            type="text"
                            placeholder="Поиск студента по имени..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setAddStudentId("");
                            }}
                            style={inp}
                          />
                          {/* Выпадающий список при поиске */}
                          {searchQuery.trim() && filteredAvailable.length > 0 && !addStudentId && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              borderRadius: '0 0 6px 6px', maxHeight: '200px', overflowY: 'auto',
                              zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}>
                              {filteredAvailable.map(s => (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    setAddStudentId(s.id);
                                    setSearchQuery(s.username);
                                  }}
                                  style={{
                                    padding: '10px 14px', cursor: 'pointer',
                                    fontSize: '14px', color: 'var(--text)',
                                    borderBottom: '1px solid var(--border)',
                                    transition: 'background 0.1s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  {s.username}
                                </div>
                              ))}
                            </div>
                          )}
                          {searchQuery.trim() && filteredAvailable.length === 0 && !addStudentId && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              borderRadius: '0 0 6px 6px', padding: '12px 14px',
                              fontSize: '13px', color: 'var(--text2)', zIndex: 10,
                            }}>
                              Студенты не найдены
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (addStudentId) addStudentToGroup(group.id, addStudentId as number);
                          }}
                          className="btn-primary"
                          disabled={!addStudentId}
                          style={{ flex: 'none', width: 'auto', padding: '10px 20px' }}
                        >
                          + Добавить
                        </button>
                      </div>

                      {/* Select как fallback для быстрого выбора */}
                      {availableStudents.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <select
                            value={addStudentId}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : "";
                              setAddStudentId(val);
                              if (val) {
                                const student = students.find(s => s.id === val);
                                if (student) setSearchQuery(student.username);
                              }
                            }}
                            style={{ ...inp, width: 'auto', minWidth: '250px' }}
                          >
                            <option value="">— Или выберите из списка ({availableStudents.length}) —</option>
                            {availableStudents.map(s => (
                              <option key={s.id} value={s.id}>{s.username}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {availableStudents.length === 0 && (
                        <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px' }}>
                          Все студенты уже добавлены в эту группу
                        </div>
                      )}
                    </div>

                    {/* Список текущих студентов */}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
                        Студенты в группе ({groupMembers.length})
                      </div>

                      {membersLoading ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>
                          Загрузка...
                        </div>
                      ) : groupMembers.length === 0 ? (
                        <div style={{
                          padding: '24px', textAlign: 'center', color: 'var(--text2)',
                          background: 'var(--surface2)', borderRadius: '8px', fontSize: '14px',
                        }}>
                          В группе пока нет студентов
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {groupMembers.map(member => (
                            <div key={member.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '10px 14px', background: 'var(--surface2)', borderRadius: '8px',
                              border: '1px solid var(--border)',
                            }}>
                              <div>
                                <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>
                                  {member.username}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: '10px' }}>
                                  добавлен {new Date(member.joined_at).toLocaleDateString()}
                                </span>
                              </div>
                              <button
                                onClick={() => removeStudentFromGroup(group.id, member.id, member.username)}
                                style={{
                                  padding: '4px 12px', background: 'transparent',
                                  color: '#ef4444', border: '1px solid #ef444440',
                                  borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#ef4444';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Удаление группы */}
                    <div style={{
                      marginTop: '20px', paddingTop: '16px',
                      borderTop: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'flex-end',
                    }}>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="btn-danger"
                        style={{ padding: '10px 24px' }}
                      >
                        Удалить группу «{group.name}»
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
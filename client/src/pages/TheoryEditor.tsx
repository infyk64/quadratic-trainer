// client/src/pages/TheoryEditor.tsx

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function TheoryEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [materials, setMaterials] = useState<Array<{ id: number; title: string; content: string }>>([]);
  const [showPreview, setShowPreview] = useState(false);

  const saveMaterial = () => {
    if (!title.trim() || !content.trim()) {
      alert('Заполните название и содержание');
      return;
    }

    const newMaterial = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
    };

    setMaterials([...materials, newMaterial]);
    setTitle('');
    setContent('');
    alert('Материал сохранён!');
  };

  const deleteMaterial = (id: number) => {
    if (!confirm('Удалить материал?')) return;
    setMaterials(materials.filter(m => m.id !== id));
  };

  return (
    <div className="page-container">
      <h1>📝 Редактор теоретических материалов</h1>

      <div className="section-card">
        <h2>Создать новый материал</h2>
        
        <input
          type="text"
          placeholder="Название материала"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            marginBottom: '16px',
          }}
        />

        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 16px',
              background: showPreview ? 'var(--accent2)' : 'var(--surface2)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {showPreview ? '📝 Редактор' : '👁️ Превью'}
          </button>
        </div>

        {showPreview ? (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            minHeight: '300px',
            color: 'var(--text)',
          }}>
            <ReactMarkdown>{content || '*Пусто*'}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            placeholder="Напишите теоретический материал в формате Markdown..."
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '300px',
              padding: '12px',
              fontSize: '16px',
              fontFamily: 'var(--mono)',
              resize: 'vertical',
              lineHeight: '1.6',
            }}
          />
        )}

        <button 
          onClick={saveMaterial}
          className="btn-primary"
          style={{ marginTop: '16px' }}
        >
          Сохранить материал
        </button>
      </div>

      <div className="section-card">
        <h2>Сохранённые материалы ({materials.length})</h2>
        
        {materials.length === 0 ? (
          <p style={{ color: 'var(--text2)' }}>Пока нет материалов</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {materials.map(material => (
              <div 
                key={material.id}
                style={{
                  padding: '16px',
                  background: 'var(--surface2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{material.title}</h3>
                  <button
                    onClick={() => deleteMaterial(material.id)}
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
                </div>
                <p style={{ 
                  color: 'var(--text2)', 
                  fontSize: '14px',
                  margin: '8px 0 0 0',
                  maxHeight: '60px',
                  overflow: 'hidden',
                }}>
                  {material.content.substring(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
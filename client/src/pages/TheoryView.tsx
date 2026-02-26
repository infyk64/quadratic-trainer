import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// Пример данных (позже будут из БД)
const sampleMaterials = [
  {
    id: 1,
    title: 'Квадратные уравнения',
    content: `# Квадратное уравнение

Квадратное уравнение — это уравнение вида:

**ax² + bx + c = 0**, где a ≠ 0

## Дискриминант

Дискриминант вычисляется по формуле:

**D = b² - 4ac**

### Количество корней зависит от дискриминанта:

- **D > 0** — два различных корня
- **D = 0** — один корень (два совпадающих)
- **D < 0** — нет действительных корней

## Формула корней

**x₁,₂ = (-b ± √D) / (2a)**`
  },
  {
    id: 2,
    title: 'Неполные квадратные уравнения',
    content: `# Неполные квадратные уравнения

Неполное квадратное уравнение — уравнение, в котором b = 0 или c = 0.

## Случай 1: b = 0

**ax² + c = 0**

Решение: **x² = -c/a**

## Случай 2: c = 0

**ax² + bx = 0**

Решение: **x(ax + b) = 0**

Корни: **x₁ = 0** и **x₂ = -b/a**`
  }
];

export function TheoryView() {
  const [selectedMaterial, setSelectedMaterial] = useState<typeof sampleMaterials[0] | null>(null);

  return (
    <div className="page-container">
      <h1>📚 Теоретические материалы</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Список материалов */}
        <div className="section-card" style={{ height: 'fit-content' }}>
          <h2>Темы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sampleMaterials.map(material => (
              <button
                key={material.id}
                onClick={() => setSelectedMaterial(material)}
                style={{
                  padding: '12px',
                  background: selectedMaterial?.id === material.id ? 'var(--accent2)' : 'var(--surface2)',
                  color: 'white',
                  border: selectedMaterial?.id === material.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                }}
              >
                {material.title}
              </button>
            ))}
          </div>
        </div>

        {/* Содержимое */}
        <div className="section-card">
          {selectedMaterial ? (
            <div>
              <h2>{selectedMaterial.title}</h2>
              <div style={{
                color: 'var(--text)',
                lineHeight: '1.8',
                fontSize: '16px',
              }}>
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 style={{ color: 'var(--text)', marginTop: '24px', marginBottom: '12px' }} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{ color: 'var(--text)', marginTop: '20px', marginBottom: '10px' }} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{ color: 'var(--text)', marginTop: '16px', marginBottom: '8px' }} {...props} />,
                    p: ({node, ...props}) => <p style={{ marginBottom: '12px' }} {...props} />,
                    ul: ({node, ...props}) => <ul style={{ marginLeft: '24px', marginBottom: '12px' }} {...props} />,
                    ol: ({node, ...props}) => <ol style={{ marginLeft: '24px', marginBottom: '12px' }} {...props} />,
                    li: ({node, ...props}) => <li style={{ marginBottom: '6px' }} {...props} />,
                    code: ({node, inline, ...props}: any) => inline ? (
                      <code style={{ 
                        background: 'var(--surface2)', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontFamily: 'var(--mono)',
                        fontSize: '14px',
                      }} {...props} />
                    ) : (
                      <code style={{
                        display: 'block',
                        background: 'var(--surface2)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontFamily: 'var(--mono)',
                        fontSize: '14px',
                        overflow: 'auto',
                      }} {...props} />
                    ),
                    strong: ({node, ...props}) => <strong style={{ color: 'var(--accent)' }} {...props} />,
                  }}
                >
                  {selectedMaterial.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
              <p style={{ fontSize: '18px' }}>Выберите тему из списка слева</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
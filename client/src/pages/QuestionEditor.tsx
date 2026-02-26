import { useState } from 'react';

interface TheoryQuestion {
  id: number;
  question: string;
  answerMask: string;
  answerType: 'exact' | 'keywords' | 'regex';
  hint?: string;
}

export function QuestionEditor() {
  const [question, setQuestion] = useState('');
  const [answerMask, setAnswerMask] = useState('');
  const [answerType, setAnswerType] = useState<'exact' | 'keywords' | 'regex'>('exact');
  const [hint, setHint] = useState('');
  const [questions, setQuestions] = useState<TheoryQuestion[]>([]);

  const saveQuestion = () => {
    if (!question.trim() || !answerMask.trim()) {
      alert('Заполните вопрос и маску ответа');
      return;
    }

    const newQuestion: TheoryQuestion = {
      id: Date.now(),
      question: question.trim(),
      answerMask: answerMask.trim(),
      answerType,
      hint: hint.trim() || undefined,
    };

    setQuestions([...questions, newQuestion]);
    setQuestion('');
    setAnswerMask('');
    setHint('');
    alert('Вопрос сохранён!');
  };

  const deleteQuestion = (id: number) => {
    if (!confirm('Удалить вопрос?')) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="page-container">
      <h1>❓ Редактор теоретических вопросов</h1>

      <div className="section-card">
        <h2>Создать новый вопрос</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>
            Вопрос
          </label>
          <textarea
            placeholder="Что такое дискриминант?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              fontSize: '16px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>
            Тип проверки
          </label>
          <select
            value={answerType}
            onChange={e => setAnswerType(e.target.value as any)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
            }}
          >
            <option value="exact">Точное совпадение (список вариантов)</option>
            <option value="keywords">Ключевые слова (все должны присутствовать)</option>
            <option value="regex">Регулярное выражение (для продвинутых)</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>
            Маска правильного ответа
          </label>
          
          {answerType === 'exact' && (
            <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--text2)' }}>
              Введите варианты правильных ответов через запятую. Например: <code>дискриминант, D, d</code>
            </div>
          )}
          
          {answerType === 'keywords' && (
            <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--text2)' }}>
              Введите ключевые слова через запятую. Все должны быть в ответе. Например: <code>корень, уравнение</code>
            </div>
          )}
          
          {answerType === 'regex' && (
            <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--text2)' }}>
              Введите регулярное выражение. Например: <code>/^d[иы]скр[иы]м[иы]нант$/i</code>
            </div>
          )}

          <input
            type="text"
            placeholder={
              answerType === 'exact' ? 'дискриминант, D, d' :
              answerType === 'keywords' ? 'корень, уравнение' :
              '/^d[иы]скр[иы]м[иы]нант$/i'
            }
            value={answerMask}
            onChange={e => setAnswerMask(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontFamily: answerType === 'regex' ? 'var(--mono)' : 'var(--body)',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>
            Подсказка (опционально)
          </label>
          <input
            type="text"
            placeholder="Формула: D = b² - 4ac"
            value={hint}
            onChange={e => setHint(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
            }}
          />
        </div>

        <button 
          onClick={saveQuestion}
          className="btn-primary"
        >
          Сохранить вопрос
        </button>
      </div>

      <div className="section-card">
        <h2>Сохранённые вопросы ({questions.length})</h2>
        
        {questions.length === 0 ? (
          <p style={{ color: 'var(--text2)' }}>Пока нет вопросов</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, index) => (
              <div 
                key={q.id}
                style={{
                  padding: '16px',
                  background: 'var(--surface2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
                      Вопрос #{index + 1}
                    </div>
                    <h3 style={{ margin: 0 }}>{q.question}</h3>
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
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

                <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
                  <strong>Тип проверки:</strong>{' '}
                  {q.answerType === 'exact' && 'Точное совпадение'}
                  {q.answerType === 'keywords' && 'Ключевые слова'}
                  {q.answerType === 'regex' && 'Регулярное выражение'}
                </div>

                <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
                  <strong>Маска:</strong> <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>{q.answerMask}</code>
                </div>

                {q.hint && (
                  <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
                    <strong>Подсказка:</strong> {q.hint}
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
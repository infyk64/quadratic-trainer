import { useState } from 'react';
import { api } from '../api/client';
import { EquationCard } from '../components/EquationCard';
import { AnswerOptions } from '../components/AnswerOptions';
import { ModeSelector } from '../components/ModeSelector';
import { Solution } from '../components/Solution';
import type { Question } from '../types/index';

type Mode = 'full' | 'incomplete' | 'random';

export function Trainer() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mode, setMode] = useState<Mode>('random');

  const loadQuestion = async () => {
    const { data } = await api.get<Question>(`/questions/generate?mode=${mode}`);
    setQuestion(data);
    setSelected([]);
    setChecked(false);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setQuestion(null);
    setSelected([]);
    setChecked(false);
  };

  const checkAnswer = async () => {
    if (!question || selected.length === 0) return;
    
    const correctIds = question.options
    .filter(o => o.isCorrect)
    .map(o => o.id);
    
    const isCorrect =
    correctIds.length === selected.length &&
    correctIds.every(id => selected.includes(id));
    
    setChecked(true);
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    
    try {
      await api.post('/attempts', {
        userId: parseInt(localStorage.getItem('userId') || '0'),
        isCorrect: isCorrect,
      });
      console.log('✅ Попытка сохранена в БД');
    } catch (err) {
      console.error('❌ Ошибка сохранения:', err);
    }
  };

  return (
    <div className="trainer-page">
      <h1>Квадратные уравнения</h1>

      <div className="score">✅ {score.correct} / {score.total}</div>

      <ModeSelector mode={mode} onChange={handleModeChange} />

      {!question && (
        <button className="btn-primary" onClick={loadQuestion}>
          Начать тренировку
        </button>
      )}

      {question && (
        <>
          <EquationCard
            a={question.equation.a}
            b={question.equation.b}
            c={question.equation.c}
          />

          <p className="hint">Выбери все правильные корни:</p>

          <AnswerOptions
            options={question.options}
            selected={selected}
            onChange={setSelected}
            disabled={checked}
          />

          {checked && (
            <>
              <div className={`result ${
                question.options
                  .filter(o => o.isCorrect)
                  .every(o => selected.includes(o.id))
                    ? 'result-correct'
                    : 'result-wrong'
              }`}>
                {question.options.filter(o => o.isCorrect).every(o => selected.includes(o.id))
                  ? '✅ Верно!'
                  : `❌ Неверно. Правильный ответ: ${
                      question.options.filter(o => o.isCorrect).map(o => o.label).join(', ')
                    }`
                }
              </div>

              <Solution
                a={question.equation.a}
                b={question.equation.b}
                c={question.equation.c}
                discriminant={question.equation.discriminant}
                roots={question.equation.roots}
              />
            </>
          )}

          {!checked ? (
            <button
              className="btn-primary"
              onClick={checkAnswer}
              disabled={selected.length === 0}
            >
              Проверить
            </button>
          ) : (
            <button className="btn-primary" onClick={loadQuestion}>
              Следующее →
            </button>
          )}
        </>
      )}
    </div>
  );
}
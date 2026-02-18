import type { AnswerOption } from '../types';

interface Props {
  options: AnswerOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  disabled: boolean;
}

export function AnswerOptions({ options, selected, onChange, disabled }: Props) {
  const toggle = (id: number) => {
    if (disabled) return;
    selected.includes(id)
      ? onChange(selected.filter(s => s !== id))
      : onChange([...selected, id]);
  };

  return (
    <div className="options-list">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => toggle(opt.id)}
          disabled={disabled}
          className={[
            'option-btn',
            selected.includes(opt.id) ? 'selected' : '',
            disabled && opt.isCorrect ? 'correct' : '',
            disabled && selected.includes(opt.id) && !opt.isCorrect ? 'wrong' : '',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
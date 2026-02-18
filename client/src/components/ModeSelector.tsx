interface Props {
  mode: 'full' | 'incomplete' | 'random';
  onChange: (mode: 'full' | 'incomplete' | 'random') => void;
}

const MODES = [
  { value: 'full',       label: '📐 Полные',    hint: 'ax² + bx + c = 0' },
  { value: 'incomplete', label: '📏 Неполные',  hint: 'ax² + c = 0' },
  { value: 'random',     label: '🎲 Случайные', hint: 'любые' },
] as const;

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="mode-selector">
      <p className="hint">Выбери режим:</p>
      <div className="mode-list">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`mode-btn ${mode === m.value ? 'mode-active' : ''}`}
          >
            <span className="mode-label">{m.label}</span>
            <span className="mode-hint">{m.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
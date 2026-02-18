interface Props {
  a: number;
  b: number;
  c: number;
}

export function EquationCard({ a, b, c }: Props) {
  // Красиво форматируем уравнение
  const formatB = (b: number) => {
    if (b === 0) return '';
    if (b === 1) return ' + x';
    if (b === -1) return ' - x';
    return b > 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`;
  };

  const formatC = (c: number) => {
    if (c === 0) return '';
    return c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
  };

  const formatA = (a: number) => {
    if (a === 1) return 'x²';
    if (a === -1) return '-x²';
    return `${a}x²`;
  };

  return (
    <div className="equation-card">
      <p className="equation-text">
        {formatA(a)}{formatB(b)}{formatC(c)} = 0
      </p>
    </div>
  );
}
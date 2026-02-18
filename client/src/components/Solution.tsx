interface Props {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  roots: number[];
}

export function Solution({ a, b, c, discriminant, roots }: Props) {
  const D = discriminant;

  return (
    <div className="solution">
      <p className="solution-title">📖 Решение:</p>

      {/* Шаг 1 — формула дискриминанта */}
      <div className="solution-step">
        <span className="step-num">1</span>
        <span>
          D = b² − 4ac = {b}² − 4 · {a} · {c} = {b * b} − {4 * a * c} = <strong>{D}</strong>
        </span>
      </div>

      {/* Шаг 2 — вывод по дискриминанту */}
      <div className="solution-step">
        <span className="step-num">2</span>
        {D < 0 && <span>D &lt; 0 → <strong>корней нет</strong></span>}
        {D === 0 && <span>D = 0 → <strong>один корень</strong></span>}
        {D > 0 && <span>D &gt; 0 → <strong>два корня</strong></span>}
      </div>

      {/* Шаг 3 — вычисление корней */}
      {D >= 0 && (
        <div className="solution-step">
          <span className="step-num">3</span>
          <div className="roots-calc">
            {D === 0 && (
              <span>x = −b / 2a = {-b} / {2 * a} = <strong>{roots[0]}</strong></span>
            )}
            {D > 0 && (
              <>
                <span>
                  x₁ = (−b + √D) / 2a = ({-b} + √{D}) / {2 * a} = <strong>{roots[0]}</strong>
                </span>
                <span>
                  x₂ = (−b − √D) / 2a = ({-b} − √{D}) / {2 * a} = <strong>{roots[1]}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
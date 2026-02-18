export function Reference() {
  return (
    <div className="reference-page">
      <h1>📚 Справочник</h1>
      <p className="reference-subtitle">Как решать квадратные уравнения</p>

      {/* Раздел 1 — Что такое квадратное уравнение */}
      <section className="ref-section">
        <h2>Что такое квадратное уравнение?</h2>
        <p>
          Квадратное уравнение — это уравнение вида:
        </p>
        <div className="formula-box">
          ax² + bx + c = 0
        </div>
        <p>где <b>a ≠ 0</b>, а b и c — любые числа.</p>
      </section>

      {/* Раздел 2 — Виды уравнений */}
      <section className="ref-section">
        <h2>Виды квадратных уравнений</h2>
        <div className="cards-grid">
          <div className="ref-card">
            <div className="ref-card-title">📐 Полное</div>
            <div className="ref-card-formula">ax² + bx + c = 0</div>
            <div className="ref-card-example">Пример: 2x² + 3x − 5 = 0</div>
          </div>
          <div className="ref-card">
            <div className="ref-card-title">📏 Неполное</div>
            <div className="ref-card-formula">ax² + c = 0</div>
            <div className="ref-card-example">Пример: 3x² − 12 = 0</div>
          </div>
        </div>
      </section>

      {/* Раздел 3 — Решение через дискриминант */}
      <section className="ref-section">
        <h2>Метод дискриминанта</h2>
        <p>Применяется для <b>полных</b> квадратных уравнений.</p>

        <div className="steps-list">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">Вычисли дискриминант</div>
              <div className="formula-box small">D = b² − 4ac</div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">Определи количество корней</div>
              <div className="cases-list">
                <div className="case case-negative">D &lt; 0 → корней нет</div>
                <div className="case case-zero">D = 0 → один корень</div>
                <div className="case case-positive">D &gt; 0 → два корня</div>
              </div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">Найди корни</div>
              <div className="formula-box small">x = (−b ± √D) / 2a</div>
              <div className="formula-hint">
                x₁ = (−b + √D) / 2a<br />
                x₂ = (−b − √D) / 2a
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Раздел 4 — Решение неполного */}
      <section className="ref-section">
        <h2>Решение неполного уравнения</h2>
        <p>Если b = 0, уравнение имеет вид <b>ax² + c = 0</b>:</p>

        <div className="steps-list">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">Перенеси c в правую часть</div>
              <div className="formula-box small">ax² = −c</div>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">Раздели на a</div>
              <div className="formula-box small">x² = −c / a</div>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">Извлеки корень</div>
              <div className="cases-list">
                <div className="case case-negative">−c/a &lt; 0 → корней нет</div>
                <div className="case case-zero">−c/a = 0 → x = 0</div>
                <div className="case case-positive">−c/a &gt; 0 → x = ±√(−c/a)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Раздел 5 — Пример */}
      <section className="ref-section">
        <h2>Разобранный пример</h2>
        <div className="example-box">
          <div className="example-task">Решить: 2x² − 5x + 3 = 0</div>

          <div className="example-step">
            <span className="ex-num">1</span>
            <span>a = 2, b = −5, c = 3</span>
          </div>
          <div className="example-step">
            <span className="ex-num">2</span>
            <span>D = (−5)² − 4 · 2 · 3 = 25 − 24 = <b>1</b></span>
          </div>
          <div className="example-step">
            <span className="ex-num">3</span>
            <span>D = 1 &gt; 0 → два корня</span>
          </div>
          <div className="example-step">
            <span className="ex-num">4</span>
            <span>x₁ = (5 + 1) / 4 = <b>1.5</b></span>
          </div>
          <div className="example-step">
            <span className="ex-num">5</span>
            <span>x₂ = (5 − 1) / 4 = <b>1</b></span>
          </div>

          <div className="example-answer">Ответ: x₁ = 1.5, x₂ = 1</div>
        </div>
      </section>
    </div>
  );
}
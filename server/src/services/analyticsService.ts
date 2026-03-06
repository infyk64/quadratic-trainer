/**
 * analyticsService.ts
 * 
 * Аналитика успеваемости:
 * 1. Линейная регрессия (метод наименьших квадратов) — прогноз оценки
 * 2. Наивный Байес — классификация студента по категории риска
 */

// ============================================
// 1. ЛИНЕЙНАЯ РЕГРЕССИЯ
// y = a + bx (x = номер попытки, y = score_percent)
// ============================================

export interface RegressionResult {
  slope: number;          // наклон (b) — тренд: >0 растёт, <0 падает
  intercept: number;      // пересечение (a)
  r_squared: number;      // R² — качество модели (0..1)
  trend: "improving" | "declining" | "stable";
  prediction_next: number;  // прогноз следующего результата
  prediction_5: number;     // прогноз через 5 попыток
  points: Array<{ x: number; y: number }>;         // исходные точки
  trend_line: Array<{ x: number; y: number }>;     // линия тренда
}

export function linearRegression(scores: number[]): RegressionResult | null {
  const n = scores.length;
  if (n < 2) return null;

  const points = scores.map((y, i) => ({ x: i + 1, y }));

  // Суммы для МНК
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  // Коэффициенты y = a + bx
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² (коэффициент детерминации)
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const p of points) {
    const predicted = intercept + slope * p.x;
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r_squared = ssTot === 0 ? 0 : Math.round((1 - ssRes / ssTot) * 1000) / 1000;

  // Тренд
  let trend: "improving" | "declining" | "stable";
  if (slope > 1) trend = "improving";
  else if (slope < -1) trend = "declining";
  else trend = "stable";

  // Прогнозы
  const nextX = n + 1;
  const prediction_next = Math.min(100, Math.max(0, Math.round((intercept + slope * nextX) * 10) / 10));
  const prediction_5 = Math.min(100, Math.max(0, Math.round((intercept + slope * (n + 5)) * 10) / 10));

  // Линия тренда (от первой до прогнозной точки)
  const trend_line = [];
  for (let x = 1; x <= n + 3; x++) {
    trend_line.push({
      x,
      y: Math.round((intercept + slope * x) * 10) / 10,
    });
  }

  return {
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
    r_squared,
    trend,
    prediction_next,
    prediction_5,
    points,
    trend_line,
  };
}


// ============================================
// 2. НАИВНЫЙ БАЙЕС — КЛАССИФИКАЦИЯ
// Категории: "excellent" | "good" | "average" | "at_risk"
// ============================================

export type StudentCategory = "excellent" | "good" | "average" | "at_risk";

export interface ClassificationResult {
  category: StudentCategory;
  label: string;
  confidence: number;          // уверенность 0..1
  probabilities: Record<StudentCategory, number>;  // вероятности каждого класса
  features: {
    avg_score: number;
    tests_passed: number;
    error_rate: number;
    avg_time_ratio: number;    // среднее время / лимит (0..2+)
    trend_slope: number;       // из регрессии
  };
  recommendation: string;
}

// Параметры Гауссова распределения для каждого класса
// Получены эмпирически для образовательной системы
interface GaussParams { mean: number; std: number; }

const CLASS_PRIORS: Record<StudentCategory, number> = {
  excellent: 0.2,
  good: 0.3,
  average: 0.3,
  at_risk: 0.2,
};

// Параметры для каждой фичи в каждом классе
// feature → class → {mean, std}
const FEATURE_PARAMS: Record<string, Record<StudentCategory, GaussParams>> = {
  avg_score: {
    excellent: { mean: 92, std: 5 },
    good:      { mean: 78, std: 8 },
    average:   { mean: 60, std: 10 },
    at_risk:   { mean: 35, std: 15 },
  },
  error_rate: {
    excellent: { mean: 8, std: 5 },
    good:      { mean: 20, std: 8 },
    average:   { mean: 35, std: 10 },
    at_risk:   { mean: 55, std: 15 },
  },
  trend_slope: {
    excellent: { mean: 2, std: 3 },
    good:      { mean: 0.5, std: 2 },
    average:   { mean: -0.5, std: 3 },
    at_risk:   { mean: -3, std: 4 },
  },
  avg_time_ratio: {
    excellent: { mean: 0.5, std: 0.15 },
    good:      { mean: 0.7, std: 0.15 },
    average:   { mean: 0.85, std: 0.15 },
    at_risk:   { mean: 1.1, std: 0.3 },
  },
};

const CATEGORY_LABELS: Record<StudentCategory, string> = {
  excellent: "Отличник",
  good: "Хорошист",
  average: "Средний уровень",
  at_risk: "Группа риска",
};

const RECOMMENDATIONS: Record<StudentCategory, string> = {
  excellent: "Студент демонстрирует высокий уровень. Можно предложить усложнённые задания.",
  good: "Хороший уровень подготовки. Стоит поработать над ошибками в сложных темах.",
  average: "Средний результат. Рекомендуется повторить теоретический материал и увеличить практику.",
  at_risk: "Студент в группе риска. Требуется дополнительное внимание и индивидуальная работа.",
};

// Плотность нормального распределения
function gaussianPDF(x: number, mean: number, std: number): number {
  if (std === 0) return x === mean ? 1 : 0;
  const exponent = -((x - mean) ** 2) / (2 * std * std);
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

export function classifyStudent(features: {
  avg_score: number;
  tests_passed: number;
  error_rate: number;
  avg_time_ratio: number;
  trend_slope: number;
}): ClassificationResult {
  const categories: StudentCategory[] = ["excellent", "good", "average", "at_risk"];

  // Вычисляем log-вероятность каждого класса
  const logProbs: Record<StudentCategory, number> = {} as any;

  for (const cat of categories) {
    let logP = Math.log(CLASS_PRIORS[cat]);

    for (const featureName of Object.keys(FEATURE_PARAMS)) {
      const value = (features as any)[featureName];
      if (value === undefined || value === null) continue;

      const params = FEATURE_PARAMS[featureName][cat];
      const pdf = gaussianPDF(value, params.mean, params.std);
      logP += Math.log(Math.max(pdf, 1e-10)); // защита от log(0)
    }

    logProbs[cat] = logP;
  }

  // Нормализуем через softmax
  const maxLogP = Math.max(...Object.values(logProbs));
  const expProbs: Record<StudentCategory, number> = {} as any;
  let sumExp = 0;
  for (const cat of categories) {
    expProbs[cat] = Math.exp(logProbs[cat] - maxLogP);
    sumExp += expProbs[cat];
  }

  const probabilities: Record<StudentCategory, number> = {} as any;
  let bestCat: StudentCategory = "average";
  let bestProb = 0;
  for (const cat of categories) {
    probabilities[cat] = Math.round((expProbs[cat] / sumExp) * 1000) / 1000;
    if (probabilities[cat] > bestProb) {
      bestProb = probabilities[cat];
      bestCat = cat;
    }
  }

  return {
    category: bestCat,
    label: CATEGORY_LABELS[bestCat],
    confidence: bestProb,
    probabilities,
    features,
    recommendation: RECOMMENDATIONS[bestCat],
  };
}
export interface Equation {
  a: number;
  b: number;
  c: number;
  type: 'full' | 'incomplete';
  discriminant: number;
  roots: number[];
}

export interface AnswerOption {
  id: number;
  label: string;
  isCorrect: boolean;
}

export interface Question {
  equation: Equation;
  options: AnswerOption[];
}

// Случайное целое число в диапазоне
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ненулевое число (чтобы a и c не были 0)
function randomNonZero(min: number, max: number): number {
  let n = 0;
  while (n === 0) n = randomInt(min, max);
  return n;
}

// Округление до 2 знаков
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Вычисление корней
function computeRoots(a: number, b: number, c: number, D: number): number[] {
  if (D < 0) return [];
  if (D === 0) return [round(-b / (2 * a))];
  return [
    round((-b + Math.sqrt(D)) / (2 * a)),
    round((-b - Math.sqrt(D)) / (2 * a)),
  ];
}

// Перемешать массив
function shuffle<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5);
}

// Неправильные варианты ответов
function generateWrongOptions(roots: number[], count: number): AnswerOption[] {
  const wrong: AnswerOption[] = [];
  let id = 10; // начинаем с 10 чтобы не пересекаться с правильными

  while (wrong.length < count) {
    const fake = round(roots[0] + randomNonZero(-3, 3));
    const alreadyExists = wrong.some(w => w.label === `x = ${fake}`)
      || roots.includes(fake);

    if (!alreadyExists) {
      wrong.push({ id: id++, label: `x = ${fake}`, isCorrect: false });
    }
  }

  return wrong;
}

// Главная функция — генерация вопроса
export function generateQuestion(mode: 'full' | 'incomplete' | 'random'): Question {
  const type = mode === 'random'
    ? (Math.random() > 0.5 ? 'full' : 'incomplete')
    : mode;

  const a = randomNonZero(-5, 5);
  const b = type === 'full' ? randomInt(-10, 10) : 0;
  const c = randomNonZero(-10, 10);

  const D = b * b - 4 * a * c;
  const roots = computeRoots(a, b, c, D);

  const equation: Equation = { a, b, c, type, discriminant: D, roots };

  // Формируем варианты ответов
  const correctOptions: AnswerOption[] = roots.length === 0
    ? [{ id: 1, label: 'Нет корней', isCorrect: true }]
    : roots.map((r, i) => ({ id: i + 1, label: `x = ${r}`, isCorrect: true }));

  const wrongCount = 4 - correctOptions.length;
  const wrongOptions = roots.length === 0
    ? [
        { id: 10, label: `x = ${randomNonZero(-5, 5)}`, isCorrect: false },
        { id: 11, label: `x = ${randomNonZero(-5, 5)}`, isCorrect: false },
        { id: 12, label: `x = ${randomNonZero(-5, 5)}`, isCorrect: false },
      ]
    : generateWrongOptions(roots, wrongCount);

  return {
    equation,
    options: shuffle([...correctOptions, ...wrongOptions]),
  };
}
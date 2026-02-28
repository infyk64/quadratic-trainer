export interface CheckResult {
  isCorrect: boolean;
  expected?: string;
}

export function checkAnswer(
  studentAnswer: string,
  answerMask: string,
  answerType: string,
): CheckResult {
  if (!studentAnswer || !studentAnswer.trim()) {
    return { isCorrect: false, expected: answerMask };
  }
  const answer = studentAnswer.trim();
  switch (answerType) {
    case "exact":
      return checkExact(answer, answerMask);
    case "keywords":
      return checkKeywords(answer, answerMask);
    case "regex":
      return checkRegex(answer, answerMask);
    case "numeric":
      return checkNumeric(answer, answerMask);
    default:
      return checkExact(answer, answerMask);
  }
}

function checkExact(answer: string, mask: string): CheckResult {
  const variants = mask.split(",").map((v) => v.trim().toLowerCase());
  const normalizedAnswer = answer.toLowerCase().trim();
  const isCorrect = variants.some((v) => v === normalizedAnswer);
  return { isCorrect, expected: variants[0] };
}

function checkKeywords(answer: string, mask: string): CheckResult {
  const keywords = mask.split(",").map((k) => k.trim().toLowerCase());
  const normalizedAnswer = answer.toLowerCase();
  const isCorrect = keywords.every((kw) => normalizedAnswer.includes(kw));
  return {
    isCorrect,
    expected: "Ответ должен содержать: " + keywords.join(", "),
  };
}

function checkRegex(answer: string, mask: string): CheckResult {
  try {
    let pattern: string;
    let flags = "i";
    const regexMatch = mask.match(/^\/(.+)\/([gimsuy]*)$/);
    if (regexMatch) {
      pattern = regexMatch[1];
      flags = regexMatch[2] || "i";
    } else {
      pattern = mask;
    }
    const regex = new RegExp(pattern, flags);
    const isCorrect = regex.test(answer.trim());
    return { isCorrect };
  } catch (err) {
    console.error("Ошибка regex:", mask, err);
    return checkExact(answer, mask);
  }
}

function checkNumeric(answer: string, mask: string): CheckResult {
  const EPSILON = 0.01;
  const noRootsPatterns = [
    "нет корней",
    "нет решений",
    "корней нет",
    "решений нет",
    "0 корней",
    "пустое множество",
  ];

  const normalizedAnswer = answer.toLowerCase().trim();
  const normalizedMask = mask.toLowerCase().trim();

  if (noRootsPatterns.includes(normalizedMask)) {
    const isCorrect = noRootsPatterns.some((p) => normalizedAnswer.includes(p));
    return { isCorrect, expected: "нет корней" };
  }

  if (noRootsPatterns.some((p) => normalizedAnswer.includes(p))) {
    return { isCorrect: false, expected: mask };
  }

  const expectedNumbers = mask
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  const answerNumbers = answer
    .replace(/x[₁₂12]?\s*=\s*/gi, "")
    .replace(/и/g, ",")
    .replace(/;/g, ",")
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (expectedNumbers.length !== answerNumbers.length) {
    return { isCorrect: false, expected: expectedNumbers.join(", ") };
  }

  const isCorrect = expectedNumbers.every(
    (exp, i) => Math.abs(exp - answerNumbers[i]) <= EPSILON,
  );

  return { isCorrect, expected: expectedNumbers.join(", ") };
}

export function checkEquationAnswer(
  a: number,
  b: number,
  c: number,
  studentAnswer: string,
): CheckResult {
  const D = b * b - 4 * a * c;
  if (D < 0) return checkNumeric(studentAnswer, "нет корней");

  const roots: number[] = [];
  if (D === 0) {
    roots.push(round(-b / (2 * a)));
  } else {
    roots.push(round((-b + Math.sqrt(D)) / (2 * a)));
    roots.push(round((-b - Math.sqrt(D)) / (2 * a)));
  }

  const mask = roots.sort((a, b) => a - b).join(", ");
  return checkNumeric(studentAnswer, mask);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

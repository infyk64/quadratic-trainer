export interface AnswerOption {
  id: number;
  label: string;
  isCorrect?: boolean;
}

export interface Equation {
  a: number;
  b: number;
  c: number;
  type: 'full' | 'incomplete';
  discriminant: number;
  roots: number[];
}

export interface Question {
  equation: Equation;
  options: AnswerOption[];
}
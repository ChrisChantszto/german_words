import { GameAnswer } from '../../shared/types/api';

export function computeScore(answers: GameAnswer[]) {
  const score = answers.filter(a => a.correct).length;
  const perfect = score === answers.length;
  return { score, perfect };
}

export function updateStreak(currentStreak: number, score: number, totalItems: number): { newStreak: number; passed: boolean } {
  const passed = score >= Math.ceil(totalItems * 0.625); // 5/8 = 62.5%
  const newStreak = passed ? currentStreak + 1 : 0;
  return { newStreak, passed };
}

export function calculateTotalTime(answers: GameAnswer[]): number {
  return answers.reduce((total, answer) => total + answer.ms, 0);
}

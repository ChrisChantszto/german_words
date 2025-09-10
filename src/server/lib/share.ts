import { GameAnswer } from '../../shared/types/api';

export function makeGrid(answers: GameAnswer[]): string {
  return answers.map(answer => answer.correct ? "🟩" : "🟥").join("");
}

export function formatShare(
  score: number, 
  totalItems: number, 
  timeMs: number, 
  perfect: boolean, 
  answers: GameAnswer[],
  dayIndex?: number
): string {
  const timeSeconds = Math.round(timeMs / 1000);
  const perfectStar = perfect ? " ⭐" : "";
  const grid = makeGrid(answers);
  
  const dateStr = dayIndex ? `${dayIndex}` : new Date().toISOString().slice(0, 10);
  
  return `WordMatch ${dateStr} ${score}/${totalItems}${perfectStar} in ${timeSeconds}s\n${grid}`;
}

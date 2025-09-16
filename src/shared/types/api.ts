// Game Types
export type ChoiceKey = "A" | "B" | "C";

// Hangman Game Types
export type HangmanDifficulty = 'easy' | 'medium' | 'hard';

export type HangmanWord = {
  word: string;
  hint: string;
};

export type HangmanGame = {
  id: string;
  lang: string;
  date: string;
  word: string;
  hint: string;
  maxAttempts: number;
  difficulty: HangmanDifficulty;
  meta?: { author?: string; source?: string; };
};

export type HangmanGuess = {
  letter: string;
  correct: boolean;
  timestamp: number;
};

export type HangmanResult = {
  word: string;
  guesses: HangmanGuess[];
  revealed: string[];
  success: boolean;
  timeMs: number;
};

// Legacy Types (for backward compatibility)
export type WordMatchItem = {
  id: string;
  prompt_en: string;
  direction: "EN->L2" | "L2->EN";
  choices: { label: string; key: ChoiceKey }[];
  answerKey: ChoiceKey;
  note?: string;
  tags?: string[];
  variants?: string[];
  ref?: string;
};

export type WordMatchDaily = {
  id: string;
  lang: string;
  date: string;
  items: WordMatchItem[];
  meta?: { author?: string; source?: string; difficulty?: 1 | 2 | 3 };
};

export type UserResult = {
  userId: string;
  seed: string;
  score: number;
  timeMs: number;
  answers: { itemId: string; pick: ChoiceKey; correct: boolean; ms: number }[];
};

export type HangmanUserResult = {
  userId: string;
  seed: string;
  score: number;
  timeMs: number;
  word: string;
  guesses: HangmanGuess[];
  success: boolean;
};

export type UserState = {
  streak: number;
  maxStreak: number;
  lastPlayed?: string;
};

export type GameAnswer = {
  itemId: string;
  pick: ChoiceKey;
  correct: boolean;
  ms: number;
};

// API Response Types
export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  userState: UserState;
};

export type GetPuzzleResponse = {
  type: 'puzzle';
  puzzle: WordMatchDaily;
};

export type GetHangmanGameResponse = {
  type: 'hangman';
  game: HangmanGame;
};

export type SubmitResultResponse = {
  type: 'result';
  score: number;
  perfect: boolean;
  timeMs: number;
  newStreak: number;
  maxStreak: number;
  shareText: string;
  answers: GameAnswer[];
};

export type SubmitHangmanResultResponse = {
  type: 'hangmanResult';
  score: number;
  perfect: boolean;
  timeMs: number;
  newStreak: number;
  maxStreak: number;
  shareText: string;
  word: string;
  guesses: HangmanGuess[];
  success: boolean;
};

export type GetUserStateResponse = {
  type: 'userState';
  userState: UserState;
};

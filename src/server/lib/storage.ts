import { redis } from '@devvit/web/server';
import { UserState, UserResult, WordMatchDaily, HangmanGame, HangmanUserResult } from '../../shared/types/api';

export class GameStorage {
  // User state management
  static async getUserState(userId: string): Promise<UserState> {
    const [streak, maxStreak, lastPlayed] = await Promise.all([
      redis.get(`user:${userId}:streak`),
      redis.get(`user:${userId}:maxStreak`),
      redis.get(`user:${userId}:lastPlayed`)
    ]);

    return {
      streak: streak ? parseInt(streak) : 0,
      maxStreak: maxStreak ? parseInt(maxStreak) : 0,
      ...(lastPlayed && { lastPlayed })
    };
  }

  static async updateUserState(userId: string, state: UserState): Promise<void> {
    await Promise.all([
      redis.set(`user:${userId}:streak`, state.streak.toString()),
      redis.set(`user:${userId}:maxStreak`, state.maxStreak.toString()),
      state.lastPlayed && redis.set(`user:${userId}:lastPlayed`, state.lastPlayed)
    ]);
  }

  // Game result storage
  static async saveUserResult(result: UserResult): Promise<void> {
    const key = `user:${result.userId}:played:${result.seed}`;
    await redis.set(key, JSON.stringify(result));
  }

  static async getUserResult(userId: string, seed: string): Promise<UserResult | null> {
    const key = `user:${userId}:played:${seed}`;
    const result = await redis.get(key);
    return result ? JSON.parse(result) : null;
  }
  
  // Hangman result storage
  static async saveHangmanResult(result: HangmanUserResult): Promise<void> {
    const key = `user:${result.userId}:hangman:${result.seed}`;
    await redis.set(key, JSON.stringify(result));
  }

  static async getHangmanResult(userId: string, seed: string): Promise<HangmanUserResult | null> {
    const key = `user:${userId}:hangman:${seed}`;
    const result = await redis.get(key);
    return result ? JSON.parse(result) : null;
  }

  // Puzzle storage
  static async savePuzzle(puzzle: WordMatchDaily): Promise<void> {
    const key = `wm:puzzle:${puzzle.id}`;
    await redis.set(key, JSON.stringify(puzzle));
  }

  static async getPuzzle(seed: string): Promise<WordMatchDaily | null> {
    const key = `wm:puzzle:${seed}`;
    const puzzle = await redis.get(key);
    return puzzle ? JSON.parse(puzzle) : null;
  }
  
  // Hangman game storage
  static async saveHangmanGame(game: HangmanGame): Promise<void> {
    const key = `hangman:game:${game.id}`;
    await redis.set(key, JSON.stringify(game));
  }

  static async getHangmanGame(seed: string): Promise<HangmanGame | null> {
    const key = `hangman:game:${seed}`;
    const game = await redis.get(key);
    return game ? JSON.parse(game) : null;
  }

  // Word bank storage
  static async saveWordBank(lang: string, items: any[]): Promise<void> {
    const key = `wm:bank:${lang}`;
    await redis.set(key, JSON.stringify(items));
  }

  static async getWordBank(lang: string): Promise<any[] | null> {
    const key = `wm:bank:${lang}`;
    const bank = await redis.get(key);
    return bank ? JSON.parse(bank) : null;
  }
}

import { redis } from '@devvit/web/server';
import { UserState, UserResult, WordMatchDaily, HangmanGame, HangmanUserResult, HangmanWord } from '../../shared/types/api';
import { WordEnricherRedis } from './word-enricher-redis';

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
  
  // German words enrichment methods for testing
  
  /**
   * Get all German words from Redis
   */
  static async getAllGermanWords(): Promise<{
    easy: HangmanWord[];
    medium: HangmanWord[];
    hard: HangmanWord[];
  }> {
    return await WordEnricherRedis.getAllWords();
  }
  
  /**
   * Add a test word to Redis
   */
  static async addTestWord(word: string, hint: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<boolean> {
    console.log(`Adding test word to Redis: ${word} (${difficulty}): ${hint}`);
    return await WordEnricherRedis.addWord(word, hint, difficulty);
  }
  
  /**
   * Add multiple test words to Redis
   */
  static async addTestWords(words: Array<{ word: string; hint: string; difficulty: 'easy' | 'medium' | 'hard' }>): Promise<number> {
    console.log(`Adding ${words.length} test words to Redis...`);
    let addedCount = 0;
    
    for (const { word, hint, difficulty } of words) {
      const added = await WordEnricherRedis.addWord(word, hint, difficulty);
      if (added) {
        addedCount++;
        console.log(`Added: ${word} (${difficulty}): ${hint}`);
      } else {
        console.log(`Skipped (already exists): ${word}`);
      }
    }
    
    console.log(`Added ${addedCount} new words to Redis`);
    return addedCount;
  }
  
  /**
   * Enrich words using OpenThesaurus
   */
  static async enrichWordsWithTerm(term: string, count: number = 5): Promise<number> {
    console.log(`Enriching words with term "${term}" (count: ${count})...`);
    return await WordEnricherRedis.searchAndAddWords(term, count);
  }
  
  /**
   * View Redis storage statistics
   */
  static async viewRedisStats(): Promise<{
    germanWordsKeys: string[];
    wordCounts: { easy: number; medium: number; hard: number; total: number };
  }> {
    // Get German words keys - we'll use scan instead of keys
    const germanWordsKeys = [
      'german_words:easy',
      'german_words:medium',
      'german_words:hard'
    ];
    
    // Check if each key exists
    const keyExists = await Promise.all(
      germanWordsKeys.map(key => redis.exists(key))
    );
    
    // Get word counts
    const words = await WordEnricherRedis.getAllWords();
    const wordCounts = {
      easy: words.easy.length,
      medium: words.medium.length,
      hard: words.hard.length,
      total: words.easy.length + words.medium.length + words.hard.length
    };
    
    return {
      germanWordsKeys: germanWordsKeys.filter((_, i) => keyExists[i]),
      wordCounts
    };
  }
}

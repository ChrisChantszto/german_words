import { HangmanGame, HangmanDifficulty, HangmanGuess } from '../../shared/types/api';
import { getRandomWord, getWordByIndex } from './german-words';
import { GameStorage } from './storage';

export class HangmanManager {
  // Create a new Hangman game
  static async createHangmanGame(
    date: Date,
    language: string = 'de',
    difficulty: HangmanDifficulty = 'medium'
  ): Promise<HangmanGame> {
    const dateStr = date.toISOString().slice(0, 10);
    const seed = `${dateStr}:${language}:hangman`;
    
    // Check if game already exists for this seed
    const existingGame = await GameStorage.getHangmanGame(seed);
    if (existingGame) {
      return existingGame;
    }
    
    // Generate a deterministic "random" number based on the seed
    const seedNum = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Get a word based on the seed
    const wordData = await getWordByIndex(difficulty, seedNum);
    // Add null check to prevent TypeScript errors
    if (!wordData) {
      throw new Error(`Failed to get word for difficulty ${difficulty}`);
    }
    const word = wordData.word;
    const hint = wordData.hint;
    
    // Create the game
    const game: HangmanGame = {
      id: seed,
      lang: language,
      date: dateStr,
      word: word,
      hint: hint,
      maxAttempts: 6, // Standard hangman rules
      difficulty: difficulty,
      meta: {
        source: 'hangman',
      }
    };
    
    // Save the game
    await GameStorage.saveHangmanGame(game);
    
    return game;
  }
  
  // Create a random practice game
  static async createPracticeGame(
    language: string = 'de',
    difficulty: HangmanDifficulty = 'medium'
  ): Promise<HangmanGame> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);
    const seed = `${dateStr}:${language}:hangman:practice:${Date.now()}`;
    
    // Get a random word
    const wordData = await getRandomWord(difficulty);
    // Add null check to prevent TypeScript errors
    if (!wordData) {
      throw new Error(`Failed to get random word for difficulty ${difficulty}`);
    }
    const word = wordData.word;
    const hint = wordData.hint;
    
    // Create the game
    const game: HangmanGame = {
      id: seed,
      lang: language,
      date: dateStr,
      word: word,
      hint: hint,
      maxAttempts: 6,
      difficulty: difficulty,
      meta: {
        source: 'practice',
      }
    };
    
    // No need to save practice games
    
    return game;
  }
  
  // Calculate score for a Hangman game
  static calculateScore(
    word: string,
    guesses: HangmanGuess[],
    success: boolean,
    timeMs: number
  ): { score: number; perfect: boolean } {
    // Base score calculation
    let score = 0;
    
    // If the player succeeded
    if (success) {
      // Base points for winning
      score += 100;
      
      // Bonus points for each remaining attempt (incorrect guesses)
      const incorrectGuesses = guesses.filter(g => !g.correct).length;
      const remainingAttempts = 6 - incorrectGuesses;
      score += remainingAttempts * 15;
      
      // Time bonus (faster is better)
      const timeSeconds = timeMs / 1000;
      if (timeSeconds < 30) {
        score += 50;
      } else if (timeSeconds < 60) {
        score += 30;
      } else if (timeSeconds < 90) {
        score += 15;
      }
      
      // Efficiency bonus (fewer guesses is better)
      const uniqueLettersInWord = new Set(word.toLowerCase().split('')).size;
      const correctGuesses = guesses.filter(g => g.correct).length;
      
      if (correctGuesses <= uniqueLettersInWord) {
        // Perfect efficiency - only guessed letters in the word
        score += 50;
      } else if (correctGuesses <= uniqueLettersInWord + 2) {
        // Good efficiency
        score += 25;
      }
    } else {
      // Partial points for unsuccessful attempts
      // Calculate how many letters were correctly guessed
      const uniqueLettersInWord = new Set(word.toLowerCase().split('')).size;
      const correctGuesses = guesses.filter(g => g.correct).length;
      
      // Award points based on progress
      const progressPercentage = correctGuesses / uniqueLettersInWord;
      score += Math.floor(progressPercentage * 50);
    }
    
    // Check if perfect game (won with no incorrect guesses)
    const perfect = success && !guesses.some(g => !g.correct);
    
    return { score, perfect };
  }
  
  // Format share text for social media
  static formatShareText(
    word: string,
    guesses: HangmanGuess[],
    success: boolean,
    timeMs: number
  ): string {
    const incorrectGuesses = guesses.filter(g => !g.correct).length;
    const timeSeconds = Math.floor(timeMs / 1000);
    
    let shareText = `Deutsch Hangman ${new Date().toISOString().slice(0, 10)}\n`;
    
    if (success) {
      shareText += `✅ I guessed "${word}" with ${incorrectGuesses} wrong guesses in ${timeSeconds}s!\n`;
    } else {
      shareText += `❌ Failed to guess "${word}" (${6 - incorrectGuesses}/6 attempts remaining)\n`;
    }
    
    // Add hangman visual representation
    for (let i = 0; i < 6; i++) {
      if (i < incorrectGuesses) {
        shareText += '❌';
      } else {
        shareText += '⬜';
      }
    }
    
    return shareText;
  }
}

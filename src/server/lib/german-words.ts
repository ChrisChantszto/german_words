// Word source utilities for the Hangman game
// Runtime word selection should use Redis only. If Redis is empty, we fetch from OpenThesaurus and persist.

// Import the Redis version of WordEnricher for enhanced word selection
import { WordEnricherRedis } from './word-enricher-redis';
import { HangmanDifficulty } from '../../shared/types/api';

// No preset base words; enrichment is done via Random Words API and persisted in Redis.

// Function to get a random word based on difficulty
export async function getRandomWord(difficulty: HangmanDifficulty = 'medium') {
  // Always prefer Redis-only words
  let words = await WordEnricherRedis.getWords(difficulty);
  if (!words || words.length === 0) {
    // On-demand enrichment: fetch random German words and persist to Redis
    await WordEnricherRedis.enrichWithRandomGermanWords(6);
    words = await WordEnricherRedis.getWords(difficulty);
  }
  if (!words || words.length === 0) {
    throw new Error(`No words available in Redis for difficulty ${difficulty}`);
  }
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

// Function to get a word by index (for deterministic selection based on seed)
export async function getWordByIndex(difficulty: HangmanDifficulty, index: number) {
  let words = await WordEnricherRedis.getWords(difficulty);
  if (!words || words.length === 0) {
    await WordEnricherRedis.enrichWithRandomGermanWords(6);
    words = await WordEnricherRedis.getWords(difficulty);
  }
  if (!words || words.length === 0) {
    throw new Error(`No words available in Redis for difficulty ${difficulty}`);
  }
  const safeIndex = index % words.length;
  return words[safeIndex];
}

// Function to enrich the word list using OpenThesaurus API
export async function enrichWordList(searchTerm: string, count: number = 10): Promise<number> {
  return WordEnricherRedis.searchAndAddWords(searchTerm, count);
}

// Function to add a custom word to the collection
export async function addCustomWord(
  word: string,
  hint: string,
  difficulty?: HangmanDifficulty
): Promise<boolean> {
  return WordEnricherRedis.addWord(word, hint, difficulty);
}

import { HangmanWord, HangmanDifficulty } from '../../shared/types/api';
import { OpenThesaurusAPI } from './openthesaurus-api';
import { RandomWordsAPI } from './random-words-api';
import { redis } from '@devvit/redis';

/**
 * Utility class for enriching the German word collection using OpenThesaurus API
 * This version uses Redis for storage instead of the file system
 */
export class WordEnricherRedis {
  // Redis keys
  private static readonly REDIS_KEY_PREFIX = 'german_words';
  private static readonly REDIS_KEY_EASY = `${WordEnricherRedis.REDIS_KEY_PREFIX}:easy`;
  private static readonly REDIS_KEY_MEDIUM = `${WordEnricherRedis.REDIS_KEY_PREFIX}:medium`;
  private static readonly REDIS_KEY_HARD = `${WordEnricherRedis.REDIS_KEY_PREFIX}:hard`;
  
  /**
   * Enriched words collection (in-memory cache)
   */
  private static enrichedWords: {
    easy: HangmanWord[];
    medium: HangmanWord[];
    hard: HangmanWord[];
  } = {
    easy: [],
    medium: [],
    hard: []
  };
  
  /**
   * Flag to track if words have been loaded from Redis
   */
  private static isInitialized = false;
  

  /**
   * Initialize the word enricher by loading words from Redis
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing WordEnricherRedis...');
      
      // Load Redis words per difficulty (no base JSON fallback)
      const [redisEasy, redisMedium, redisHard] = await Promise.all([
        this.getWordsFromRedis(this.REDIS_KEY_EASY),
        this.getWordsFromRedis(this.REDIS_KEY_MEDIUM),
        this.getWordsFromRedis(this.REDIS_KEY_HARD),
      ]);

      const pick = (redisWords: HangmanWord[] | undefined): HangmanWord[] => {
        if (redisWords && redisWords.length > 0) return [...redisWords];
        return [];
      };

      this.enrichedWords = {
        easy: pick(redisEasy),
        medium: pick(redisMedium),
        hard: pick(redisHard),
      };

      console.log(
        `Word pools ready - Easy: ${this.enrichedWords.easy.length} (redis:${redisEasy.length}), ` +
        `Medium: ${this.enrichedWords.medium.length} (redis:${redisMedium.length}), ` +
        `Hard: ${this.enrichedWords.hard.length} (redis:${redisHard.length})`
      );

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing word enricher:', error);
      // Keep empty pools on error; words will be filled by later enrichment calls
      this.enrichedWords = { easy: [], medium: [], hard: [] };
      this.isInitialized = true;
    }
  }

  /**
   * Get words from Redis by key
   */
  private static async getWordsFromRedis(key: string): Promise<HangmanWord[]> {
    try {
      // Get all words from the Redis hash
      const wordsHash = await redis.hGetAll(key);
      
      if (!wordsHash || Object.keys(wordsHash).length === 0) {
        return [];
      }
      
      // Convert hash to array of HangmanWord objects
      const words: HangmanWord[] = [];
      
      for (const word of Object.keys(wordsHash)) {
        const hint = wordsHash[word] || `A German word with ${word.length} letters`;
        words.push({ word, hint });
      }
      
      return words;
    } catch (error) {
      console.error(`Error getting words from Redis key ${key}:`, error);
      return [];
    }
  }

  /**
   * Save words to Redis
   */
  private static async saveToRedis(difficulty: HangmanDifficulty, words: HangmanWord[]): Promise<void> {
    try {
      // Determine the Redis key based on difficulty
      let key;
      switch (difficulty) {
        case 'easy':
          key = this.REDIS_KEY_EASY;
          break;
        case 'medium':
          key = this.REDIS_KEY_MEDIUM;
          break;
        case 'hard':
          key = this.REDIS_KEY_HARD;
          break;
      }
      
      // Skip if no words to save
      if (words.length === 0) {
        return;
      }
      
      // Create a hash of word -> hint pairs
      const wordHash: Record<string, string> = {};
      for (const { word, hint } of words) {
        wordHash[word] = hint || `A German word with ${word.length} letters`;
      }
      
      // Save to Redis
      await redis.hSet(key, wordHash);
      console.log(`Saved ${words.length} ${difficulty} words to Redis key: ${key}`);
    } catch (error) {
      console.error(`Error saving ${difficulty} words to Redis:`, error);
    }
  }

  /**
   * Get all words (original + enriched) for a specific difficulty
   * @param difficulty The difficulty level
   * @returns Array of words for the specified difficulty
   */
  static async getWords(difficulty: HangmanDifficulty): Promise<HangmanWord[]> {
    await this.initialize();
    return this.enrichedWords[difficulty];
  }

  /**
   * Get all words (original + enriched) for all difficulties
   * @returns Object containing words for all difficulties
   */
  static async getAllWords(): Promise<typeof WordEnricherRedis.enrichedWords> {
    await this.initialize();
    return this.enrichedWords;
  }

  /**
   * Add a new word to the collection
   * @param word The word to add
   * @param hint The hint for the word
   * @param difficulty Optional difficulty level (if not provided, it will be estimated)
   * @returns True if the word was added, false if it already exists
   */
  static async addWord(
    word: string, 
    hint: string, 
    difficulty?: HangmanDifficulty
  ): Promise<boolean> {
    await this.initialize();
    
    // Normalize the word
    const normalizedWord = word.toLowerCase().trim();
    
    // Check if the word already exists in any difficulty level
    const allWords = [
      ...this.enrichedWords.easy,
      ...this.enrichedWords.medium,
      ...this.enrichedWords.hard
    ];
    
    if (allWords.some(w => w.word.toLowerCase() === normalizedWord)) {
      return false; // Word already exists
    }
    
    // Determine difficulty if not provided
    const actualDifficulty = difficulty || RandomWordsAPI.estimateDifficulty(normalizedWord);
    
    // Create the new word object
    const newWord: HangmanWord = {
      word: normalizedWord,
      hint
    };
    
    // Add the word to the appropriate difficulty level
    this.enrichedWords[actualDifficulty].push(newWord);
    
    // Save to Redis
    await this.saveToRedis(actualDifficulty, [newWord]);
    
    console.log(`Added new word to ${actualDifficulty} collection: ${normalizedWord} (${hint})`);
    return true;
  }

  /**
   * Fetch random German words via RandomWordsAPI and add them to Redis/in-memory
   * @param count Desired number of words to add (best-effort)
   * @returns Number of new words added
   */
  static async enrichWithRandomGermanWords(count: number = 6): Promise<number> {
    await this.initialize();
    try {
      const fetched = await RandomWordsAPI.fetchRandomGermanWords(count);

      // Group by difficulty
      const byDifficulty: Record<HangmanDifficulty, HangmanWord[]> = {
        easy: [],
        medium: [],
        hard: [],
      };

      let added = 0;

      for (const { word, hint } of fetched) {
        // Skip if already exists in any pool
        const exists = [
          ...this.enrichedWords.easy,
          ...this.enrichedWords.medium,
          ...this.enrichedWords.hard,
        ].some((w) => w.word.toLowerCase() === word.toLowerCase());
        if (exists) continue;

        const diff = RandomWordsAPI.estimateDifficulty(word);
        const entry: HangmanWord = { word, hint };
        this.enrichedWords[diff].push(entry);
        byDifficulty[diff].push(entry);
        added++;
      }

      // Persist per difficulty
      for (const diff of ['easy', 'medium', 'hard'] as const) {
        if (byDifficulty[diff].length > 0) {
          await this.saveToRedis(diff, byDifficulty[diff]);
        }
      }

      return added;
    } catch (e) {
      console.error('enrichWithRandomGermanWords failed:', e);
      return 0;
    }
  }

  /**
   * Fetch and add new words from OpenThesaurus based on a seed word
   * @param seedWord The seed word to start the search from
   * @param count Number of words to fetch
   * @returns Number of new words added
   */
  static async enrichWithSeedWord(seedWord: string, count: number = 10): Promise<number> {
    await this.initialize();
    
    try {
      console.log(`Enriching word list with seed word: ${seedWord}, count: ${count}`);
      
      // Fetch words from OpenThesaurus
      const newWords = await OpenThesaurusAPI.fetchRandomWords(seedWord, count);
      console.log(`Fetched ${newWords.length} words from OpenThesaurus`);
      
      // Group words by difficulty
      const wordsByDifficulty: Record<HangmanDifficulty, HangmanWord[]> = {
        easy: [],
        medium: [],
        hard: []
      };
      
      // Add each word if it doesn't already exist
      let addedCount = 0;
      
      for (const { word, hint } of newWords) {
        // Check if word already exists
        const allWords = [
          ...this.enrichedWords.easy,
          ...this.enrichedWords.medium,
          ...this.enrichedWords.hard
        ];
        
        if (allWords.some(w => w.word.toLowerCase() === word.toLowerCase())) {
          console.log(`Word already exists: ${word}`);
          continue;
        }
        
        // Determine difficulty
        const difficulty = OpenThesaurusAPI.estimateWordDifficulty(word);
        
        // Add to appropriate collection
        this.enrichedWords[difficulty].push({ word, hint });
        wordsByDifficulty[difficulty].push({ word, hint });
        
        addedCount++;
        console.log(`Added word: ${word} (${difficulty}): ${hint}`);
      }
      
      // Save new words to Redis by difficulty
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        if (wordsByDifficulty[difficulty].length > 0) {
          await this.saveToRedis(difficulty, wordsByDifficulty[difficulty]);
        }
      }
      
      console.log(`Added ${addedCount} new words to the collection`);
      return addedCount;
    } catch (error) {
      console.error('Error enriching words:', error);
      return 0;
    }
  }

  /**
   * Search for words in OpenThesaurus and add them to the collection
   * @param searchTerm The term to search for
   * @param count Maximum number of words to add
   * @returns Number of new words added
   */
  static async searchAndAddWords(searchTerm: string, count: number = 10): Promise<number> {
    await this.initialize();
    
    try {
      console.log(`Searching for words with term: ${searchTerm}, max count: ${count}`);
      
      // Try different search strategies
      let wordPool: string[] = [];
      
      // 1. Try words starting with the search term
      const startsWithWords = await OpenThesaurusAPI.getWordsStartingWith(searchTerm);
      console.log(`Found ${startsWithWords.length} words starting with "${searchTerm}"`);
      wordPool = [...wordPool, ...startsWithWords];
      
      // 2. Try words containing the search term
      if (wordPool.length < count * 2) {
        const substringWords = await OpenThesaurusAPI.getWordsWithSubstring(searchTerm);
        console.log(`Found ${substringWords.length} words containing "${searchTerm}"`);
        wordPool = [...new Set([...wordPool, ...substringWords])];
      }
      
      // 3. If still not enough, try synonyms of the search term
      if (wordPool.length < count && searchTerm.length >= 3) {
        const synonyms = await OpenThesaurusAPI.getSynonyms(searchTerm);
        console.log(`Found ${synonyms.length} synonyms for "${searchTerm}"`);
        wordPool = [...new Set([...wordPool, ...synonyms])];
      }
      
      // Filter out words that are too short
      wordPool = wordPool.filter(word => word.length >= 3);
      console.log(`After filtering, have ${wordPool.length} words in pool`);
      
      // Shuffle and take the requested count
      const shuffled = wordPool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      
      // Group words by difficulty
      const wordsByDifficulty: Record<HangmanDifficulty, HangmanWord[]> = {
        easy: [],
        medium: [],
        hard: []
      };
      
      // Add each word
      let addedCount = 0;
      
      for (const word of selected) {
        // Check if word already exists
        const allWords = [
          ...this.enrichedWords.easy,
          ...this.enrichedWords.medium,
          ...this.enrichedWords.hard
        ];
        
        if (allWords.some(w => w.word.toLowerCase() === word.toLowerCase())) {
          console.log(`Word already exists: ${word}`);
          continue;
        }
        
        // Generate hint
        const hint = await OpenThesaurusAPI.generateHint(word);
        
        // Determine difficulty
        const difficulty = OpenThesaurusAPI.estimateWordDifficulty(word);
        
        // Add to appropriate collection
        this.enrichedWords[difficulty].push({ word, hint });
        wordsByDifficulty[difficulty].push({ word, hint });
        
        addedCount++;
        console.log(`Added word: ${word} (${difficulty}): ${hint}`);
      }
      
      // Save new words to Redis by difficulty
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        if (wordsByDifficulty[difficulty].length > 0) {
          await this.saveToRedis(difficulty, wordsByDifficulty[difficulty]);
        }
      }
      
      console.log(`Added ${addedCount} new words to the collection`);
      return addedCount;
    } catch (error) {
      console.error('Error searching and adding words:', error);
      return 0;
    }
  }
}

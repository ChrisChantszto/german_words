import { HangmanWord, HangmanDifficulty } from '../../shared/types/api';
import { OpenThesaurusAPI } from './openthesaurus-api';
import fs from 'fs/promises';
import path from 'path';

/**
 * Utility class for enriching the German word collection using OpenThesaurus API
 */
export class WordEnricher {
  private static readonly CACHE_DIR = path.join(process.cwd(), 'cache');
  private static readonly CACHE_FILE = path.join(WordEnricher.CACHE_DIR, 'enriched-words.json');
  
  /**
   * Enriched words collection
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
   * Base words from the original collection
   */
  private static baseWords: {
    easy: HangmanWord[];
    medium: HangmanWord[];
    hard: HangmanWord[];
  } | null = null;

  /**
   * Flag to track if words have been loaded from cache
   */
  private static isInitialized = false;

  /**
   * Set the base words from the original collection
   * This method should be called from german-words.ts after it's initialized
   */
  static setBaseWords(baseWords: {
    easy: HangmanWord[];
    medium: HangmanWord[];
    hard: HangmanWord[];
  }): void {
    this.baseWords = baseWords;
    
    // Initialize with base words if not already initialized
    if (!this.isInitialized) {
      this.enrichedWords = {
        easy: [...baseWords.easy],
        medium: [...baseWords.medium],
        hard: [...baseWords.hard]
      };
    }
  }

  /**
   * Initialize the word enricher by loading cached words if available
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create cache directory if it doesn't exist
      await fs.mkdir(this.CACHE_DIR, { recursive: true });
      
      // Try to load cached words
      try {
        const cachedData = await fs.readFile(this.CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(cachedData);
        
        // Make sure base words are available
        if (this.baseWords) {
          // Merge with base words
          this.enrichedWords = {
            easy: [...this.baseWords.easy, ...(parsed.easy || [])],
            medium: [...this.baseWords.medium, ...(parsed.medium || [])],
            hard: [...this.baseWords.hard, ...(parsed.hard || [])]
          };
        } else {
          // Just use cached words if base words aren't available yet
          this.enrichedWords = {
            easy: [...(parsed.easy || [])],
            medium: [...(parsed.medium || [])],
            hard: [...(parsed.hard || [])]
          };
        }
        
        console.log('Loaded enriched words from cache');
      } catch (err) {
        // Cache file doesn't exist or is invalid
        if (this.baseWords) {
          // Use base words if available
          this.enrichedWords = {
            easy: [...this.baseWords.easy],
            medium: [...this.baseWords.medium],
            hard: [...this.baseWords.hard]
          };
        }
        console.log('No cached enriched words found, using default words');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing word enricher:', error);
    }
  }

  /**
   * Save the enriched words to cache
   */
  private static async saveToCache(): Promise<void> {
    try {
      // Only save the words that were added on top of the original words
      let originalEasyWords = new Set<string>();
      let originalMediumWords = new Set<string>();
      let originalHardWords = new Set<string>();
      
      // Use base words if available
      if (this.baseWords) {
        originalEasyWords = new Set(this.baseWords.easy.map(w => w.word));
        originalMediumWords = new Set(this.baseWords.medium.map(w => w.word));
        originalHardWords = new Set(this.baseWords.hard.map(w => w.word));
      }
      
      const additionalWords = {
        easy: this.enrichedWords.easy.filter(w => !originalEasyWords.has(w.word)),
        medium: this.enrichedWords.medium.filter(w => !originalMediumWords.has(w.word)),
        hard: this.enrichedWords.hard.filter(w => !originalHardWords.has(w.word))
      };
      
      await fs.writeFile(
        this.CACHE_FILE, 
        JSON.stringify(additionalWords, null, 2), 
        'utf-8'
      );
      
      console.log('Saved enriched words to cache');
    } catch (error) {
      console.error('Error saving enriched words to cache:', error);
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
  static async getAllWords(): Promise<typeof WordEnricher.enrichedWords> {
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
    const actualDifficulty = difficulty || OpenThesaurusAPI.estimateWordDifficulty(normalizedWord);
    
    // Add the word to the appropriate difficulty level
    this.enrichedWords[actualDifficulty].push({
      word: normalizedWord,
      hint
    });
    
    // Save to cache
    await this.saveToCache();
    
    return true;
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
      // Fetch words from OpenThesaurus
      const newWords = await OpenThesaurusAPI.fetchRandomWords(seedWord, count);
      
      // Add each word if it doesn't already exist
      let addedCount = 0;
      
      for (const { word, hint } of newWords) {
        const added = await this.addWord(word, hint);
        if (added) addedCount++;
      }
      
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
      // Try different search strategies
      let wordPool: string[] = [];
      
      // 1. Try words starting with the search term
      const startsWithWords = await OpenThesaurusAPI.getWordsStartingWith(searchTerm);
      wordPool = [...wordPool, ...startsWithWords];
      
      // 2. Try words containing the search term
      if (wordPool.length < count * 2) {
        const substringWords = await OpenThesaurusAPI.getWordsWithSubstring(searchTerm);
        wordPool = [...new Set([...wordPool, ...substringWords])];
      }
      
      // 3. If still not enough, try synonyms of the search term
      if (wordPool.length < count && searchTerm.length >= 3) {
        const synonyms = await OpenThesaurusAPI.getSynonyms(searchTerm);
        wordPool = [...new Set([...wordPool, ...synonyms])];
      }
      
      // Filter out words that are too short
      wordPool = wordPool.filter(word => word.length >= 3);
      
      // Shuffle and take the requested count
      const shuffled = wordPool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      
      // Add each word
      let addedCount = 0;
      
      for (const word of selected) {
        const hint = await OpenThesaurusAPI.generateHint(word);
        const added = await this.addWord(word, hint);
        if (added) addedCount++;
      }
      
      return addedCount;
    } catch (error) {
      console.error('Error searching and adding words:', error);
      return 0;
    }
  }
}

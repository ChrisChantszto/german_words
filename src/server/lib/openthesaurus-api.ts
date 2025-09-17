import { HangmanWord, HangmanDifficulty } from '../../shared/types/api';

// Install axios if not already installed
// npm install axios

// Types for OpenThesaurus API responses
interface OpenThesaurusSynset {
  id: string;
  categories: Array<{ name: string }>;
  terms: Array<{ term: string }>;
}

interface OpenThesaurusResponse {
  synsets: OpenThesaurusSynset[];
  similar?: Array<{ term: string; distance: number }>;
  substring?: Array<{ term: string }>;
}

/**
 * OpenThesaurus API client for fetching German words
 * API documentation: https://www.openthesaurus.de/about/api
 */
export class OpenThesaurusAPI {
  private static readonly BASE_URL = 'https://api.open-thesaurus.de/synonyme/search';
  // Note: Some environments disallow setting User-Agent; we omit it here.

  /**
   * Search for a word in OpenThesaurus
   * @param query The word to search for
   * @param options Additional search options
   * @returns Promise with the search results
   */
  static async searchWord(
    query: string, 
    options: { 
      similar?: boolean; 
      substring?: boolean;
      startswith?: boolean;
    } = {}
  ): Promise<OpenThesaurusResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add required parameters
      params.append('q', query);
      params.append('format', 'application/json');
      
      // Add optional parameters
      if (options.similar) params.append('similar', 'true');
      if (options.substring) params.append('substring', 'true');
      if (options.startswith) params.append('startswith', 'true');
      
      const url = `${this.BASE_URL}?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`OpenThesaurus HTTP ${response.status}`);
      }
      const data = await response.json();
      return data as OpenThesaurusResponse;
    } catch (error) {
      console.error('Error fetching from OpenThesaurus:', error);
      throw new Error('Failed to fetch data from OpenThesaurus');
    }
  }

  /**
   * Get synonyms for a given word
   * @param word The word to find synonyms for
   * @returns Promise with an array of synonyms
   */
  static async getSynonyms(word: string): Promise<string[]> {
    try {
      const response = await this.searchWord(word);
      
      // Extract all terms from all synsets
      const synonyms = new Set<string>();
      
      response.synsets.forEach(synset => {
        synset.terms.forEach(term => {
          // Don't include the original word in the synonyms
          if (term.term.toLowerCase() !== word.toLowerCase()) {
            synonyms.add(term.term);
          }
        });
      });
      
      return Array.from(synonyms);
    } catch (error) {
      console.error('Error getting synonyms:', error);
      return [];
    }
  }

  /**
   * Find similar words (for typo suggestions)
   * @param word The word to find similar words for
   * @returns Promise with an array of similar words
   */
  static async getSimilarWords(word: string): Promise<Array<{ term: string; distance: number }>> {
    try {
      const response = await this.searchWord(word, { similar: true });
      return response.similar || [];
    } catch (error) {
      console.error('Error getting similar words:', error);
      return [];
    }
  }

  /**
   * Find words that contain the given substring
   * @param substring The substring to search for
   * @returns Promise with an array of words containing the substring
   */
  static async getWordsWithSubstring(substring: string): Promise<string[]> {
    try {
      const response = await this.searchWord(substring, { substring: true });
      return (response.substring || []).map(item => item.term);
    } catch (error) {
      console.error('Error getting words with substring:', error);
      return [];
    }
  }

  /**
   * Find words that start with the given prefix
   * @param prefix The prefix to search for
   * @returns Promise with an array of words starting with the prefix
   */
  static async getWordsStartingWith(prefix: string): Promise<string[]> {
    try {
      const response = await this.searchWord(prefix, { startswith: true });
      return (response.substring || []).map(item => item.term);
    } catch (error) {
      console.error('Error getting words starting with prefix:', error);
      return [];
    }
  }

  /**
   * Estimate word difficulty based on length and common German letter patterns
   * @param word The word to evaluate
   * @returns 'easy', 'medium', or 'hard'
   */
  static estimateWordDifficulty(word: string): HangmanDifficulty {
    const normalizedWord = word.toLowerCase();
    const length = normalizedWord.length;
    
    // Simple length-based difficulty estimation
    if (length <= 5) {
      return 'easy';
    } else if (length <= 9) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  /**
   * Generate a hint for a word based on its synonyms or definition
   * @param word The word to generate a hint for
   * @returns Promise with a hint string
   */
  static async generateHint(word: string): Promise<string> {
    try {
      // Try to get synonyms first
      const synonyms = await this.getSynonyms(word);
      
      if (synonyms.length > 0) {
        // Use a synonym as a hint
        return `Similar to: ${synonyms[0]}`;
      } else {
        // Fallback to a generic hint based on word length
        return `A German word with ${word.length} letters`;
      }
    } catch (error) {
      // Fallback hint if API fails
      return `A German word with ${word.length} letters`;
    }
  }

  /**
   * Fetch random words from OpenThesaurus based on a seed word
   * @param seedWord A word to start the search from
   * @param count Number of words to fetch
   * @returns Promise with an array of HangmanWord objects
   */
  static async fetchRandomWords(seedWord: string, count: number = 10): Promise<HangmanWord[]> {
    try {
      // First get words that start with the same letter
      const firstLetter = seedWord.charAt(0);
      const wordsStartingWithSameLetter = await this.getWordsStartingWith(firstLetter);
      
      // If we don't have enough words, also get some words containing the seed word
      let wordPool = [...wordsStartingWithSameLetter];
      
      if (wordPool.length < count * 2 && seedWord.length >= 3) {
        const wordsWithSubstring = await this.getWordsWithSubstring(seedWord.substring(0, 3));
        wordPool = [...new Set([...wordPool, ...wordsWithSubstring])];
      }
      
      // Filter out words that are too short
      wordPool = wordPool.filter(word => word.length >= 3);
      
      // Shuffle and take the requested count
      const shuffled = wordPool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      
      // Generate hints for each word
      const result: HangmanWord[] = [];
      
      for (const word of selected) {
        const hint = await this.generateHint(word);
        
        result.push({
          word,
          hint
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching random words:', error);
      return [];
    }
  }
}

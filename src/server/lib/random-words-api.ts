// Supported categories as documented by the API
export type Category = 'wordle' | 'sports' | 'animals' | 'birds' | 'softwares' | 'companies';
import { HangmanWord, HangmanDifficulty } from '../../shared/types/api';

// Random Words API client
// Docs: https://random-words-api.kushcreates.com/
// Endpoint: https://random-words-api.kushcreates.com/api

export type RandomWordsParams = {
  language?: string; // e.g., 'de'
  category?: Category;
  length?: number; // word length filter
  words?: number; // number of words to return
  type?: 'uppercase' | 'lowercase' | 'capitalized';
  alphabetize?: boolean;
  firstletter?: string;
};

export class RandomWordsAPI {
  private static readonly BASE_URL = 'https://random-words-api.kushcreates.com/api';

  static categories = [
    'wordle', 'sports', 'animals', 'birds', 'softwares', 'companies'
  ] as const satisfies readonly Category[];

  static randomCategory(): Category {
    const idx = Math.floor(Math.random() * this.categories.length);
    return this.categories[idx] as Category;
  }

  static randomLength(min = 4, max = 10): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static buildQuery(params: RandomWordsParams): string {
    const qp = new URLSearchParams();
    if (params.language) qp.append('language', params.language);
    if (params.category) qp.append('category', params.category);
    if (params.length) qp.append('length', String(params.length));
    if (params.words) qp.append('words', String(params.words));
    if (params.type) qp.append('type', params.type);
    if (typeof params.alphabetize === 'boolean') qp.append('alphabetize', String(params.alphabetize));
    if (params.firstletter) qp.append('firstletter', params.firstletter);
    return qp.toString();
  }

  // Fetches words from the API and normalizes to a string[]
  static async fetchWords(params: RandomWordsParams): Promise<string[]> {
    const qs = this.buildQuery(params);
    const url = `${this.BASE_URL}?${qs}`;

    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!resp.ok) {
        throw new Error(`RandomWordsAPI HTTP ${resp.status}`);
      }
      const data = await resp.json();

      // Normalize various plausible shapes into string[]
      if (data == null) return [];

      if (Array.isArray(data)) {
        // Could be an array of strings or array of objects
        if (data.length === 0) return [];
        if (typeof data[0] === 'string') return data as string[];
        // Try to extract a "word" property from objects
        return (data as any[])
          .map((x) => (typeof x?.word === 'string' ? x.word : null))
          .filter((x): x is string => typeof x === 'string');
      }

      if (typeof data === 'object') {
        // Try common shapes
        if (Array.isArray((data as any).words)) {
          return ((data as any).words as any[])
            .map((w) => (typeof w === 'string' ? w : (typeof w?.word === 'string' ? w.word : null)))
            .filter((x): x is string => typeof x === 'string');
        }
      }

      // Fallback: nothing usable
      return [];
    } catch (err) {
      console.error('RandomWordsAPI.fetchWords error:', err);
      return [];
    }
  }

  static estimateDifficulty(word: string): HangmanDifficulty {
    const len = word.length;
    if (len <= 5) return 'easy';
    if (len <= 9) return 'medium';
    return 'hard';
  }

  static buildHint(word: string, opts: { category?: string; length?: number } = {}): string {
    const parts: string[] = [];
    if (opts.category) parts.push(`Category: ${opts.category}`);
    if (opts.length) parts.push(`${opts.length} letters`);
    if (parts.length === 0) return `Random German word (${word.length} letters)`;
    return `${parts.join(' · ')}`;
  }

  // Convenience: fetch German words with randomized filters
  static async fetchRandomGermanWords(desiredCount: number): Promise<HangmanWord[]> {
    const category = this.randomCategory();
    const length = this.randomLength();
    const wordsParam = Math.max(3, Math.min(desiredCount, 12));

    const words = await this.fetchWords({
      language: 'de',
      category,
      length,
      words: wordsParam,
      type: 'lowercase',
      alphabetize: false,
    });

    const hintFor = (w: string) => this.buildHint(w, { category, length });

    return Array.from(new Set(words))
      .map((w) => w?.toLowerCase?.().trim?.() ?? '')
      .filter((w) => w && w.length >= 3)
      .map((w) => ({ word: w, hint: hintFor(w) }));
  }
}
